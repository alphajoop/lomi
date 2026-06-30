use anyhow::{bail, Result};
use inquire::{Confirm, Password, Select, Text};

pub fn require_tty() -> Result<()> {
    if !super::output::is_tty() {
        bail!("Interactive prompts cannot be used in non-TTY environments. Pass --yes with required flags to run non-interactively.");
    }
    Ok(())
}

pub fn select<T: std::fmt::Display + PartialEq + Clone + 'static>(
    message: &str,
    options: Vec<T>,
    default: T,
) -> Result<T> {
    require_tty()?;
    let starting_cursor = options
        .iter()
        .position(|option| *option == default)
        .unwrap_or(0);
    Select::new(message, options)
        .with_starting_cursor(starting_cursor)
        .prompt()
        .map_err(Into::into)
}

pub fn confirm(message: &str, default: bool) -> Result<bool> {
    require_tty()?;
    Confirm::new(message)
        .with_default(default)
        .prompt()
        .map_err(Into::into)
}

pub fn text(message: &str) -> Result<String> {
    require_tty()?;
    Text::new(message).prompt().map_err(Into::into)
}

pub fn password(message: &str) -> Result<String> {
    require_tty()?;
    Password::new(message)
        .without_confirmation()
        .prompt()
        .map_err(Into::into)
}
