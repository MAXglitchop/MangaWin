use serde::{Deserialize, Serialize};
use std::fs;
use crate::storage::paths::get_config_dir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub port: String,
    pub custom_java_args: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            port: "4567".to_string(),
            custom_java_args: "".to_string(),
        }
    }
}

pub fn load_settings() -> AppSettings {
    let mut path = get_config_dir();
    path.push("settings.json");
    
    if let Ok(data) = fs::read_to_string(&path) {
        if let Ok(settings) = serde_json::from_str(&data) {
            return settings;
        }
    }
    AppSettings::default()
}

pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let mut path = get_config_dir();
    path.push("settings.json");
    
    let data = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}
