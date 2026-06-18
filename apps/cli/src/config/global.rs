use anyhow::{Context, Result};
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
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Settings {
    #[serde(default)]
    pub has_seen_rules_install_prompt: bool,
    #[serde(default)]
    pub last_rules_install_version: Option<String>,
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
        Ok(())
    }

    pub fn profile(&self, name: &str) -> Option<&ProfileSettings> {
        self.profiles.get(name)
    }

    pub fn profile_mut(&mut self, name: &str) -> &mut ProfileSettings {
        self.profiles
            .entry(name.to_string())
            .or_default()
    }

    pub fn set_token(&mut self, profile: &str, token: String, api_url: String) -> Result<()> {
        let settings = self.profile_mut(profile);
        settings.cli_token = Some(token);
        settings.api_url = Some(api_url);
        self.current_profile = profile.to_string();
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn roundtrip_config() -> Result<()> {
        let temp = tempfile::tempdir()?;
        env::set_var("XDG_CONFIG_HOME", temp.path());

        let mut config = GlobalConfig::default();
        config.set_token(
            "sandbox",
            "test_token".to_string(),
            "https://sandbox.api.lomi.africa".to_string(),
        )?;

        let loaded = GlobalConfig::load()?;
        assert_eq!(
            loaded.profile("sandbox").and_then(|p| p.cli_token.as_deref()),
            Some("test_token")
        );
        Ok(())
    }
}
