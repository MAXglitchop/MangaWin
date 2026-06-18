use std::process::Stdio;
use tokio::process::{Child, Command};

pub fn start_suwayomi(java_path: &str, jar_path: &str, port: &str) -> Result<Child, String> {
    if !std::path::Path::new(jar_path).exists() {
        return Err(format!("Engine jar not found at {}", jar_path));
    }

    if !std::path::Path::new(java_path).exists() {
        return Err(format!("Bundled Java not found at {}", java_path));
    }

    let mut cmd = Command::new(java_path);
    cmd.arg("-jar").arg(jar_path);
    cmd.arg(format!("--server.port={}", port));

    // We want to capture stdout and stderr to pipe logs
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    {
        // CREATE_NO_WINDOW flag to prevent console popups on Windows
        // In tokio 1.x, creation_flags is available via std::os::windows::process::CommandExt
        // But for tokio::process::Command we need to use creation_flags directly or os::windows::process::CommandExt
        // tokio's Command does not have `creation_flags` directly, we must extract std::process::Command or use it via ext
        // Actually tokio::process::Command implements windows ext traits since tokio 1.14
        let mut std_cmd: std::process::Command = std::process::Command::new(java_path);
        std_cmd
            .arg("-jar")
            .arg(jar_path)
            .arg(format!("--server.port={}", port));
        std_cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        std_cmd.creation_flags(CREATE_NO_WINDOW);

        cmd = std_cmd.into();
    }

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn engine: {}", e))?;

    Ok(child)
}

pub async fn stop_suwayomi(child: &mut Child) -> Result<(), String> {
    child
        .kill()
        .await
        .map_err(|e| format!("Failed to kill engine: {}", e))?;
    // child.wait().await.map_err(|e| format!("Failed to wait on engine: {}", e))?; // not strictly needed after kill in async
    Ok(())
}
