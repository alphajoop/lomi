use anyhow::Result;
use colored::Colorize;

use crate::api::{ApiClient, MeResponse};
use crate::cli;

#[derive(Debug, Clone, Default)]
pub struct ProbeSummary {
    pub passed: u32,
    pub failed: u32,
    pub organization: Option<String>,
    pub environment: Option<String>,
}

pub async fn run_core_checks(client: &ApiClient, json: bool) -> ProbeSummary {
    let mut summary = ProbeSummary::default();

    let connectivity = async {
        client.get_text("/").await?;
        Ok::<(), anyhow::Error>(())
    }
    .await;

    match connectivity {
        Ok(()) => {
            summary.passed += 1;
            if !json {
                cli::output::print_probe_ok("API connectivity");
            }
        }
        Err(error) => {
            summary.failed += 1;
            if !json {
                cli::output::print_probe_fail("API connectivity", &error.to_string());
            }
        }
    }

    match client.get::<MeResponse>("/me").await {
        Ok(identity) => {
            summary.passed += 1;
            summary.organization = Some(identity.organization_name.clone());
            summary.environment = Some(identity.environment.clone());
            if !json {
                cli::output::print_probe_ok(&format!(
                    "Identity: {} ({})",
                    identity.organization_name, identity.environment
                ));
            }
        }
        Err(error) => {
            summary.failed += 1;
            if !json {
                cli::output::print_probe_fail("Identity (GET /me)", &error.to_string());
            }
        }
    }

    for (label, result) in [
        (
            "Account balance (GET /accounts/balance)",
            client
                .get::<serde_json::Value>("/accounts/balance")
                .await
                .map(|_| ()),
        ),
        (
            "Providers (GET /providers)",
            client
                .get::<Vec<serde_json::Value>>("/providers")
                .await
                .map(|_| ()),
        ),
    ] {
        match result {
            Ok(()) => {
                summary.passed += 1;
                if !json {
                    cli::output::print_probe_ok(label);
                }
            }
            Err(error) => {
                summary.failed += 1;
                if !json {
                    cli::output::print_probe_fail(label, &error.to_string());
                }
            }
        }
    }

    match client.get::<Vec<serde_json::Value>>("/webhooks").await {
        Ok(rows) => {
            summary.passed += 1;
            if !json {
                cli::output::print_probe_ok(&format!("Webhooks: {} configured", rows.len()));
            }
        }
        Err(error) => {
            summary.failed += 1;
            if !json {
                cli::output::print_probe_fail("Webhooks (GET /webhooks)", &error.to_string());
            }
        }
    }

    summary
}

pub fn print_probe_totals(passed: u32, failed: u32) {
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
}

pub fn ensure_probe_passed(failed: u32) -> Result<()> {
    if failed > 0 {
        anyhow::bail!("Probe completed with {failed} failure(s)");
    }
    Ok(())
}
