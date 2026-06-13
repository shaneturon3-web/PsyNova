# PsyNova Server — desktop launcher

Three menu entries (and matching `systemd --user` services) that boot the
PsyNova dev stack on demand and open Chrome (or whatever browser is on
PATH) at the right URL — local for solo work, public for human testers.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     applications menu / activities                  │
│                                                                     │
│   [Ψ] PsyNova Server (Local)        ← starts stack, opens local URL │
│   [Ψ] PsyNova Server (Cloudflare)   ← stack + tunnel, opens public  │
│   [Ψ] PsyNova Server (Stop)         ← kills both                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
   psynova_launcher.sh local|cloudflare|stop
        │
        │ systemctl --user start/stop
        ▼
   psynova-stack.service ──► psynova_stack.sh start
        │  (Vite :5173, Nest :3000, ensures psynova-db container is up)
        │
        │ Requires=
        ▼
   psynova-tunnel.service ──► psynova_tunnel.sh start
        │  (cloudflared quick tunnel, parses public URL,
        │   atomically rewrites ~/.local/state/psynova/url.txt)
        ▼
   browser opens whatever URL is in url.txt
```

## Install (one shot)

```bash
bash ~/PsyNova/app/ops/install_psynova_launcher.sh
```

What it does:

| Source                                           | Destination                                                 |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `app/ops/systemd/psynova-stack.service`          | `~/.config/systemd/user/psynova-stack.service`              |
| `app/ops/systemd/psynova-tunnel.service`         | `~/.config/systemd/user/psynova-tunnel.service`             |
| `app/ops/desktop/psynova-server-local.desktop`   | `~/.local/share/applications/psynova-server-local.desktop`  |
| `app/ops/desktop/psynova-server-cloudflare.desktop` | `~/.local/share/applications/psynova-server-cloudflare.desktop` |
| `app/ops/desktop/psynova-server-stop.desktop`    | `~/.local/share/applications/psynova-server-stop.desktop`   |
| `app/ops/desktop/psynova-icon.svg`               | `~/.local/share/icons/hicolor/scalable/apps/psynova-server.svg` |

The installer also runs `systemctl --user daemon-reload`,
`update-desktop-database`, and `gtk-update-icon-cache`, so the new
entries appear in your menu without logging out.

`__REPO_ROOT__` placeholders in the desktop files are replaced with the
actual `PSYNOVA_REPO_ROOT` (default `~/PsyNova`) at install time. If you
move the repo, re-run the installer.

## Use it

### From the menu

Open your apps menu / activities, type `PsyNova` — three entries appear.

- **PsyNova Server (Local)** — fastest path for solo dev. Starts the
  stack, opens Chrome at <http://localhost:5173>.
- **PsyNova Server (Cloudflare)** — start the stack **and** a Cloudflare
  quick tunnel, opens Chrome at the freshly-minted
  `https://*.trycloudflare.com` URL. Share that URL with testers.
- **PsyNova Server (Stop)** — stops the tunnel, then the stack, no
  browser. Equivalent to:
  ```bash
  systemctl --user stop psynova-tunnel.service psynova-stack.service
  ```

### From the terminal

```bash
# direct shell entry (skips desktop notifications + browser opening)
systemctl --user start psynova-stack.service             # local
systemctl --user start psynova-tunnel.service            # adds public URL
systemctl --user stop  psynova-tunnel.service            # back to local
systemctl --user stop  psynova-stack.service psynova-tunnel.service

# launcher (matches what the menu does — also opens browser)
bash ~/PsyNova/app/ops/psynova_launcher.sh local
bash ~/PsyNova/app/ops/psynova_launcher.sh cloudflare
bash ~/PsyNova/app/ops/psynova_launcher.sh stop
```

### Auto-start at boot (optional)

Lazy mode is the default — the stack only runs when you ask for it. To
have the stack auto-start when you log in (or, with linger, at boot
even before login):

```bash
# enable user-services to run at boot (without you having to log in)
loginctl enable-linger $USER

# auto-start the stack at user-session start
systemctl --user enable psynova-stack.service

# tunnel is opt-in; only enable if you want the public URL up 24/7
systemctl --user enable psynova-tunnel.service
```

To go back to lazy mode:

```bash
systemctl --user disable psynova-tunnel.service psynova-stack.service
loginctl disable-linger $USER       # optional
```

## State, logs, troubleshooting

Everything the launcher writes lives under
`~/.local/state/psynova/` (XDG `$XDG_STATE_HOME`):

```
~/.local/state/psynova/
├── url.txt          ← active URL the launcher opens (local OR public)
├── stack.log        ← psynova_stack.sh output
├── backend.log      ← Nest dev server output (port 3000)
├── frontend.log     ← Vite dev server output  (port 5173)
├── tunnel.log       ← cloudflared output
├── launcher.log     ← psynova_launcher.sh output
├── backend.pid
├── frontend.pid
└── tunnel.pid
```

Useful commands:

```bash
# live status of every layer
bash ~/PsyNova/app/ops/psynova_stack.sh status
bash ~/PsyNova/app/ops/psynova_tunnel.sh status

# follow logs (systemd view)
journalctl --user -u psynova-stack -f
journalctl --user -u psynova-tunnel -f

# follow logs (raw files)
tail -f ~/.local/state/psynova/{stack,backend,frontend,tunnel,launcher}.log

# what URL did the launcher think was active?
cat ~/.local/state/psynova/url.txt
```

### Common issues

| Symptom                                            | Likely cause                                                                                          | Fix                                                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Menu entries don't appear                          | Desktop database wasn't refreshed                                                                     | `update-desktop-database ~/.local/share/applications` and log out/in                                  |
| "PsyNova Server (Local)" opens a blank Chrome tab  | Stack still warming up; URL polled out                                                                | Re-click — second invocation reuses the running stack                                                 |
| `psynova-stack.service` fails to start             | `psynova-db` container missing or unhealthy                                                            | `cd ~/PsyNova/app && docker compose up -d db`                                                        |
| `psynova-tunnel.service` fails                    | `cloudflared` not installed                                                                            | `bash ~/PsyNova/app/ops/start_public_tunnel.sh` (it auto-installs to `~/.local/bin`); retry         |
| Chrome doesn't open                                | No supported browser on `PATH`                                                                        | Set `export PSYNOVA_BROWSER=firefox` (or other) before running the launcher                          |
| Public URL never appears                           | Cloudflared connected but quick-tunnel registration was slow                                          | Retry, or check `~/.local/state/psynova/tunnel.log`                                                  |

## Uninstall

```bash
bash ~/PsyNova/app/ops/install_psynova_launcher.sh --uninstall
```

This stops + disables the services, removes both unit files, removes
all three `.desktop` entries and the icon, then refreshes the
caches. State files in `~/.local/state/psynova/` are kept on purpose
(they're useful for post-mortems) — `rm -rf` them manually if you want
a clean slate.

## How it relates to the existing scripts

| Script                                       | Role                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `app/ops/psynova_stack.sh`                   | The thing systemd actually runs for the stack. Boots Nest + Vite + DB.       |
| `app/ops/psynova_tunnel.sh`                  | The thing systemd runs for the tunnel. Wraps `start_public_tunnel.sh`.       |
| `app/ops/psynova_launcher.sh`                | Tiny glue called by the `.desktop` entries. Only knows `systemctl + Chrome`. |
| `app/ops/start_public_tunnel.sh` (existing)  | Plain `cloudflared --url http://localhost:5173` runner; auto-installs CLI.  |
| `app/ops/free_port_3000.sh` (existing)       | Used by stack script when restarting backend.                                |
| `app/ops/install_psynova_launcher.sh`        | Copies units + desktop files into `~/.config` and `~/.local/share`.          |

So everything a human tester sees ("PsyNova Server (Cloudflare)" → public URL)
falls back to the same mechanics you already use on the command line — the
launcher is just the "make it one click" layer on top.
