use anyhow::Result;
use clap::{Args, Subcommand};
use colored::Colorize;

use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct McpArgs {
    #[command(subcommand)]
    pub command: McpCommand,
}

#[derive(Subcommand, Debug)]
pub enum McpCommand {
    /// Print HTTP MCP configuration for Cursor or Claude
    Config(McpConfigArgs),
}

#[derive(Args, Debug)]
pub struct McpConfigArgs {
    /// MCP HTTP server URL
    #[arg(long, default_value = "https://mcp.lomi.africa")]
    pub url: String,

    /// Output format: cursor or claude
    #[arg(long, default_value = "cursor")]
    pub target: String,
}

pub async fn run(common: &CommonOptions, args: McpArgs) -> Result<()> {
    match args.command {
        McpCommand::Config(config) => run_config(common, config).await,
    }
}

async fn run_config(common: &CommonOptions, args: McpConfigArgs) -> Result<()> {
    let json = cli::output::should_use_json(common);
    if !json {
        cli::banner::print_intro("MCP HTTP configuration");
    }

    let api_key = std::env::var("LOMI_SECRET_KEY").ok();

    let key_placeholder = "<your-lomi-secret-key>";

    let snippet = match args.target.as_str() {
        "cursor" => serde_json::json!({
            "mcpServers": {
                "lomi": {
                    "url": format!("{}/mcp", args.url.trim_end_matches('/')),
                    "headers": {
                        "Authorization": "Bearer YOUR_TRANSPORT_SECRET",
                        "x-lomi-api-key": api_key.clone().unwrap_or_else(|| key_placeholder.to_string())
                    }
                }
            }
        }),
        "claude" => serde_json::json!({
            "mcpServers": {
                "lomi": {
                    "type": "http",
                    "url": format!("{}/mcp", args.url.trim_end_matches('/')),
                    "headers": {
                        "Authorization": "Bearer YOUR_TRANSPORT_SECRET",
                        "x-lomi-api-key": api_key.clone().unwrap_or_else(|| key_placeholder.to_string())
                    }
                }
            }
        }),
        other => {
            anyhow::bail!("Unknown target {other}. Use cursor or claude.");
        }
    };

    if json {
        return cli::output::print_json(&snippet);
    }

    println!("{}", "Paste into your MCP client settings:".bright_black());
    println!("{}", serde_json::to_string_pretty(&snippet)?);
    if api_key.is_none() {
        println!(
            "{}",
            "Tip: set LOMI_SECRET_KEY in your environment to embed your key.".yellow()
        );
    }
    Ok(())
}
