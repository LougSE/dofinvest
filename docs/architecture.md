# Dofinvest - Architecture Documentation

## Executive Summary

Dofinvest is a client-side React SPA that calculates Dofus crafting profitability. It operates entirely offline using local JSON datasets and localStorage for persistence.

## Technology Stack

### Core

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool with SWC |
| React Router | 6.30.1 | Client-side routing |

### Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 3.4.17 | Utility-first CSS |
| shadcn/ui | - | Component library (Radix-based) |
| tailwindcss-animate | 1.0.7 | Animation utilities |

### State & Data

| Technology | Version | Purpose |
|------------|---------|---------|
| TanStack Query | 5.83.0 | Server state management |
| React Hook Form | 7.61.1 | Form handling |
| Zod | 3.25.76 | Schema validation |
| localStorage | Native | Persistence layer |

## Architecture Pattern

### Component-Based SPA

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
├─────────────────────────────────────────────────┤
│  React App                                       │
│  ┌──────────────────────────────────────────┐   │
│  │  Pages (Index, Dashboard, Prices)         │   │
│  ├──────────────────────────────────────────┤   │
│  │  Components (PriceInputModal, Table...)   │   │
│  ├──────────────────────────────────────────┤   │
│  │  Custom Hooks (useRecipes, usePrices...)  │   │
│  ├──────────────────────────────────────────┤   │
│  │  Data Layer (localDataClient, TanStack)   │   │
│  └──────────────────────────────────────────┘   │
│                      │                           │
│                      ▼                           │
│  ┌──────────────────────────────────────────┐   │
│  │  localStorage (prices, analyses, cache)   │   │
│  └──────────────────────────────────────────┘   │
│                      │                           │
│                      ▼                           │
│  ┌──────────────────────────────────────────┐   │
│  │  /public/data/ (items.json, items-129)    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Data Flow

### 1. Dataset Loading (`lib/localDataClient.ts`)

- Loads item data from `/public/data/items.json` (Dofus 2.0) or `items-129.json` (Retro)
- In-memory caching with simple object store
- Returns normalized `DofusItem` objects

### 2. Recipe Management (`hooks/useRecipes.ts`)

- Fetches recipes for selected items from local dataset
- localStorage caching with 7-day TTL
- Concurrent fetch limiting (max 4 parallel requests)

### 3. Price Management (`hooks/usePrices.ts`)

- Stores resource and item prices in localStorage
- Keys: `dofinvest_prices:{server}:{dataset}:{resources|items}`
- Auto-migrates from base dataset when switching versions

### 4. Analysis Persistence

- Last analysis saved to `dofinvest_last_analysis:{server}:{dataset}`
- Contains selected items, results, and quantities
- Auto-restored on page load

## State Management

### No Global State Library

Uses React Context + custom hooks pattern:

- **Prices**: `usePrices()` hook with localStorage persistence
- **Recipes**: `useRecipes()` hook with cache + TTL
- **Search**: `useItemsSearch()` hook with debouncing
- **View State**: Simple "search" | "results" toggle in component state

### localStorage Keys

| Key Pattern | Purpose |
|-------------|---------|
| `dofinvest_prices:{server}:{dataset}:resources` | Resource unit prices |
| `dofinvest_prices:{server}:{dataset}:items` | Item HDV prices |
| `dofinvest_last_analysis:{server}:{dataset}` | Last analysis state |
| `dofinvest_recipe_v2:{dataset}:{itemId}` | Recipe cache with TTL |

## Routing Structure

```
/                   → Index.tsx (Main profitability calculator)
/dashboard          → Dashboard.tsx (Future analytics)
/prices             → Prices.tsx (Bulk price management)
*                   → NotFound.tsx
```

## Component Architecture

### Key Components

| Component | Purpose | Lines |
|-----------|---------|-------|
| `Index.tsx` | Main workflow (search → select → analyze → results) | ~500 |
| `ProfitabilityTable.tsx` | Results display with sorting, expansion | ~750 |
| `PriceInputModal.tsx` | HDV price entry with locking | ~450 |
| `SearchBar.tsx` | Debounced search with tag filters | ~100 |

### shadcn/ui Components

Located in `components/ui/`, includes:
- Dialog, Select, Button, Input, Card
- Toast, Tabs, Accordion, ScrollArea
- Full Radix UI primitive suite

## Performance Patterns

1. **Virtual Scrolling**: 60 items initially, IntersectionObserver for infinite scroll
2. **Concurrent Limiting**: Recipe fetching capped at 4 parallel requests
3. **Memoization**: Heavy use of `useMemo` for filtered lists
4. **Debouncing**: Search inputs debounced in SearchBar
5. **Caching**: Recipe cache with 7-day TTL

## Type System

Core types in `types/dofus.ts`:

```typescript
interface DofusItem {
  id: string;
  name: string;
  level: number;
  type: string;
  iconUrl: string;
  recipe: RecipeIngredient[];
  isCraftable: boolean;
}

interface ProfitabilityResult {
  item: DofusItem;
  costTotal: number;
  hdvPrice: number;
  benefit: number;
  marginPercent: number;
}
```

## Build Configuration

### Vite (`vite.config.ts`)

- SWC for fast compilation (`@vitejs/plugin-react-swc`)
- Path alias: `@/` → `./src/`
- Dev server: port 8080

### TypeScript (`tsconfig.json`)

- Relaxed strict mode (for rapid development)
- Path mapping: `@/*` → `./src/*`
- Project references for app/node separation

### Tailwind (`tailwind.config.ts`)

- Custom colors: `profit`, `loss`, `lime`, `forest`
- Custom fonts: Roboto (sans), Poppins (heading)
- CSS variables for HSL theming
- Dark mode via `.dark` class
