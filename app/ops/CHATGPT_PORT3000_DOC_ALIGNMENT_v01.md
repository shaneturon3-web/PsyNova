# Alineacion con documento externo EADDRINUSE :3000 (ChatGPT)

[MOCKUP PURPOSE ONLY - NOT REAL DATA]

## Principio compartido

**Un solo dueno del puerto 3000:** API en Docker **o** Nest local (`npm run start:dev`), no ambos.

## Lo que el documento sugiere y como esta el repo

| Sugerencia tipica | Implementacion PsyNova |
|-------------------|-------------------------|
| Perfil Compose para no levantar API por defecto | `backend.profiles: [prod, with-api]` — `docker compose up` **sin** API en :3000 |
| Comando tipo `--profile prod up` | `docker compose --profile prod up -d` (equivale a `--profile with-api`) |
| Guard antes de Nest local | `ops/port_guard_3000.sh` + `npm run start:dev` |
| No matar procesos a ciegas como politica default | `ops/free_port_3000.sh` diagnostica; documentacion desaconseja `fuser -k` rutinario |
| Health check | `curl http://127.0.0.1:3000/api/health` |

## No implementado (a proposito)

- **Segundo servicio `backend-dev` en 3001:** duplicaria build y mantenimiento; el modo dev acordado es **Nest en el host** en :3000 cuando el contenedor API esta apagado, o **solo Docker** con `--profile prod`.
- **systemd unit** en `/etc/`: depende del host; no versionamos unidades globales en el repo.
- **`PORT=3002` local** como fallback permanente: opcion manual si hace falta; el default sigue siendo 3000 con regla de un dueno.

## Referencia

Politica operativa: `ops/PORT_3000_POLICY.md`
