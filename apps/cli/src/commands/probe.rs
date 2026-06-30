use anyhow::Result;
use clap::Args;

use crate::api::ApiClient;
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};
use crate::commands::probe_checks::{ensure_probe_passed, print_probe_totals, run_core_checks};

#[derive(Args, Debug)]
pub struct ProbeArgs {
    /// Send a test event to the first configured webhook
    #[arg(long)]
    pub send_test_webhook: bool,
}

pub async fn run(common: &CommonOptions, args: ProbeArgs) -> Result<()> {
    if common.show_ui() {
        cli::banner::print_intro("Integration probe");
    }
    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let json = cli::output::should_use_json(common);
    let summary = run_core_checks(&client, json).await;

    let mut passed = summary.passed;
    let mut failed = summary.failed;

    if args.send_test_webhook {
        match client.get::<Vec<serde_json::Value>>("/webhooks").await {
            Ok(rows) => {
                if let Some(first) = rows.first() {
                    let id = first
                        .get("id")
                        .or_else(|| first.get("webhook_id"))
                        .and_then(|v| v.as_str());
                    if let Some(id) = id {
                        match client
                            .post::<serde_json::Value, _>(
                                &format!("/webhooks/{id}/test"),
                                &serde_json::json!({}),
                            )
                            .await
                        {
                            Ok(_) => {
                                passed += 1;
                                if !json {
                                    cli::output::print_probe_ok(&format!(
                                        "Test webhook (POST /webhooks/{id}/test)"
                                    ));
                                }
                            }
                            Err(error) => {
                                failed += 1;
                                if !json {
                                    cli::output::print_probe_fail(
                                        &format!("Test webhook (POST /webhooks/{id}/test)"),
                                        &error.to_string(),
                                    );
                                }
                            }
                        }
                    } else if !json {
                        cli::output::print_probe_fail("Test webhook", "no webhook id found");
                        failed += 1;
                    }
                } else if !json {
                    cli::output::print_dim("No webhooks configured — skipped test webhook.");
                }
            }
            Err(error) => {
                failed += 1;
                if !json {
                    cli::output::print_probe_fail("Test webhook", &error.to_string());
                }
            }
        }
    }

    if !json {
        print_probe_totals(passed, failed);
    }

    ensure_probe_passed(failed)?;

    if common.show_ui() {
        cli::banner::print_outro("Integration probe complete");
    }
    Ok(())
}
