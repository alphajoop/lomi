use anyhow::Result;
use clap::Args;
use colored::Colorize;

use crate::api::ApiClient;
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct TriggerArgs {
    /// Webhook event type to emit (sandbox synthetic payload)
    pub event: String,

    /// Optional webhook ID to scope delivery
    #[arg(long)]
    pub webhook_id: Option<String>,
}

pub async fn run(common: &CommonOptions, args: TriggerArgs) -> Result<()> {
    let json = cli::output::should_use_json(common);
    if !json {
        cli::banner::print_intro("Trigger synthetic webhook event");
    }

    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let body = serde_json::json!({
        "event": args.event,
        "webhook_id": args.webhook_id,
    });

    let response: serde_json::Value = client.post("/cli/trigger", &body).await?;

    if json {
        return cli::output::print_json(&response);
    }

    cli::output::print_success(&format!("Triggered {}", args.event.cyan()));
    Ok(())
}
