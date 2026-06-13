#!/usr/bin/env bash
# Apply compliance-gateway files from the repository root. Backups: .pre-compliance-gateway/<stamp>/
# Entry: `app.js` re-exports `init` from `compliance-gateway.js` so `main.js` can run i18n before bootstrap.
set -euo pipefail

ROOT="${1:-$(pwd)}"
PATCH_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$ROOT/.pre-compliance-gateway/$STAMP"

mkdir -p "$BACKUP_DIR"

backup_file(){ local rel="$1"; if [ -f "$ROOT/$rel" ]; then mkdir -p "$BACKUP_DIR/$(dirname "$rel")"; cp "$ROOT/$rel" "$BACKUP_DIR/$rel"; fi; }
install_file(){ local rel="$1"; mkdir -p "$ROOT/$(dirname "$rel")"; cp "$PATCH_DIR/$rel" "$ROOT/$rel"; }

backup_file "app/frontend/src/app.js"
backup_file "app/frontend/src/app-legacy.js"
backup_file "app/frontend/src/styles.css"
backup_file "app/frontend/src/main.js"
backup_file "app/backend/src/app.module.ts"
backup_file "app/backend/src/main.ts"
backup_file "app/frontend/.env.example"
backup_file "app/backend/.env.example"

install_file "app/frontend/src/compliance-gateway.js"
install_file "app/frontend/src/compliance-gateway.css"
install_file "app/backend/src/vendor-links/vendor-links.service.ts"
install_file "app/backend/src/vendor-links/vendor-links.controller.ts"
install_file "app/backend/src/vendor-links/vendor-links.module.ts"
install_file "docs/GITHUB_NOTE_COMPLIANCE_GATEWAY.md"

cat > "$ROOT/app/frontend/src/app.js" <<'JS'
import { init as initLegacy } from "./app-legacy.js";
/**
 * Shell router: legacy = app-legacy.js; gateway = compliance + portal. Default: legacy.
 */
export async function init() {
  const mode = import.meta.env.VITE_SPA_MODE || "legacy";
  if (mode === "gateway") {
    await import("./compliance-gateway.css");
    const m = await import("./compliance-gateway.js");
    return m.init();
  }
  return initLegacy();
}
JS

cat >> "$ROOT/app/frontend/.env.example" <<'ENV'

# Compliance gateway vendor URLs — public redirect/embed destinations only.
# Do not put secrets here.
VITE_VENDOR_BOOKING_URL=
VITE_VENDOR_TELEHEALTH_URL=
VITE_VENDOR_FORMS_URL=
VITE_VENDOR_DOCUMENTS_URL=
VITE_VENDOR_BILLING_URL=
VITE_PRIVACY_URL=
ENV

cat >> "$ROOT/app/backend/.env.example" <<'ENV'

# Compliance gateway vendor URLs — public redirect/embed destinations only.
# Do not put API keys or secrets here.
VENDOR_BOOKING_URL=
VENDOR_TELEHEALTH_URL=
VENDOR_FORMS_URL=
VENDOR_DOCUMENTS_URL=
VENDOR_BILLING_URL=
PRIVACY_URL=
ENV

python3 - "$ROOT/app/backend/src/app.module.ts" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
text = path.read_text()
if "VendorLinksModule" in text:
    raise SystemExit(0)

lines = text.splitlines()
insert_at = 0
for i, line in enumerate(lines):
    if line.startswith("import "):
        insert_at = i + 1
lines.insert(insert_at, "import { VendorLinksModule } from './vendor-links/vendor-links.module';")
text = "\n".join(lines) + "\n"
if re.search(r"\n    HealthModule,\n  \],", text):
    text = re.sub(
        r"(\n    HealthModule,)\n(  \],)",
        r"\1\n    VendorLinksModule,\n\2",
        text,
        count=1,
    )
else:
    marker = "imports: ["
    idx = text.find(marker)
    if idx != -1:
        text = text[: idx + len(marker)] + "\n    VendorLinksModule,\n" + text[idx + len(marker) :]
    else:
        text += "\n// TODO: Add VendorLinksModule to the AppModule imports array manually.\n"
path.write_text(text)
PY

python3 - "$ROOT/app/backend/src/main.ts" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()
if "X-Content-Type-Options" in text:
    raise SystemExit(0)
needle = "const app = await NestFactory.create(AppModule);"
block = """const app = await NestFactory.create(AppModule);
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });"""
if needle in text:
    text = text.replace(needle, block, 1)
else:
    text += "\n// TODO: Add security headers in bootstrap().\n"
path.write_text(text)
PY

mkdir -p "$ROOT/.pre-compliance-gateway"
echo "$BACKUP_DIR" > "$ROOT/.pre-compliance-gateway/LATEST_BACKUP"

echo "Compliance gateway patch applied."
echo "Backup created at: $BACKUP_DIR"
echo "Review docs/GITHUB_NOTE_COMPLIANCE_GATEWAY.md before committing."
