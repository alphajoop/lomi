use anyhow::Result;
use clap::Args;
use colored::Colorize;
use serde::Serialize;

use crate::api::ApiClient;
use crate::auth::session::{ensure_authenticated, try_authenticated, verify_and_refresh_metadata, AuthResult};
use crate::cli::{self, CommonOptions};
use crate::commands::probe_checks::{ensure_probe_passed, run_core_checks};

#[derive(Args, Debug)]
pub struct QuickstartArgs {
    /// Skip API connectivity checks
    #[arg(long)]
    pub skip_probe: bool,
}

#[derive(Serialize)]
pub struct QuickstartStep {
    pub command: String,
    pub description: String,
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
    if common.show_ui() {
        cli::banner::print_intro("lomi. quickstart");
    }

    let auth = match try_authenticated(common) {
        AuthResult::Authenticated(auth) => auth,
        AuthResult::Expired(_) | AuthResult::Failed(_) => {
            if common.show_ui() {
                cli::output::print_info("No valid session found — starting login...");
            }
            ensure_authenticated(common, true, true, json).await?
        }
    };

    let client = ApiClient::new(&auth)?;

    let mut passed = 0u32;
    let mut failed = 0u32;
    let mut organization = String::from("unknown");
    let mut environment = String::from("unknown");

    if !args.skip_probe {
        if common.show_ui() {
            println!();
            println!("{}", "Running checks...".bold());
        }

        let summary = run_core_checks(&client, json).await;
        passed = summary.passed;
        failed = summary.failed;
        if let Some(org) = summary.organization {
            organization = org;
        }
        if let Some(env) = summary.environment {
            environment = env;
        }
    } else if let Ok(identity) = verify_and_refresh_metadata(&auth).await {
        organization = identity.organization_name;
        environment = identity.environment;
    }

    let next_steps = default_next_steps();

    let status = if failed > 0 { "degraded" } else { "ready" };

    if json {
        return cli::output::print_json(&QuickstartResponse {
            status: status.to_string(),
            profile: common.effective_profile()?,
            organization,
            environment,
            probe: QuickstartProbeSummary { passed, failed },
            next_steps,
        });
    }

    cli::output::divider();
    if failed > 0 {
        cli::output::print_hint(&format!(
            "{failed} check(s) failed — run `lomi login` if your token expired, then retry."
        ));
    } else if args.skip_probe {
        cli::output::print_dim("Skipped probe checks.");
    } else {
        cli::output::print_success("Your CLI is connected and ready.");
    }

    println!();
    println!("{}", "Next steps:".bold());
    for (index, step) in next_steps.iter().enumerate() {
        cli::output::print_list_item(index, &step.command, &step.description);
    }

    ensure_probe_passed(failed)?;
    cli::banner::print_outro("Quickstart complete");
    Ok(())
}

pub fn default_next_steps() -> Vec<QuickstartStep> {
    vec![
        QuickstartStep {
            command: "lomi checkout create --amount 10000 --currency XOF --success-url https://example.com/success --cancel-url https://example.com/cancel --json".to_string(),
            description: "Create a sandbox test checkout session".to_string(),
        },
        QuickstartStep {
            command: "lomi listen http://localhost:3000/webhooks".to_string(),
            description: "Forward webhooks to your local server".to_string(),
        },
        QuickstartStep {
            command: "lomi install-rules".to_string(),
            description: "Install AI agent rules for Cursor, Claude, and Codex".to_string(),
        },
        QuickstartStep {
            command: "lomi init".to_string(),
            description: "Scaffold a project with SDK examples".to_string(),
        },
    ]
}
