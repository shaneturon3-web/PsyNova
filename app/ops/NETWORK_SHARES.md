# LAN network shares

## This machine as SMB server

After running `setup_samba_server.sh`, this workstation exposes:

| Share | Path | Contents |
|-------|------|----------|
| `shared` | `~/shared/` | Parent folder with symlinks + bundle dirs |
| `homes` | `~/` | Authenticated home access (Samba default) |

Subfolders under `~/shared/`:

- `PsyNova`, `SugarCubes`, `SugarNotes`, `orb` — symlinks to home dirs
- `CursorSecrets`, `AgentStack`, `InkscapeConfig` — packed migration bundles

**URL:** `smb://$(hostname -s).local/shared`

**Access:** authenticated user only (`valid users`), read/write.

## Setup (once, requires sudo)

```bash
bash ~/PsyNova/app/ops/setup_samba_server.sh
```

Set SMB password when prompted (`smbpasswd`). Default LAN subnet for UFW: `192.168.18.0/24` (override with `LAN_SUBNET=`).

## OptiPlex as SMB server (existing)

| Share | URL |
|-------|-----|
| PsyNova | `smb://optiplex.local/shared/PsyNova` |
| SugarCubes | `smb://optiplex.local/shared/SugarCubes` |
| CursorSecrets | `smb://optiplex.local/shared/CursorSecrets` |
| AgentStack | `smb://optiplex.local/shared/AgentStack` |
| InkscapeConfig | `smb://optiplex.local/shared/InkscapeConfig` |

Push from Elite: `bash ~/PsyNova/app/ops/sync_to_optiplex.sh` (Cursor must be quit).

## Firewall

UFW rules added for LAN only (TCP 445/139, UDP 137/138). Enable with `sudo ufw enable` if inactive.
