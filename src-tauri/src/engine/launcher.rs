use tokio::process::{Command, Child};
use std::process::Stdio;
use std::path::PathBuf;

pub fn start_suwayomi(java_path: &PathBuf, jar_path: &PathBuf, port: &str, custom_java_args: &str) -> Result<Child, String> {
    let mut cmd = Command::new(java_path);
    
    // Apply custom args if they exist
    if !custom_java_args.trim().is_empty() {
        for arg in custom_java_args.split_whitespace() {
            cmd.arg(arg);
        }
    }
    
    cmd.arg(format!("-Dsuwayomi.tachidesk.config.server.port={}", port));
    cmd.arg("-Dsuwayomi.tachidesk.config.server.initialOpenInBrowserEnabled=false");
    cmd.arg("-Dsuwayomi.tachidesk.config.server.systemTrayEnabled=false");
    cmd.arg("-jar").arg(jar_path);
    
    cmd.stdout(Stdio::piped())
       .stderr(Stdio::piped());

    #[cfg(target_os = "windows")]
    {
        let mut std_cmd: std::process::Command = std::process::Command::new(java_path);
        
        if !custom_java_args.trim().is_empty() {
            for arg in custom_java_args.split_whitespace() {
                std_cmd.arg(arg);
            }
        }
        
        std_cmd.arg(format!("-Dsuwayomi.tachidesk.config.server.port={}", port));
        std_cmd.arg("-Dsuwayomi.tachidesk.config.server.initialOpenInBrowserEnabled=false");
        std_cmd.arg("-Dsuwayomi.tachidesk.config.server.systemTrayEnabled=false");
        std_cmd.arg("-jar").arg(jar_path);
        std_cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        std_cmd.creation_flags(CREATE_NO_WINDOW);
        
        cmd = std_cmd.into();
    }

    cmd.kill_on_drop(true);

    let child = cmd.spawn().map_err(|e| format!("Failed to spawn engine: {}", e))?;
    Ok(child)
}
