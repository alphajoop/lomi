use anyhow::{bail, Result};
use clap::Args;

use crate::cli::{self, CommonOptions};
use crate::config::GlobalConfig;

#[derive(Args, Debug)]
pub struct SwitchArgs {
    /// Profile name to set as default
    pub profile: String,
}

pub async fn run(_common: &CommonOptions, args: SwitchArgs) -> Result<()> {
    let mut config = GlobalConfig::load()?;

    if config.profile(&args.profile).is_none() {
        bail!(
            "Profile `{}` does not exist. Run `lomi login --profile {}` first.",
            args.profile,
            args.profile
        );
    }

    config.current_profile = args.profile.clone();
    config.save()?;

    cli::output::print_success(&format!("Switched default profile to `{}`", args.profile));
    Ok(())
}
