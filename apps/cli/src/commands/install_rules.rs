use anyhow::{bail, Result};
use clap::Args;
use colored::Colorize;

use crate::cli::{self, CommonOptions, DOCS_URL};
use crate::config::GlobalConfig;
use crate::rules::installer::{install_rules as install, InstallTarget};
use crate::rules::manifest::{load_current_rules, MANIFEST_VERSION};

#[derive(Args, Debug)]
pub struct InstallRulesArgs {
    /// Install targets: cursor, claude-code, codex, vscode, llms.txt
    #[arg(long)]
    pub target: Option<Vec<String>>,

    /// Force reinstall even if already up to date
    #[arg(long)]
    pub force: bool,
}

pub async fn run(common: &CommonOptions, args: InstallRulesArgs) -> Result<()> {
    cli::banner::print_intro("Installing lomi. agent rules");

    let targets = resolve_targets(&args)?;
    let rules = load_current_rules()?;

    if rules.is_empty() {
        bail!("No rules found in manifest");
    }

    let installed = install(&targets, &rules)?;

    let mut config = GlobalConfig::load()?;
    config.settings.has_seen_rules_install_prompt = true;
    config.settings.last_rules_install_version = Some(MANIFEST_VERSION.to_string());
    config.save()?;

    cli::output::print_success("Installed the following rules files:");
    for path in installed {
        println!("  {}", path.display().to_string().green());
    }

    println!();
    println!(
        "Learn more: {}",
        format!("{DOCS_URL}/start/first-payment").bright_blue()
    );
    cli::banner::print_outro("Agent rules installed successfully");
    let _ = common;
    let _ = args.force;
    Ok(())
}

fn resolve_targets(args: &InstallRulesArgs) -> Result<Vec<InstallTarget>> {
    if let Some(targets) = &args.target {
        return targets.iter().map(|t| InstallTarget::from_str(t)).collect();
    }

    if !crate::cli::output::is_tty() {
        return Ok(vec![InstallTarget::Cursor, InstallTarget::LlmsTxt]);
    }

    let choices: Vec<String> = InstallTarget::all()
        .iter()
        .map(|target| format!("{} — {}", target.label(), target.hint()))
        .collect();

    let selected = inquire::MultiSelect::new("Which AI coding setup are you using?", choices)
        .with_default(&[0, 4])
        .prompt()?;

    selected
        .iter()
        .filter_map(|label| {
            InstallTarget::all()
                .iter()
                .find(|target| label.starts_with(target.label()))
                .copied()
        })
        .collect::<Vec<_>>()
        .pipe(Ok)
}

trait Pipe: Sized {
    fn pipe<F, R>(self, f: F) -> R
    where
        F: FnOnce(Self) -> R,
    {
        f(self)
    }
}

impl<T> Pipe for T {}
