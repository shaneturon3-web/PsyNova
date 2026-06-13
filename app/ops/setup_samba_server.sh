#!/usr/bin/env bash
# setup_samba_server.sh — install Samba, expose ~/shared on LAN (read/write, authenticated).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARE_USER="${SHARE_USER:-$(whoami)}"
SHARE_ROOT="${SHARE_ROOT:-$HOME/shared}"
LAN_SUBNET="${LAN_SUBNET:-192.168.18.0/24}"
SAMBA_INCLUDE="/etc/samba/smb-shares-psynova.conf"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Re-running with sudo..."
  exec sudo -E SHARE_USER="$SHARE_USER" SHARE_ROOT="$SHARE_ROOT" LAN_SUBNET="$LAN_SUBNET" bash "$0" "$@"
fi

echo "[samba] Installing packages..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y samba ufw

echo "[samba] Creating share root: $SHARE_ROOT"
mkdir -p "$SHARE_ROOT"/{PsyNova,SugarCubes,SugarNotes,orb,CursorSecrets,AgentStack,InkscapeConfig}

link_if_missing() {
  local src="$1" dest="$2"
  [[ -e "$src" ]] || return 0
  if [[ -L "$dest" || -e "$dest" ]]; then
    return 0
  fi
  ln -s "$src" "$dest"
  echo "  linked $dest -> $src"
}

link_if_missing "$HOME/PsyNova" "$SHARE_ROOT/PsyNova"
link_if_missing "$HOME/SugarCubes" "$SHARE_ROOT/SugarCubes"
link_if_missing "$HOME/SugarNotes" "$SHARE_ROOT/SugarNotes"
link_if_missing "$HOME/orb" "$SHARE_ROOT/orb"

chown -R "$SHARE_USER:$SHARE_USER" "$SHARE_ROOT"

echo "[samba] Writing $SAMBA_INCLUDE"
sed -e "s|__SHARE_USER__|$SHARE_USER|g" -e "s|__SHARE_ROOT__|$SHARE_ROOT|g" \
  "$SCRIPT_DIR/samba-shares.conf.template" > "$SAMBA_INCLUDE"

if ! grep -q 'smb-shares-psynova.conf' /etc/samba/smb.conf 2>/dev/null; then
  cat >> /etc/samba/smb.conf <<EOF

# PsyNova LAN shares (managed by setup_samba_server.sh)
include = $SAMBA_INCLUDE
EOF
fi

if ! pdbedit -L 2>/dev/null | grep -q "^${SHARE_USER}:"; then
  echo "[samba] Set SMB password for $SHARE_USER (same as login or choose a LAN password):"
  smbpasswd -a "$SHARE_USER"
else
  echo "[samba] SMB user $SHARE_USER already exists (run: sudo smbpasswd $SHARE_USER to change)"
fi

echo "[samba] Configuring UFW for LAN subnet $LAN_SUBNET"
ufw allow from "$LAN_SUBNET" to any port 445 proto tcp comment 'SMB' || true
ufw allow from "$LAN_SUBNET" to any port 139 proto tcp comment 'NetBIOS' || true
ufw allow from "$LAN_SUBNET" to any port 137 proto udp comment 'NetBIOS-ns' || true
ufw allow from "$LAN_SUBNET" to any port 138 proto udp comment 'NetBIOS-dgm' || true
# Enable UFW only if currently inactive (do not force-enable without user intent)
if ufw status | grep -q 'Status: inactive'; then
  echo "[samba] UFW is inactive; rules added but not enabled. Run: sudo ufw enable"
else
  ufw reload || true
fi

systemctl enable smbd nmbd
systemctl restart smbd nmbd

HOST="$(hostname -s)"
echo ""
echo "[samba] Done."
echo "  URL: smb://${HOST}.local/shared"
echo "  User: $SHARE_USER"
echo "  Test: smbclient -L //${HOST}.local/shared -U $SHARE_USER"
