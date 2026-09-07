use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct EngineHealth {
    pub backend: String,
    pub version: String,
    pub policy: String,
}

#[tauri::command]
fn engine_health() -> EngineHealth {
    EngineHealth {
        backend: "rust".into(),
        version: env!("CARGO_PKG_VERSION").into(),
        policy: "zero-lookahead; cached-by-dataset-hash".into(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![engine_health])
        .run(tauri::generate_context!())
        .expect("error while running DHAPPA V3");
}
