use crate::storage::paths::{get_runtime_dir, get_downloads_dir};
use futures_util::StreamExt;
use reqwest::Client;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

pub fn get_java_executable() -> Option<PathBuf> {
    let p = get_runtime_dir();
    
    // Check possible extracted locations
    let possible_paths = [
        p.join("bin").join("java.exe"),
        p.join("jre").join("bin").join("java.exe"),
        p.join("java.exe"),
    ];
    
    for path in possible_paths.iter() {
        if path.exists() {
            return Some(path.clone());
        }
    }
    
    // Check 1-level deep directories (if strip_toplevel was false)
    if let Ok(entries) = std::fs::read_dir(&p) {
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                let bin_path = entry.path().join("bin").join("java.exe");
                if bin_path.exists() {
                    return Some(bin_path);
                }
            }
        }
    }
    
    None
}

pub async fn check_and_install_java<F>(progress_callback: F) -> Result<(), String> 
where F: Fn(f32) + Send + 'static {
    if get_java_executable().is_some() {
        return Ok(());
    }

    let client = Client::new();
    progress_callback(5.0);

    let url = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse";
    
    let mut zip_path = get_downloads_dir();
    std::fs::create_dir_all(&zip_path).unwrap();
    zip_path.push("jre.zip");

    let res = client.get(url).send().await.map_err(|e| format!("Failed to download Java: {}", e))?;
    if !res.status().is_success() {
        return Err(format!("Java download API returned {}", res.status()));
    }

    let total_size = res.content_length().unwrap_or(0) as f64;
    let mut file = File::create(&zip_path).map_err(|e| format!("Failed to create JRE zip file: {}", e))?;
    
    let mut downloaded: f64 = 0.0;
    let mut stream = res.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("Error while downloading Java: {}", e))?;
        file.write_all(&chunk).map_err(|e| format!("Error while writing Java chunk: {}", e))?;
        
        downloaded += chunk.len() as f64;
        if total_size > 0.0 {
            // Local progress from 10 to 80 for download
            let local_progress = 10.0 + (downloaded / total_size * 70.0);
            progress_callback(local_progress as f32);
        }
    }

    // Extraction
    progress_callback(85.0);
    
    let runtime_dir = get_runtime_dir();
    std::fs::create_dir_all(&runtime_dir).unwrap();

    // Since zip_extract requires a File or Cursor, we use std::fs::File
    let archive_file = File::open(&zip_path).map_err(|e| format!("Failed to open downloaded JRE zip: {}", e))?;
    
    #[allow(deprecated)]
    zip_extract::extract(archive_file, &runtime_dir, true)
        .map_err(|e| format!("Failed to extract Java zip: {}", e))?;

    progress_callback(100.0);

    // Cleanup the zip
    let _ = std::fs::remove_file(&zip_path);

    Ok(())
}
