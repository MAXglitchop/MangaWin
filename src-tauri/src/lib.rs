mod server_manager;

use server_manager::{ServerState, check_server_exists, download_server, start_server, stop_server};
use tokio::sync::Mutex;
use tauri::Manager;

#[cfg(target_os = "windows")]
fn fix_maximized_frameless_gap(window: &tauri::WebviewWindow) {
    use windows_sys::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        CallWindowProcW, GetWindowLongPtrW, SetWindowLongPtrW,
        GWL_WNDPROC, WM_NCCALCSIZE,
    };

    // Get the HWND from the Tauri window
    let hwnd = window.hwnd().expect("Failed to get HWND").0 as HWND;

    unsafe {
        // Store the original window procedure
        let original_proc = GetWindowLongPtrW(hwnd, GWL_WNDPROC);
        
        // Store the original proc as user data so we can call it later
        static mut ORIGINAL_PROC: isize = 0;
        ORIGINAL_PROC = original_proc;

        unsafe extern "system" fn custom_wndproc(
            hwnd: HWND,
            msg: u32,
            wparam: WPARAM,
            lparam: LPARAM,
        ) -> LRESULT {
            if msg == WM_NCCALCSIZE && wparam != 0 {
                // When wparam is TRUE, return 0 to tell Windows we want the
                // entire window area as client area (no non-client area).
                // This eliminates the gap that Windows reserves for the taskbar
                // when maximizing a frameless window.
                return 0;
            }
            CallWindowProcW(
                Some(std::mem::transmute::<isize, unsafe extern "system" fn(HWND, u32, WPARAM, LPARAM) -> LRESULT>(ORIGINAL_PROC)),
                hwnd,
                msg,
                wparam,
                lparam,
            )
        }

        SetWindowLongPtrW(hwnd, GWL_WNDPROC, custom_wndproc as *const () as isize);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ServerState { process: Mutex::new(None) })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(target_os = "windows")]
            {
                let window = app.get_webview_window("main").expect("Failed to get main window");
                fix_maximized_frameless_gap(&window);

                // Set the window icon for taskbar/task manager
                // Load the PNG and decode it to raw RGBA
                let png_bytes = include_bytes!("../icons/icon.png");
                let img = image::load_from_memory(png_bytes).expect("Failed to decode icon");
                let rgba = img.to_rgba8();
                let (width, height) = rgba.dimensions();
                let icon = tauri::image::Image::new_owned(rgba.into_raw(), width, height);
                let _ = window.set_icon(icon);
            }
            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { .. } => {
                let state = window.state::<ServerState>();
                if let Ok(mut process_guard) = state.inner().process.try_lock() {
                    if let Some(mut child) = process_guard.take() {
                        let _ = child.kill();
                    }
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            check_server_exists,
            download_server,
            start_server,
            stop_server,
            server_manager::setup_server_config,
            server_manager::graphql_request,
            server_manager::delete_extension_file,
            server_manager::open_verification_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
