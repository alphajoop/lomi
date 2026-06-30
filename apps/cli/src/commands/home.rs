use anyhow::Result;
use clap::Args;
use colored::Colorize;

use crate::auth::session::try_authenticated;
use crate::cli::{self, CommonOptions};
use crate::commands::quickstart;

#[derive(Args, Debug)]
pub struct HomeArgs {}

pub async fn run(common: &CommonOptions, _args: HomeArgs) -> Result<()> {
    if common.show_ui() {
        cli::banner::print_intro("Welcome to lomi.");
    }

    let profile = common.effective_profile()?;
    match try_authenticated(common) {
        crate::auth::session::AuthResult::Authenticated(auth) => {
            cli::output::print_success(&format!(
                "Logged in to profile `{}` ({})",
                auth.profile, auth.api_url
            ));
            println!();
            println!("{}", "Get started:".bold());
            for (index, step) in quickstart::default_next_steps().iter().enumerate() {
                cli::output::print_list_item(index, &step.command, &step.description);
            }
        }
        crate::auth::session::AuthResult::Expired(_) => {
            cli::output::print_auth_expired(&profile);
            cli::output::print_hint(&format!("Run `lomi login --profile {profile}` to continue."));
        }
        crate::auth::session::AuthResult::Failed(_) => {
            cli::output::print_not_logged_in(&profile);
            cli::output::print_hint("Run `lomi quickstart` for a guided setup.");
        }
    }

    if common.show_ui() {
        cli::banner::print_outro("Run `lomi --help` for all commands");
    }
    Ok(())
}
