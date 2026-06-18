use anyhow::{bail, Result};
use clap::{Args, Subcommand};
use colored::Colorize;
use std::path::Path;

use crate::cli::{self, CommonOptions, lomi_ui_registry_url};
use crate::ui::{
    installer::{self, InstallOptions},
    lockfile,
    prereqs::{self, PrereqOptions},
    registry,
};

#[derive(Args, Debug)]
pub struct UiArgs {
    #[command(subcommand)]
    pub command: UiCommands,
}

#[derive(Subcommand, Debug)]
pub enum UiCommands {
    /// List available Lomi UI components from the live registry
    List(ListArgs),
    /// Add one or all Lomi UI components via shadcn
    Add(AddArgs),
    /// Re-install locked components from the latest registry
    Update(UpdateArgs),
}

#[derive(Args, Debug)]
pub struct ListArgs {
    /// Project path (unused; kept for consistent global UX)
    #[arg(long, default_value = ".", hide = true)]
    pub path: String,
}

#[derive(Args, Debug)]
pub struct AddArgs {
    /// Component name (omit when using --all)
    pub name: Option<String>,

    /// Install every component in the registry
    #[arg(long)]
    pub all: bool,

    /// Target project directory
    #[arg(long, default_value = ".")]
    pub path: String,

    /// Skip shadcn init prompt
    #[arg(long)]
    pub yes: bool,

    /// Print shadcn commands without executing
    #[arg(long)]
    pub dry_run: bool,
}

#[derive(Args, Debug)]
pub struct UpdateArgs {
    /// Update a single locked component
    #[arg(long)]
    pub component: Option<String>,

    /// Target project directory
    #[arg(long, default_value = ".")]
    pub path: String,

    /// Skip shadcn init prompt
    #[arg(long)]
    pub yes: bool,

    /// Print shadcn commands without executing
    #[arg(long)]
    pub dry_run: bool,
}

pub async fn run(_common: &CommonOptions, args: UiArgs) -> Result<()> {
    match args.command {
        UiCommands::List(list_args) => run_list(list_args).await,
        UiCommands::Add(add_args) => run_add(add_args).await,
        UiCommands::Update(update_args) => run_update(update_args).await,
    }
}

async fn run_list(args: ListArgs) -> Result<()> {
    cli::banner::print_intro("Lomi UI registry");

    let spinner = indicatif::ProgressBar::new_spinner();
    spinner.set_message("Fetching registry...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(100));

    let index = registry::fetch_index().await?;
    spinner.finish_and_clear();

    if index.items.is_empty() {
        cli::output::print_info("No components found in registry.");
        return Ok(());
    }

    println!(
        "{:<32} {:<28} {}",
        "NAME".bold(),
        "TITLE".bold(),
        "DESCRIPTION".bold()
    );
    cli::output::divider();

    for item in &index.items {
        println!(
            "{:<32} {:<28} {}",
            item.name.cyan(),
            item.title.as_deref().unwrap_or("—"),
            item.description.as_deref().unwrap_or("—")
        );
    }

    println!();
    if let Some(name) = &index.name {
        cli::output::print_dim(&format!("Registry: {name}"));
    }
    if let Some(version) = &index.version {
        cli::output::print_dim(&format!("Registry version: {version}"));
    }
    if let Some(homepage) = &index.homepage {
        cli::output::print_dim(&format!("Docs: {homepage}"));
    }

    let _ = args.path;
    cli::banner::print_outro("Run `lomi ui add <name>` to install a component");
    Ok(())
}

async fn run_add(args: AddArgs) -> Result<()> {
    if args.all && args.name.is_some() {
        bail!("Pass either a component name or --all, not both");
    }
    if !args.all && args.name.is_none() {
        bail!("Component name required (or pass --all)");
    }

    cli::banner::print_intro("Adding Lomi UI component");

    let project_dir = Path::new(&args.path);
    let index = registry::fetch_index().await?;
    let registry_url = index
        .registry_url
        .clone()
        .unwrap_or_else(lomi_ui_registry_url);
    let registry_version = index.version.as_deref().unwrap_or("unknown");

    let names: Vec<String> = if args.all {
        index.items.iter().map(|item| item.name.clone()).collect()
    } else {
        let name = args.name.as_ref().unwrap();
        registry::find_item(&index, name)?;
        vec![name.clone()]
    };

    let prereq_options = PrereqOptions {
        yes: args.yes,
        dry_run: args.dry_run,
    };
    prereqs::ensure_prereqs(project_dir, &prereq_options)?;

    let install_options = InstallOptions {
        yes: true,
        dry_run: args.dry_run,
    };

    let mut lockfile = lockfile::load_or_create(registry_version, &registry_url, project_dir)?;

    for name in &names {
        installer::install_component(project_dir, name, &install_options)?;
        if !args.dry_run {
            lockfile.record_install(name, registry_version, &registry_url);
        }
    }

    if !args.dry_run {
        lockfile.save(project_dir)?;
        cli::output::print_success(&format!(
            "Installed {} component(s)",
            names.len()
        ));
    }

    cli::banner::print_outro("Lomi UI install complete");
    Ok(())
}

async fn run_update(args: UpdateArgs) -> Result<()> {
    cli::banner::print_intro("Updating Lomi UI components");

    let project_dir = Path::new(&args.path);
    let existing = lockfile::UiLockfile::load(project_dir)?;
    let existing = match existing {
        Some(lockfile) => lockfile,
        None => bail!(
            "No .lomi/ui-lock.json found. Run `lomi ui add <name>` first."
        ),
    };

    let index = registry::fetch_index().await?;
    let registry_url = index
        .registry_url
        .clone()
        .unwrap_or_else(lomi_ui_registry_url);
    let registry_version = index.version.as_deref().unwrap_or("unknown");

    let names: Vec<String> = if let Some(component) = &args.component {
        registry::find_item(&index, component)?;
        if !existing.components.iter().any(|c| c.name == *component) {
            bail!("Component '{component}' is not in .lomi/ui-lock.json");
        }
        vec![component.clone()]
    } else {
        existing.components.iter().map(|c| c.name.clone()).collect()
    };

    if names.is_empty() {
        bail!("No components to update in lockfile");
    }

    let prereq_options = PrereqOptions {
        yes: args.yes,
        dry_run: args.dry_run,
    };
    prereqs::ensure_prereqs(project_dir, &prereq_options)?;

    let install_options = InstallOptions {
        yes: true,
        dry_run: args.dry_run,
    };

    let mut lockfile = existing;

    for name in &names {
        installer::install_component(project_dir, name, &install_options)?;
        if !args.dry_run {
            lockfile.record_install(name, registry_version, &registry_url);
        }
    }

    if !args.dry_run {
        lockfile.save(project_dir)?;
        cli::output::print_success(&format!(
            "Updated {} component(s) to registry {registry_version}",
            names.len()
        ));
    }

    cli::banner::print_outro("Lomi UI update complete");
    Ok(())
}

/// Install a component during `lomi init` (no banner; errors bubble to caller).
pub async fn install_for_init(
    project_dir: &Path,
    name: &str,
    yes: bool,
    dry_run: bool,
) -> Result<()> {
    let index = registry::fetch_index().await?;
    registry::find_item(&index, name)?;

    let registry_url = index
        .registry_url
        .clone()
        .unwrap_or_else(lomi_ui_registry_url);
    let registry_version = index.version.as_deref().unwrap_or("unknown");

    prereqs::ensure_prereqs(
        project_dir,
        &PrereqOptions { yes, dry_run },
    )?;
    installer::install_component(
        project_dir,
        name,
        &InstallOptions { yes: true, dry_run },
    )?;

    if !dry_run {
        let mut lockfile =
            lockfile::load_or_create(registry_version, &registry_url, project_dir)?;
        lockfile.record_install(name, registry_version, &registry_url);
        lockfile.save(project_dir)?;
    }

    Ok(())
}
