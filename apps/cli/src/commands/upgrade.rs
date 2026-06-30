use anyhow::Result;
use clap::Args;

use crate::cli::CommonOptions;

#[derive(Args, Debug)]
pub struct UpgradeArgs {}

pub async fn run(common: &CommonOptions, _args: UpgradeArgs) -> Result<()> {
    crate::commands::update::show_cli_upgrade(common)
}
