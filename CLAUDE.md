# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**mini-auto-deploy** — a CLI deployment tool (`deploy` command) that builds, packages (tar.gz), uploads via SFTP, and launches Web/Node.js applications on remote Linux servers over SSH. Supports Docker, Nginx (static), and PM2 deployment strategies.

Pure JavaScript, no build step, no TypeScript, no linter. Entry point: `bin/deploy.js` (registered as `deploy` in package.json bin).

## Commands

```bash
# Install dependencies
npm install

# Run tests (custom test runner, Node 14+ compatible)
npm test

# Run CLI locally
node bin/deploy.js --help
node bin/deploy.js --version
node bin/deploy.js --init       # generate deploy.config.js
node bin/deploy.js --init-ui    # open browser-based config UI
node bin/deploy.js              # run deploy (requires deploy.config.js)

# Release (uses release-it with conventional changelog)
npm run release
```

## Architecture

**Template Method Pattern** with a factory function and three-layer class hierarchy:

```
bin/deploy.js              CLI arg parsing (minimist), .env loading (dotenv),
                           interactive SSH prompts (inquirer), config validation,
                           delegates to factory + deployer

lib/index.js               Factory: routes config.type + config.deployMode → deployer class

lib/deployer/base.js       BaseDeployer — deploy() template method pipeline:
                           beforeDeploy → build → package → connect → upload →
                           remote script → health check → hooks → cleanup

lib/deployer/noTemplate.js NoTemplateDeployer — for deployers that don't need
                           Dockerfile/nginx.conf templates (skips template generation)

    ├── WebDocker    (webDocker.js)   — web + docker; generates Dockerfile/nginx.conf from mustache templates
    ├── WebNginx     (webNginx.js)    — web + Nginx static serve (extends NoTemplateDeployer)
    ├── NodeDocker   (nodeDocker.js)  — node + docker (extends NoTemplateDeployer)
    └── NodePm2      (nodePm2.js)     — node + pm2 (extends NoTemplateDeployer)

lib/shell/ssh.js           SSH/SFTP client — connect (30s timeout), disconnect, upload, execRemoteShell (5min timeout)
lib/shell/local.js         execLocalShell() — runs local shell commands
lib/shell/escape.js        escapeShell() — single-quote wraps values to prevent shell injection
lib/logger.js              Logger class — timestamps to deploy.log + console (chalk)
lib/config/loader.js       Config resolution, env var merging, validation orchestration
lib/config/validator.js    validateConfig() → { valid, errors[] } — type/deployMode compatibility, port range, ssh fields
lib/healthCheck.js         healthCheck() — polls http://host:port/path until 2xx/3xx or retries exhausted
lib/configUi.js            startConfigUi() — HTTP server on :3456 serving a config form, writes deploy.config.js
lib/helpText.js            showHelp() — CLI help text
```

### Deployer Interface

Each deployer must implement:
- `getModeName()` — log label, e.g. `"Docker(Web)"`, `"Docker(Node)"`, `"Nginx"`, `"PM2"`
- `buildRemoteScript()` — the remote shell script; all config values escaped via `escapeShell()`

Optional overrides: `needBuild()`, `getTarFiles()`, `getTarExtraArgs()`, `getCleanupFiles()`, `beforeDeploy()`, `supportsRollback()`, `getHealthCheckPort()`.

### Key Patterns

- **Shell injection prevention**: `escapeShell()` wraps every config value interpolated into shell scripts in single quotes (with `'\''` escaping for embedded quotes). Also used when building `tar` command args in `doPackage()`.
- **Mustache templating**: `WebDocker.beforeDeploy()` generates `Dockerfile` and `nginx.conf` from `templates/Dockerfile.mustache` and `templates/nginx.conf.mustache` when `config.useBuiltInTemplates` is true. Uses `{{#proxy}}...{{/proxy}}` sections for conditional proxy blocks.
- **Remote execution**: Uses `client.exec()` (not `client.shell()`) for proper exit codes. Non-zero exit → reject. SFTP via `client.sftp.fastPut()`. Both SSH connect and remote exec have timeout protection.
- **Config resolution**: `--config` flag > `deploy.config.[env].js` > `deploy.config.js` > `.cjs` > `.mjs`. Env vars (`DEPLOY_SSH_HOST`, `DEPLOY_SSH_PORT`, `DEPLOY_PROJECT_NAME`, `DEPLOY_REMOTE_DIR`) override config file values.
- **Config validation**: `validateConfig()` checks type/deployMode validity, port range (1-65535), ssh fields, and type-mode compatibility (web can't use pm2, node can't use Nginx).
- **Error handling**: Deployers throw errors (no `process.exit()` in lib/). `bin/deploy.js` catches and exits with code.
- **Cleanup**: `doCleanup()` is in `finally` block — temp files always cleaned, even on failure. Graceful `ENOENT` handling (no TOCTOU).
- **Rollback**: Docker deployers (`WebDocker`, `NodeDocker`) support rollback via `supportsRollback()`. Before deploying, the current image is tagged as `:previous`. On failure, the old container is restored from the tagged image.
- **Hooks**: `config.hooks.beforeDeploy` and `config.hooks.afterDeploy` are arrays of local shell commands executed before/after deployment. Hook failures are logged but don't abort the deploy.
- **Dry-run**: `--dry-run` flag prints all commands (local and remote) without executing them.

## File Naming Conventions

- Source files: `camelCase.js`
- Template files: `PascalCase.mustache`
- Test files: `feature.test.js` (each exports `[{name, fn}]` array)
- Directories: `lib/deployer/`, `lib/shell/`, `lib/config/`

## Testing

Custom test runner at `test/run.js` (Node 14+ compatible). Each `*.test.js` file exports an array of `{name, fn}` objects. No test framework — just `require()` and `assert`.

Suites: logger, shellEscape, configValidator, factory routing, base deployer, deployers (4 classes).

## Release

Uses `release-it` with `@release-it/conventional-changelog` (angular preset). Publishes to npm, creates GitHub release, generates CHANGELOG.md.
