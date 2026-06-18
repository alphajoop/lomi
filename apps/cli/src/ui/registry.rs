use anyhow::{bail, Context, Result};
use serde::Deserialize;

use crate::cli::{self, lomi_ui_index_url, lomi_ui_registry_url};

#[derive(Debug, Clone, Deserialize)]
pub struct RegistryItem {
    pub name: String,
    pub title: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RegistryIndex {
    pub name: Option<String>,
    pub version: Option<String>,
    pub homepage: Option<String>,
    pub registry_url: Option<String>,
    pub items: Vec<RegistryItem>,
}

#[derive(Debug, Clone, Deserialize)]
struct RegistryJson {
    pub name: Option<String>,
    pub version: Option<String>,
    pub homepage: Option<String>,
    pub items: Vec<RegistryItem>,
}

pub async fn fetch_index() -> Result<RegistryIndex> {
    let index_url = lomi_ui_index_url();
    let client = reqwest::Client::new();

    let response = client
        .get(&index_url)
        .send()
        .await
        .with_context(|| format!("Failed to fetch registry index from {index_url}"))?;

    if response.status().is_success() {
        return response
            .json::<RegistryIndex>()
            .await
            .context("Failed to parse registry index");
    }

    let registry_url = lomi_ui_registry_url();
    let response = client
        .get(&registry_url)
        .send()
        .await
        .with_context(|| format!("Failed to fetch registry from {registry_url}"))?;

    if !response.status().is_success() {
        bail!(
            "Registry unavailable (HTTP {}). Check {DOCS} or set LOMI_UI_REGISTRY_URL.",
            response.status(),
            DOCS = cli::DOCS_URL
        );
    }

    let registry: RegistryJson = response
        .json()
        .await
        .context("Failed to parse registry.json")?;

    Ok(RegistryIndex {
        name: registry.name,
        version: registry.version,
        homepage: registry.homepage,
        registry_url: Some(registry_url),
        items: registry.items,
    })
}

pub fn find_item<'a>(index: &'a RegistryIndex, name: &str) -> Result<&'a RegistryItem> {
    index
        .items
        .iter()
        .find(|item| item.name == name)
        .with_context(|| format!("Component '{name}' not found in registry"))
}
