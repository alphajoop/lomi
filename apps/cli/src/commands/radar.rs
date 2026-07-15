use anyhow::Result;
use clap::{Args, Subcommand};

use crate::api::ApiClient;
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct RadarArgs {
    #[command(subcommand)]
    pub command: RadarCommand,
}

#[derive(Subcommand, Debug)]
pub enum RadarCommand {
    /// List risk assessments
    Assessments(RadarAssessmentsListArgs),
    /// Get Radar settings
    Settings,
}

#[derive(Args, Debug)]
pub struct RadarAssessmentsListArgs {
    #[arg(long)]
    pub decision: Option<String>,
    #[arg(long)]
    pub rail: Option<String>,
    #[arg(long, default_value_t = 1)]
    pub page: u32,
    #[arg(long, default_value_t = 50)]
    pub page_size: u32,
}

pub async fn run(common: &CommonOptions, args: RadarArgs) -> Result<()> {
    match args.command {
        RadarCommand::Assessments(list_args) => list_assessments(common, list_args).await,
        RadarCommand::Settings => get_settings(common).await,
    }
}

async fn list_assessments(common: &CommonOptions, args: RadarAssessmentsListArgs) -> Result<()> {
    let json = cli::output::should_use_json(common);
    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let mut path = format!(
        "/risk-assessments?page={}&pageSize={}",
        args.page, args.page_size
    );
    if let Some(decision) = &args.decision {
        path.push_str(&format!("&decision={decision}"));
    }
    if let Some(rail) = &args.rail {
        path.push_str(&format!("&rail={rail}"));
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

async fn get_settings(common: &CommonOptions) -> Result<()> {
    let json = cli::output::should_use_json(common);
    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let rows: serde_json::Value = client.get("/organization/radar-settings").await?;
    if json {
        return cli::output::print_json(&rows);
    }
    println!(
        "{}",
        serde_json::to_string_pretty(&rows).unwrap_or_default()
    );
    Ok(())
}
