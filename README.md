# MangaWin

MangaWin is a beautiful, standalone, and zero-configuration desktop manga reader for Windows. It serves as a native, lightweight wrapper around the incredibly powerful [Suwayomi (Tachidesk)](https://github.com/Suwayomi/Suwayomi-Server) engine, bringing the full Tachiyomi experience to your desktop without any of the setup hassle.

## Features

- **Zero-Configuration Setup:** No Java installation required! MangaWin automatically downloads a portable Java runtime and the latest Suwayomi engine seamlessly on your first boot.
- **Native Windows UI:** Features a sleek, borderless window design with a custom titlebar and a beautiful retro-terminal dashboard for advanced engine settings.
- **Automatic Extension Cleanup:** Integrates a smart background watchdog that automatically cleans up orphaned `.apk` extensions from your hard drive if the Suwayomi engine leaves them behind after an uninstallation.
- **Background Resource Management:** Automatically detects when you close the app and instantly terminates the background Java server to prevent memory leaks and zombie processes.
- **Fully Un-installable:** Comes with a custom NSIS uninstaller script that guarantees all core configuration files, extensions, and downloaded manga are cleanly wiped from your system if you ever decide to uninstall.

## How it Works

Under the hood, MangaWin is built using **Tauri**, **React**, **Vite**, and **Tailwind CSS**. 
When you launch MangaWin, the Rust backend automatically manages the lifecycle of a headless Java Suwayomi-Server. The frontend then securely interfaces with Suwayomi's internal WebUI, presenting it in a seamless, fullscreen desktop experience.

## Building from Source

To compile your own production installer, ensure you have [Node.js](https://nodejs.org) and [Rust](https://rustup.rs) installed on your system.

```bash
# Install dependencies
npm install

# Start the development server (with hot-reloading)
npm run tauri dev

# Compile the final optimized .exe and MSI installers
npm run tauri build
```

Your final compiled installers will be located in the `src-tauri/target/release/bundle/nsis/` directory.

## Data Storage

MangaWin stores all of its critical data in your local AppData folder to prevent cluttering your Documents or Program Files.

- **MangaWin Core Files (Java/Engine):** `%LOCALAPPDATA%\MangaWin`
- **Suwayomi Data (Extensions/Downloads/Library):** `%LOCALAPPDATA%\Tachidesk`

*Note: Deleting these folders will reset your app to a fresh installation state.*
