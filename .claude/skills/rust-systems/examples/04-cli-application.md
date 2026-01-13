# Professional CLI Application with Clap

> **Demonstrates**: Production-ready command-line application with clap derive macros
> **Technologies**: clap 4.x, dialoguer, indicatif, colored, Rust 1.75+
> **Integration**: Subcommands, configuration files, interactive prompts, progress bars
> **Use when**: Building developer tools, utilities, and command-line interfaces

---

## Overview

This example implements a professional CLI application with:
- Derive-based argument parsing with clap 4.x
- Subcommands and nested commands
- Interactive prompts with dialoguer
- Progress bars and spinners with indicatif
- Colored output for better UX
- Configuration file support
- Shell completion generation

## Implementation

### 1. Dependencies (Cargo.toml)

```toml
[package]
name = "mycli"
version = "0.1.0"
edition = "2021"
description = "A professional CLI tool"
authors = ["Your Name <your@email.com>"]

[[bin]]
name = "mycli"
path = "src/main.rs"

[dependencies]
# CLI parsing
clap = { version = "4.4", features = ["derive", "env", "wrap_help"] }
clap_complete = "4.4"

# Interactive
dialoguer = { version = "0.11", features = ["fuzzy-select"] }
indicatif = "0.17"
console = "0.15"

# Colors
colored = "2.1"

# Configuration
config = "0.14"
directories = "5.0"
toml = "0.8"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Async (if needed)
tokio = { version = "1.35", features = ["full"] }

# Error handling
thiserror = "1.0"
anyhow = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

### 2. CLI Structure (src/cli.rs)

```rust
use clap::{Args, Parser, Subcommand, ValueEnum};
use std::path::PathBuf;

/// MyCLI - A professional command-line tool
///
/// This tool demonstrates best practices for building CLI applications in Rust.
#[derive(Parser, Debug)]
#[command(
    name = "mycli",
    author,
    version,
    about,
    long_about = None,
    propagate_version = true,
    arg_required_else_help = true,
)]
pub struct Cli {
    /// Configuration file path
    #[arg(short, long, global = true, env = "MYCLI_CONFIG")]
    pub config: Option<PathBuf>,

    /// Increase verbosity (-v, -vv, -vvv)
    #[arg(short, long, action = clap::ArgAction::Count, global = true)]
    pub verbose: u8,

    /// Suppress all output except errors
    #[arg(short, long, global = true)]
    pub quiet: bool,

    /// Output format
    #[arg(long, global = true, default_value = "text", value_enum)]
    pub format: OutputFormat,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    /// Initialize a new project
    Init(InitArgs),

    /// Manage configuration
    #[command(subcommand)]
    Config(ConfigCommands),

    /// Run tasks
    Run(RunArgs),

    /// Generate shell completions
    Completions(CompletionsArgs),

    /// Interactive mode
    Interactive,
}

/// Arguments for init command
#[derive(Args, Debug)]
pub struct InitArgs {
    /// Project name
    #[arg(required = true)]
    pub name: String,

    /// Project template to use
    #[arg(short, long, default_value = "default")]
    pub template: String,

    /// Target directory (defaults to current directory)
    #[arg(short, long)]
    pub directory: Option<PathBuf>,

    /// Skip interactive prompts
    #[arg(long)]
    pub no_interactive: bool,

    /// Overwrite existing files
    #[arg(long)]
    pub force: bool,
}

/// Config subcommands
#[derive(Subcommand, Debug)]
pub enum ConfigCommands {
    /// Show current configuration
    Show,

    /// Set a configuration value
    Set {
        /// Configuration key (e.g., "user.name")
        key: String,
        /// Configuration value
        value: String,
    },

    /// Get a configuration value
    Get {
        /// Configuration key
        key: String,
    },

    /// List all configuration values
    List,

    /// Reset configuration to defaults
    Reset {
        /// Reset without confirmation
        #[arg(long)]
        force: bool,
    },
}

/// Arguments for run command
#[derive(Args, Debug)]
pub struct RunArgs {
    /// Task to run
    #[arg(required = true)]
    pub task: String,

    /// Arguments to pass to the task
    #[arg(trailing_var_arg = true)]
    pub args: Vec<String>,

    /// Run in dry-run mode (don't make changes)
    #[arg(long)]
    pub dry_run: bool,

    /// Number of parallel jobs
    #[arg(short, long, default_value = "4")]
    pub jobs: usize,

    /// Continue on error
    #[arg(long)]
    pub keep_going: bool,
}

/// Arguments for completions command
#[derive(Args, Debug)]
pub struct CompletionsArgs {
    /// Shell to generate completions for
    #[arg(value_enum)]
    pub shell: Shell,
}

#[derive(ValueEnum, Clone, Debug)]
pub enum Shell {
    Bash,
    Zsh,
    Fish,
    PowerShell,
}

#[derive(ValueEnum, Clone, Debug, Default)]
pub enum OutputFormat {
    #[default]
    Text,
    Json,
    Yaml,
}
```

### 3. Configuration Management (src/config.rs)

```rust
use anyhow::{Context, Result};
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(default)]
    pub user: UserConfig,

    #[serde(default)]
    pub project: ProjectConfig,

    #[serde(default)]
    pub output: OutputConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UserConfig {
    pub name: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub default_template: String,
    pub auto_git_init: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputConfig {
    pub color: bool,
    pub emoji: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            user: UserConfig::default(),
            project: ProjectConfig::default(),
            output: OutputConfig::default(),
        }
    }
}

impl Default for ProjectConfig {
    fn default() -> Self {
        Self {
            default_template: "default".to_string(),
            auto_git_init: true,
        }
    }
}

impl Default for OutputConfig {
    fn default() -> Self {
        Self {
            color: true,
            emoji: true,
        }
    }
}

impl AppConfig {
    /// Load configuration from file
    pub fn load(custom_path: Option<&PathBuf>) -> Result<Self> {
        let config_path = custom_path
            .cloned()
            .or_else(Self::default_config_path);

        match config_path {
            Some(path) if path.exists() => {
                let content = fs::read_to_string(&path)
                    .with_context(|| format!("Failed to read config from {:?}", path))?;
                let config: AppConfig = toml::from_str(&content)
                    .with_context(|| "Failed to parse config file")?;
                Ok(config)
            }
            _ => Ok(Self::default()),
        }
    }

    /// Save configuration to file
    pub fn save(&self, custom_path: Option<&PathBuf>) -> Result<()> {
        let config_path = custom_path
            .cloned()
            .or_else(Self::default_config_path)
            .ok_or_else(|| anyhow::anyhow!("Could not determine config path"))?;

        // Create parent directories
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create config directory {:?}", parent))?;
        }

        let content = toml::to_string_pretty(self)
            .with_context(|| "Failed to serialize config")?;
        fs::write(&config_path, content)
            .with_context(|| format!("Failed to write config to {:?}", config_path))?;

        Ok(())
    }

    /// Get default configuration path
    pub fn default_config_path() -> Option<PathBuf> {
        ProjectDirs::from("com", "example", "mycli")
            .map(|dirs| dirs.config_dir().join("config.toml"))
    }

    /// Set a configuration value by key path
    pub fn set_value(&mut self, key: &str, value: &str) -> Result<()> {
        let parts: Vec<&str> = key.split('.').collect();

        match parts.as_slice() {
            ["user", "name"] => self.user.name = Some(value.to_string()),
            ["user", "email"] => self.user.email = Some(value.to_string()),
            ["project", "default_template"] => self.project.default_template = value.to_string(),
            ["project", "auto_git_init"] => {
                self.project.auto_git_init = value.parse()
                    .with_context(|| "Invalid boolean value")?;
            }
            ["output", "color"] => {
                self.output.color = value.parse()
                    .with_context(|| "Invalid boolean value")?;
            }
            ["output", "emoji"] => {
                self.output.emoji = value.parse()
                    .with_context(|| "Invalid boolean value")?;
            }
            _ => anyhow::bail!("Unknown configuration key: {}", key),
        }

        Ok(())
    }

    /// Get a configuration value by key path
    pub fn get_value(&self, key: &str) -> Option<String> {
        let parts: Vec<&str> = key.split('.').collect();

        match parts.as_slice() {
            ["user", "name"] => self.user.name.clone(),
            ["user", "email"] => self.user.email.clone(),
            ["project", "default_template"] => Some(self.project.default_template.clone()),
            ["project", "auto_git_init"] => Some(self.project.auto_git_init.to_string()),
            ["output", "color"] => Some(self.output.color.to_string()),
            ["output", "emoji"] => Some(self.output.emoji.to_string()),
            _ => None,
        }
    }
}
```

### 4. Interactive Prompts (src/interactive.rs)

```rust
use anyhow::Result;
use colored::Colorize;
use dialoguer::{theme::ColorfulTheme, Confirm, FuzzySelect, Input, MultiSelect, Password, Select};

/// Interactive project initialization
pub struct ProjectWizard {
    theme: ColorfulTheme,
}

impl ProjectWizard {
    pub fn new() -> Self {
        Self {
            theme: ColorfulTheme::default(),
        }
    }

    /// Run the interactive project wizard
    pub fn run(&self) -> Result<ProjectOptions> {
        println!("{}", "\n🚀 Project Initialization Wizard\n".bold().cyan());

        // Project name
        let name: String = Input::with_theme(&self.theme)
            .with_prompt("Project name")
            .validate_with(|input: &String| {
                if input.is_empty() {
                    Err("Project name cannot be empty")
                } else if input.contains(' ') {
                    Err("Project name cannot contain spaces")
                } else {
                    Ok(())
                }
            })
            .interact_text()?;

        // Description
        let description: String = Input::with_theme(&self.theme)
            .with_prompt("Description (optional)")
            .allow_empty(true)
            .interact_text()?;

        // Template selection with fuzzy search
        let templates = vec![
            "default - Basic project structure",
            "api - REST API with Actix-web",
            "cli - Command-line application",
            "lib - Rust library",
            "wasm - WebAssembly module",
        ];

        let template_idx = FuzzySelect::with_theme(&self.theme)
            .with_prompt("Select template")
            .items(&templates)
            .default(0)
            .interact()?;

        let template = templates[template_idx].split(" - ").next().unwrap().to_string();

        // Features selection
        let features = vec![
            "tracing - Structured logging",
            "serde - Serialization",
            "tokio - Async runtime",
            "sqlx - Database support",
            "clap - CLI parsing",
        ];

        let selected_features = MultiSelect::with_theme(&self.theme)
            .with_prompt("Select features (space to toggle)")
            .items(&features)
            .interact()?;

        let features: Vec<String> = selected_features
            .iter()
            .map(|&i| features[i].split(" - ").next().unwrap().to_string())
            .collect();

        // Git initialization
        let init_git = Confirm::with_theme(&self.theme)
            .with_prompt("Initialize git repository?")
            .default(true)
            .interact()?;

        // Author information
        let author: String = Input::with_theme(&self.theme)
            .with_prompt("Author name")
            .default("Anonymous".to_string())
            .interact_text()?;

        let email: String = Input::with_theme(&self.theme)
            .with_prompt("Author email")
            .allow_empty(true)
            .interact_text()?;

        // License selection
        let licenses = vec!["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "None"];
        let license_idx = Select::with_theme(&self.theme)
            .with_prompt("Select license")
            .items(&licenses)
            .default(0)
            .interact()?;

        let license = if licenses[license_idx] == "None" {
            None
        } else {
            Some(licenses[license_idx].to_string())
        };

        // Confirmation
        println!("\n{}", "📋 Summary:".bold());
        println!("  Name: {}", name.green());
        println!("  Template: {}", template.green());
        println!("  Features: {}", features.join(", ").green());
        println!("  Git: {}", if init_git { "Yes".green() } else { "No".red() });
        println!("  License: {}", license.as_deref().unwrap_or("None").green());

        let confirmed = Confirm::with_theme(&self.theme)
            .with_prompt("\nProceed with these settings?")
            .default(true)
            .interact()?;

        if !confirmed {
            anyhow::bail!("Cancelled by user");
        }

        Ok(ProjectOptions {
            name,
            description: if description.is_empty() { None } else { Some(description) },
            template,
            features,
            init_git,
            author,
            email: if email.is_empty() { None } else { Some(email) },
            license,
        })
    }
}

#[derive(Debug)]
pub struct ProjectOptions {
    pub name: String,
    pub description: Option<String>,
    pub template: String,
    pub features: Vec<String>,
    pub init_git: bool,
    pub author: String,
    pub email: Option<String>,
    pub license: Option<String>,
}

/// Secure password input
pub fn prompt_password(prompt: &str) -> Result<String> {
    let password = Password::with_theme(&ColorfulTheme::default())
        .with_prompt(prompt)
        .with_confirmation("Confirm password", "Passwords don't match")
        .interact()?;

    Ok(password)
}

/// Simple yes/no confirmation
pub fn confirm(prompt: &str, default: bool) -> Result<bool> {
    let result = Confirm::with_theme(&ColorfulTheme::default())
        .with_prompt(prompt)
        .default(default)
        .interact()?;

    Ok(result)
}
```

### 5. Progress Indicators (src/progress.rs)

```rust
use indicatif::{MultiProgress, ProgressBar, ProgressStyle};
use std::time::Duration;

/// Create a spinner for indeterminate progress
pub fn create_spinner(message: &str) -> ProgressBar {
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_strings(&["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"])
            .template("{spinner:.blue} {msg}")
            .unwrap(),
    );
    spinner.set_message(message.to_string());
    spinner.enable_steady_tick(Duration::from_millis(80));
    spinner
}

/// Create a progress bar for determinate progress
pub fn create_progress_bar(total: u64, message: &str) -> ProgressBar {
    let progress = ProgressBar::new(total);
    progress.set_style(
        ProgressStyle::default_bar()
            .template("{msg}\n{spinner:.green} [{bar:40.cyan/blue}] {pos}/{len} ({eta})")
            .unwrap()
            .progress_chars("█▓▒░"),
    );
    progress.set_message(message.to_string());
    progress
}

/// Create a download-style progress bar
pub fn create_download_bar(total: u64) -> ProgressBar {
    let progress = ProgressBar::new(total);
    progress.set_style(
        ProgressStyle::default_bar()
            .template("{msg}\n{spinner:.green} [{bar:40.cyan/blue}] {bytes}/{total_bytes} ({bytes_per_sec}, {eta})")
            .unwrap()
            .progress_chars("=>-"),
    );
    progress
}

/// Multi-progress for parallel tasks
pub struct TaskProgress {
    multi: MultiProgress,
    bars: Vec<ProgressBar>,
}

impl TaskProgress {
    pub fn new(tasks: &[&str]) -> Self {
        let multi = MultiProgress::new();
        let bars: Vec<ProgressBar> = tasks
            .iter()
            .map(|task| {
                let bar = multi.add(ProgressBar::new(100));
                bar.set_style(
                    ProgressStyle::default_bar()
                        .template("{prefix:.bold.dim} {spinner:.green} [{bar:25.cyan/blue}] {msg}")
                        .unwrap()
                        .progress_chars("█▓░"),
                );
                bar.set_prefix(format!("{:>12}", task));
                bar.set_message("pending");
                bar
            })
            .collect();

        Self { multi, bars }
    }

    pub fn start(&self, idx: usize) {
        if let Some(bar) = self.bars.get(idx) {
            bar.set_message("running...");
            bar.enable_steady_tick(Duration::from_millis(100));
        }
    }

    pub fn progress(&self, idx: usize, pos: u64) {
        if let Some(bar) = self.bars.get(idx) {
            bar.set_position(pos);
        }
    }

    pub fn finish(&self, idx: usize, success: bool) {
        if let Some(bar) = self.bars.get(idx) {
            bar.disable_steady_tick();
            bar.set_position(100);
            if success {
                bar.set_message("✓ done");
            } else {
                bar.set_message("✗ failed");
            }
            bar.finish();
        }
    }

    pub fn finish_all(&self) {
        for bar in &self.bars {
            bar.finish();
        }
    }
}

/// Example: Simulate parallel downloads
pub async fn simulate_parallel_downloads() {
    let tasks = vec!["downloading", "extracting", "installing", "configuring"];
    let progress = TaskProgress::new(&tasks.iter().map(|s| *s).collect::<Vec<_>>());

    let handles: Vec<_> = (0..tasks.len())
        .map(|i| {
            let progress = progress.clone();
            tokio::spawn(async move {
                progress.start(i);
                for j in 0..100 {
                    tokio::time::sleep(Duration::from_millis(50 + (i * 20) as u64)).await;
                    progress.progress(i, j + 1);
                }
                progress.finish(i, true);
            })
        })
        .collect();

    for handle in handles {
        let _ = handle.await;
    }
}

impl Clone for TaskProgress {
    fn clone(&self) -> Self {
        Self {
            multi: self.multi.clone(),
            bars: self.bars.clone(),
        }
    }
}
```

### 6. Output Formatting (src/output.rs)

```rust
use colored::Colorize;
use serde::Serialize;

use crate::cli::OutputFormat;

/// Print success message
pub fn success(message: &str) {
    println!("{} {}", "✓".green().bold(), message.green());
}

/// Print error message
pub fn error(message: &str) {
    eprintln!("{} {}", "✗".red().bold(), message.red());
}

/// Print warning message
pub fn warning(message: &str) {
    println!("{} {}", "⚠".yellow().bold(), message.yellow());
}

/// Print info message
pub fn info(message: &str) {
    println!("{} {}", "ℹ".blue().bold(), message);
}

/// Print debug message (only in verbose mode)
pub fn debug(message: &str, verbose: u8) {
    if verbose > 0 {
        println!("{} {}", "🔍".dimmed(), message.dimmed());
    }
}

/// Print a heading
pub fn heading(title: &str) {
    println!("\n{}\n{}", title.bold().underline(), "─".repeat(title.len()));
}

/// Print a key-value pair
pub fn key_value(key: &str, value: &str) {
    println!("  {}: {}", key.bold(), value);
}

/// Print data in specified format
pub fn print_data<T: Serialize>(data: &T, format: &OutputFormat) -> anyhow::Result<()> {
    match format {
        OutputFormat::Text => {
            // For text, we just print the debug representation
            println!("{:#?}", data);
        }
        OutputFormat::Json => {
            let json = serde_json::to_string_pretty(data)?;
            println!("{}", json);
        }
        OutputFormat::Yaml => {
            let yaml = serde_yaml::to_string(data)?;
            println!("{}", yaml);
        }
    }
    Ok(())
}

/// Print a table
pub fn table(headers: &[&str], rows: &[Vec<String>]) {
    // Calculate column widths
    let mut widths: Vec<usize> = headers.iter().map(|h| h.len()).collect();
    for row in rows {
        for (i, cell) in row.iter().enumerate() {
            if i < widths.len() {
                widths[i] = widths[i].max(cell.len());
            }
        }
    }

    // Print headers
    let header_line: String = headers
        .iter()
        .enumerate()
        .map(|(i, h)| format!("{:width$}", h.bold(), width = widths[i]))
        .collect::<Vec<_>>()
        .join(" │ ");
    println!("{}", header_line);

    // Print separator
    let separator: String = widths
        .iter()
        .map(|w| "─".repeat(*w))
        .collect::<Vec<_>>()
        .join("─┼─");
    println!("{}", separator);

    // Print rows
    for row in rows {
        let row_line: String = row
            .iter()
            .enumerate()
            .map(|(i, cell)| {
                let width = widths.get(i).copied().unwrap_or(cell.len());
                format!("{:width$}", cell, width = width)
            })
            .collect::<Vec<_>>()
            .join(" │ ");
        println!("{}", row_line);
    }
}
```

### 7. Shell Completions (src/completions.rs)

```rust
use clap::CommandFactory;
use clap_complete::{generate, Generator};
use std::io;

use crate::cli::{Cli, Shell};

/// Generate shell completions
pub fn generate_completions(shell: Shell) {
    let mut cmd = Cli::command();

    match shell {
        Shell::Bash => generate_completion(clap_complete::shells::Bash, &mut cmd),
        Shell::Zsh => generate_completion(clap_complete::shells::Zsh, &mut cmd),
        Shell::Fish => generate_completion(clap_complete::shells::Fish, &mut cmd),
        Shell::PowerShell => generate_completion(clap_complete::shells::PowerShell, &mut cmd),
    }
}

fn generate_completion<G: Generator>(gen: G, cmd: &mut clap::Command) {
    generate(gen, cmd, cmd.get_name().to_string(), &mut io::stdout());
}
```

### 8. Main Application (src/main.rs)

```rust
use anyhow::Result;
use clap::Parser;
use colored::Colorize;

mod cli;
mod completions;
mod config;
mod interactive;
mod output;
mod progress;

use cli::{Cli, Commands, ConfigCommands};
use config::AppConfig;

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    // Setup logging based on verbosity
    setup_logging(cli.verbose, cli.quiet);

    // Load configuration
    let mut config = AppConfig::load(cli.config.as_ref())?;

    // Handle commands
    match cli.command {
        Commands::Init(args) => cmd_init(args, &config).await?,
        Commands::Config(subcmd) => cmd_config(subcmd, &mut config, cli.config.as_ref())?,
        Commands::Run(args) => cmd_run(args, &config).await?,
        Commands::Completions(args) => completions::generate_completions(args.shell),
        Commands::Interactive => cmd_interactive().await?,
    }

    Ok(())
}

fn setup_logging(verbose: u8, quiet: bool) {
    use tracing_subscriber::EnvFilter;

    let filter = if quiet {
        EnvFilter::new("error")
    } else {
        match verbose {
            0 => EnvFilter::new("warn"),
            1 => EnvFilter::new("info"),
            2 => EnvFilter::new("debug"),
            _ => EnvFilter::new("trace"),
        }
    };

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .without_time()
        .init();
}

async fn cmd_init(args: cli::InitArgs, config: &AppConfig) -> Result<()> {
    use progress::create_spinner;

    output::heading(&format!("Initializing project: {}", args.name));

    let options = if args.no_interactive {
        interactive::ProjectOptions {
            name: args.name,
            description: None,
            template: args.template,
            features: vec![],
            init_git: config.project.auto_git_init,
            author: config.user.name.clone().unwrap_or_default(),
            email: config.user.email.clone(),
            license: Some("MIT".to_string()),
        }
    } else {
        let wizard = interactive::ProjectWizard::new();
        wizard.run()?
    };

    // Create project
    let spinner = create_spinner("Creating project structure...");
    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    spinner.finish_with_message("✓ Project structure created".green().to_string());

    let spinner = create_spinner("Installing dependencies...");
    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
    spinner.finish_with_message("✓ Dependencies installed".green().to_string());

    if options.init_git {
        let spinner = create_spinner("Initializing git repository...");
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        spinner.finish_with_message("✓ Git repository initialized".green().to_string());
    }

    output::success(&format!("\nProject '{}' created successfully!", options.name));
    output::info(&format!("Run 'cd {}' to get started", options.name));

    Ok(())
}

fn cmd_config(subcmd: ConfigCommands, config: &mut AppConfig, path: Option<&std::path::PathBuf>) -> Result<()> {
    match subcmd {
        ConfigCommands::Show => {
            output::heading("Current Configuration");
            let toml = toml::to_string_pretty(config)?;
            println!("{}", toml);
        }
        ConfigCommands::Set { key, value } => {
            config.set_value(&key, &value)?;
            config.save(path)?;
            output::success(&format!("Set {} = {}", key, value));
        }
        ConfigCommands::Get { key } => {
            match config.get_value(&key) {
                Some(value) => println!("{}", value),
                None => output::error(&format!("Unknown key: {}", key)),
            }
        }
        ConfigCommands::List => {
            output::heading("Configuration Values");
            output::table(
                &["Key", "Value"],
                &[
                    vec!["user.name".to_string(), config.user.name.clone().unwrap_or_default()],
                    vec!["user.email".to_string(), config.user.email.clone().unwrap_or_default()],
                    vec!["project.default_template".to_string(), config.project.default_template.clone()],
                    vec!["project.auto_git_init".to_string(), config.project.auto_git_init.to_string()],
                    vec!["output.color".to_string(), config.output.color.to_string()],
                    vec!["output.emoji".to_string(), config.output.emoji.to_string()],
                ],
            );
        }
        ConfigCommands::Reset { force } => {
            if !force && !interactive::confirm("Reset configuration to defaults?", false)? {
                output::info("Cancelled");
                return Ok(());
            }
            *config = AppConfig::default();
            config.save(path)?;
            output::success("Configuration reset to defaults");
        }
    }
    Ok(())
}

async fn cmd_run(args: cli::RunArgs, _config: &AppConfig) -> Result<()> {
    output::heading(&format!("Running task: {}", args.task));

    if args.dry_run {
        output::warning("Dry-run mode: no changes will be made");
    }

    let pb = progress::create_progress_bar(100, &format!("Executing {}...", args.task));

    for i in 0..100 {
        tokio::time::sleep(std::time::Duration::from_millis(30)).await;
        pb.set_position(i + 1);
    }

    pb.finish_with_message(format!("✓ Task '{}' completed", args.task).green().to_string());

    Ok(())
}

async fn cmd_interactive() -> Result<()> {
    output::heading("Interactive Mode");
    output::info("Running interactive wizard...\n");

    let wizard = interactive::ProjectWizard::new();
    let options = wizard.run()?;

    output::success(&format!("Would create project: {:?}", options));

    Ok(())
}
```

## Usage

### Basic Commands

```bash
# Initialize project
mycli init my-project
mycli init my-project --template api --no-interactive

# Configuration
mycli config show
mycli config set user.name "John Doe"
mycli config get user.email
mycli config list
mycli config reset

# Run tasks
mycli run build
mycli run test --dry-run --jobs 8

# Generate completions
mycli completions bash >> ~/.bashrc
mycli completions zsh >> ~/.zshrc

# Interactive mode
mycli interactive

# Global options
mycli -v init my-project      # Verbose
mycli -vvv run build          # Very verbose
mycli -q run test             # Quiet
mycli --format json config show
```

## Key Takeaways

1. **Derive-Based Parsing**: clap 4.x derive macros for clean CLI definition
2. **Subcommands**: Nested command structure for complex CLIs
3. **Interactive UX**: dialoguer for prompts, indicatif for progress
4. **Configuration**: XDG-compliant config with directories crate
5. **Shell Completions**: Built-in completion generation
6. **Output Formatting**: Multiple output formats (text, JSON, YAML)
7. **Error Handling**: anyhow for ergonomic error handling

This CLI structure is production-ready and follows Rust CLI best practices.
