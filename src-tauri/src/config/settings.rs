use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub engine_path: String,
    pub port: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            engine_path: "".to_string(),
            port: "4567".to_string(),
        }
    }
}

pub fn get_settings_path() -> PathBuf {
    // Basic implementation: storing in current dir or a known app dir
    // For Tauri, we could use the AppHandle to get app_data_dir, but for simplicity:
    let mut path = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    path.pop(); // remove exe name
    path.push("mangawin_settings.json");
    path
}

pub fn load_settings() -> AppSettings {
    let path = get_settings_path();
    if let Ok(data) = fs::read_to_string(path) {
        if let Ok(settings) = serde_json::from_str(&data) {
            return settings;
        }
    }
    AppSettings::default()
}

pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let path = get_settings_path();
    let data = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}
