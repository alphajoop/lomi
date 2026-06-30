use anyhow::Result;
use chrono::{Duration, Utc};
use serde::Deserialize;

use crate::cli::{self, CommonOptions};
use crate::config::GlobalConfig;

const GITHUB_LATEST_RELEASE_URL: &str =
    "https://api.github.com/repos/lomiafrica/lomi./releases/latest";

#[derive(Debug, Deserialize)]
struct GitHubRelease {
    tag_name: String,
}

pub async fn maybe_notify_update(common: &CommonOptions) -> Result<()> {
    if common.quiet || common.use_json() {
        return Ok(());
    }

    let current = env!("CARGO_PKG_VERSION");
    let mut config = GlobalConfig::load()?;

    if let Some(last_check) = config.settings.last_update_check_at {
        if Utc::now() - last_check < Duration::hours(24) {
            if let Some(latest) = &config.settings.latest_known_cli_version {
                if latest != current && is_newer(latest, current) {
                    cli::output::print_update_available(current, latest);
                }
            }
            return Ok(());
        }
    }

    let client = reqwest::Client::builder()
        .user_agent(format!("lomi-cli/{current}"))
        .build()?;

    let response = client.get(GITHUB_LATEST_RELEASE_URL).send().await;
    config.settings.last_update_check_at = Some(Utc::now());

    if let Ok(response) = response {
        if response.status().is_success() {
            if let Ok(release) = response.json::<GitHubRelease>().await {
                let latest = release
                    .tag_name
                    .strip_prefix("cli-v")
                    .unwrap_or(&release.tag_name)
                    .to_string();
                config.settings.latest_known_cli_version = Some(latest.clone());
                config.save()?;

                if is_newer(&latest, current) {
                    cli::output::print_update_available(current, &latest);
                }
                return Ok(());
            }
        }
    }

    config.save()?;
    Ok(())
}

fn is_newer(latest: &str, current: &str) -> bool {
    parse_version(latest) > parse_version(current)
}

fn parse_version(version: &str) -> (u32, u32, u32) {
    let mut parts = version.split('.');
    let major = parts.next().and_then(|p| p.parse().ok()).unwrap_or(0);
    let minor = parts.next().and_then(|p| p.parse().ok()).unwrap_or(0);
    let patch = parts.next().and_then(|p| p.parse().ok()).unwrap_or(0);
    (major, minor, patch)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compares_semver() {
        assert!(is_newer("3.2.0", "3.1.1"));
        assert!(!is_newer("3.1.1", "3.1.1"));
    }
}
