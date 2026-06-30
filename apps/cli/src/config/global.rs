use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

pub const DEFAULT_PROFILE: &str = "default";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProfileSettings {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cli_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub environment: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token_suffix: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Settings {
    #[serde(default)]
    pub has_seen_rules_install_prompt: bool,
    #[serde(default)]
    pub last_rules_install_version: Option<String>,
    #[serde(default)]
    pub has_seen_telemetry_notice: bool,
    #[serde(default)]
    pub last_update_check_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub latest_known_cli_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalConfig {
    pub version: u32,
    pub current_profile: String,
    #[serde(default)]
    pub profiles: std::collections::HashMap<String, ProfileSettings>,
    #[serde(default)]
    pub settings: Settings,
}

impl Default for GlobalConfig {
    fn default() -> Self {
        Self {
            version: 2,
            current_profile: DEFAULT_PROFILE.to_string(),
            profiles: std::collections::HashMap::new(),
            settings: Settings::default(),
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct ProfileMetadata {
    pub organization_name: Option<String>,
    pub organization_id: Option<String>,
    pub environment: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
}

impl GlobalConfig {
    pub fn load() -> Result<Self> {
        let path = config_path()?;
        if !path.exists() {
            return Ok(Self::default());
        }
        let contents = fs::read_to_string(&path)
            .with_context(|| format!("Failed to read config at {}", path.display()))?;
        let config: GlobalConfig = serde_json::from_str(&contents)
            .with_context(|| format!("Failed to parse config at {}", path.display()))?;
        Ok(config)
    }

    pub fn save(&self) -> Result<()> {
        let path = config_path()?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let contents = serde_json::to_string_pretty(self)?;
        fs::write(&path, contents)?;
        restrict_config_permissions(&path)?;
        Ok(())
    }

    pub fn profile(&self, name: &str) -> Option<&ProfileSettings> {
        self.profiles.get(name)
    }

    pub fn profile_mut(&mut self, name: &str) -> &mut ProfileSettings {
        self.profiles.entry(name.to_string()).or_default()
    }

    pub fn token_suffix(token: &str) -> String {
        if token.len() > 4 {
            token[token.len() - 4..].to_string()
        } else {
            "****".to_string()
        }
    }

    pub fn set_token(&mut self, profile: &str, token: String, api_url: String) -> Result<()> {
        let settings = self.profile_mut(profile);
        settings.cli_token = Some(token.clone());
        settings.api_url = Some(api_url);
        settings.created_at = Some(Utc::now());
        settings.token_suffix = Some(Self::token_suffix(&token));
        self.current_profile = profile.to_string();
        self.save()
    }

    pub fn update_profile_metadata(
        &mut self,
        profile: &str,
        metadata: ProfileMetadata,
    ) -> Result<()> {
        let settings = self.profile_mut(profile);
        settings.organization_name = metadata.organization_name;
        settings.organization_id = metadata.organization_id;
        settings.environment = metadata.environment;
        if metadata.expires_at.is_some() {
            settings.expires_at = metadata.expires_at;
        }
        self.save()
    }

    pub fn clear_token(&mut self, profile: &str) -> Result<()> {
        if let Some(settings) = self.profiles.get_mut(profile) {
            settings.cli_token = None;
            settings.expires_at = None;
            settings.organization_name = None;
            settings.organization_id = None;
            settings.environment = None;
            settings.token_suffix = None;
        }
        self.save()
    }

    pub fn clear_profile(&mut self, profile: &str) -> Result<()> {
        self.profiles.remove(profile);
        if self.current_profile == profile {
            self.current_profile = DEFAULT_PROFILE.to_string();
        }
        self.save()
    }

    pub fn list_profiles(&self) -> Vec<String> {
        let mut names: Vec<_> = self.profiles.keys().cloned().collect();
        names.sort();
        names
    }

    pub fn is_token_expired(profile: &ProfileSettings) -> bool {
        profile
            .expires_at
            .is_some_and(|expires| expires <= Utc::now())
    }
}

pub fn config_dir() -> Result<PathBuf> {
    if let Ok(dir) = std::env::var("LOMI_CONFIG_DIR") {
        return Ok(PathBuf::from(dir));
    }
    let dirs = ProjectDirs::from("", "", "lomi")
        .context("Could not determine config directory for this platform")?;
    Ok(dirs.config_dir().to_path_buf())
}

pub fn config_path() -> Result<PathBuf> {
    Ok(config_dir()?.join("config.json"))
}

#[cfg(unix)]
fn restrict_config_permissions(path: &PathBuf) -> Result<()> {
    use std::os::unix::fs::PermissionsExt;
    let mut perms = fs::metadata(path)?.permissions();
    perms.set_mode(0o600);
    fs::set_permissions(path, perms)?;
    Ok(())
}

#[cfg(not(unix))]
fn restrict_config_permissions(_path: &PathBuf) -> Result<()> {
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn roundtrip_config() -> Result<()> {
        let temp = tempfile::tempdir()?;
        env::set_var("LOMI_CONFIG_DIR", temp.path());

        let mut config = GlobalConfig::default();
        config.set_token(
            "sandbox",
            "test_token".to_string(),
            "https://sandbox.api.lomi.africa".to_string(),
        )?;

        let loaded = GlobalConfig::load()?;
        assert_eq!(
            loaded
                .profile("sandbox")
                .and_then(|p| p.cli_token.as_deref()),
            Some("test_token")
        );
        assert_eq!(
            loaded.profile("sandbox").and_then(|p| p.token_suffix.as_deref()),
            Some("oken")
        );
        Ok(())
    }

    #[test]
    fn detects_expired_token() {
        let profile = ProfileSettings {
            expires_at: Some(Utc::now() - chrono::Duration::hours(1)),
            ..Default::default()
        };
        assert!(GlobalConfig::is_token_expired(&profile));
    }
}
