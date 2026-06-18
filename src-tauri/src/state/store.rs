use serde::Serialize;
use std::collections::VecDeque;
use std::sync::Mutex;
use tokio::process::Child;

#[derive(Debug, Serialize, Clone)]
pub struct LogEntry {
    pub log_type: String, // info, error, success
    pub message: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct EngineStatus {
    pub state: String, // "Starting", "Ready", "Stopped", "Error", "Setup"
    pub error: Option<String>,
}

pub struct AppState {
    pub engine_status: Mutex<EngineStatus>,
    pub engine_process: Mutex<Option<Child>>,
    pub logs: Mutex<VecDeque<LogEntry>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            engine_status: Mutex::new(EngineStatus {
                state: "Setup".to_string(),
                error: None,
            }),
            engine_process: Mutex::new(None),
            logs: Mutex::new(VecDeque::with_capacity(1000)),
        }
    }
}

impl AppState {
    pub fn add_log(&self, log_type: &str, message: &str) {
        let mut logs = self.logs.lock().unwrap();
        if logs.len() >= 1000 {
            logs.pop_front();
        }
        logs.push_back(LogEntry {
            log_type: log_type.to_string(),
            message: message.to_string(),
        });
    }
}
