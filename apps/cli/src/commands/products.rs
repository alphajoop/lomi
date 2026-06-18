use anyhow::Result;
use clap::{Args, Subcommand};
use colored::Colorize;

use crate::api::ApiClient;
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct ProductsArgs {
    #[command(subcommand)]
    pub command: ProductsCommand,
}

#[derive(Subcommand, Debug)]
pub enum ProductsCommand {
    /// List products and prices
    List,
}

pub async fn run(common: &CommonOptions, args: ProductsArgs) -> Result<()> {
    match args.command {
        ProductsCommand::List => list_products(common).await,
    }
}

async fn list_products(common: &CommonOptions) -> Result<()> {
    let json = cli::output::should_use_json(common);
    if !json {
        cli::banner::print_intro("Products");
    }

    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let rows: Vec<serde_json::Value> = client.get("/products").await?;

    if json {
        return cli::output::print_json(&rows);
    }

    if rows.is_empty() {
        println!("{} No products found.", "○".bright_black());
        return Ok(());
    }

    for row in rows {
        let name = row
            .get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("Unnamed");
        let product_id = row
            .get("product_id")
            .or_else(|| row.get("id"))
            .and_then(|v| v.as_str())
            .unwrap_or("-");
        println!("{} {}", name.bold(), product_id.bright_black());

        if let Some(prices) = row.get("prices").and_then(|v| v.as_array()) {
            for price in prices {
                let price_id = price
                    .get("price_id")
                    .or_else(|| price.get("id"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("-");
                let amount = price.get("amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
                let currency = price
                    .get("currency_code")
                    .and_then(|v| v.as_str())
                    .unwrap_or("XOF");
                println!(
                    "  {} {} {}",
                    "○".bright_black(),
                    price_id.cyan(),
                    format!("{amount} {currency}").bright_black()
                );
            }
        }
    }
    Ok(())
}
