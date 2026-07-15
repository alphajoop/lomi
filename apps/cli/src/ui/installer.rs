use anyhow::{bail, Context, Result};
use std::path::Path;
use std::process::Command;

use crate::cli::{self, lomi_ui_item_url};

pub struct InstallOptions {
    pub yes: bool,
    pub dry_run: bool,
}

pub fn install_component(project_dir: &Path, name: &str, options: &InstallOptions) -> Result<()> {
    let item_url = lomi_ui_item_url(name);
    let mut args = vec!["shadcn@latest", "add", &item_url];

    if options.yes {
        args.push("--yes");
    }

    if options.dry_run {
        cli::output::print_dim(&format!(
            "Would run: npx {} (in {})",
            args.join(" "),
            project_dir.display()
        ));
        return Ok(());
    }

    cli::output::print_step(&format!("Installing {name}..."));

    let status = Command::new("npx")
        .args(&args)
        .current_dir(project_dir)
        .status()
        .with_context(|| format!("Failed to run shadcn add for {name}"))?;

    if !status.success() {
        bail!("Failed to install component '{name}'");
    }

    Ok(())
}
