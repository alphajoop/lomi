use anyhow::Result;
use clap::{Args, Subcommand};

use crate::api::ApiClient;
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct DisputesArgs {
    #[command(subcommand)]
    pub command: DisputesCommand,
}

#[derive(Subcommand, Debug)]
pub enum DisputesCommand {
    /// List disputes
    List(DisputesListArgs),
    /// Get a dispute by ID
    Get { id: String },
}

#[derive(Args, Debug)]
pub struct DisputesListArgs {
    #[arg(long)]
    pub status: Option<String>,
    #[arg(long, default_value_t = 1)]
    pub page: u32,
    #[arg(long, default_value_t = 50)]
    pub page_size: u32,
}

pub async fn run(common: &CommonOptions, args: DisputesArgs) -> Result<()> {
    match args.command {
        DisputesCommand::List(list_args) => list_disputes(common, list_args).await,
        DisputesCommand::Get { id } => get_dispute(common, &id).await,
    }
}

async fn list_disputes(common: &CommonOptions, args: DisputesListArgs) -> Result<()> {
    let json = cli::output::should_use_json(common);
    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let mut path = format!("/disputes?page={}&pageSize={}", args.page, args.page_size);
    if let Some(status) = &args.status {
        path.push_str(&format!("&status={status}"));
    }

    let rows: serde_json::Value = client.get(&path).await?;
    if json {
        return cli::output::print_json(&rows);
    }
    println!(
        "{}",
        serde_json::to_string_pretty(&rows).unwrap_or_default()
    );
    Ok(())
}

async fn get_dispute(common: &CommonOptions, id: &str) -> Result<()> {
    let json = cli::output::should_use_json(common);
    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;
    let row: serde_json::Value = client.get(&format!("/disputes/{id}")).await?;
    if json {
        return cli::output::print_json(&row);
    }
    println!("{}", serde_json::to_string_pretty(&row).unwrap_or_default());
    Ok(())
}
