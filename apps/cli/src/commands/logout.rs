use anyhow::Result;
use clap::Args;

use crate::cli::{self, CommonOptions};
use crate::config::GlobalConfig;

#[derive(Args, Debug)]
pub struct LogoutArgs {}

pub async fn run(common: &CommonOptions, _args: LogoutArgs) -> Result<()> {
    let profile = common.effective_profile()?;
    cli::banner::print_intro(&format!("Logging out profile [{profile}]"));

    let mut config = GlobalConfig::load()?;
    config.clear_profile(&profile)?;

    cli::output::print_success(&format!("Logged out profile [{profile}]"));
    cli::banner::print_outro("Logout complete");
    Ok(())
}
