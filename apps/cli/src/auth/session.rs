use anyhow::{bail, Context, Result};
use std::env;

use crate::auth::device_flow::{api_url_for_profile, login, LoginOptions};
use crate::cli::CommonOptions;
use crate::config::GlobalConfig;

#[derive(Debug, Clone)]
pub struct AuthContext {
    pub profile: String,
    pub cli_token: String,
    pub api_url: String,
}

#[derive(Debug, Clone)]
pub enum AuthResult {
    Authenticated(AuthContext),
    Failed(String),
}

pub fn token_from_env() -> Option<String> {
    env::var("LOMI_ACCESS_TOKEN")
        .ok()
        .filter(|value| !value.is_empty())
}

pub fn resolve_auth(common: &CommonOptions) -> Result<Option<AuthContext>> {
    let profile = common.effective_profile()?;

    if let Some(token) = token_from_env() {
        return Ok(Some(AuthContext {
            profile: profile.clone(),
            cli_token: token,
            api_url: api_url_for_profile(&profile, common.api_url.as_deref()),
        }));
    }

    let config = GlobalConfig::load()?;
    if let Some(profile_settings) = config.profile(&profile) {
        if let Some(token) = profile_settings.cli_token.clone() {
            let api_url = profile_settings
                .api_url
                .clone()
                .unwrap_or_else(|| api_url_for_profile(&profile, common.api_url.as_deref()));
            return Ok(Some(AuthContext {
                profile,
                cli_token: token,
                api_url,
            }));
        }
    }

    Ok(None)
}

pub async fn ensure_authenticated(
    common: &CommonOptions,
    open_browser: bool,
    embedded: bool,
    silent: bool,
) -> Result<AuthContext> {
    if let Some(auth) = resolve_auth(common)? {
        return Ok(auth);
    }

    if !embedded && !silent {
        let profile = common.effective_profile()?;
        crate::cli::output::print_error("You must login first. Use `lomi login`.");
        bail!("Not authenticated for profile `{profile}`");
    }

    if !crate::cli::output::is_tty() && embedded {
        bail!("Authentication required. Set LOMI_ACCESS_TOKEN or run `lomi login` in a TTY.");
    }

    let profile = common.effective_profile()?;
    let api_url = api_url_for_profile(&profile, common.api_url.as_deref());
    login(LoginOptions {
        profile: profile.clone(),
        api_url: api_url.clone(),
        open_browser,
        embedded,
        silent,
    })
    .await?;

    resolve_auth(common)?
        .context("Authentication succeeded but token was not saved")
}

pub fn try_authenticated(common: &CommonOptions) -> AuthResult {
    match resolve_auth(common) {
        Ok(Some(auth)) => AuthResult::Authenticated(auth),
        Ok(None) => AuthResult::Failed("Not logged in".to_string()),
        Err(error) => AuthResult::Failed(error.to_string()),
    }
}
