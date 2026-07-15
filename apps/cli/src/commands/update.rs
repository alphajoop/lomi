use anyhow::{bail, Context, Result};
use clap::{Args, Subcommand};
use std::path::Path;
use std::process::Command;

use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct UpdateArgs {
    /// Project path (when updating SDK without subcommand)
    #[arg(default_value = ".")]
    pub path: String,

    #[command(subcommand)]
    pub command: Option<UpdateCommand>,
}

#[derive(Subcommand, Debug)]
pub enum UpdateCommand {
    /// Update @lomi./sdk in a project
    Sdk(UpdateSdkArgs),
    /// Show how to upgrade the lomi. CLI itself
    Cli,
}

#[derive(Args, Debug)]
pub struct UpdateSdkArgs {
    /// Project path
    #[arg(default_value = ".")]
    pub path: String,
}

pub async fn run(common: &CommonOptions, args: UpdateArgs) -> Result<()> {
    match args.command {
        Some(UpdateCommand::Sdk(sdk_args)) => update_sdk(common, &sdk_args.path).await,
        Some(UpdateCommand::Cli) => show_cli_upgrade(common),
        None => update_sdk(common, &args.path).await,
    }
}

async fn update_sdk(_common: &CommonOptions, path: &str) -> Result<()> {
    cli::banner::print_intro("Updating @lomi./sdk");

    let project_dir = Path::new(path);
    if !project_dir.join("package.json").exists() {
        bail!("No package.json found in {path}");
    }

    let package_manager = detect_package_manager(project_dir);
    let cli_version = env!("CARGO_PKG_VERSION");

    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message(format!("Updating @lomi./sdk via {package_manager}..."));
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    let status = match package_manager.as_str() {
        "pnpm" => Command::new("pnpm")
            .args(["add", "@lomi./sdk@latest"])
            .current_dir(project_dir)
            .status(),
        "yarn" => Command::new("yarn")
            .args(["add", "@lomi./sdk@latest"])
            .current_dir(project_dir)
            .status(),
        "bun" => Command::new("bun")
            .args(["add", "@lomi./sdk@latest"])
            .current_dir(project_dir)
            .status(),
        _ => Command::new("npm")
            .args(["install", "@lomi./sdk@latest"])
            .current_dir(project_dir)
            .status(),
    }
    .context("Failed to run package manager")?;

    spinner.finish_and_clear();

    if !status.success() {
        bail!("Failed to update @lomi./sdk");
    }

    cli::output::print_success(&format!("Updated @lomi./sdk (CLI version {cli_version})"));
    cli::banner::print_outro("SDK update complete");
    Ok(())
}

pub fn show_cli_upgrade(_common: &CommonOptions) -> Result<()> {
    let current = env!("CARGO_PKG_VERSION");
    cli::banner::print_intro("Upgrade lomi. CLI");
    cli::output::print_kv("Current version", current);
    println!();
    cli::output::print_info("npm:  npm install -g lomi.cli");
    cli::output::print_info("pnpm: pnpm add -g lomi.cli");
    cli::output::print_info("brew: brew upgrade lomi");
    cli::output::print_info("source: cargo install --path apps/cli --force");
    cli::banner::print_outro("Upgrade instructions shown");
    Ok(())
}

fn detect_package_manager(project_dir: &Path) -> String {
    for (file, pm) in [
        ("pnpm-lock.yaml", "pnpm"),
        ("yarn.lock", "yarn"),
        ("bun.lockb", "bun"),
        ("bun.lock", "bun"),
    ] {
        if project_dir.join(file).exists() {
            return pm.to_string();
        }
    }
    "npm".to_string()
}
