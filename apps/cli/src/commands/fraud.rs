use anyhow::Result;
use clap::{Args, Subcommand};

use crate::api::ApiClient;
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct FraudArgs {
    #[command(subcommand)]
    pub command: FraudCommand,
}

#[derive(Subcommand, Debug)]
pub enum FraudCommand {
    /// List fraud alerts
    Alerts(FraudAlertsListArgs),
}

#[derive(Args, Debug)]
pub struct FraudAlertsListArgs {
    #[arg(long)]
    pub status: Option<String>,
    #[arg(long, default_value_t = 1)]
    pub page: u32,
    #[arg(long, default_value_t = 50)]
    pub page_size: u32,
}

pub async fn run(common: &CommonOptions, args: FraudArgs) -> Result<()> {
    match args.command {
        FraudCommand::Alerts(list_args) => list_alerts(common, list_args).await,
    }
}

async fn list_alerts(common: &CommonOptions, args: FraudAlertsListArgs) -> Result<()> {
    let json = cli::output::should_use_json(common);
    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let mut path = format!(
        "/fraud-alerts?page={}&pageSize={}",
        args.page, args.page_size
    );
    if let Some(status) = &args.status {
        path.push_str(&format!("&status={status}"));
    }

    let rows: serde_json::Value = client.get(&path).await?;
    if json {
        return cli::output::print_json(&rows);
    }
    println!("{}", serde_json::to_string_pretty(&rows).unwrap_or_default());
    Ok(())
}
