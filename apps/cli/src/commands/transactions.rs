use anyhow::Result;
use clap::{Args, Subcommand};
use colored::Colorize;

use crate::api::ApiClient;
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct TransactionsArgs {
    #[command(subcommand)]
    pub command: TransactionsCommand,
}

#[derive(Subcommand, Debug)]
pub enum TransactionsCommand {
    /// List recent transactions
    List(TransactionsListArgs),
    /// Get a transaction by ID
    Get {
        /// Transaction ID
        id: String,
    },
}

#[derive(Args, Debug)]
pub struct TransactionsListArgs {
    /// Maximum number of transactions to return
    #[arg(long, default_value_t = 10)]
    pub limit: u32,
}

pub async fn run(common: &CommonOptions, args: TransactionsArgs) -> Result<()> {
    match args.command {
        TransactionsCommand::List(list_args) => list_transactions(common, list_args).await,
        TransactionsCommand::Get { id } => get_transaction(common, &id).await,
    }
}

async fn list_transactions(common: &CommonOptions, args: TransactionsListArgs) -> Result<()> {
    let json = cli::output::should_use_json(common);
    if !json {
        cli::banner::print_intro("Transactions");
    }

    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let path = format!("/transactions?limit={}", args.limit);
    let rows: Vec<serde_json::Value> = client.get(&path).await?;

    if json {
        return cli::output::print_json(&rows);
    }

    if rows.is_empty() {
        println!("{} No transactions found.", "○".bright_black());
        return Ok(());
    }

    for row in rows {
        print_transaction_row(&row);
    }
    Ok(())
}

async fn get_transaction(common: &CommonOptions, id: &str) -> Result<()> {
    let json = cli::output::should_use_json(common);
    if !json {
        cli::banner::print_intro("Transaction details");
    }

    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let row: serde_json::Value = client.get(&format!("/transactions/{id}")).await?;

    if json {
        return cli::output::print_json(&row);
    }

    print_transaction_row(&row);
    Ok(())
}

fn print_transaction_row(row: &serde_json::Value) {
    let id = row
        .get("transaction_id")
        .or_else(|| row.get("id"))
        .and_then(|v| v.as_str())
        .unwrap_or("-");
    let status = row
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");
    let amount = row.get("gross_amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let currency = row
        .get("currency_code")
        .and_then(|v| v.as_str())
        .unwrap_or("XOF");
    println!(
        "{} {} {}",
        id.cyan(),
        status.yellow(),
        format!("{amount} {currency}").bright_black(),
    );
}
