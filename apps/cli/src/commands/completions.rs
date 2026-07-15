use anyhow::Result;
use clap::{Args, Subcommand, ValueEnum};
use clap_complete::{generate, Shell};
use std::io;

use crate::cli::{self, CommonOptions};

#[derive(Args, Debug)]
pub struct CompletionsArgs {
    #[command(subcommand)]
    pub command: CompletionsCommand,
}

#[derive(Subcommand, Debug)]
pub enum CompletionsCommand {
    /// Generate shell completion script
    Generate(CompletionsGenerateArgs),
}

#[derive(Args, Debug)]
pub struct CompletionsGenerateArgs {
    /// Target shell
    pub shell: CompletionShell,
}

#[derive(Clone, Debug, ValueEnum)]
pub enum CompletionShell {
    Bash,
    Zsh,
    Fish,
    PowerShell,
    Elvish,
}

pub fn run(_common: &CommonOptions, args: CompletionsArgs) -> Result<()> {
    match args.command {
        CompletionsCommand::Generate(generate_args) => generate_completions(generate_args),
    }
}

fn generate_completions(args: CompletionsGenerateArgs) -> Result<()> {
    let mut cmd = crate::cli::app::build_cli();
    let shell = match args.shell {
        CompletionShell::Bash => Shell::Bash,
        CompletionShell::Zsh => Shell::Zsh,
        CompletionShell::Fish => Shell::Fish,
        CompletionShell::PowerShell => Shell::PowerShell,
        CompletionShell::Elvish => Shell::Elvish,
    };

    let bin_name = cmd.get_name().to_string();
    generate(shell, &mut cmd, bin_name, &mut io::stdout());

    eprintln!();
    cli::output::print_hint(&install_hint(&args.shell));
    Ok(())
}

fn install_hint(shell: &CompletionShell) -> String {
    match shell {
        CompletionShell::Bash => {
            "Save to a file and source it: lomi completions generate bash > ~/.lomi-completions.bash && echo 'source ~/.lomi-completions.bash' >> ~/.bashrc".to_string()
        }
        CompletionShell::Zsh => {
            "Save to a file and source it: lomi completions generate zsh > ~/.lomi-completions.zsh && echo 'source ~/.lomi-completions.zsh' >> ~/.zshrc".to_string()
        }
        CompletionShell::Fish => {
            "Save to fish completions: lomi completions generate fish > ~/.config/fish/completions/lomi.fish".to_string()
        }
        CompletionShell::PowerShell => {
            "Add to your PowerShell profile: lomi completions generate powershell | Out-File -Encoding UTF8 ~\\.lomi-completions.ps1".to_string()
        }
        CompletionShell::Elvish => {
            "Save and use: lomi completions generate elvish > ~/.lomi-completions.elv".to_string()
        }
    }
}
