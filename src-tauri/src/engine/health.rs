use reqwest::Client;
use std::time::Duration;
use tokio::time::sleep;

pub async fn wait_for_engine(port: &str, timeout_secs: u64) -> Result<(), String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .map_err(|e| e.to_string())?;
        
    let url = format!("http://127.0.0.1:{}", port);
    
    let start = std::time::Instant::now();
    let timeout = Duration::from_secs(timeout_secs);
    
    while start.elapsed() < timeout {
        if let Ok(res) = client.get(&url).send().await {
            if res.status().is_success() || res.status().is_redirection() {
                return Ok(());
            }
        }
        sleep(Duration::from_millis(500)).await;
    }
    
    Err(format!("Engine health check timed out after {} seconds", timeout_secs))
}
