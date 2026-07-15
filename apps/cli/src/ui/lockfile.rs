use anyhow::{Context, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LockedComponent {
    pub name: String,
    pub installed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiLockfile {
    pub registry_version: String,
    pub registry_url: String,
    pub components: Vec<LockedComponent>,
}

impl UiLockfile {
    pub fn load(project_dir: &Path) -> Result<Option<Self>> {
        let path = lockfile_path(project_dir);
        if !path.exists() {
            return Ok(None);
        }

        let content = fs::read_to_string(&path)
            .with_context(|| format!("Failed to read {}", path.display()))?;
        let lockfile: UiLockfile = serde_json::from_str(&content)
            .with_context(|| format!("Failed to parse {}", path.display()))?;
        Ok(Some(lockfile))
    }

    pub fn save(&self, project_dir: &Path) -> Result<()> {
        let path = lockfile_path(project_dir);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let content = serde_json::to_string_pretty(self)?;
        fs::write(&path, format!("{content}\n"))
            .with_context(|| format!("Failed to write {}", path.display()))?;
        Ok(())
    }

    pub fn record_install(&mut self, name: &str, registry_version: &str, registry_url: &str) {
        self.registry_version = registry_version.to_string();
        self.registry_url = registry_url.to_string();

        if let Some(existing) = self.components.iter_mut().find(|c| c.name == name) {
            existing.installed_at = Utc::now().to_rfc3339();
            return;
        }

        self.components.push(LockedComponent {
            name: name.to_string(),
            installed_at: Utc::now().to_rfc3339(),
        });
    }
}

pub fn lockfile_path(project_dir: &Path) -> PathBuf {
    project_dir.join(".lomi").join("ui-lock.json")
}

pub fn load_or_create(
    registry_version: &str,
    registry_url: &str,
    project_dir: &Path,
) -> Result<UiLockfile> {
    match UiLockfile::load(project_dir)? {
        Some(lockfile) => Ok(lockfile),
        None => Ok(UiLockfile {
            registry_version: registry_version.to_string(),
            registry_url: registry_url.to_string(),
            components: Vec::new(),
        }),
    }
}
