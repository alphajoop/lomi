use anyhow::Result;
use clap::Args;

use crate::auth::session::{try_authenticated, verify_and_refresh_metadata, AuthResult};
use crate::cli::{self, CommonOptions};
use crate::config::global::config_path;

#[derive(Args, Debug)]
pub struct WhoamiArgs {}

pub async fn run(common: &CommonOptions, _args: WhoamiArgs) -> Result<()> {
    let profile = common.effective_profile()?;
    if common.show_ui() {
        cli::banner::print_intro(&format!("Account [{profile}]"));
    }

    let spinner = if common.show_ui() {
        let spinner = indicatif::ProgressBar::new_spinner();
        spinner.set_style(
            indicatif::ProgressStyle::default_spinner()
                .template("{spinner} {msg}")
                .unwrap(),
        );
        spinner.set_message("Checking your account...");
        spinner.enable_steady_tick(std::time::Duration::from_millis(100));
        Some(spinner)
    } else {
        None
    };

    let auth = match try_authenticated(common) {
        AuthResult::Authenticated(auth) => auth,
        AuthResult::Expired(message) | AuthResult::Failed(message) => {
            if let Some(spinner) = spinner {
                spinner.finish_and_clear();
            }
            if common.show_ui() {
                cli::output::print_not_logged_in(&profile);
            }
            anyhow::bail!(message);
        }
    };

    let identity = match verify_and_refresh_metadata(&auth).await {
        Ok(identity) => identity,
        Err(error) => {
            if let Some(spinner) = &spinner {
                spinner.finish_and_clear();
            }
            let _ = crate::auth::session::handle_auth_api_error(common, &error).await;
            if error
                .downcast_ref::<crate::api::ApiError>()
                .is_some_and(|e| e.is_unauthorized())
            {
                cli::output::print_auth_expired(&profile);
            }
            return Err(error);
        }
    };

    if let Some(spinner) = spinner {
        spinner.finish_and_clear();
    }

    let token_preview = auth
        .cli_token
        .len()
        .checked_sub(4)
        .map(|start| format!("****{}", &auth.cli_token[start..]))
        .unwrap_or_else(|| "****".to_string());

    let body = format!(
        "Profile:      {}\nOrganization: {} ({})\nEnvironment:  {}\nMerchant:     {}\nToken:        {}\nAPI URL:      {}",
        auth.profile,
        identity.organization_name,
        identity.organization_id,
        identity.environment,
        identity.merchant_id,
        token_preview,
        auth.api_url
    );

    cli::output::print_note(&format!("Account [{profile}]"), &body);

    if let Ok(path) = config_path() {
        cli::output::print_kv("Config", &path.display().to_string());
    }

    cli::banner::print_outro("Account verified");
    Ok(())
}
