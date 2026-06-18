use std::path::PathBuf;
use std::fs;

pub fn get_app_data_dir() -> PathBuf {
    // Basic fallback or generic %APPDATA% logic
    // Using dirs crate would be better, but we will use a naive approach for standard Windows %APPDATA%
    let mut path = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("MangaWin");
    path
}

pub fn get_engine_dir() -> PathBuf {
    let mut p = get_app_data_dir();
    p.push("engine");
    p
}

pub fn get_runtime_dir() -> PathBuf {
    let mut p = get_app_data_dir();
    p.push("runtime");
    p
}

pub fn get_config_dir() -> PathBuf {
    let mut p = get_app_data_dir();
    p.push("config");
    p
}

pub fn get_cache_dir() -> PathBuf {
    let mut p = get_app_data_dir();
    p.push("cache");
    p
}

pub fn get_downloads_dir() -> PathBuf {
    let mut p = get_app_data_dir();
    p.push("downloads");
    p
}

pub fn init_directories() -> Result<(), String> {
    let dirs = [
        get_app_data_dir(),
        get_engine_dir(),
        get_runtime_dir(),
        get_config_dir(),
        get_cache_dir(),
        get_downloads_dir(),
    ];
    
    for d in dirs.iter() {
        if !d.exists() {
            fs::create_dir_all(d).map_err(|e| format!("Failed to create directory {}: {}", d.display(), e))?;
        }
    }
    
    Ok(())
}
