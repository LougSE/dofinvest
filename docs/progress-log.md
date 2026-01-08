# Dofinvest Progress Log

## About
- This log tracks functional and technical changes to Dofinvest, dated and summarized.
- Use it as a quick reference to see what changed (UI/UX, data, logic) and when.
- Add new entries at the bottom with the date and concise bullets (avoid verbosity).

## 2026-01-08
- Modal: hook order fixed (no `isLockedResource` crash), safe keys for grouped resources; build OK.
- Aggregated resources: unit price next to quantity (gray), compact cards; graying clickable preserved (aggregated and per item).
- Item expansions: removed “Recette de craft” header and cost sort button to simplify UI.
- Modal HDV: items sorted with non-locked first (aligned with resources).

## 2026-01-03
- Quantities adjustable only on the results page (no quantity fields in the selection panel). Quantity input restyled to match the theme.
- Price modal locks restored: prefilled values auto-lock with “Modifier” to unlock; locks reset on close.
- Default sort on costs descending: items, detailed recipes, and aggregated resources show highest cost first. Default table sort on margin (%) descending, with “Qté” column (include checkboxes). Aggregated resource cards are clickable to gray/acknowledge (grouped by name to avoid duplicates). Fixed an analysis crash (effect moved after aggregated resource calculation). Removed native number input spinners.
- Analysis UX: include-all toggle, unit prices visible in aggregated resources, decimal quantities removed (rounded), graying of resources in detailed recipes, tag/type filter on search, dedup of resources, resources with no lock prioritized in modal.
- Modal HDV: items sorted with non-locked first. Aggregated resource cards compacted (unit price near quantity, gray), grayed clickable aggregated & per-item.

## 2025-12-29
- Added Retro dataset switch: dropdown to choose Dofus 2.0 vs 1.29. Search and recipes load from `items.json` (2.0) or `items-129.json` (Retro) via dataset-aware hooks/client.
- Normalized Retro dataset from `scrapstuff/fetched_data/items.json` into `items-129.json` (type icons, hashed ids, 1,286 craftables). Added La Baguette des Limbes with Retro recipe.
- Recipes now cache per dataset (`dofinvest_recipe_v2:`) to avoid cross-version contamination; cache resets when switching versions.
- Prices: localStorage keys include dataset; on first Retro load, 2.0 prices are migrated once. Resource/item inputs lock only when explicitly set, not on first keystroke.
- UI: resource & item price inputs lock/grayscale when prefills exist; “Modifier” unlocks them. Aggregated resources sortable and cost-colored.
- Analysis table: per-item “Include” toggle to include/exclude items from aggregated resources; expanded recipes sortable by cost with red gradient; aggregated resources show total cost (red), sortable by cost.

## 2025-12-28
- Resource prices modal: prefills now lock inputs when a cached price exists; “Modifier” unlocks them. Locked fields are visually grayed. Lock state resets on close but honors manual unlock while open.
- Aggregated resources: cost gradient tweaked; quantities emphasized; sorting toggle by cost (asc/desc).
- Saved analyses: button in the results view to save the current analysis and list saved entries (in-session) with items and timestamps.
- Fixed crashes: removed duplicate helpers, added missing imports (`cn`), builds clean.

## 2025-12-27
- Icons: confirmed Ankama CDN unreachable; shipped type-based local icons as interim (bow, sword/dagger, hat, cape, ring, amulet, belt, boots, wand, staff, resource, default). `items.json` now references local icons; external fetch errors resolved.
- Search: removed result slicing; all matches shown. Minimum 2 chars kept to avoid huge renders.
- Analysis table: added inline editable HDV prices, recalculating benefit/margin in place. Added aggregated resources summary with cost-based gradient and sortable cost order.
- Modal: fixed undefined `hdvPrices`, ensured dialog description, avoided remount loops; price inputs respect stored values. Price reset available.
- Data source: kept crawlit repo ignored via `.gitignore`; `items.json` regenerated without bundling source repo. README documents regeneration steps.
- Outstanding: real icons require a working CDN or bundling actual assets; type icons remain the fallback until a live source is provided.

## 2025-12-26
- Rebuilt `items.json` with type-based local icons (no external image hosts) for items/resources to avoid network errors.
- Removed search pagination slice (all matches returned; no hidden items).
- Fixed price modal state usage (`itemPrices`), so stored prices persist across openings.
- Added instructions in `webapp/README.md` for regenerating `items.json` from the crawlit dump without committing the source repo.

## 2025-12-25
- Implemented a new local data pipeline using the crawlit Dofus dumps (Dofus only, no Touch). Built `webapp/public/data/items.json` with craftable-only items (~3.6k) normalized to the app schema (id/name/level/type/iconUrl/recipe).
- Switched search and recipe hooks to the local client (`localDataClient`) eliminating Dofapi dependency; in-memory search with debounce, recipes from the loaded JSON, cache unchanged.
- OpenSpec updated: removed Dofapi change; new change `add-local-dofus-data-source` validated.

## 2025-12-24
- Observation: Dofapi endpoints appear unreachable (“Failed to fetch”), so live item/recipe retrieval is blocked.
- Decision: switch to an alternative Dofus Retro source (local JSON dump or self-hosted service) to feed search + recipes without relying on Dofapi.
- Proposed path: load a local `items.json` (items + recipes + icons) under `public/` and adapt the client to a local source while keeping the same internal API (search/getRecipe). Icons: use provided URLs or construct from ids if a known pattern exists.
