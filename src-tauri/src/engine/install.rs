use crate::storage::paths::get_engine_dir;
use futures_util::StreamExt;
use reqwest::Client;
use serde_json::Value;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

pub fn get_engine_jar() -> Option<PathBuf> {
    let p = get_engine_dir();
    // Find the first .jar file in the engine directory
    if let Ok(entries) = std::fs::read_dir(&p) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("jar") {
                // To avoid fake stubs from previous tests, check size > 1MB
                if let Ok(meta) = std::fs::metadata(&path) {
                    if meta.len() > 1024 * 1024 {
                        return Some(path);
                    }
                }
            }
        }
    }
    None
}

pub async fn check_and_install_engine<F>(progress_callback: F) -> Result<(), String> 
where F: Fn(f32) + Send + 'static {
    if get_engine_jar().is_some() {
        return Ok(());
    }

    let client = Client::builder()
        .user_agent("MangaWin/1.0")
        .build()
        .map_err(|e| e.to_string())?;

    // 1. Fetch latest release from GitHub
    progress_callback(5.0);
    let release_url = "https://api.github.com/repos/Suwayomi/Suwayomi-Server/releases/latest";
    let res = client.get(release_url)
        .send().await
        .map_err(|e| format!("Failed to reach GitHub API: {}", e))?;
        
    if !res.status().is_success() {
        return Err(format!("GitHub API returned {}", res.status()));
    }

    let release_data: Value = res.json().await.map_err(|e| e.to_string())?;
    
    // 2. Find the JAR asset
    let mut download_url = String::new();
    let mut file_name = String::new();
    
    if let Some(assets) = release_data["assets"].as_array() {
        for asset in assets {
            if let Some(name) = asset["name"].as_str() {
                if name.ends_with(".jar") && !name.contains("sources") && !name.contains("javadoc") {
                    if let Some(url) = asset["browser_download_url"].as_str() {
                        download_url = url.to_string();
                        file_name = name.to_string();
                        break;
                    }
                }
            }
        }
    }

    if download_url.is_empty() {
        return Err("Could not find a valid Suwayomi JAR asset in the latest release.".to_string());
    }

    // 3. Download the JAR
    let mut p = get_engine_dir();
    std::fs::create_dir_all(&p).unwrap();
    p.push(&file_name);

    let res = client.get(&download_url).send().await.map_err(|e| e.to_string())?;
    let total_size = res.content_length().unwrap_or(0) as f64;
    
    let mut file = File::create(&p).map_err(|e| format!("Failed to create engine JAR file: {}", e))?;
    let mut downloaded: f64 = 0.0;
    let mut stream = res.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("Error while downloading engine: {}", e))?;
        file.write_all(&chunk).map_err(|e| format!("Error while writing engine chunk: {}", e))?;
        
        downloaded += chunk.len() as f64;
        if total_size > 0.0 {
            // progress_callback receives 0.0 to 100.0 (overall 50.0 to 100.0 mapped by caller)
            // We scale it from 10.0 to 100.0 locally
            let local_progress = 10.0 + (downloaded / total_size * 90.0);
            progress_callback(local_progress as f32);
        }
    }

    Ok(())
}
