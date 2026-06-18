use crate::config::settings::{load_settings, save_settings as save_settings_fs, AppSettings};
use crate::engine::health::wait_for_engine;
use crate::engine::process::{start_suwayomi, stop_suwayomi};
use crate::state::store::{AppState, EngineStatus, LogEntry};
use std::fs::File;
use std::io::Write;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::io::{AsyncBufReadExt, BufReader};

#[tauri::command]
pub fn get_settings() -> AppSettings {
    load_settings()
}

#[tauri::command]
pub fn save_settings(path: String, port: String) -> Result<(), String> {
    let settings = AppSettings {
        engine_path: path,
        port,
    };
    save_settings_fs(&settings)
}

#[tauri::command]
pub fn check_engine_status(state: State<'_, AppState>) -> EngineStatus {
    let status = state.engine_status.lock().unwrap();
    status.clone()
}

#[tauri::command]
pub async fn pick_engine_path() -> Result<Option<String>, String> {
    Ok(None)
}

#[tauri::command]
pub async fn stop_engine(state: State<'_, AppState>) -> Result<(), String> {
    let child_opt = {
        let mut process_lock = state.engine_process.lock().unwrap();
        process_lock.take()
    };
    if let Some(mut child) = child_opt {
        stop_suwayomi(&mut child).await?;

        let mut status = state.engine_status.lock().unwrap();
        status.state = "Stopped".to_string();
        status.error = None;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_recent_logs(state: State<'_, AppState>) -> Result<Vec<LogEntry>, String> {
    let logs = state.logs.lock().unwrap();
    Ok(logs.iter().cloned().collect())
}

#[tauri::command]
pub async fn export_logs(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let logs = state.logs.lock().unwrap();
    let mut file = File::create(&path).map_err(|e| format!("Could not create file: {}", e))?;

    for log in logs.iter() {
        writeln!(file, "[{}] {}", log.log_type.to_uppercase(), log.message)
            .map_err(|e| format!("Failed to write to file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn launch_engine(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let settings = load_settings();

    if settings.engine_path.is_empty() {
        let mut status = state.engine_status.lock().unwrap();
        status.state = "Setup".to_string();
        app.emit("engine-status", status.clone()).unwrap();
        return Ok(());
    }

    {
        let mut status = state.engine_status.lock().unwrap();
        status.state = "Starting".to_string();
        status.error = None;
        app.emit("engine-status", status.clone()).unwrap();
    }

    let child_opt = {
        let mut process_lock = state.engine_process.lock().unwrap();
        process_lock.take()
    };

    if let Some(mut child) = child_opt {
        let _ = stop_suwayomi(&mut child).await;
    }

    let msg = format!("Starting engine from {}", settings.engine_path);
    state.add_log("info", &msg);
    app.emit(
        "engine-log",
        serde_json::json!({"type": "info", "message": &msg}),
    )
    .unwrap();

    let java_path = match app.path().resource_dir() {
        Ok(dir) => dir
            .join("jre")
            .join("bin")
            .join("java.exe")
            .to_string_lossy()
            .to_string(),
        Err(_) => "java".to_string(), // fallback
    };

    match start_suwayomi(&java_path, &settings.engine_path, &settings.port) {
        Ok(mut child) => {
            // Take stdout and stderr
            let stdout = child.stdout.take();
            let stderr = child.stderr.take();

            {
                let mut plock = state.engine_process.lock().unwrap();
                *plock = Some(child);
            }

            let app_clone = app.clone();
            let port = settings.port.clone();

            // Spawn task to read stdout
            if let Some(out) = stdout {
                let app_out = app.clone();
                tauri::async_runtime::spawn(async move {
                    let mut reader = BufReader::new(out).lines();
                    while let Ok(Some(line)) = reader.next_line().await {
                        let st = app_out.state::<AppState>();
                        st.add_log("info", &line);
                        let _ = app_out.emit(
                            "engine-log",
                            serde_json::json!({"type": "info", "message": line}),
                        );
                    }
                });
            }

            // Spawn task to read stderr
            if let Some(err) = stderr {
                let app_err = app.clone();
                tauri::async_runtime::spawn(async move {
                    let mut reader = BufReader::new(err).lines();
                    while let Ok(Some(line)) = reader.next_line().await {
                        let st = app_err.state::<AppState>();
                        st.add_log("error", &line);
                        let _ = app_err.emit(
                            "engine-log",
                            serde_json::json!({"type": "error", "message": line}),
                        );
                    }
                });
            }

            // Health check loop
            tauri::async_runtime::spawn(async move {
                let msg = "Process started. Waiting for engine to be ready...";
                let st = app_clone.state::<AppState>();
                st.add_log("info", msg);
                app_clone
                    .emit(
                        "engine-log",
                        serde_json::json!({"type": "info", "message": msg}),
                    )
                    .unwrap();

                match wait_for_engine(&port, 30).await {
                    Ok(_) => {
                        let mut status = st.engine_status.lock().unwrap();
                        status.state = "Ready".to_string();
                        app_clone.emit("engine-status", status.clone()).unwrap();

                        let msg = "Engine is ready.";
                        st.add_log("success", msg);
                        app_clone
                            .emit(
                                "engine-log",
                                serde_json::json!({"type": "success", "message": msg}),
                            )
                            .unwrap();
                    }
                    Err(e) => {
                        let mut status = st.engine_status.lock().unwrap();
                        status.state = "Error".to_string();
                        status.error = Some(e.clone());
                        app_clone.emit("engine-status", status.clone()).unwrap();

                        st.add_log("error", &e);
                        app_clone
                            .emit(
                                "engine-log",
                                serde_json::json!({"type": "error", "message": e}),
                            )
                            .unwrap();
                    }
                }
            });

            Ok(())
        }
        Err(e) => {
            let mut status = state.engine_status.lock().unwrap();
            status.state = "Error".to_string();
            status.error = Some(e.clone());
            app.emit("engine-status", status.clone()).unwrap();

            state.add_log("error", &format!("Launch failed: {}", e));
            app.emit(
                "engine-log",
                serde_json::json!({
                    "type": "error",
                    "message": format!("Launch failed: {}", e)
                }),
            )
            .unwrap();

            Err(e)
        }
    }
}
