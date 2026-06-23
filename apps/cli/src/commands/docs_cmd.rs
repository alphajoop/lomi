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
pub struct DocsSyncI18nArgs {
    #[arg(long)]
    pub check: bool,
    #[arg(long)]
    pub dry_run: bool,
    #[arg(long)]
    pub scaffold_missing: bool,
    #[arg(long)]
    pub lock: bool,
}

#[derive(Args, Debug)]
pub struct DocsTranslateI18nArgs {
    #[arg(long)]
    pub check: bool,
    #[arg(long)]
    pub dry_run: bool,
    #[arg(long)]
    pub force: bool,
}

#[derive(Args, Debug)]
pub struct DocsImproveArgs {
    #[arg(long)]
    pub path: String,
    #[arg(long)]
    pub stdout: bool,
    #[arg(long)]
    pub output: Option<PathBuf>,
}

#[derive(Args, Debug)]
pub struct DocsDiffArgs {
    #[arg(long)]
    pub path: String,
    #[arg(long)]
    pub proposed: Option<PathBuf>,
    #[arg(long, default_value = "unified")]
    pub format: String,
}

#[derive(Args, Debug)]
pub struct DocsSuggestArgs {
    /// Skip the TypeScript docs-drift script
    #[arg(long)]
    pub skip_ts: bool,
    /// Deterministic actions only (no LLM narrative)
    #[arg(long)]
    pub skip_ai: bool,
    /// Skip i18n structure/gap checks
    #[arg(long)]
    pub no_i18n: bool,
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
    /// Deterministic i18n sync — gap/stale/structure checks (doctool)
    SyncI18n(DocsSyncI18nArgs),
    /// LLM incremental segment translation for locale siblings (doctool)
    TranslateI18n(DocsTranslateI18nArgs),
    /// Improve MDX prose with RAG context (doctool)
    Improve(DocsImproveArgs),
    /// Unified diff for proposed MDX vs canonical (doctool)
    Diff(DocsDiffArgs),
    /// Scan codebase + drift, suggest prioritized fixes (doctool)
    Suggest(DocsSuggestArgs),
}

use crate::monorepo::find_monorepo_root;

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
        DocsCommands::SyncI18n(args) => {
            cli::banner::print_intro("Docs sync-i18n");
            let mut dt_args = vec!["sync-i18n".to_string()];
            if args.check {
                dt_args.push("--check".to_string());
            }
            if args.dry_run {
                dt_args.push("--dry-run".to_string());
            }
            if args.scaffold_missing {
                dt_args.push("--scaffold-missing".to_string());
            }
            if args.lock {
                dt_args.push("--lock".to_string());
            }
            if common.use_json() {
                dt_args.push("--json".to_string());
            }
            run_dt(&root, &dt_args)
        }
        DocsCommands::TranslateI18n(args) => {
            cli::banner::print_intro("Docs translate-i18n");
            let mut dt_args = vec!["translate-i18n".to_string()];
            if args.check {
                dt_args.push("--check".to_string());
            }
            if args.dry_run {
                dt_args.push("--dry-run".to_string());
            }
            if args.force {
                dt_args.push("--force".to_string());
            }
            if common.use_json() {
                dt_args.push("--json".to_string());
            }
            run_dt(&root, &dt_args)
        }
        DocsCommands::Improve(args) => {
            cli::banner::print_intro("Docs improve");
            let mut dt_args = vec!["improve".to_string(), "--path".to_string(), args.path];
            if args.stdout {
                dt_args.push("--stdout".to_string());
            }
            if let Some(output) = args.output {
                dt_args.push("--output".to_string());
                dt_args.push(output.to_string_lossy().into_owned());
            }
            if common.use_json() {
                dt_args.push("--json".to_string());
            }
            run_dt(&root, &dt_args)
        }
        DocsCommands::Diff(args) => {
            cli::banner::print_intro("Docs diff");
            let mut dt_args = vec![
                "diff".to_string(),
                "--path".to_string(),
                args.path,
                "--format".to_string(),
                args.format,
            ];
            if let Some(proposed) = args.proposed {
                dt_args.push("--proposed".to_string());
                dt_args.push(proposed.to_string_lossy().into_owned());
            }
            if common.use_json() {
                dt_args.push("--json".to_string());
            }
            run_dt(&root, &dt_args)
        }
        DocsCommands::Suggest(args) => {
            cli::banner::print_intro("Docs suggest");
            let mut dt_args = vec!["suggest".to_string()];
            if args.skip_ts {
                dt_args.push("--skip-ts".to_string());
            }
            if args.skip_ai {
                dt_args.push("--skip-ai".to_string());
            }
            if args.no_i18n {
                dt_args.push("--no-i18n".to_string());
            }
            if common.use_json() {
                dt_args.push("--json".to_string());
            }
            run_dt(&root, &dt_args)
        }
    }
}
