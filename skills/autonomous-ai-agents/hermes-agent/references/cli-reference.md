# Hermes CLI Reference

Live sources when anything looks stale: `hebri --help`, `hermes <command> --help`,
https://hermes-agent.nousresearch.com/docs/reference/cli-commands

### Global Flags

```
hermes [flags] [command]        (no subcommand = interactive chat)

  --version, -V             Show version
  -z, --oneshot PROMPT      One-shot: print ONLY the final response (for scripts/pipes)
  -m MODEL  --provider P    Model/provider override for this invocation
  -t, --toolsets LIST       Comma-separated toolsets for this invocation
  --resume, -r SESSION      Resume session by ID or title
  --continue, -c [NAME]     Resume by name, or most recent session
  --worktree, -w            Isolated git worktree mode (parallel agents)
  --skills, -s SKILL        Preload skills (comma-separate or repeat)
  --profile, -p NAME        Use a named profile
  --yolo                    Skip dangerous command approval
  --tui / --cli             Force the Ink TUI / classic REPL
  --ignore-rules            Skip AGENTS.md/SOUL.md/memory/skill injection
  --safe-mode               Disable ALL customizations (troubleshooting)
  --pass-session-id         Include session ID in system prompt
```

### Chat

```
hebri chat [flags]
  -q, --query TEXT          Single query, non-interactive
  --image PATH              Attach a local image to a single query
  -Q, --quiet               Suppress banner, spinner, tool previews
  --checkpoints             Enable filesystem checkpoints (/rollback)
  --max-turns N             Cap tool-calling iterations
  --source TAG              Session source tag (default: cli)
```
(plus the global flags above)

### Configuration

```
hebri setup [section]      Wizard (model|tts|terminal|gateway|tools|agent)
hebri model                Interactive model/provider picker
hebri fallback [add|remove|list]  Fallback provider chain
hebri config [show|edit|get|set|unset|path|env-path|check|migrate]
hebri login / logout       OAuth sign-in / clear stored auth
hebri doctor [--fix]       Check dependencies and config
hebri status [--all]       Component status
```

### Tools & Skills

```
hebri tools [list|enable NAME|disable NAME]   Per-platform toolsets (curses UI with no args)

hebri skills list|browse|search QUERY|inspect ID
hebri skills install ID    Hub identifier OR a direct https://…/SKILL.md URL
hebri skills config        Enable/disable skills per platform
hebri skills check|update|uninstall|publish PATH
hebri skills tap add REPO  Add a GitHub repo as a skill source
hebri bundles              Skill bundles (one /<name> alias loads several skills)
```

### MCP Servers

```
hebri mcp add NAME (--url or --command) | remove | list | test NAME
hebri mcp catalog | install NAME     Curated catalog install
hebri mcp configure NAME             Toggle tool selection
hebri mcp serve                      Run Hermes as an MCP server
```
Details (transport, tool discovery, catalog): `references/native-mcp.md`.

### Gateway (Messaging Platforms)

```
hebri gateway run|install|start|stop|restart|status|setup
```

20+ platforms: Telegram, Discord, Slack, WhatsApp (Baileys + Business Cloud API), iMessage (Photon — `hebri photon setup`), Signal, Email, SMS, Matrix, Mattermost, Teams, LINE, SimpleX, ntfy, Google Chat, Home Assistant, DingTalk, Feishu, WeCom, Weixin, API Server, Webhooks. Open WebUI connects via the API Server adapter. Most adapters ship under `plugins/platforms/`.
Docs: https://hermes-agent.nousresearch.com/docs/user-guide/messaging/

### Sessions

```
hebri sessions list|browse|rename ID TITLE|delete ID|export OUT|prune|stats
```

### Cron / Webhooks

```
hebri cron list|create SCHED|edit ID|pause|resume|run ID|remove|status
    Schedules: '30m', 'every 2h', '0 9 * * *', ISO timestamp
hebri webhook subscribe NAME|list|remove NAME|test NAME
```
Webhook payloads/routes: `references/webhooks.md`.

### Profiles

```
hebri profile list|create NAME (--clone|--clone-all|--clone-from)|use|show|delete
hebri profile rename A B | alias NAME | export NAME | import FILE
hebri profile migrate-identity A B   Retry a completed rename's session/routing identity migration
```

### Credentials & Pools

```
hebri auth                 Interactive credential manager
hebri auth add [PROVIDER]  Add OAuth or API-key credential (nous, openai-codex, qwen-oauth, …)
hebri auth list|remove P IDX|reset PROVIDER|status
```
Multiple credentials per provider form a pool that rotates automatically and skips exhausted keys.

### Other

```
hebri desktop / gui        Native desktop app
hebri dashboard            Web admin panel + embedded chat (--stop / --status)
hebri proxy                OpenAI-compatible local proxy backed by an OAuth provider
hebri portal               Quick setup / sign in via Nous Portal
hebri kanban <verb>        Multi-agent work-queue board
hebri project              Named multi-folder workspaces
hebri skin list|use|set    Switch/tweak skins (see references/themes.md)
hebri pets <verb>          Pet mascots (see references/petdex.md)
hebri memory setup|status|off|reset   Memory provider
hebri secrets bitwarden|onepassword   External secret stores
hebri moa                  Mixture-of-Agents slots
hebri hooks / security / backup / import / checkpoints / console
hebri logs [-f] [errors]   View agent/error logs
hebri send                 One-off message through a gateway platform
hebri pairing / plugins / insights / journey / computer-use
hebri acp                  ACP server (IDE integration)
hebri completion bash|zsh|fish
hebri update / uninstall / claw migrate
```

Plugin- and provider-supplied subcommands (e.g. `hebri photon setup`) only appear once their plugin is installed/active.

### Where to Find Things

| Looking for... | Location |
|---|---|
| Config options | `hebri config edit` · [Configuration docs](https://hermes-agent.nousresearch.com/docs/user-guide/configuration) |
| Tools / toolsets | `hebri tools list` · [Tools reference](https://hermes-agent.nousresearch.com/docs/reference/tools-reference) |
| Skills catalog | `hebri skills browse` · [Skills catalog](https://hermes-agent.nousresearch.com/docs/reference/skills-catalog) |
| Provider setup | `hebri model` · [Providers guide](https://hermes-agent.nousresearch.com/docs/integrations/providers) |
| Env variables | `hebri config env-path` · [Env vars reference](https://hermes-agent.nousresearch.com/docs/reference/environment-variables) |
| Gateway logs | `~/.hermes/logs/gateway.log` (or `hebri logs`) |
| Sessions | `hebri sessions browse` (reads state.db) |
