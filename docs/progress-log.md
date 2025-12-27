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

## 2025-12-27
- Icons: confirmed Ankama CDN unreachable; decided to ship type-based local icons as interim (arc, épée/dague, chapeau, cape, anneau, amulette, ceinture, bottes, baguette, bâton, ressource, default). `items.json` now references local icons; external fetch errors resolved.
- Search: removed result slicing; all matches shown. Minimum 2 chars kept to avoid huge renders.
- Analysis table: added inline editable HDV prices, recalculating benefit/margin in place. Added aggregated resources summary with cost-based gradient and sortable cost order.
- Modal: fixed undefined `hdvPrices`, ensured dialog description, avoided remount loops; price inputs respect stored values. Price reset available.
- Data source: kept crawlit repo ignored via `.gitignore`; `items.json` regenerated without bundling source repo. README documents regeneration steps.
- Outstanding: real icons require a working CDN or bundling actual assets; type icons remain the fallback until a live source is provided.

## 2025-12-28
- Resource prices modal: prefills now lock inputs when a cached price exists; “Modifier” unlocks them. Locked fields are visually grayed. Lock state resets on close but honors manual unlock while open.
- Aggregated resources: cost gradient tweaked; quantities emphasized; sorting toggle by cost (asc/desc).
- Saved analyses: button in the results view to save the current analysis and list saved entries (in-session) with items and timestamps.
- Fixed crashes: removed duplicate helpers, added missing imports (`cn`), builds clean.

## 2025-12-29
- Added Retro dataset switch: dropdown to choose Dofus 2.0 vs 1.29. Search and recipes load from `items.json` (2.0) or `items-129.json` (Retro) via dataset-aware hooks/client.
- Normalized Retro dataset from `scrapstuff/fetched_data/items.json` into `items-129.json` (type icons, hashed ids, 1,286 craftables). Added La Baguette des Limbes with Retro recipe.
- Recipes now cache per dataset (`dofinvest_recipe_v2:`) to avoid cross-version contamination; cache resets when switching versions.
- Prices: localStorage keys include dataset; on first Retro load, 2.0 prices are migrated once. Resource/item inputs lock only when explicitly set, not on first keystroke.
- UI: resource & item price inputs lock/grayscale when prefills exist; “Modifier” unlocks them. Aggregated resources sortable and cost-colored.
- Analysis table: per-item “Inclure” toggle to include/exclude items from aggregated resources; expanded recipes sortable by cost with red gradient; aggregated resources show total cost (red), sortable by cost.

## 2025-12-30
- Quantités ajustables uniquement dans la page de résultats (plus de champs de quantité dans le panneau de sélection). Champ quantité re-stylé pour coller au thème.
- Verrouillage des prix restauré dans le modal : les valeurs préremplies se verrouillent avec bouton “Modifier”, reset des locks à la fermeture.
- Tri par défaut des coûts en décroissant : tableau des items, recettes détaillées et ressources agrégées affichent les coûts du plus élevé au plus faible. Par défaut la table classe sur la marge (%) en décroissant, avec colonne dédiée "Qté" (cases à cocher pour inclure). Les cartes de ressources agrégées sont cliquables pour griser/valider visuellement les ressources déjà achetées. Fix d’un crash de la page d’analyse (effet déplacé après calcul des ressources agrégées).
