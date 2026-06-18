use tokio::process::Child;
use tokio::sync::mpsc::Receiver;
use tauri::{AppHandle, Manager, Emitter};
use crate::app::state::{AppState, LifecyclePhase};
use std::time::Duration;
use crate::storage::settings::load_settings;
use serde::Deserialize;

#[derive(Deserialize)]
struct Extension {
    #[serde(rename = "apkName")]
    apk_name: String,
    installed: bool,
}

pub async fn monitor_process(app: AppHandle, mut child: Child, mut kill_rx: Receiver<()>) {
    let settings = load_settings();
    let port = settings.port.clone();

    // Spawn the extension cleaner loop
    let cleaner_handle = tokio::spawn(async move {
        let client = reqwest::Client::new();
        let api_url = format!("http://127.0.0.1:{}/api/v1/extension/list", port);
        
        loop {
            tokio::time::sleep(Duration::from_secs(30)).await;
            
            // First cleanup any .deleted files lying around from previous runs
            let ext_dir = dirs::data_local_dir().map(|mut p| { p.push("Tachidesk/extensions"); p });
            if let Some(dir) = ext_dir.as_ref() {
                if let Ok(entries) = std::fs::read_dir(dir) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.extension().and_then(|s| s.to_str()) == Some("deleted") {
                            let _ = std::fs::remove_file(&path);
                        }
                    }
                }
            }

            // Now check API for uninstalled extensions and clean them up
            if let Ok(res) = client.get(&api_url).send().await {
                if let Ok(extensions) = res.json::<Vec<Extension>>().await {
                    let uninstalled: Vec<String> = extensions.into_iter()
                        .filter(|e| !e.installed)
                        .map(|e| e.apk_name)
                        .collect();

                    if let Some(dir) = ext_dir {
                        if let Ok(entries) = std::fs::read_dir(&dir) {
                            for entry in entries.flatten() {
                                let path = entry.path();
                                if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                                    if file_name.ends_with(".apk") && uninstalled.contains(&file_name.to_string()) {
                                        // This APK is in the folder but the engine says it's uninstalled!
                                        // Try to delete it. If locked by OS, rename it so it won't load on next boot.
                                        if std::fs::remove_file(&path).is_err() {
                                            let mut renamed = path.clone();
                                            renamed.set_extension("apk.deleted");
                                            let _ = std::fs::rename(&path, &renamed);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    tokio::select! {
        _ = kill_rx.recv() => {
            // We received a manual kill signal
            cleaner_handle.abort();
            let _ = child.kill().await;
        }
        status = child.wait() => {
            // Process exited on its own
            cleaner_handle.abort();
            let app_state = app.state::<AppState>();
            let current_phase = app_state.get_phase();
            
            if current_phase == LifecyclePhase::Ready || current_phase == LifecyclePhase::Starting {
                let msg = format!("Engine exited unexpectedly: {:?}", status);
                app_state.set_phase(LifecyclePhase::Crashed(msg.clone()));
                app_state.add_log("error", &msg);
                let _ = app.emit("lifecycle-update", app_state.get_phase());
            }
        }
    }
}
