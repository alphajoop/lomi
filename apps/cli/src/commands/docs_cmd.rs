use anyhow::{Context, Result};
use clap::Args;
use colored::Colorize;
use std::path::PathBuf;
use std::process::Command;

use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct DocsCheckArgs {}

#[derive(Args, Debug)]
pub struct DocsArgs {
    #[command(subcommand)]
    pub command: DocsCommands,
}

#[derive(clap::Subcommand, Debug)]
pub enum DocsCommands {
    /// Run docs lint and drift checks (apps/docs)
    Check(DocsCheckArgs),
}

fn find_monorepo_root() -> Result<PathBuf> {
    let mut dir = std::env::current_dir()?;
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

fn run_pnpm_in_docs(root: &PathBuf, script: &str) -> Result<()> {
    let docs_dir = root.join("apps/docs");
    let status = Command::new("pnpm")
        .arg(script)
        .current_dir(&docs_dir)
        .status()
        .with_context(|| format!("Failed to run pnpm {script} in {}", docs_dir.display()))?;

    if !status.success() {
        anyhow::bail!("pnpm {script} failed in apps/docs");
    }
    Ok(())
}

pub async fn run(common: &CommonOptions, args: DocsArgs) -> Result<()> {
    match args.command {
        DocsCommands::Check(_) => {
            cli::banner::print_intro("Docs check");
            let root = find_monorepo_root()?;
            println!("  Monorepo root: {}", root.display());
            run_pnpm_in_docs(&root, "lint")?;
            run_pnpm_in_docs(&root, "docs:drift")?;
            if !common.use_json() {
                println!("  {} Docs lint and drift checks passed", "✓".green());
            }
            Ok(())
        }
    }
}
