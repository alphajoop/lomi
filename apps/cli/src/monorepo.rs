//! Monorepo root discovery — keep in sync with `doctool_core::find_monorepo_root`.
use std::path::{Path, PathBuf};

use anyhow::Result;

pub fn find_monorepo_root() -> Result<PathBuf> {
    find_monorepo_root_from(std::env::current_dir()?)
}

pub fn find_monorepo_root_from(start: impl AsRef<Path>) -> Result<PathBuf> {
    let mut dir = start.as_ref().to_path_buf();
    loop {
        if dir.join("apps/docs/package.json").is_file() {
            return Ok(dir);
        }
        if !dir.pop() {
            anyhow::bail!(
                "Could not find apps/docs — run from the lomi. monorepo root or a subdirectory"
            );
        }
    }
}
