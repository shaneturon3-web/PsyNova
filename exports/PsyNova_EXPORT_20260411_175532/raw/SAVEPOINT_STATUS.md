# Savepoint — antes de apagar el equipo

**Fecha de referencia:** 2026-04-10 (ajusta si abres otro día)

## Qué hay en este workspace

| Ruta | Qué es |
|------|--------|
| `virtual-psychology-clinic/` | Plataforma (NestJS backend, frontend Vite, WordPress, Docker) |
| `analista-financiero-clinica-virtual/` | COS — modelo Excel + CSV + PDF de progreso |
| `psynova/` | Rutas cortas: `platform` → `virtual-psychology-clinic`, `cos` → `analista-financiero-clinica-virtual` |
| `psynova/ops/load_dependencies.sh` | Instala npm en backend/frontend con caché en `psynova/lib/npm_cache` |
| `psynova/ops/patch_backend_dist_header.sh` | Parche en contenedor Docker del `dist/*.js` (cuando Docker funcione) |

## Estado técnico recordado

- **Headers mockup / HTTP:** En código fuente (`backend/src`) los tags suelen ir como `MOCKUP-PURPOSE-ONLY`; el **`dist/`** debe alinearse con `npm run build` en `backend/` o con el script de parche en contenedor.
- **Docker:** Si antes fallaba por permisos: usuario en grupo `docker` o `sudo docker compose ...` desde `psynova/platform` (perfil `prod` / `with-api` para el API en `:3000`).
- **PDF informe unificado:** `analista-financiero-clinica-virtual/output/PSYNOVA-PR-001_PROGRESS_REPORT_MERGED_2026-04-10.pdf` (o el nombre con fecha que tengas).

## Al encender de nuevo (rápido)

1. Abrir esta carpeta: `PsyNova Virtual Clinic`
2. Backend local (sin Docker API): `cd virtual-psychology-clinic/backend && npm run start:dev` (puerto 3000; no duplicar con contenedor API).
3. Stack Docker: `cd psynova/platform && docker compose --profile prod up -d --build`
4. COS / Excel: `cd analista-financiero-clinica-virtual && PYTHONPATH=. python -m analista_financiero_clinica_virtual`

## Pendiente habitual

- Portal paciente / UAT (ver `psynova/ops/PLOTTER_QUEUE.md`)
- Docker si aún no tienes permisos resueltos

---

*Archivo generado como “savepoint” para retomar sin perder contexto. Puedes borrarlo o actualizarlo cuando quieras.*
