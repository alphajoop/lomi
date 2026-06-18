# lomi. CLI

Native Rust command-line interface for the [lomi.](https://lomi.africa) payment platform.

## Install

### npm (recommended)

```bash
npm install -g lomi.cli
lomi login
```

The npm package downloads the native binary from GitHub Releases. Requires a published release (`cli-v*` tag).

### Homebrew

```bash
brew install lomiafrica/tap/lomi
# or from the repo formula (update sha256 after each release):
brew install --formula apps/cli/homebrew/lomi.rb
```

### From source

```bash
cd apps/cli
cargo install --path .
```

## Quick start

```bash
# lomi quickstart — verify CLI and get next steps
lomi quickstart
lomi quickstart --json

# Authenticate (browser device flow)
lomi login

# Check status
lomi status
lomi whoami

# Scaffold a project with SDK examples
lomi init

# Install AI agent rules (Cursor, Claude Code, Codex)
lomi install-rules

# Listen for sandbox webhooks (no ngrok)
lomi listen http://localhost:3000/webhooks

# Local webhook development server
lomi dev

# Integration health check
lomi probe

# Create a checkout session (interactive or headless)
lomi checkout create
lomi checkout create --amount 10000 --currency XOF \
  --success-url https://example.com/success \
  --cancel-url https://example.com/cancel --json

# Refunds and transactions
lomi transactions list --json
lomi transactions get <transaction-id> --json
lomi refunds create --transaction-id <id> --amount 5000 --json

# Create a payment link
lomi payments create

# Install Lomi UI checkout components
lomi ui list
lomi ui add payment-provider-selector
lomi ui update
```

## Commands

| Command | Description |
| --- | --- |
| `login` | Browser authentication via Supabase device flow |
| `logout` | Clear stored credentials for a profile |
| `whoami` | Show current account and profile |
| `status` | Verify login and API connectivity |
| `init` | Initialize project with SDK, examples, and `.env` |
| `quickstart` | Golden-path checks and next steps |
| `listen` | Cloud webhook relay (sandbox-first) |
| `probe` | Integration health checks |
| `webhooks list` / `webhooks test` | Manage and test webhook endpoints |
| `products list` | List products and prices |
| `transactions list` / `transactions get` | List or retrieve transactions |
| `refunds create` / `list` / `get` | Create, list, or retrieve refunds |
| `checkout create` | Create a hosted checkout session (interactive or headless) |
| `dev` | Local webhook receiver for development |
| `install-rules` | AI setup wizard: Cursor, Claude Code, Codex, llms.txt |
| `payments create` | Create a payment link interactively |
| `update` | Update `@lomi./sdk` in the current project |
| `ui list` / `ui add` / `ui update` | Install Lomi UI components from docs registry (no login) |
| `list-profiles` | List CLI auth profiles |
| `switch` | Set the default profile |

## Profiles

Use named profiles for sandbox vs production:

```bash
lomi login --profile sandbox
lomi switch sandbox
lomi init --profile sandbox
```

Global config: `~/.config/lomi/config.json` (Linux) or `~/Library/Preferences/lomi/config.json` (macOS).

## Headless / CI

```bash
export LOMI_ACCESS_TOKEN=your_cli_token
lomi status

lomi init --yes \
  --environment sandbox \
  --language ts \
  --api-key lomi_sk_test_xxx
# Installs Cursor + llms.txt agent rules by default (use --skip-rules-install to opt out)

lomi login --no-browser
lomi install-rules --target cursor
```

## Agent rules

`lomi install-rules` asks which AI setup you use, then installs:

- **Cursor** → `.cursor/rules/lomi.*.mdc`
- **Claude Code** → `CLAUDE.md`
- **OpenAI Codex** → `AGENTS.md`
- **VS Code** → `.github/instructions/lomi-*.instructions.md`
- **llms.txt** → project-root briefing synced from [docs.lomi.africa/llms.txt](https://docs.lomi.africa/llms.txt)

Topic rules (checkout, webhooks, etc.) are bundled in the binary. Refresh from OpenAPI + docs:

```bash
./scripts/generate-rules.sh
```

## Development

```bash
cargo build
cargo test
cargo run -- --help
cargo run -- status
```

## Publishing a release

1. Bump version in `apps/cli/Cargo.toml` and `apps/cli/npm/package.json`
2. Run `./scripts/generate-rules.sh` to refresh `rules/llms.txt` and API reference
3. Update SHA256 checksums in `apps/cli/homebrew/lomi.rb`
4. Tag and push: `git tag cli-v3.0.0 && git push origin cli-v3.0.0`
5. GitHub Actions builds binaries, creates a release, and publishes `lomi.cli` to npm (requires `NPM_TOKEN` secret)

## Auth backend

Login uses the existing Supabase `cli-auth` edge function ([`apps/dashboard/supabase/functions/cli-auth`](../../dashboard/supabase/functions/cli-auth/index.ts)) and DB schema ([`20250226000075_cli_tool.sql`](../../dashboard/supabase/migrations/20250226000075_cli_tool.sql)) — same device-code flow as the previous TypeScript CLI:

1. `POST /cli-auth/device-auth` → user code + verification URI
2. Browser authorization in dashboard
3. `POST /cli-auth/token` → CLI API key stored in `~/.config/lomi/config.json`

## Documentation

https://docs.lomi.africa

## License

MIT
