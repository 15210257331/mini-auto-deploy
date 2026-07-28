# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mini-auto-deploy** is a CLI deployment tool (`deploy` command) that builds, packages, uploads (via SFTP), and launches web/Node.js apps on remote Linux servers over SSH. Supports Docker, Nginx (static), and PM2 deployment strategies.

- Pure JavaScript (no TypeScript, no build step)
- Entry: `bin/deploy.js` (shebang node script, registered as `"bin": { "deploy": "bin/deploy.js" }`)
- Published to npm as `mini-auto-deploy`

## Commands

```bash
# Install
npm install

# Run the CLI locally
node bin/deploy.js --help
node bin/deploy.js --version
node bin/deploy.js --init          # generate deploy.config.js from template
node bin/deploy.js                  # run deploy (needs deploy.config.js)

# Run tests (53 tests across 6 suites)
npm test

# Release to npm (uses release-it with conventional changelog)
npm run release
```

No linter or build step.

## Architecture

**Template Method Pattern** with a factory function, three-layer class hierarchy:

```
bin/deploy.js           → CLI arg parsing (minimist), .env loading (dotenv),
                           interactive SSH prompts (inquirer), config validation,
                           config resolution (--config flag, deploy.config.*js)
       │
lib/index.js            → Factory: routes config.type + config.deployMode to deployer class
       │
lib/baseDeployer.js     → Base class: deploy() template method pipeline
       │                   (beforeDeploy → build → package → connect → upload → remote script → cleanup)
       │
lib/noTemplateDeployer.js → Middle class: for deployers that don't need Dockerfile/nginx.conf templates
       │
       ├── WebDocker    (lib/web/webDocker.js)    — web + docker, generates Dockerfile/nginx.conf from mustache templates
       ├── WebNginx     (lib/web/webNginx.js)     — web + nginx static serve (extends NoTemplateDeployer)
       ├── NodeDocker   (lib/node/nodeDocker.js)  — node + docker (extends NoTemplateDeployer)
       └── NodePm2      (lib/node/nodePm2.js)     — node + pm2 (extends NoTemplateDeployer)

lib/sshClient.js         → SSH/SFTP client: connect (with 30s timeout), disconnect, upload, execRemoteShell (with 5min timeout)
lib/localShell.js        → execLocalShell(shell, message, logger) — runs local shell commands
lib/logger.js            → log(msg) / error(msg) with timestamps to deploy.log and console (chalk-colored)
lib/shellEscape.js       → escapeShell(val) — single-quote wraps values to prevent command injection
lib/configValidator.js   → validateConfig(config) → { valid, errors[] } — validates type, deployMode, port, ssh, etc.
```

Each deployer must implement:
- `getModeName()` — log label, e.g. `"Docker(Web)"`, `"Docker(Node)"`, `"Nginx"`, `"PM2"`
- `buildRemoteScript()` — the remote shell script (all config values escaped via `escapeShell()`)

Optional overrides: `needBuild()`, `getTarFiles()` (returns array), `getTarExtraArgs()`, `getCleanupFiles()`, `beforeDeploy()`.

## Key Patterns

- **Shell injection prevention**: `escapeShell()` wraps all config values interpolated into shell scripts in single quotes. Also used when building `tar` command args in `doPackage()` (filenames from config could contain spaces/special chars).
- **Mustache templating**: `WebDocker.beforeDeploy()` generates `Dockerfile` and `nginx.conf` from `templates/Dockerfile.mustache` and `templates/nginx.conf.mustache` when `config.useBuiltInTemplates` is true. Uses Mustache sections (`{{#proxy}}...{{/proxy}}`) for conditional proxy block.
- **Remote execution**: Uses `client.exec()` (not `client.shell()`) for proper exit codes. Non-zero → reject. Uses `client.sftp.fastPut()` for uploads. Both SSH connect and remote exec have timeout protection.
- **Config resolution**: CLI `--config` flag → `deploy.config.js` → `deploy.config.cjs` → `deploy.config.mjs`. Env vars (`DEPLOY_SSH_HOST`, `DEPLOY_SSH_PORT`, `DEPLOY_PROJECT_NAME`, `DEPLOY_REMOTE_DIR`) override. `require` cache is cleared each run to get fresh config.
- **Config validation**: `validateConfig()` checks type/deployMode validity, port range, ssh fields, and type-mode compatibility (web can't use pm2, node can't use Nginx).
- **Error handling**: Deployers throw errors (no `process.exit()` in lib). `bin/deploy.js` catches and exits with code.
- **Cleanup**: `doCleanup()` is in `finally` block — temp files always cleaned, even on failure. Uses graceful `ENOENT` handling (no TOCTOU).

## File Naming Conventions

- Source files: `camelCase.js`
- Template files: `PascalCase.mustache`
- Test files: `feature.test.js` (export `[{name, fn}]` array)
- Directories: `web/` and `node/` organized by project type

## Testing

Custom runner `test/run.js` (Node 14+ compatible). Each `*.test.js` exports `[{name, fn}]`. 6 suites: logger, shellEscape, configValidator, factory routing, base deployer, and deployers.
