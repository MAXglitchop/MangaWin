use std::path::PathBuf;
use std::fs;
use std::io::Cursor;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Mutex;
use std::process::Child;
use serde::Serialize;
use futures_util::StreamExt;
use std::os::windows::process::CommandExt;

pub struct ServerState {
    pub process: Mutex<Option<Child>>,
}

#[derive(Clone, Serialize)]
struct ProgressPayload {
    progress: f64,
}

// Get the server directory: %APPDATA%/MangaWin/server
fn get_server_dir() -> PathBuf {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let dir = PathBuf::from(appdata).join("MangaWin").join("server");
    if !dir.exists() {
        fs::create_dir_all(&dir).unwrap_or_default();
    }
    dir
}

// Returns (path_to_javaw, working_dir)
fn get_exe_path() -> Option<(PathBuf, PathBuf)> {
    let server_dir = get_server_dir();
    if let Ok(entries) = fs::read_dir(&server_dir) {
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                // E.g. Suwayomi-Server-v2.2.2100-windows-x64
                let javaw_path = entry.path().join("jre").join("bin").join("javaw.exe");
                let server_jar_path = entry.path().join("bin").join("Suwayomi-Server.jar");
                if javaw_path.exists() && server_jar_path.exists() {
                    return Some((javaw_path, entry.path()));
                }
            }
        }
    }
    None
}

#[tauri::command]
pub fn check_server_exists() -> bool {
    get_exe_path().is_some()
}

#[tauri::command]
pub async fn download_server(app: AppHandle) -> Result<(), String> {
    let url = "https://github.com/Suwayomi/Suwayomi-Server/releases/download/v2.2.2100/Suwayomi-Server-v2.2.2100-windows-x64.zip";
    
    let client = reqwest::Client::new();
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    
    let total_size = res.content_length().unwrap_or(330_000_000) as f64;
    let mut downloaded = 0f64;
    let mut stream = res.bytes_stream();
    
    let mut zip_data = Vec::new();
    
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        downloaded += chunk.len() as f64;
        zip_data.extend_from_slice(&chunk);
        
        // Emit progress
        let progress = (downloaded / total_size) * 100.0;
        let _ = app.emit("download_progress", ProgressPayload { progress });
    }
    
    // Unzip the data
    let cursor = Cursor::new(zip_data);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| e.to_string())?;
    
    let server_dir = get_server_dir();
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let outpath = match file.enclosed_name() {
            Some(path) => server_dir.join(path),
            None => continue,
        };

        if (*file.name()).ends_with('/') {
            fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).map_err(|e| e.to_string())?;
                }
            }
            let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn start_server(state: tauri::State<'_, ServerState>) -> Result<(), String> {
    let (exe, working_dir) = match get_exe_path() {
        Some(paths) => paths,
        None => return Err("Server executable not found".to_string()),
    };

    const CREATE_NO_WINDOW: u32 = 0x08000000;
    
    let child = std::process::Command::new(exe)
        .current_dir(&working_dir)
        .arg("--add-exports=java.desktop/sun.awt=ALL-UNNAMED")
        .arg("-jar")
        .arg("bin/Suwayomi-Server.jar")
        .arg("--suwayomi.tachidesk.server.initialOpenInBrowserEnabled=false")
        .arg("--suwayomi.tachidesk.server.systemTrayEnabled=false")
        .arg("--suwayomi.tachidesk.server.webUIEnabled=false")
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| e.to_string())?;

    let mut process_guard = state.process.lock().await;
    *process_guard = Some(child);

    Ok(())
}

#[tauri::command]
pub async fn stop_server(state: tauri::State<'_, ServerState>) -> Result<(), String> {
    let mut process_guard = state.process.lock().await;
    if let Some(mut child) = process_guard.take() {
        let _ = child.kill();
    }
    Ok(())
}

#[tauri::command]
pub fn setup_server_config() -> Result<(), String> {
    let localappdata = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| ".".to_string());
    let config_path = PathBuf::from(localappdata).join("Tachidesk").join("server.conf");
    
    if config_path.exists() {
        if let Ok(mut content) = fs::read_to_string(&config_path) {
            let mut changed = false;
            
            if content.contains("server.initialOpenInBrowserEnabled = true") {
                content = content.replace("server.initialOpenInBrowserEnabled = true", "server.initialOpenInBrowserEnabled = false");
                changed = true;
            }
            if content.contains("server.systemTrayEnabled = true") {
                content = content.replace("server.systemTrayEnabled = true", "server.systemTrayEnabled = false");
                changed = true;
            }
            if content.contains("server.ip = \"0.0.0.0\"") {
                content = content.replace("server.ip = \"0.0.0.0\"", "server.ip = \"127.0.0.1\"");
                changed = true;
            }
            if content.contains("server.webUIEnabled = true") {
                content = content.replace("server.webUIEnabled = true", "server.webUIEnabled = false");
                changed = true;
            }
            
            if changed {
                let _ = fs::write(&config_path, content);
            }
        }
    } else {
        // Pre-create the config on first launch so the browser never opens
        if let Some(parent) = config_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let initial_config = "server.initialOpenInBrowserEnabled = false\nserver.systemTrayEnabled = false\nserver.webUIEnabled = false\nserver.ip = \"127.0.0.1\"\n";
        let _ = std::fs::write(&config_path, initial_config);
    }
    Ok(())
}

#[tauri::command]
pub async fn graphql_request(query: String, variables: Option<String>) -> Result<String, String> {
    let client = reqwest::Client::new();
    let mut body = serde_json::Map::new();
    body.insert("query".to_string(), serde_json::Value::String(query));
    
    if let Some(vars) = variables {
        if let Ok(parsed_vars) = serde_json::from_str::<serde_json::Value>(&vars) {
            body.insert("variables".to_string(), parsed_vars);
        }
    }

    let response = client.post("http://127.0.0.1:4567/api/graphql")
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let text = response.text().await.map_err(|e| e.to_string())?;
    Ok(text)
}

#[tauri::command]
pub async fn delete_extension_file(pkg_name: String) -> Result<(), String> {
    let localappdata = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| ".".to_string());
    let extensions_dir = PathBuf::from(localappdata).join("Tachidesk").join("extensions");
    
    if !extensions_dir.exists() {
        return Ok(());
    }

    let prefix = pkg_name.replace("eu.kanade.tachiyomi.extension.", "tachiyomi-");

    if let Ok(entries) = fs::read_dir(&extensions_dir) {
        for entry in entries.flatten() {
            if let Some(file_name) = entry.file_name().to_str() {
                if file_name.starts_with(&prefix) && (file_name.ends_with(".apk") || file_name.ends_with(".jar")) {
                    let _ = fs::remove_file(entry.path());
                }
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn open_verification_window(app: tauri::AppHandle, url: String) -> Result<String, String> {
    let script = r#"
        setInterval(() => {
            if (document.cookie.includes('cf_clearance')) {
                document.title = "COOKIE_STEALER:" + JSON.stringify({ cookie: document.cookie, userAgent: navigator.userAgent });
            }
        }, 1000);
    "#;

    if let Some(w) = app.get_webview_window("verification") {
        let _ = w.close();
    }

    let window = tauri::WebviewWindowBuilder::new(
        &app,
        "verification",
        tauri::WebviewUrl::External(url.parse().unwrap())
    )
    .title("Cloudflare Verification")
    .initialization_script(script)
    .build()
    .map_err(|e| e.to_string())?;

    let mut cookie_data = String::new();

    loop {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        // Check if window is closed by user
        if app.get_webview_window("verification").is_none() {
            return Err("Verification window was closed before cookie could be extracted.".to_string());
        }
        
        if let Ok(title) = window.title() {
            if title.starts_with("COOKIE_STEALER:") {
                cookie_data = title.replace("COOKIE_STEALER:", "");
                break;
            }
        }
    }
    
    let _ = window.close();
    
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".to_string());
    let path = std::path::PathBuf::from(appdata).join("MangaWin").join("cookies.json");
    let _ = std::fs::write(&path, &cookie_data);

    Ok(cookie_data)
}


