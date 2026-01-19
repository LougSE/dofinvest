# Dofinvest - Project Overview

## Purpose

Dofinvest is a React web application that calculates crafting profitability for the **Dofus MMORPG**. It helps players determine which items are profitable to craft by comparing resource costs against market prices (HDV - Hôtel des Ventes).

## Key Features

- **Multi-version support**: Dofus 2.0 and Dofus 1.29 (Retro)
- **Search and filter** craftable items with type filters and tags
- **Calculate crafting profitability** by entering HDV prices
- **Save and restore analyses** per server and dataset version
- **Offline-capable** with localStorage caching

## Tech Stack Summary

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.8.3 |
| Build Tool | Vite + SWC | 5.4.19 |
| Styling | Tailwind CSS + shadcn/ui | 3.4.17 |
| Routing | React Router DOM | 6.30.1 |
| Data | TanStack Query + localStorage | 5.83.0 |

## Architecture Type

**Component-based Single Page Application (SPA)**

- No backend server required
- All data loaded from local JSON datasets
- Client-side state management with custom hooks
- localStorage for persistence across sessions

## Repository Structure

```
dofinvest/
├── webapp/              # Main React application
│   ├── src/            # Source code
│   └── public/         # Static assets & data
├── docs/               # Documentation
├── openspec/           # Spec-driven development
└── _bmad/              # BMad Method workflows
```

## Target Users

Dofus MMORPG players who want to:
- Find profitable items to craft
- Track resource and item prices
- Optimize their in-game economic activities

## Server Support

Default server: **Abrak** (configurable to any server name)

## Data Sources

- `/public/data/items.json` - Dofus 2.0 craftable items (~3.6k)
- `/public/data/items-129.json` - Dofus 1.29 Retro items

Generated from the Dofus encyclopedia using `crawlit-dofus-encyclopedia-parser`.
