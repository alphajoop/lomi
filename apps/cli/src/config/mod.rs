pub mod global;
pub mod secrets;

pub use global::{GlobalConfig, ProfileMetadata};

use crate::cli::{PRODUCTION_API_URL, SANDBOX_API_URL};

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Environment {
    Production,
    Sandbox,
}

impl Environment {
    pub fn api_url(&self) -> &'static str {
        match self {
            Self::Production => PRODUCTION_API_URL,
            Self::Sandbox => SANDBOX_API_URL,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Production => "production",
            Self::Sandbox => "sandbox",
        }
    }

    pub fn from_str(value: &str) -> anyhow::Result<Self> {
        match value.to_lowercase().as_str() {
            "production" | "prod" => Ok(Self::Production),
            "sandbox" | "test" => Ok(Self::Sandbox),
            other => anyhow::bail!("Unknown environment: {other}"),
        }
    }
}

impl std::fmt::Display for Environment {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Production => write!(f, "Production (live transactions)"),
            Self::Sandbox => write!(f, "Sandbox (for testing)"),
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Language {
    TypeScript,
    JavaScript,
}

impl Language {
    pub fn extension(&self) -> &'static str {
        match self {
            Self::TypeScript => "ts",
            Self::JavaScript => "js",
        }
    }

    pub fn is_typescript(&self) -> bool {
        matches!(self, Self::TypeScript)
    }

    pub fn from_str(value: &str) -> anyhow::Result<Self> {
        match value.to_lowercase().as_str() {
            "typescript" | "ts" => Ok(Self::TypeScript),
            "javascript" | "js" => Ok(Self::JavaScript),
            other => anyhow::bail!("Unknown language: {other}"),
        }
    }
}

impl std::fmt::Display for Language {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::TypeScript => write!(f, "TypeScript"),
            Self::JavaScript => write!(f, "JavaScript"),
        }
    }
}
