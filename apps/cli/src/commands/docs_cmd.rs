use anyhow::{Context, Result};
use clap::Args;
use colored::Colorize;
use std::path::{Path, PathBuf};
use std::process::Command;

use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct DocsCheckArgs {}

#[derive(Args, Debug)]
pub struct DocsScanArgs {}

#[derive(Args, Debug)]
pub struct DocsDriftArgs {
    /// Skip the TypeScript docs-drift script
    #[arg(long)]
    pub skip_ts: bool,
}

#[derive(Args, Debug)]
pub struct DocsGraphArgs {
    #[arg(long)]
    pub output: Option<PathBuf>,
}

#[derive(Args, Debug)]
pub struct DocsScaffoldArgs {}

#[derive(Args, Debug)]
pub struct DocsArgs {
    #[command(subcommand)]
    pub command: DocsCommands,
}

#[derive(clap::Subcommand, Debug)]
pub enum DocsCommands {
    /// Run docs lint and drift checks (apps/docs)
    Check(DocsCheckArgs),
    /// Index code, OpenAPI, MDX, SDK, and competitor docs (doctool)
    Scan(DocsScanArgs),
    /// Unified drift report (doctool)
    Drift(DocsDriftArgs),
    /// Export documentation knowledge graph JSON (doctool)
    Graph(DocsGraphArgs),
    /// Scaffold missing REST reference MDX pages (doctool)
    Scaffold(DocsScaffoldArgs),
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

fn run_dt(root: &Path, args: &[String]) -> Result<()> {
    let debug_bin = root.join("apps/doctool/target/debug/dt");
    let release_bin = root.join("apps/doctool/target/release/dt");

    let mut cmd = if release_bin.is_file() {
        Command::new(release_bin)
    } else if debug_bin.is_file() {
        Command::new(debug_bin)
    } else if Command::new("dt").arg("--version").output().is_ok_and(|o| o.status.success()) {
        Command::new("dt")
    } else {
        let mut cargo = Command::new("cargo");
        cargo.args([
            "run",
            "--quiet",
            "--manifest-path",
            &root.join("apps/doctool/Cargo.toml").to_string_lossy(),
            "-p",
            "doctool-cli",
            "--",
        ]);
        cargo
    };

    cmd.args(args).current_dir(root);
    let status = cmd
        .status()
        .context("Failed to run dt — build with: cd apps/doctool && cargo build")?;

    if !status.success() {
        anyhow::bail!(
            "dt {} failed",
            args.first().map(String::as_str).unwrap_or("command")
        );
    }
    Ok(())
}

pub async fn run(common: &CommonOptions, args: DocsArgs) -> Result<()> {
    let root = find_monorepo_root()?;

    match args.command {
        DocsCommands::Check(_) => {
            cli::banner::print_intro("Docs check");
            if !common.use_json() {
                println!("  Monorepo root: {}", root.display());
            }
            let mut dt_args = vec!["check".to_string()];
            if common.use_json() {
                dt_args.push("--json".to_string());
            }
            run_dt(&root, &dt_args)?;
            if !common.use_json() {
                println!("  {} Docs lint and drift checks passed", "✓".green());
            }
            Ok(())
        }
        DocsCommands::Scan(_) => {
            cli::banner::print_intro("Docs scan");
            let mut dt_args = vec!["scan".to_string()];
            if common.use_json() {
                dt_args.push("--json".to_string());
            }
            run_dt(&root, &dt_args)
        }
        DocsCommands::Drift(args) => {
            cli::banner::print_intro("Docs drift");
            let mut dt_args = vec!["drift".to_string()];
            if args.skip_ts {
                dt_args.push("--skip-ts".to_string());
            }
            if common.use_json() {
                dt_args.push("--json".to_string());
            }
            run_dt(&root, &dt_args)
        }
        DocsCommands::Graph(args) => {
            cli::banner::print_intro("Docs graph");
            let mut dt_args = vec!["graph".to_string()];
            if let Some(output) = args.output {
                dt_args.push("--output".to_string());
                dt_args.push(output.to_string_lossy().into_owned());
            }
            if common.use_json() {
                dt_args.push("--json".to_string());
            }
            run_dt(&root, &dt_args)
        }
        DocsCommands::Scaffold(_) => {
            cli::banner::print_intro("Docs scaffold");
            let mut dt_args = vec!["scaffold".to_string()];
            if common.use_json() {
                dt_args.push("--json".to_string());
            }
            run_dt(&root, &dt_args)
        }
    }
}
