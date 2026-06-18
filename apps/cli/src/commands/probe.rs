use anyhow::Result;
use clap::Args;
use colored::Colorize;

use crate::api::{ApiClient, MeResponse};
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct ProbeArgs {
    /// Send a test event to the first configured webhook
    #[arg(long)]
    pub send_test_webhook: bool,
}

pub async fn run(common: &CommonOptions, args: ProbeArgs) -> Result<()> {
    cli::banner::print_intro("Integration probe");
    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let mut passed = 0u32;
    let mut failed = 0u32;

    async fn step(label: &str, result: Result<()>) -> (u32, u32) {
        match result {
            Ok(()) => {
                println!("  {} {}", "✓".green(), label);
                (1, 0)
            }
            Err(error) => {
                println!("  {} {} — {}", "✗".red(), label, error);
                (0, 1)
            }
        }
    }

    let (p, f) = step(
        "API connectivity (GET /)",
        async {
            client.get_text("/").await?;
            Ok(())
        }
        .await,
    )
    .await;
    passed += p;
    failed += f;

    match client.get::<MeResponse>("/me").await {
        Ok(identity) => {
            println!(
                "  {} Identity: {} ({})",
                "✓".green(),
                identity.organization_name,
                identity.environment
            );
            passed += 1;
        }
        Err(error) => {
            println!("  {} Identity (GET /me) — {}", "✗".red(), error);
            failed += 1;
        }
    }

    let (p, f) = step(
        "Account balance (GET /accounts/balance)",
        client
            .get::<serde_json::Value>("/accounts/balance")
            .await
            .map(|_| ()),
    )
    .await;
    passed += p;
    failed += f;

    let (p, f) = step(
        "Providers (GET /providers)",
        client
            .get::<Vec<serde_json::Value>>("/providers")
            .await
            .map(|_| ()),
    )
    .await;
    passed += p;
    failed += f;

    match client.get::<Vec<serde_json::Value>>("/webhooks").await {
        Ok(rows) => {
            println!("  {} Webhooks: {} configured", "✓".green(), rows.len());
            passed += 1;

            if args.send_test_webhook {
                if let Some(first) = rows.first() {
                    let id = first
                        .get("id")
                        .or_else(|| first.get("webhook_id"))
                        .and_then(|v| v.as_str());
                    if let Some(id) = id {
                        let (p, f) = step(
                            &format!("Test webhook (POST /webhooks/{id}/test)"),
                            client
                                .post::<serde_json::Value, _>(
                                    &format!("/webhooks/{id}/test"),
                                    &serde_json::json!({}),
                                )
                                .await
                                .map(|_| ()),
                        )
                        .await;
                        passed += p;
                        failed += f;
                    } else {
                        println!("  {} Test webhook — no webhook id found", "✗".red());
                        failed += 1;
                    }
                } else {
                    println!(
                        "  {} Test webhook — no webhooks configured",
                        "○".bright_black()
                    );
                }
            }
        }
        Err(error) => {
            println!("  {} Webhooks (GET /webhooks) — {}", "✗".red(), error);
            failed += 1;
        }
    }

    cli::output::divider();
    println!(
        "{} passed, {} failed",
        passed.to_string().green(),
        if failed > 0 {
            failed.to_string().red().to_string()
        } else {
            failed.to_string().bright_black().to_string()
        }
    );

    if failed > 0 {
        anyhow::bail!("Probe completed with {failed} failure(s)");
    }

    cli::banner::print_outro("Integration probe complete");
    Ok(())
}
