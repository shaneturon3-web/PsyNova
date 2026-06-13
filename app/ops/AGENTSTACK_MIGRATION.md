# AgentStack migration (Ollama + Agentlap + SugarNotes + Chrome)

## Bundle contents

Packed by `pack_agentstack_bundle.sh` into `~/shared/AgentStack/` or SMB `AgentStack/`:

- `orb/` — bridge, MCP, guardian, rules (no `.venv`)
- `SugarNotes/` — inbox and exports
- `chrome/sugarnotes_chrome_extension/` — SugarNotes Capture v1.1
- `systemd/user/` — agentlap-bridge, ollama, guardian, transcript export
- `local-bin/` — sugarnotes, sugarnotes_process, agentelap*, sugarcubes-agent
- `desktop/` — launcher entries
- `ollama/` — model list, env defaults, optional `dot-ollama/` copy
- `secrets/` — orb `.env` files (chmod 600)

## Push from Elite

Included in `sync_to_optiplex.sh` automatically.

Manual pack:

```bash
bash ~/PsyNova/app/ops/pack_agentstack_bundle.sh
```

## Apply on OptiPlex

```bash
bash ~/PsyNova/app/ops/apply_agentstack_bundle.sh
```

Then in Chrome:

1. `chrome://extensions`
2. Developer mode
3. Load unpacked → `~/orb/sugarnotes_chrome_extension`

## Verify

```bash
systemctl --user status agentlap-bridge.service
curl -s http://127.0.0.1:8899/health
curl -s http://127.0.0.1:11434/api/tags
```

## Ollama

If `~/.ollama` was not bundled, install Ollama and run:

```bash
ollama pull llama3.1
ollama pull qwen2.5-coder
```

Or execute `AgentStack/ollama/pull-models.sh` if present.
