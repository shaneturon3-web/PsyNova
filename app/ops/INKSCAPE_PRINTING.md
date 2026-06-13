# Inkscape printing with plotter

## Page sizes

Bundled `pages.csv` includes Arch A–E for large-format work:

- Arch A: 9 × 12 in
- Arch B: 12 × 18 in
- Arch C: 18 × 24 in
- Arch D: 24 × 36 in
- Arch E: 36 × 48 in

In Inkscape: **File → Document Properties → Page → Custom size** (or pick from list).

## Print to plotter

1. Install plotter queue: `bash ~/PsyNova/app/ops/install_printer_plotter.sh --discover` then configure
2. **File → Print** → select plotter queue (e.g. `Plotter`)
3. Match document size to media loaded in plotter

## Print to Xerox 6130N

```bash
bash ~/PsyNova/app/ops/install_printer_xerox_6130.sh
```

**File → Print** → `Phaser-6130N` for letter/A4 documents.

## PDF fallback

For wide-format jobs when direct print fails:

1. **File → Save As → PDF**
2. Print PDF from system viewer: `lp -d Plotter document.pdf`

## Restore config on new machine

```bash
bash ~/PsyNova/app/ops/install_inkscape.sh
# or: bash ~/PsyNova/app/ops/apply_inkscape_config.sh smb://.../InkscapeConfig
```
