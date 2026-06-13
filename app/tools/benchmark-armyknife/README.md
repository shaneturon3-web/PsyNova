# Benchmark Armyknife Protocol v1.0

**Autor (concepto y arquitectura):** Shane  
**Código:** motor TypeScript ejecutable bajo `tools/benchmark-armyknife/`.

## Qué hace (v1)

- **Fetch** ligero (`fetch`, sin Puppeteer por defecto) + caché en memoria.
- **Parse** HTML → árbol heurístico (`cheerio`).
- **Scores:** power, popularity (stub + npm downloads opcional), performance (latencia), costo (heurística texto).
- **Total** con pesos 0.35 / 0.25 / 0.20 / 0.20.
- **Export:** tabla Markdown + JSON (`benchmark_results`, `selected_tree`, `meta`).
- **UI lógica:** `SelectionState` + filtro de árbol (checkboxes descritos en especificación).

## Comandos

```bash
cd tools/benchmark-armyknife
npm install
npm run build
node dist/index.js https://example.com
```

**Solo tema (CSS / hojas de estilo / pistas de stack, sin árbol DOM completo):**

```bash
node dist/index.js --theme https://medipsy.ca/our-team
# acepta URL sin esquema:  node dist/index.js --theme medipsy.ca/our-team
```

### Comando `BENCHY` (shell)

Tras `npm run build`, en `~/.bashrc` (o tu shell) añade **una** línea con la ruta real a este repo:

```bash
source "/ruta/a/tools/benchmark-armyknife/BENCHY.snippet.sh"
```

Eso define la función **`BENCHY`** (equivalente práctico a un alias; los alias puros de bash no se expanden bien fuera de sesiones interactivas). Uso: `BENCHY https://example.com` o `BENCHY "https://a.com" "https://b.com"`. Solo tema: `BENCHY --theme medipsy.ca/our-team`.

## Escritorio (UI local + icono)

- **Servidor UI:** `desktop-shell/server.cjs` sirve una página en `http://127.0.0.1:18742/` (puerto `ARMYK_DESKTOP_PORT`). Incluye zona de **arrastre** de enlaces/archivos, **selector de archivos** y extracción de URLs desde texto, **PDF** y **DOCX** (vía `pdf-parse` / `mammoth` en el proceso Node).
- **Lanzador:** `./desktop-shell/launch-desktop.sh` (o `cd desktop-shell && npm start`).
- **Icono estilo “drop box”:** `desktop-shell/assets/icon.png` (regenerable con `python3 desktop-shell/scripts/write_icon_png.py`).
- **Linux (una vez):** `./install-linux-once.sh` instala el `.desktop` en el escritorio, el icono en `~/.local/share/icons/...` e intenta añadir el lanzador a **favoritos de GNOME Shell** (barra). Otros entornos: fijar manualmente.
- **ZIP emparejado:** desde esta carpeta, `scripts/package-bundle.sh` genera `../benchmark-armyknife-bundle-YYYYMMDD.zip` (excluye `node_modules`; tras descomprimir: `npm install` en raíz y en `desktop-shell`, `npm run build` en raíz).

Si falla TLS (`unable to get local issuer certificate`), solo en entorno de laboratorio:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node dist/index.js https://example.com
```

## Especificación completa

Ver `SPEC_BENCHMARK_ARMYKNIFE_PROTOCOL_v1.md`.

## Tag

`[MOCKUP PURPOSE ONLY - NOT REAL DATA]`
