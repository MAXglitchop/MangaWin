use tauri::{AppHandle, State, Manager, Emitter};
use crate::app::state::{AppState, LifecyclePhase};
use crate::logs::ring_buffer::LogEntry;
use crate::storage::settings::{AppSettings, load_settings, save_settings as save_settings_fs};
use crate::storage::paths::get_app_data_dir;
use crate::engine::install::check_and_install_engine;
use crate::runtime::java::check_and_install_java;
use crate::engine::launcher::start_suwayomi;
use crate::engine::health::wait_for_engine;
use crate::engine::watchdog::monitor_process;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::mpsc;
use std::fs::File;
use std::io::Write;

#[tauri::command]
pub fn get_settings() -> AppSettings {
    load_settings()
}

#[tauri::command]
pub fn save_settings(port: String, custom_java_args: String) -> Result<(), String> {
    let settings = AppSettings { port, custom_java_args };
    save_settings_fs(&settings)
}

#[tauri::command]
pub fn check_engine_status(state: State<'_, AppState>) -> LifecyclePhase {
    state.get_phase()
}

#[tauri::command]
pub async fn get_recent_logs(state: State<'_, AppState>) -> Result<Vec<LogEntry>, String> {
    Ok(state.logs.get_all())
}

#[tauri::command]
pub async fn export_logs(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let logs = state.logs.get_all();
    let mut file = File::create(&path).map_err(|e| format!("Could not create file: {}", e))?;
    for log in logs.iter() {
        writeln!(file, "[{}] {}", log.log_type.to_uppercase(), log.message)
            .map_err(|e| format!("Failed to write to file: {}", e))?;
    }
    Ok(())
}

async fn stop_engine_internal(state: &AppState) {
    let tx_opt = {
        let mut lock = state.kill_switch.lock().unwrap();
        lock.take()
    };
    if let Some(tx) = tx_opt {
        let _ = tx.send(()).await;
    }
}

#[tauri::command]
#[allow(unreachable_code)]
pub async fn reset_app(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    stop_engine_internal(&state).await;
    
    let dir = get_app_data_dir();
    if dir.exists() {
        let _ = std::fs::remove_dir_all(&dir);
    }
    
    app.restart();
    Ok(())
}

#[tauri::command]
pub async fn stop_engine(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    stop_engine_internal(&state).await;
    state.set_phase(LifecyclePhase::Crashed("Engine stopped manually".to_string()));
    app.emit("lifecycle-update", state.get_phase()).unwrap();
    Ok(())
}

#[tauri::command]
pub async fn launch_engine(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    state.set_phase(LifecyclePhase::Initializing);
    app.emit("lifecycle-update", LifecyclePhase::Initializing).unwrap();

    if let Err(e) = crate::storage::paths::init_directories() {
        state.set_phase(LifecyclePhase::Crashed(format!("Init error: {}", e)));
        app.emit("lifecycle-update", state.get_phase()).unwrap();
        return Err(e);
    }

    state.add_log("info", "Checking Java runtime...");
    let app_java = app.clone();
    let res_java = check_and_install_java(move |prog| {
        let st = app_java.state::<AppState>();
        st.set_phase(LifecyclePhase::Installing(prog * 0.5));
        let _ = app_java.emit("lifecycle-update", st.get_phase());
    }).await;

    if let Err(e) = res_java {
        state.set_phase(LifecyclePhase::Crashed(format!("Java error: {}", e)));
        app.emit("lifecycle-update", state.get_phase()).unwrap();
        return Err(e);
    }

    state.add_log("info", "Checking Suwayomi engine...");
    let app_engine = app.clone();
    let res_engine = check_and_install_engine(move |prog| {
        let st = app_engine.state::<AppState>();
        st.set_phase(LifecyclePhase::Installing(50.0 + (prog * 0.5)));
        let _ = app_engine.emit("lifecycle-update", st.get_phase());
    }).await;

    if let Err(e) = res_engine {
        state.set_phase(LifecyclePhase::Crashed(format!("Engine error: {}", e)));
        app.emit("lifecycle-update", state.get_phase()).unwrap();
        return Err(e);
    }

    state.set_phase(LifecyclePhase::Starting);
    app.emit("lifecycle-update", LifecyclePhase::Starting).unwrap();
    
    stop_engine_internal(&state).await;

    let java_path = crate::runtime::java::get_java_executable().unwrap();
    let jar_path = crate::engine::install::get_engine_jar().unwrap();
    let settings = load_settings();
    
    state.add_log("info", "Launching Suwayomi...");
    match start_suwayomi(&java_path, &jar_path, &settings.port, &settings.custom_java_args) {
        Ok(mut child) => {
            let stdout = child.stdout.take();
            let stderr = child.stderr.take();
            
            let (tx, rx) = mpsc::channel(1);
            {
                let mut lock = state.kill_switch.lock().unwrap();
                *lock = Some(tx);
            }
            
            if let Some(out) = stdout {
                let a = app.clone();
                tauri::async_runtime::spawn(async move {
                    let mut reader = BufReader::new(out).lines();
                    while let Ok(Some(line)) = reader.next_line().await {
                        a.state::<AppState>().add_log("info", &line);
                        let _ = a.emit("engine-log", serde_json::json!({"type": "info", "message": line}));
                    }
                });
            }

            if let Some(err) = stderr {
                let a = app.clone();
                tauri::async_runtime::spawn(async move {
                    let mut reader = BufReader::new(err).lines();
                    while let Ok(Some(line)) = reader.next_line().await {
                        a.state::<AppState>().add_log("error", &line);
                        let _ = a.emit("engine-log", serde_json::json!({"type": "error", "message": line}));
                    }
                });
            }

            let app_wd = app.clone();
            tauri::async_runtime::spawn(async move {
                monitor_process(app_wd, child, rx).await;
            });

            let a = app.clone();
            let p = settings.port.clone();
            tauri::async_runtime::spawn(async move {
                match wait_for_engine(&p, 30).await {
                    Ok(_) => {
                        let st = a.state::<AppState>();
                        if st.get_phase() == LifecyclePhase::Starting {
                            st.set_phase(LifecyclePhase::Ready);
                            st.add_log("success", "Engine is ready.");
                            let _ = a.emit("lifecycle-update", LifecyclePhase::Ready);
                        }
                    },
                    Err(e) => {
                        let st = a.state::<AppState>();
                        if st.get_phase() == LifecyclePhase::Starting {
                            st.set_phase(LifecyclePhase::Crashed(e.clone()));
                            st.add_log("error", &e);
                            let _ = a.emit("lifecycle-update", st.get_phase());
                        }
                    }
                }
            });

            Ok(())
        },
        Err(e) => {
            state.set_phase(LifecyclePhase::Crashed(e.clone()));
            state.add_log("error", &e);
            app.emit("lifecycle-update", state.get_phase()).unwrap();
            Err(e)
        }
    }
}
