use anyhow::Result;
use clap::Args;

use crate::auth::device_flow::{api_url_for_profile, login, LoginOptions};
use crate::cli::{self, CommonOptions};
use crate::config::GlobalConfig;

#[derive(Args, Debug)]
pub struct LoginArgs {
    /// Don't automatically open the browser; print the URL only
    #[arg(long)]
    pub no_browser: bool,
}

pub async fn run(common: &CommonOptions, args: LoginArgs) -> Result<()> {
    let profile = common.effective_profile()?;

    if let Some(existing) = GlobalConfig::load()?.profile(&profile) {
        if existing.cli_token.is_some() {
            let continue_login = cli::prompts::confirm(
                "You are already logged in. Login with a different account?",
                false,
            )?;
            if !continue_login {
                cli::banner::print_outro("Already logged in");
                return Ok(());
            }
        }
    }

    let api_url = api_url_for_profile(&profile, common.api_url.as_deref());
    login(LoginOptions {
        profile: profile.clone(),
        api_url,
        open_browser: !args.no_browser,
        embedded: false,
        silent: false,
    })
    .await?;
    Ok(())
}
