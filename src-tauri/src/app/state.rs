use std::sync::Mutex;
use serde::Serialize;
use tokio::sync::mpsc::Sender;
use crate::logs::ring_buffer::RingBuffer;

#[derive(Debug, Serialize, Clone, PartialEq)]
pub enum LifecyclePhase {
    Initializing,
    Installing(f32),
    Starting,
    Ready,
    Crashed(String),
}

pub struct AppState {
    phase: Mutex<LifecyclePhase>,
    pub kill_switch: Mutex<Option<Sender<()>>>,
    pub logs: RingBuffer,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            phase: Mutex::new(LifecyclePhase::Initializing),
            kill_switch: Mutex::new(None),
            logs: RingBuffer::new(1000),
        }
    }
}

impl AppState {
    pub fn get_phase(&self) -> LifecyclePhase {
        self.phase.lock().unwrap().clone()
    }

    pub fn set_phase(&self, phase: LifecyclePhase) {
        let mut p = self.phase.lock().unwrap();
        *p = phase;
    }

    pub fn add_log(&self, log_type: &str, message: &str) {
        self.logs.push(log_type, message);
    }
}
