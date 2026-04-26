// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod loader;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            loader::launch_game,
            loader::terminate_game
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
