// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod engine;
mod ipc;
mod logs;
mod runtime;
mod storage;

use app::state::AppState;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            ipc::commands::get_settings,
            ipc::commands::save_settings,
            ipc::commands::check_engine_status,
            ipc::commands::stop_engine,
            ipc::commands::launch_engine,
            ipc::commands::get_recent_logs,
            ipc::commands::export_logs,
            ipc::commands::reset_app
        ])
        .setup(|tauri_app| {
            let app_handle = tauri_app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let state = app_handle.state::<AppState>();
                let _ = ipc::commands::launch_engine(app_handle.clone(), state).await;
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
                let tx = app_handle.state::<AppState>().kill_switch.lock().unwrap().clone();
                if let Some(tx) = tx {
                    let _ = tx.try_send(());
                }
            }
            _ => {}
        });
}
