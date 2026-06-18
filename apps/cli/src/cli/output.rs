use colored::Colorize;
use serde::Serialize;

use super::CommonOptions;

pub fn logo() -> String {
    format!(
        "{}{}",
        "lomi".bright_green().bold(),
        ".".bright_magenta().bold()
    )
}

pub fn error_prefix() -> String {
    format!("{} {}", "X".red().bold(), "Error:".red())
}

pub fn print_error(message: &str) {
    eprintln!("{} {}", error_prefix(), message);
}

pub fn print_success(message: &str) {
    println!("{}", message.green());
}

pub fn print_info(message: &str) {
    println!("{}", message.bright_blue());
}

pub fn print_dim(message: &str) {
    println!("{}", message.bright_black());
}

pub fn print_step(message: &str) {
    println!("{} {}", "│".bright_black(), message);
}

pub fn print_note(title: &str, body: &str) {
    println!();
    println!("{} {}", "◇".cyan(), title.cyan());
    for line in body.lines() {
        println!("{}  {}", "│".bright_black(), line);
    }
    println!("{}  {}", "├".bright_black(), "─".repeat(40).bright_black());
}

pub fn divider() {
    println!("{}", "-".repeat(54).bright_black());
}

pub fn is_tty() -> bool {
    use std::io::IsTerminal;
    std::io::stdin().is_terminal()
}

pub fn should_use_json(common: &CommonOptions) -> bool {
    common.use_json()
}

pub fn print_json<T: Serialize>(value: &T) -> anyhow::Result<()> {
    println!("{}", serde_json::to_string_pretty(value)?);
    Ok(())
}
