use anyhow::{bail, Result};
use clap::Args;
use colored::Colorize;
use serde::Serialize;

use crate::api::{ApiClient, MeResponse};
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct QuickstartArgs {
    /// Skip API connectivity checks
    #[arg(long)]
    pub skip_probe: bool,
}

#[derive(Serialize)]
struct QuickstartStep {
    command: String,
    description: String,
}

#[derive(Serialize)]
struct QuickstartResponse {
    status: String,
    profile: String,
    organization: String,
    environment: String,
    probe: QuickstartProbeSummary,
    next_steps: Vec<QuickstartStep>,
}

#[derive(Serialize)]
struct QuickstartProbeSummary {
    passed: u32,
    failed: u32,
}

pub async fn run(common: &CommonOptions, args: QuickstartArgs) -> Result<()> {
    let json = cli::output::should_use_json(common);
    if !json {
        cli::banner::print_intro("lomi. quickstart");
    }

    let auth = ensure_authenticated(common, true, false, false).await?;
    let client = ApiClient::new(&auth)?;

    let mut passed = 0u32;
    let mut failed = 0u32;
    let mut organization = String::from("unknown");
    let mut environment = String::from("unknown");

    if !args.skip_probe {
        if !json {
            println!("Running integration checks...");
        }

        match async {
            client.get_text("/").await?;
            Ok::<(), anyhow::Error>(())
        }
        .await
        {
            Ok(()) => {
                passed += 1;
                if !json {
                    println!("  {} API connectivity", "✓".green());
                }
            }
            Err(error) => {
                failed += 1;
                if !json {
                    println!("  {} API connectivity — {error}", "✗".red());
                }
            }
        }

        match client.get::<MeResponse>("/me").await {
            Ok(identity) => {
                passed += 1;
                if !json {
                    println!(
                        "  {} Identity: {} ({})",
                        "✓".green(),
                        identity.organization_name,
                        identity.environment
                    );
                }
                organization = identity.organization_name;
                environment = identity.environment;
            }
            Err(error) => {
                failed += 1;
                if !json {
                    println!("  {} Identity — {error}", "✗".red());
                }
            }
        }

        match client.get::<serde_json::Value>("/accounts/balance").await {
            Ok(_) => {
                passed += 1;
                if !json {
                    println!("  {} Account balance", "✓".green());
                }
            }
            Err(error) => {
                failed += 1;
                if !json {
                    println!("  {} Account balance — {error}", "✗".red());
                }
            }
        }
    }

    let next_steps = vec![
        QuickstartStep {
            command: "lomi checkout create --amount 10000 --currency XOF --success-url https://example.com/success --cancel-url https://example.com/cancel --json".to_string(),
            description: "Create a sandbox test checkout session".to_string(),
        },
        QuickstartStep {
            command: "lomi listen http://localhost:3000/webhooks".to_string(),
            description: "Forward webhooks to your local server (sandbox-first)".to_string(),
        },
        QuickstartStep {
            command: "lomi install-rules".to_string(),
            description: "Install AI agent rules for Cursor, Claude, and Codex".to_string(),
        },
        QuickstartStep {
            command: "lomi probe".to_string(),
            description: "Run full integration health checks".to_string(),
        },
    ];

    let status = if failed > 0 { "degraded" } else { "ready" };

    if json {
        return cli::output::print_json(&QuickstartResponse {
            status: status.to_string(),
            profile: common.profile.clone(),
            organization,
            environment,
            probe: QuickstartProbeSummary { passed, failed },
            next_steps,
        });
    }

    cli::output::divider();
    if failed > 0 {
        println!(
            "{} {} probe check(s) failed — fix auth/API connectivity, then retry.",
            "Note:".yellow(),
            failed
        );
    } else if args.skip_probe {
        println!("{} Skipped probe checks.", "Note:".bright_black());
    } else {
        cli::output::print_success("Your CLI is connected and ready.");
    }

    println!();
    println!("{}", "Next steps:".bold());
    for (index, step) in next_steps.iter().enumerate() {
        println!("  {}. {} — {}", index + 1, step.command.cyan(), step.description);
    }

    if failed > 0 {
        bail!("Quickstart completed with {failed} probe failure(s)");
    }

    cli::banner::print_outro("Quickstart complete");
    Ok(())
}
