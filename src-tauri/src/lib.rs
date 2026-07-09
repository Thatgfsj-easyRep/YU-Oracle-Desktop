// Tauri app entry point.
// The app loads the static frontend (Vite-built) and uses only
// two plugins: opener (open URLs in default browser) and
// clipboard-manager (write to system clipboard).
// Everything else (draw cards, render hexagrams) is pure
// frontend logic.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }
            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
