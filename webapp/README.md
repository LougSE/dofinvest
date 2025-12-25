# Dofinvest

Calculateur de rentabilité pour le craft Dofus (React + Vite + TypeScript + Tailwind + shadcn-ui).

## Getting Started

Prerequisites: Node.js + npm.

```
npm install
npm run dev
```

Open http://localhost:5173.

## Scripts
- `npm run dev` — serveur de développement Vite.
- `npm run build` — build de production.
- `npm run build:dev` — build en mode development.
- `npm run preview` — prévisualiser le build.
- `npm run lint` — lint ESLint.

## Données locales
- Source : dump Dofus (hors Touch) depuis `crawlit-dofus-encyclopedia-parser`.
- Fichier consommé : `public/data/items.json` (craftables uniquement, champs normalisés : id, name, level, type, iconUrl, recipe, isCraftable).

### Régénérer `items.json`
1. Cloner (hors repo) `crawlit-dofus-encyclopedia-parser` à la racine du projet.
2. Laisser le dossier ignoré (il est dans `.gitignore`).
3. Exécuter le script Python utilisé (voir `docs/progress-log.md`) pour fusionner/normaliser les craftables Dofus en `webapp/public/data/items.json`.
4. Commiter uniquement `items.json` (et les icônes locales si besoin), pas le repo crawlit.

## Structure
- `src/` : code applicatif (pages, components, hooks, lib).
- `public/` : assets statiques et dataset local (`data/items.json`).

## Notes
- L’app fonctionne hors ligne avec le dataset local (plus de dépendance Dofapi).
- Icônes utilisées depuis les URLs fournies dans le dump.
