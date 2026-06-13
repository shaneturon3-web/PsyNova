# OptiPlex migration — SMB shares

| Share | URL | Contents |
|-------|-----|----------|
| PsyNova | `smb://optiplex.local/shared/PsyNova` | Full repo + `.env` secrets + `.psynova-sync/` runtime state |
| SugarCubes | `smb://optiplex.local/shared/SugarCubes` | Workspace + `sugar_cubes.db` + `.cursor/rules/` |
| CursorSecrets | `smb://optiplex.local/shared/CursorSecrets` | Safe bundle: checkpointed `state.vscdb`, MCP, skills, rules (no WAL/SHM) |
| AgentStack | `smb://optiplex.local/shared/AgentStack` | Ollama/Agentlap/SugarNotes/Chrome extension bundle |
| InkscapeConfig | `smb://optiplex.local/shared/InkscapeConfig` | Inkscape preferences, page sizes, palettes, templates |

See also: [`NETWORK_SHARES.md`](NETWORK_SHARES.md), [`AGENTSTACK_MIGRATION.md`](AGENTSTACK_MIGRATION.md), [`INKSCAPE_PRINTING.md`](INKSCAPE_PRINTING.md)

## Critical: SQLite and SMB do not mix

Cursor stores auth tokens, rules, MCP secrets, and onboarding state in `~/.config/Cursor/User/globalStorage/state.vscdb`. Copying this file over SMB while Cursor is running corrupts it and triggers a greenfield reset.

| Do | Don't |
|----|-------|
| Work in `~/PsyNova` on OptiPlex | Open `smb://.../PsyNova` as Cursor workspace |
| Quit Cursor before sync/restore | Run sync while Cursor is open |
| Run `fix-cursor-secrets` after apply | Rsync live `globalStorage/` over SMB |
| Re-auth MCP OAuth if tokens stale | Copy `-wal` / `-shm` files |

## Push from HP EliteBook

**Quit Cursor completely**, then:

```bash
bash ~/PsyNova/app/ops/sync_to_optiplex.sh
```

The script packs AgentStack and InkscapeConfig locally, then rsyncs all shares.

## Apply on OptiPlex

```bash
bash ~/PsyNova/app/ops/SETUP_AND_APPLY.sh
bash ~/PsyNova/app/ops/apply_agentstack_bundle.sh
bash ~/PsyNova/app/ops/install_inkscape.sh
bash ~/PsyNova/app/ops/install_printer_xerox_6130.sh
bash ~/PsyNova/app/ops/install_printer_plotter.sh --discover   # when plotter connected
```

Or step by step:

```bash
bash ~/PsyNova/app/ops/apply_from_optiplex_shares.sh
bash ~/PsyNova/app/ops/bootstrap_optiplex.sh
fix-cursor-secrets    # only when Cursor is fully quit
```

Install the shortcut once:

```bash
bash ~/PsyNova/app/ops/install_fix_cursor_secrets.sh
```

## After apply

1. Reopen Cursor → Open Folder → `~/PsyNova`
2. Settings → MCP → re-auth disconnected servers
3. Settings → Rules → verify they match Elite
4. Chrome → load unpacked `~/orb/sugarnotes_chrome_extension`
5. Test PsyNova: `curl http://localhost:3000/` and open http://localhost:5173
6. Test Agentlap: `curl http://127.0.0.1:8899/health`

## Recovery if Cursor reset to greenfield

If `state.vscdb` is corrupt but `state.vscdb.backup` on local disk is intact:

```bash
# Quit Cursor first
fix-cursor-secrets
```

The restore script prefers `state.vscdb.backup` from the bundle when it passes `PRAGMA quick_check`.

## Cleanup

Delete obsolete `migration-bundle/` on the PsyNova share if present — do not open it in Cursor.
