use anyhow::Result;
use clap::Args;

use crate::auth::session::resolve_auth;
use crate::cli::{self, cli_auth_base, CommonOptions};
use crate::config::GlobalConfig;

#[derive(Args, Debug)]
pub struct LogoutArgs {}

pub async fn run(common: &CommonOptions, _args: LogoutArgs) -> Result<()> {
    let profile = common.effective_profile()?;
    cli::banner::print_intro(&format!("Logging out profile [{profile}]"));

    if let Ok(Some(auth)) = resolve_auth(common) {
        let client = reqwest::Client::new();
        let _ = client
            .post(format!("{}/revoke", cli_auth_base(&auth.api_url)))
            .header("X-API-KEY", &auth.cli_token)
            .send()
            .await;
    }

    let mut config = GlobalConfig::load()?;
    config.clear_profile(&profile)?;

    cli::output::print_success(&format!("Logged out profile [{profile}]"));
    cli::banner::print_outro("Logout complete");
    Ok(())
}
