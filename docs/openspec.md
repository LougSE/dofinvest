# Dofinvest Openspec (Dofapi Intégration)

## Portée
Décrire l’intégration Dofapi, les contrats de données et les points d’extension front (hooks/clients) pour remplacer les mocks et activer la rentabilité réelle.

## Environnement
- Base API : `VITE_DOFAPI_BASE` (défaut `https://dofapi.fr`).
- Headers : none requis. Gérer CORS via fetch standard.
- Timeouts : 10s par requête, abortable.
- Retries légers : 1 retry sur codes 429/5xx avec backoff 500ms.

## Modèles (TypeScript)
- `Item { id, name, level, type, icon: string, recipe?: RecipeIngredient[] }`
- `RecipeIngredient { itemId, quantity }`
- `RecipeResource { id, name, iconUrl, totalQuantity, unitPrice, totalCost }`
- `PriceCache { resources: Record<id, number>; items: Record<id, number>; server: string; updatedAt }`

## Endpoints Dofapi
- `GET /items?name=<q>&page=<n>&size=<s>`
  - Filtre `craftable` côté client: garder items avec `recipe` définie.
  - Réponse: `{ items: Item[], total, page, size }` (si API renvoie un tableau simple, envelopper côté client).
- `GET /items/{id}`
  - Détails item (nom, niveau, type, icon, recette éventuelle).
- `GET /items/{id}/recipe`
  - Tableau `RecipeIngredient[]`.
- `GET /items/{id}/image`
  - PNG 64x64 pour l’icône. Préférer `item.icon` si déjà fourni.

## Flots
1) **Recherche** : `useItemsSearch(query, craftableOnly, page)` → debounce 300ms, abort sur nouvelle saisie, stocker résultats en mémoire courte.
2) **Sélection** : multi-select d’items depuis la liste.
3) **Recettes** : pour chaque `itemId` sélectionné, `useRecipe(itemId)` →
   - lecture cache localStorage/IndexedDB (`dofinvest_recipe_v1:{id}`), sinon fetch `/items/{id}/recipe` (fallback `/items/{id}` si recette incluse).
   - TTL suggéré: 7 jours.
4) **Agrégation** : fusionner recettes sélectionnées, sommer `totalQuantity` par resourceId.
5) **Prix** :
   - Ressources: `localStorage key dofinvest_prices:{server}:resources`.
   - Items HDV: `dofinvest_prices:{server}:items`.
   - Formulaires préremplis depuis cache; bouton “Sauver” réécrit le cache.
6) **Calcul** : pour chaque item → `costTotal = Σ (qty * unitPrice)`, `benefit = hdv - costTotal`, `margin = benefit / hdv`.
7) **Affichage** : table triable, détails de recette expand, stats globales, export CSV.
8) **Fallback** : si réseau KO → utiliser caches; afficher toast et badge “mode offline”.

## Clients/Hooks prévus
- `createDofapiClient(baseUrl)` avec méthodes `searchItems`, `getItem`, `getRecipe`, `getImageUrl(id)`.
- `useItemsSearch({ query, craftableOnly, page, pageSize })` → `{ data, isLoading, error, hasMore, refetch }`.
- `useRecipe(itemId)` → `{ recipe, isLoading, error, fromCache }`.
- `usePrices(server)` → `{ resourcePrices, itemPrices, savePrices, resetPrices }` (localStorage).

## Règles de cache
- Recettes/détails: localStorage ou IndexedDB (si besoin taille >5MB). Clé versionnée `v1`.
- Prix: localStorage par serveur. Validation: valeurs numériques > 0.
- Images: laisser le cache navigateur gérer (`<img src=/items/{id}/image>`).

## Erreurs & UX
- États: loading (squelettes), empty, error (toast + CTA retry), offline badge.
- Non-craftables: filtrer ou marquer “non craftable”.
- Limiter concurrence: max 4 requêtes recette simultanées; queue sinon.
- Pagination: garder `pageSize` 50–100 pour recherche.

## Traces & suivi
- Cette openspec est la source de vérité pour l’intégration Dofapi et le cache local. Toute évolution d’API ou de contrat (types/hooks/clefs de cache) doit être reflétée ici et dans les types TS.
