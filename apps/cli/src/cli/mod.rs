pub mod banner;
pub mod output;
pub mod prompts;

use clap::Args;

pub const PRODUCTION_API_URL: &str = "https://api.lomi.africa";
pub const SANDBOX_API_URL: &str = "https://sandbox.api.lomi.africa";
pub const LOCAL_API_URL: &str = "http://localhost:4242";
pub const SUPABASE_URL: &str = "https://mdswvokxrnfggrujsfjd.supabase.co";
pub fn cli_auth_base() -> String {
    format!("{SUPABASE_URL}/functions/v1/cli-auth")
}
/// Public Supabase anon key (same as dashboard client). Override via LOMI_SUPABASE_ANON_KEY.
pub const SUPABASE_ANON_KEY: &str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kc3d2b2t4cm5mZ2dydWpzZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MTA0NTIsImV4cCI6MjA4NTg3MDQ1Mn0.vWQoCk2mBTUPWVpzcu3WmKv9xwXoj0bv8SCRrEdJxpM";
pub const DOCS_URL: &str = "https://docs.lomi.africa";
pub const LOMI_UI_REGISTRY_URL: &str = "https://docs.lomi.africa/r/registry.json";
pub const LOMI_UI_INDEX_URL: &str = "https://docs.lomi.africa/r/index.json";
pub const DEFAULT_DEV_PORT: u16 = 4242;

pub fn lomi_ui_registry_url() -> String {
    std::env::var("LOMI_UI_REGISTRY_URL").unwrap_or_else(|_| LOMI_UI_REGISTRY_URL.to_string())
}

pub fn lomi_ui_index_url() -> String {
    std::env::var("LOMI_UI_INDEX_URL").unwrap_or_else(|_| LOMI_UI_INDEX_URL.to_string())
}

pub fn lomi_ui_item_url(name: &str) -> String {
    let registry_url = lomi_ui_registry_url();
    let base = registry_url
        .trim_end_matches("registry.json")
        .trim_end_matches('/');
    format!("{base}/{name}.json")
}

#[derive(Clone, Args, Debug)]
pub struct CommonOptions {
    /// The login profile to use
    #[arg(long, default_value = "default", global = true)]
    pub profile: String,

    /// Override the API URL
    #[arg(short = 'a', long, global = true)]
    pub api_url: Option<String>,

    /// CLI log level (debug, info, warn, error)
    #[arg(short = 'l', long, default_value = "info", global = true)]
    pub log_level: String,

    /// Opt-out of sending telemetry
    #[arg(long, global = true)]
    pub skip_telemetry: bool,

    /// Emit machine-readable JSON to stdout (suppresses banners and spinners)
    #[arg(long, global = true)]
    pub json: bool,
}

impl CommonOptions {
    pub fn use_json(&self) -> bool {
        self.json || !output::is_tty()
    }
}

impl CommonOptions {
    pub fn resolved_api_url(&self) -> String {
        self.api_url
            .clone()
            .unwrap_or_else(|| PRODUCTION_API_URL.to_string())
    }
}
