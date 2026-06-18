use anyhow::{bail, Context, Result};
use colored::Colorize;
use reqwest::StatusCode;
use serde::Deserialize;
use std::time::{Duration, Instant};

use crate::cli::{cli_auth_base, PRODUCTION_API_URL, SUPABASE_ANON_KEY};
use crate::config::GlobalConfig;

fn auth_client() -> Result<reqwest::Client> {
    let mut headers = reqwest::header::HeaderMap::new();
    if let Some(anon_key) = std::env::var("LOMI_SUPABASE_ANON_KEY")
        .ok()
        .filter(|v| !v.is_empty())
        .or_else(|| {
            if SUPABASE_ANON_KEY.is_empty() {
                None
            } else {
                Some(SUPABASE_ANON_KEY.to_string())
            }
        })
    {
        let apikey = reqwest::header::HeaderValue::from_str(&anon_key)
            .context("Invalid LOMI_SUPABASE_ANON_KEY")?;
        let bearer = reqwest::header::HeaderValue::from_str(&format!("Bearer {anon_key}"))
            .context("Invalid LOMI_SUPABASE_ANON_KEY for Authorization")?;
        headers.insert("apikey", apikey);
        headers.insert(reqwest::header::AUTHORIZATION, bearer);
    }
    Ok(reqwest::Client::builder()
        .default_headers(headers)
        .build()?)
}

#[derive(Debug, Deserialize)]
struct DeviceAuthResponse {
    device_code: String,
    user_code: String,
    verification_uri: String,
    interval: u64,
    expires_in: u64,
}

#[derive(Debug, Deserialize)]
struct TokenSuccessResponse {
    api_key: String,
}

#[derive(Debug, Deserialize)]
struct TokenErrorResponse {
    error: Option<String>,
    message: Option<String>,
}

#[derive(Debug, Clone)]
pub struct LoginOptions {
    pub profile: String,
    pub api_url: String,
    pub open_browser: bool,
    pub embedded: bool,
    pub silent: bool,
}

pub async fn login(options: LoginOptions) -> Result<String> {
    let client = auth_client()?;

    let auth_base = cli_auth_base();
    let device_auth = client
        .post(format!("{auth_base}/device-auth"))
        .send()
        .await
        .context("Failed to connect to authentication service")?
        .error_for_status()
        .context("Device auth request failed")?
        .json::<DeviceAuthResponse>()
        .await
        .context("Invalid device auth response")?;

    if !options.silent && !options.embedded {
        crate::cli::banner::print_intro("Logging in to lomi.");
    }

    if !options.silent {
        println!();
        println!("{}", "Action Required to complete authentication:".bold());
        println!();
        println!("1. Copy this code: {}", device_auth.user_code.yellow().bold());
        println!("2. Press Enter to open your browser");
        println!("3. Paste the code when prompted on the webpage.");
        println!();
        println!(
            "{} After signing in, you may be redirected to your dashboard.",
            "IMPORTANT:".yellow()
        );
        println!(
            "If needed, return to: {}",
            device_auth.verification_uri.cyan()
        );
        println!();

        crate::cli::prompts::wait_for_enter("Press Enter to open the browser and continue...")?;
    }

    if options.open_browser {
        if let Err(error) = open::that(&device_auth.verification_uri) {
            crate::cli::output::print_error(&format!(
                "Could not open browser automatically: {error}. Open this URL manually: {}",
                device_auth.verification_uri
            ));
        }
    } else if !options.silent {
        println!(
            "Browser auto-open disabled. Visit: {}",
            device_auth.verification_uri.cyan()
        );
    }

    if !options.silent {
        println!();
        println!("Waiting for you to authorize in the browser...");
    }

    let spinner = if options.silent {
        None
    } else {
        Some(indicatif::ProgressBar::new_spinner())
    };
    if let Some(spinner) = &spinner {
        spinner.set_style(
            indicatif::ProgressStyle::default_spinner().template("{spinner} {msg}").unwrap(),
        );
        spinner.set_message("Waiting for authorization in browser...");
        spinner.enable_steady_tick(Duration::from_millis(100));
    }

    let expiry = Instant::now() + Duration::from_secs(device_auth.expires_in);
    let poll_interval = Duration::from_secs(device_auth.interval.max(1));
    let mut token: Option<String> = None;

    while Instant::now() < expiry {
        tokio::time::sleep(poll_interval).await;

        let environment = environment_for_profile(&options.profile);
        let response = client
            .post(format!("{auth_base}/token"))
            .json(&serde_json::json!({
                "device_code": device_auth.device_code,
                "environment": environment,
            }))
            .send()
            .await
            .context("Failed to poll for authorization token")?;

        if response.status().is_success() {
            let body = response
                .json::<TokenSuccessResponse>()
                .await
                .context("Invalid token response")?;
            token = Some(body.api_key);
            break;
        }

        let status = response.status();
        let body = response
            .json::<TokenErrorResponse>()
            .await
            .unwrap_or(TokenErrorResponse {
                error: None,
                message: None,
            });

        match body.error.as_deref() {
            Some("authorization_pending") => continue,
            Some("expired_token") => bail!("Login failed: The authorization code expired."),
            Some("access_denied") => bail!("Login failed: Authorization was denied in the browser."),
            _ if status == StatusCode::BAD_REQUEST => {
                bail!(
                    "Login failed: {}",
                    body.message.unwrap_or_else(|| "Unknown polling error".to_string())
                );
            }
            _ => bail!("Login failed: Could not connect to authentication service."),
        }
    }

    if let Some(spinner) = spinner {
        spinner.finish_and_clear();
    }

    let token = token.context("Login failed: Timed out waiting for authorization.")?;

    let mut config = GlobalConfig::load()?;
    config.set_token(&options.profile, token.clone(), options.api_url)?;

    if !options.silent && !options.embedded {
        crate::cli::output::print_success("Login successful! CLI token saved globally.");
        crate::cli::banner::print_outro("You're all set!");
        println!();
        println!("Run `lomi init` in your project directory to get started.");
    }

    Ok(token)
}

pub fn environment_for_profile(profile: &str) -> &'static str {
    if profile == "sandbox" {
        "test"
    } else {
        "live"
    }
}

pub fn api_url_for_profile(profile: &str, override_url: Option<&str>) -> String {
    override_url.map(str::to_string).unwrap_or_else(|| {
        if profile == "local" {
            crate::cli::LOCAL_API_URL.to_string()
        } else if profile == "sandbox" {
            crate::cli::SANDBOX_API_URL.to_string()
        } else {
            PRODUCTION_API_URL.to_string()
        }
    })
}
