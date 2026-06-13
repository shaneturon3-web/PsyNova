#!/usr/bin/env bash
# apply_agentstack_bundle.sh — restore Agentlap stack on target machine.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE="${1:-}"

find_bundle() {
  local -a candidates=(
    "${1:-}"
    "$HOME/shared/AgentStack"
    "/mnt/shared/AgentStack"
    "/run/user/$(id -u)/gvfs/smb-share:server=optiplex.local,share=shared/AgentStack"
  )
  local c
  for c in "${candidates[@]}"; do
    [[ -n "$c" && -d "$c/orb" ]] && { echo "$c"; return 0; }
  done
  return 1
}

BUNDLE="${BUNDLE:-$(find_bundle "${1:-}" || true)}"
[[ -n "$BUNDLE" ]] || { echo "ERROR: AgentStack bundle not found" >&2; exit 1; }

echo "[agentstack] Restoring from $BUNDLE"

# orb
mkdir -p "$HOME/orb"
rsync -a --exclude '.venv/' "$BUNDLE/orb/" "$HOME/orb/"

# SugarNotes
[[ -d "$BUNDLE/SugarNotes" ]] && mkdir -p "$HOME/SugarNotes" && rsync -a "$BUNDLE/SugarNotes/" "$HOME/SugarNotes/"

# Chrome ext -> orb path expected by runbook
if [[ -d "$BUNDLE/chrome/sugarnotes_chrome_extension" ]]; then
  rsync -a "$BUNDLE/chrome/sugarnotes_chrome_extension/" "$HOME/orb/sugarnotes_chrome_extension/"
fi

# secrets
[[ -f "$BUNDLE/secrets/orb.env" ]] && cp "$BUNDLE/secrets/orb.env" "$HOME/orb/.env" && chmod 600 "$HOME/orb/.env"
[[ -f "$BUNDLE/secrets/openrouter.env" ]] && cp "$BUNDLE/secrets/openrouter.env" "$HOME/orb/openrouter.env" && chmod 600 "$HOME/orb/openrouter.env"

# local bin
mkdir -p "$HOME/.local/bin"
if [[ -d "$BUNDLE/local-bin" ]]; then
  for f in "$BUNDLE/local-bin"/*; do
    [[ -e "$f" ]] || continue
    base=$(basename "$f")
    if [[ -L "$f" ]]; then
      target=$(readlink "$f")
      ln -sf "$target" "$HOME/.local/bin/$base"
    else
      cp -a "$f" "$HOME/.local/bin/$base"
      chmod +x "$HOME/.local/bin/$base" 2>/dev/null || true
    fi
  done
fi

# desktop
mkdir -p "$HOME/.local/share/applications"
[[ -d "$BUNDLE/desktop" ]] && cp -a "$BUNDLE/desktop/"*.desktop "$HOME/.local/share/applications/" 2>/dev/null || true

# systemd
mkdir -p "$HOME/.config/systemd/user"
[[ -d "$BUNDLE/systemd/user" ]] && cp -a "$BUNDLE/systemd/user/"* "$HOME/.config/systemd/user/" 2>/dev/null || true

# Ollama models
if [[ -d "$BUNDLE/ollama/dot-ollama" ]]; then
  mkdir -p "$HOME/.ollama"
  rsync -a "$BUNDLE/ollama/dot-ollama/" "$HOME/.ollama/"
elif [[ -x "$BUNDLE/ollama/pull-models.sh" ]]; then
  command -v ollama >/dev/null 2>&1 && bash "$BUNDLE/ollama/pull-models.sh" || \
    echo "[agentstack] WARN: ollama not installed; run pull-models.sh after installing ollama"
fi

# orb venv + services
if [[ -f "$HOME/orb/requirements.txt" ]] && [[ ! -d "$HOME/orb/.venv" ]]; then
  python3 -m venv "$HOME/orb/.venv"
  "$HOME/orb/.venv/bin/pip" install -q -r "$HOME/orb/requirements.txt" 2>/dev/null || true
fi

for installer in install_agentlap_services.sh install_agentlap_guardian.sh install_sugarnotes_processing.sh install_agent_menu.sh; do
  [[ -x "$HOME/orb/$installer" ]] && bash "$HOME/orb/$installer" || true
done

systemctl --user daemon-reload 2>/dev/null || true

echo ""
echo "[agentstack] Done."
echo "  Chrome: chrome://extensions -> Load unpacked -> ~/orb/sugarnotes_chrome_extension"
echo "  Health: curl -s http://127.0.0.1:8899/health"
echo "  Ollama: curl -s http://127.0.0.1:11434/api/tags"
