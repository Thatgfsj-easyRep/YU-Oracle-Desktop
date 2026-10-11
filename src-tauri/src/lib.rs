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
            // open_devtools 只有桌面端 WebView 提供；移动端（iOS/Android）连编译都不会过，
            // 所以除了 debug_assertions 还要限定 desktop。
            #[cfg(all(debug_assertions, desktop))]
            {
                use tauri::Manager;
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
