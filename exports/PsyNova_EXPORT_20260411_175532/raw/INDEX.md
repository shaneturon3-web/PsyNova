# Toolbox Cursor — PsyNova Virtual Clinic

Indice maestro de mini-apps y envoltorios. Implementacion viva en `tools/toolbox-cursor/apps/`. La logica pesada sigue en `ops/` (una sola fuente de verdad).

**Tag:** `[MOCKUP PURPOSE ONLY - NOT REAL DATA]`

## Proposito (por que existe)

- Entrada unica para comandos largos sin errores de ruta o de pegado.
- Documentar combinaciones seguras entre herramientas nuevas y existentes.
- Reducir friccion Docker / sudo / puerto 3000 / migraciones DB.

## Tabla de herramientas

| ID | Ruta | Funcion | Origen real |
|----|------|---------|-------------|
| `benchmark-armyknife` | `../benchmark-armyknife/` | Motor protocolo v1: fetch+parse+score+export JSON (URLs) | TypeScript en carpeta (no wrapper) |
| `stack-batch` | `apps/run-stack-batch.sh` | Lote: `up db`, espera `pg_isready`, migracion `password_hash`, opcional `--with-api` | `ops/stack_batch_db_migrate_v01.sh` |
| `migrate-pw` | `apps/run-migrate-password-hash.sh` | Solo migracion SQL contra `psynova-db` | `ops/migrate_db_password_hash.sh` |
| `free-3000` | `apps/run-free-port-3000.sh` | Diagnostico / liberar puerto 3000 | `ops/free_port_3000.sh` |
| `prompt-tail` | `apps/psynova-prompt-tail.sh` | Imprime cierre operativo estandar (recordatorios + handshake) | Texto fijo (no duplica ops) |

## Uso (desde raiz del repo)

```bash
cd "/home/shane/Desktop/PsyNova Virtual Clinic/virtual-psychology-clinic"
bash tools/toolbox-cursor/apps/run-stack-batch.sh
bash tools/toolbox-cursor/apps/run-stack-batch.sh --with-api
bash tools/toolbox-cursor/apps/run-migrate-password-hash.sh
bash tools/toolbox-cursor/apps/run-free-port-3000.sh
bash tools/toolbox-cursor/apps/psynova-prompt-tail.sh
```

## Combinaciones recomendadas

| Secuencia | Cuando | No combinar con |
|-----------|--------|-----------------|
| `stack-batch` | Reinicio / DB nueva / despues de `down -v` | — |
| `migrate-pw` despues de `up -d db` manual | Solo si no usas el lote completo | Ejecutar dos veces el mismo lote sin necesidad |
| `free-3000` → Nest local | Antes de `npm run start:dev` si sospechas conflicto | Docker API en mismo puerto (`--profile with-api`) |
| `stack-batch --with-api` | Validar API en contenedor + health | `npm run start:dev` simultaneo en :3000 |
| `prompt-tail` | Pegar cierre al final de cualquier reporte operativo | — |

## Nuevas herramientas (como registrar)

1. Anadir fila en la tabla superior y seccion de combinaciones si aplica.
2. Preferir envoltorio en `apps/` que llame a `ops/` en lugar de duplicar logica.
3. Actualizar `SHANE Profiles.README` seccion Toolbox Cursor.
4. Marcar `[DECISION]` con fecha si cambia politica operativa.

## Referencias de proyecto

- Politica puerto 3000: `ops/PORT_3000_POLICY.md`
- Migracion SQL: `database/03-alter-users-password-hash.sql`
- **Auditoria externa (par TXT + prompt ChatGPT):** `tools/Shane's Armyknives/` (`PAIR_01_*`, `PAIR_02_*`, `INDEX.txt`)
