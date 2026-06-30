use anyhow::Result;
use clap::Args;

use crate::api::health_check;
use crate::auth::session::ensure_authenticated;
use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct StatusArgs {}

pub async fn run(common: &CommonOptions, _args: StatusArgs) -> Result<()> {
    if common.show_ui() {
        cli::banner::print_intro("Checking lomi. CLI status");
    }

    let spinner = if common.show_ui() {
        let spinner = indicatif::ProgressBar::new_spinner();
        spinner.set_style(
            indicatif::ProgressStyle::default_spinner()
                .template("{spinner} {msg}")
                .unwrap(),
        );
        spinner.set_message("Verifying login...");
        spinner.enable_steady_tick(std::time::Duration::from_millis(100));
        Some(spinner)
    } else {
        None
    };

    let auth = ensure_authenticated(common, true, false, false).await?;

    if let Some(spinner) = &spinner {
        spinner.set_message("Checking API connection...");
    }

    health_check(&auth).await?;

    if let Some(spinner) = spinner {
        spinner.finish_and_clear();
    }

    cli::output::print_success("CLI token valid");
    cli::output::print_success("Connected to lomi. API");
    if common.show_ui() {
        println!();
        cli::output::print_hint("Run `lomi quickstart` to see recommended next steps.");
        cli::banner::print_outro("Status check complete");
    }
    Ok(())
}
