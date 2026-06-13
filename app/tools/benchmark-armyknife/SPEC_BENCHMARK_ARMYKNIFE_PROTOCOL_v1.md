# Benchmark Armyknife Protocol v1.0 — especificación canónica

**Autor (diseño conceptual + arquitectura):** Shane  
**Implementación código:** `tools/benchmark-armyknife/` (TypeScript, motor v1 ejecutable)

Tag: `[MOCKUP PURPOSE ONLY - NOT REAL DATA]`

El texto completo de la especificación entregado en sesión (objetivos, capas INPUT→EXPORT, pesos de score, motor de popularidad, extractor DOM, checkbox engine, export JSON, extensión futura) es la **fuente de verdad conceptual**. Este archivo permanece como referencia; el código implementa un **subconjunto mínimo** ampliable (`api_adapter`, `tool_adapter`, Puppeteer opcional, SimilarWeb, etc. = v1.1+).

## Peso compuesto (implementado en `core/scorer.ts`)

`TOTAL = POWER×0.35 + POPULARITY×0.25 + PERFORMANCE×0.20 + COST×0.20`

## Principio “Armyknife thinking”

No es un dashboard: pipeline de **corte en capas** (fetch liviano → parse → score → árbol → selección → JSON).

## Autoría

Concepto y arquitectura del sistema **Benchmark Armyknife Protocol**: Shane.
