use anyhow::Result;
use clap::{Args, Subcommand};
use colored::Colorize;

use crate::api::ApiClient;
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct WebhooksArgs {
    #[command(subcommand)]
    pub command: WebhooksCommand,
}

#[derive(Subcommand, Debug)]
pub enum WebhooksCommand {
    /// List configured webhooks
    List,
    /// Send a test event to a webhook endpoint
    Test {
        /// Webhook ID
        id: String,
    },
}

pub async fn run(common: &CommonOptions, args: WebhooksArgs) -> Result<()> {
    match args.command {
        WebhooksCommand::List => list_webhooks(common).await,
        WebhooksCommand::Test { id } => test_webhook(common, &id).await,
    }
}

async fn list_webhooks(common: &CommonOptions) -> Result<()> {
    let json = cli::output::should_use_json(common);
    if !json {
        cli::banner::print_intro("Webhook endpoints");
    }

    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let rows: Vec<serde_json::Value> = client.get("/webhooks").await?;

    if json {
        return cli::output::print_json(&rows);
    }

    if rows.is_empty() {
        println!("{} No webhooks configured.", "○".bright_black());
        return Ok(());
    }

    for row in rows {
        let id = row
            .get("id")
            .or_else(|| row.get("webhook_id"))
            .and_then(|v| v.as_str())
            .unwrap_or("-");
        let url = row.get("url").and_then(|v| v.as_str()).unwrap_or("-");
        let active = row
            .get("active")
            .or_else(|| row.get("is_active"))
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        let status = if active {
            "active".green()
        } else {
            "inactive".bright_black()
        };
        println!("{} {} {}", id.cyan(), url.bright_blue(), status);
    }
    Ok(())
}

async fn test_webhook(common: &CommonOptions, id: &str) -> Result<()> {
    let json = cli::output::should_use_json(common);
    if !json {
        cli::banner::print_intro("Send test webhook");
    }

    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let response: serde_json::Value = client
        .post(&format!("/webhooks/{id}/test"), &serde_json::json!({}))
        .await?;

    if json {
        return cli::output::print_json(&response);
    }

    cli::output::print_success("Test webhook sent");
    if !response.is_null() {
        println!("{}", serde_json::to_string_pretty(&response).unwrap_or_default());
    }
    Ok(())
}
