# Dofinvest Progress Log

## 2025-12-24
- Observation: Dofapi endpoints appear unreachable (“Failed to fetch”), so live item/recipe retrieval is blocked.
- Decision: switch to an alternative Dofus Retro source (local JSON dump or self-hosted service) to feed search + recipes without relying on Dofapi.
- Proposed path: load a local `items.json` (items + recipes + icons) under `public/` and adapt the client to a local source while keeping the same internal API (search/getRecipe). Icons: use provided URLs or construct from ids if a known pattern exists.

## 2025-12-25
- Implemented a new local data pipeline using the crawlit Dofus dumps (Dofus only, no Touch). Built `webapp/public/data/items.json` with craftable-only items (~3.6k) normalized to the app schema (id/name/level/type/iconUrl/recipe).
- Switched search and recipe hooks to the local client (`localDataClient`) eliminating Dofapi dependency; in-memory search with debounce, recipes from the loaded JSON, cache unchanged.
- OpenSpec updated: removed Dofapi change; new change `add-local-dofus-data-source` validated.

## 2025-12-26
- Rebuilt `items.json` with type-based local icons (no external image hosts) for items/resources to avoid network errors.
- Removed search pagination slice (all matches returned; no hidden items).
- Fixed price modal state usage (`itemPrices`), so stored prices persist across openings.
- Added instructions in `webapp/README.md` for regenerating `items.json` from the crawlit dump without committing the source repo.
