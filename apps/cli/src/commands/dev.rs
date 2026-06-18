use anyhow::Result;
use axum::{
    body::Bytes,
    extract::State,
    http::{HeaderMap, StatusCode},
    routing::{get, post},
    Router,
};
use clap::Args;
use colored::Colorize;
use std::net::SocketAddr;
use std::sync::Arc;

use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions, DEFAULT_DEV_PORT, DOCS_URL};
use crate::commands::install_rules::{self, InstallRulesArgs};
use crate::config::GlobalConfig;

#[derive(Clone)]
struct AppState {
    verify_signature: bool,
}

#[derive(Args, Debug)]
pub struct DevArgs {
    /// Port to run the webhook server on
    #[arg(short, long, default_value_t = DEFAULT_DEV_PORT)]
    pub port: u16,

    /// Path to .env file
    #[arg(long, default_value = ".env")]
    pub env_file: String,

    /// Verify webhook signatures using LOMI_WEBHOOK_SECRET (auto-enabled when secret is set)
    #[arg(long)]
    pub verify_signature: Option<bool>,

    /// Skip agent rules install prompt
    #[arg(long)]
    pub skip_rules_install: bool,
}

pub async fn run(common: &CommonOptions, args: DevArgs) -> Result<()> {
    let _auth = ensure_authenticated(common, true, true, true).await?;

    if !args.skip_rules_install {
        maybe_prompt_rules(common).await?;
    }

    load_dotenv(&args.env_file);

    let verify_signature = args
        .verify_signature
        .unwrap_or_else(|| std::env::var("LOMI_WEBHOOK_SECRET").is_ok());

    cli::banner::print_intro("Starting lomi. development server");
    cli::output::divider();
    println!(
        "{} {} {} {} {}",
        "Key:".bright_black(),
        "Webhook".yellow(),
        "|".bright_black(),
        "Event".blue(),
        "|".bright_black()
    );
    cli::output::divider();

    let state = Arc::new(AppState {
        verify_signature,
    });

    let app = Router::new()
        .route("/webhook", post(handle_webhook))
        .route("/health", get(|| async { "ok" }))
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], args.port));
    let listener = tokio::net::TcpListener::bind(addr).await?;

    println!(
        "{} Local webhook server ready at {}",
        "○".bright_black(),
        format!("http://localhost:{}/webhook", args.port).green()
    );
    println!(
        "{} For cloud relay without ngrok, use: {}",
        "○".bright_black(),
        format!("lomi listen http://localhost:{}/webhook", args.port).green()
    );
    println!(
        "{} Or point your dashboard webhook endpoint to this URL",
        "○".bright_black()
    );
    println!("{} Docs: {}", "○".bright_black(), DOCS_URL.bright_blue());
    println!();
    println!("Press Ctrl+C to stop.");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    println!();
    cli::output::print_success("Development server stopped.");
    Ok(())
}

async fn maybe_prompt_rules(common: &CommonOptions) -> Result<()> {
    let mut config = GlobalConfig::load()?;
    let manifest_version = crate::rules::manifest::MANIFEST_VERSION;

    let should_prompt = !config.settings.has_seen_rules_install_prompt
        || config
            .settings
            .last_rules_install_version
            .as_deref()
            .map(|v| v != manifest_version)
            .unwrap_or(true);

    if !should_prompt || !crate::cli::output::is_tty() {
        return Ok(());
    }

    let install = cli::prompts::confirm(
        "Would you like to install the lomi. agent rules for Cursor / Claude?",
        true,
    )?;

    config.settings.has_seen_rules_install_prompt = true;
    config.save()?;

    if install {
        install_rules::run(
            common,
            InstallRulesArgs {
                target: None,
                force: false,
            },
        )
        .await?;
    }

    Ok(())
}

fn load_dotenv(path: &str) {
    if let Ok(contents) = std::fs::read_to_string(path) {
        for line in contents.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            if let Some((key, value)) = line.split_once('=') {
                std::env::set_var(key.trim(), value.trim());
            }
        }
    }
}

async fn handle_webhook(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<(StatusCode, String), StatusCode> {
    let timestamp = chrono::Local::now().format("%b %d %H:%M:%S%.3f");
    println!();
    println!(
        "{} {} {}",
        timestamp.to_string().bright_black(),
        "Webhook".yellow(),
        "received".bright_black()
    );
    println!("  {} POST", "Method:".blue());
    println!("  {} /webhook", "Path:".blue());

    for (key, value) in headers.iter() {
        if let Ok(value) = value.to_str() {
            println!("  {}: {}", key.as_str().cyan(), value);
        }
    }

    let raw_body = String::from_utf8_lossy(&body);
    let header_pairs: Vec<(String, String)> = headers
        .iter()
        .filter_map(|(k, v)| v.to_str().ok().map(|s| (k.as_str().to_string(), s.to_string())))
        .collect();

    let event_type = headers
        .get("x-lomi-event")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    if let Some(event) = &event_type {
        println!("  {} {}", "Event:".blue(), event.yellow().bold());
    }

    if state.verify_signature {
        match crate::webhook::verify_from_headers(&raw_body, &header_pairs) {
            Ok(verified_event) => {
                let label = verified_event.unwrap_or_else(|| "unknown".to_string());
                println!(
                    "  {} {} ({})",
                    "Signature:".green(),
                    "verified".green(),
                    label.bright_black()
                );
            }
            Err(message) => {
                println!("  {} {}", "Signature:".red(), message);
                return Err(StatusCode::BAD_REQUEST);
            }
        }
    }

    match serde_json::from_str::<serde_json::Value>(&raw_body) {
        Ok(json) => {
            if event_type.is_none() {
                if let Some(event) = json.get("event").and_then(|v| v.as_str()) {
                    println!("  {} {}", "Event:".blue(), event.yellow().bold());
                }
            }
            println!("  {}:", "Payload".blue());
            println!("{}", serde_json::to_string_pretty(&json).unwrap_or_default());
        }
        Err(_) => println!("  {}: {}", "Body".blue(), raw_body),
    }

    Ok((StatusCode::OK, r#"{"received":true}"#.to_string()))
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install Ctrl+C handler");
}
