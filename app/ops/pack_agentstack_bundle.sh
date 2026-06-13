#!/usr/bin/env bash
# pack_agentstack_bundle.sh — bundle Ollama/Agentlap/SugarNotes/Chrome extension for migration.
set -euo pipefail

DEST="${1:-${AGENTSTACK_BUNDLE_DEST:-$HOME/shared/AgentStack}}"
ORB="${ORB_ROOT:-$HOME/orb}"
NOTES="${SUGARNOTES_ROOT:-$HOME/SugarNotes}"

mkdir -p "$DEST"/{orb,SugarNotes,chrome,systemd/user,local-bin,desktop,ollama,secrets}

# orb (no venv)
if [[ -d "$ORB" ]]; then
  rsync -a \
    --exclude '.venv/' --exclude '__pycache__/' --exclude '*.pyc' \
    "$ORB/" "$DEST/orb/"
fi

# SugarNotes
[[ -d "$NOTES" ]] && rsync -a "$NOTES/" "$DEST/SugarNotes/"

# Chrome extension
[[ -d "$ORB/sugarnotes_chrome_extension" ]] && \
  rsync -a "$ORB/sugarnotes_chrome_extension/" "$DEST/chrome/sugarnotes_chrome_extension/"

# systemd user units
mkdir -p "$DEST/systemd/user"
for f in "$HOME/.config/systemd/user"/agentlap-* "$HOME/.config/systemd/user"/cursor-transcript-export*; do
  [[ -f "$f" ]] && cp "$f" "$DEST/systemd/user/"
done
[[ -d "$ORB/systemd" ]] && cp -a "$ORB/systemd/"* "$DEST/systemd/user/" 2>/dev/null || true

# local bin wrappers (dereference symlinks — SMB/GVFS cannot store symlinks)
mkdir -p "$DEST/local-bin"
for bin in sugarnotes sugarnotes_process sugarcubes-agent agentelap agentelap-server agentelap-window; do
  src="$HOME/.local/bin/$bin"
  [[ -e "$src" ]] || continue
  if [[ -L "$src" ]]; then
    target=$(readlink -f "$src" 2>/dev/null || readlink "$src")
    if [[ -f "$target" ]]; then
      cp "$target" "$DEST/local-bin/$bin"
      chmod +x "$DEST/local-bin/$bin"
    else
      printf '%s\n' "$target" > "$DEST/local-bin/${bin}.symlink-target"
    fi
  else
    cp -a "$src" "$DEST/local-bin/$bin"
  fi
done

# desktop entries
for desk in agentlap.desktop sugarcubes-agent.desktop; do
  [[ -f "$HOME/.local/share/applications/$desk" ]] && \
    cp "$HOME/.local/share/applications/$desk" "$DEST/desktop/" 2>/dev/null || true
done

# Ollama model list
mkdir -p "$DEST/ollama"
if command -v ollama >/dev/null 2>&1; then
  ollama list 2>/dev/null > "$DEST/ollama/models.txt" || true
fi
cat > "$DEST/ollama/env.defaults" <<'EOF'
AGENTLAP_OLLAMA_MODEL=llama3.1:latest
AGENTLAP_OLLAMA_URL=http://127.0.0.1:11434
EOF
if [[ -f "$DEST/ollama/models.txt" ]] && ! grep -q llama3.1 "$DEST/ollama/models.txt" 2>/dev/null; then
  cat > "$DEST/ollama/pull-models.sh" <<'EOF'
#!/usr/bin/env bash
ollama pull llama3.1
ollama pull qwen2.5-coder
EOF
  chmod +x "$DEST/ollama/pull-models.sh"
fi
# Always ship pull script as fallback
if [[ ! -f "$DEST/ollama/pull-models.sh" ]]; then
  cat > "$DEST/ollama/pull-models.sh" <<'EOF'
#!/usr/bin/env bash
ollama pull llama3.1
ollama pull qwen2.5-coder
EOF
  chmod +x "$DEST/ollama/pull-models.sh"
fi

# Secrets (optional, restrictive perms)
[[ -f "$ORB/.env" ]] && cp "$ORB/.env" "$DEST/secrets/orb.env" && chmod 600 "$DEST/secrets/orb.env"
[[ -f "$ORB/openrouter.env" ]] && cp "$ORB/openrouter.env" "$DEST/secrets/openrouter.env" && chmod 600 "$DEST/secrets/openrouter.env"

# Copy ~/.ollama if present
if [[ -d "$HOME/.ollama" ]]; then
  rsync -a "$HOME/.ollama/" "$DEST/ollama/dot-ollama/"
fi

cat > "$DEST/manifest.txt" <<EOF
created_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
source_host=$(hostname)
source_user=$USER
bundle_version=1
orb=$ORB
sugarnotes=$NOTES
EOF

echo "[agentstack] Packed -> $DEST"
