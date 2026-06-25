use anyhow::Result;
use clap::Args;
use colored::Colorize;

use crate::api::{ApiClient, MeResponse};
use crate::auth::session::try_authenticated;
use crate::cli::{self, CommonOptions};
use crate::config::global::config_path;

#[derive(Args, Debug)]
pub struct WhoamiArgs {}

pub async fn run(common: &CommonOptions, _args: WhoamiArgs) -> Result<()> {
    let profile = common.effective_profile()?;
    cli::banner::print_intro(&format!(
        "Displaying your account details [{profile}]"
    ));

    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_style(
        indicatif::ProgressStyle::default_spinner()
            .template("{spinner} {msg}")
            .unwrap(),
    );
    spinner.set_message("Checking your account details...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    let auth = match try_authenticated(common) {
        crate::auth::AuthResult::Authenticated(auth) => auth,
        crate::auth::AuthResult::Failed(message) => {
            spinner.finish_and_clear();
            cli::output::print_error(&format!(
                "You must login first. Use `lomi login --profile {profile}`.",
            ));
            anyhow::bail!(message);
        }
    };

    let identity = if let Ok(client) = ApiClient::new(&auth) {
        client.get::<MeResponse>("/me").await.ok()
    } else {
        None
    };

    spinner.finish_and_clear();

    let token_preview = if auth.cli_token.len() > 4 {
        format!("****{}", &auth.cli_token[auth.cli_token.len() - 4..])
    } else {
        "****".to_string()
    };

    let mut body = format!(
        "Profile:  {}\nToken:    {}\nAPI URL:  {}",
        auth.profile, token_preview, auth.api_url
    );

    if let Some(me) = identity {
        body.push_str(&format!(
            "\nMerchant: {}\nOrganization: {} ({})\nEnvironment: {}",
            me.merchant_id, me.organization_name, me.organization_id, me.environment
        ));
    }

    cli::output::print_note(
        &format!("Account details [{profile}]"),
        &body,
    );

    if let Ok(path) = config_path() {
        println!(
            "{}  Config:   {}",
            "│".bright_black(),
            path.display().to_string().bright_black()
        );
    }

    cli::banner::print_outro("Account details retrieved");
    Ok(())
}
