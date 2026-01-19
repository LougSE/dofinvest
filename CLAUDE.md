# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Project Overview

Dofinvest is a React web application that calculates crafting profitability for the Dofus MMORPG. It helps players determine which items are profitable to craft by comparing resource costs against market prices (HDV). The app works entirely offline using local JSON datasets generated from the Dofus encyclopedia.

**Key Features:**
- Multi-version support: Dofus 2.0 and Dofus 1.29 (Retro)
- Search and filter craftable items (with type filters and tags)
- Calculate crafting profitability by entering HDV prices
- Save and restore analyses per server and dataset version
- Offline-capable with localStorage caching

## Development Commands

### Main Webapp (`/webapp`)

```bash
# Install dependencies
npm install

# Development server (runs on http://localhost:8080)
npm run dev

# Production build
npm run build

# Development build (with source maps)
npm run build:dev

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Architecture

### Tech Stack
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite (with SWC for fast compilation)
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** React hooks + localStorage for persistence
- **Data Fetching:** TanStack Query (React Query)

### Core Data Flow

1. **Dataset Loading** (`lib/localDataClient.ts`):
   - Loads item data from `/public/data/items.json` (Dofus 2.0) or `/public/data/items-129.json` (Retro)
   - In-memory caching with simple object store
   - Returns normalized `DofusItem` objects with id, name, level, type, iconUrl, recipe, isCraftable

2. **Recipe Management** (`hooks/useRecipes.ts`):
   - Fetches recipes for selected items from local dataset
   - Implements localStorage caching with 7-day TTL
   - Concurrent fetch limiting (max 4 parallel requests)
   - Returns `RecipeIngredient[]` mapping per item ID

3. **Price Management** (`hooks/usePrices.ts`):
   - Stores resource and item prices in localStorage per server + dataset version
   - Keys: `dofinvest_prices:{server}:{dataset}:resources` and `:items`
   - Auto-migrates from base "20" dataset when switching versions
   - Provides save/reset operations

4. **Analysis Persistence**:
   - Last analysis saved to `dofinvest_last_analysis:{server}:{dataset}`
   - Contains selected items, results, and quantities
   - Auto-restored on page load

### Directory Structure

```
webapp/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui primitives (Button, Card, etc.)
│   │   ├── Header.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ItemCard.tsx
│   │   ├── SelectionPanel.tsx
│   │   ├── PriceInputModal.tsx
│   │   └── ProfitabilityTable.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useItemsSearch.ts   # Search/filter items
│   │   ├── useRecipes.ts       # Fetch and cache recipes
│   │   └── usePrices.ts        # Manage HDV prices
│   ├── lib/              # Utility libraries
│   │   ├── localDataClient.ts  # Dataset loading
│   │   ├── dofapi.ts          # Legacy API client (unused)
│   │   └── utils.ts           # Tailwind helpers
│   ├── pages/            # Route components
│   │   ├── Index.tsx          # Main profitability calculator
│   │   ├── Dashboard.tsx      # Future analytics dashboard
│   │   ├── Prices.tsx         # Bulk price management
│   │   └── NotFound.tsx
│   ├── types/            # TypeScript definitions
│   │   └── dofus.ts          # DofusItem, Resource, ProfitabilityResult
│   ├── data/             # Mock data for development
│   └── App.tsx           # Root component with routing
├── public/
│   ├── data/
│   │   ├── items.json        # Dofus 2.0 dataset (all craftable items)
│   │   └── items-129.json    # Dofus 1.29 Retro dataset
│   └── icons/               # Local item icons cache
└── [config files]
```

### Key Components

- **`Index.tsx`**: Main page implementing the complete workflow:
  - Search & filter items with tag support
  - Multi-select items for analysis
  - Virtual scrolling for performance (60 items/page, infinite scroll)
  - Opens `PriceInputModal` when "Analyzer" clicked
  - Displays results in `ProfitabilityTable`
  - Two view states: "search" and "results"

- **`PriceInputModal.tsx`**: Complex modal for HDV price entry:
  - Auto-generates unique resource list from selected items
  - Pre-fills prices from localStorage
  - Supports resource quantity editing
  - Allows item HDV price locking (min/avg/max)
  - Persists all prices on confirm

- **`ProfitabilityTable.tsx`**: Results display with:
  - Sortable columns (benefit, margin%, cost, etc.)
  - Expandable resource breakdown per item
  - Editable quantities (recalculates on change)
  - Visual profit/loss indicators (green/red)
  - Export and save functionality

### Styling & Theme

- **Tailwind Config** (`tailwind.config.ts`):
  - Custom colors: `profit`, `loss`, `lime`, `forest`
  - CSS variables for theming via HSL colors
  - Font families: Roboto (sans), Poppins (heading)
  - shadcn/ui integration with `tailwindcss-animate`

- **Global Styles** (`index.css`):
  - Dofus-inspired theme with blue/gold gradients
  - Dark mode support via `.dark` class
  - Custom card styles (`.card-dofus`)
  - Font family imports (Google Fonts)

### Type System

Key types in `types/dofus.ts`:
- `DofusItem`: Core item structure with id, name, level, type, iconUrl, recipe, isCraftable
- `RecipeIngredient`: Recipe component with itemId, name, quantity, iconUrl
- `Resource`: Computed resource with totalQuantity, unitPrice, totalCost
- `ProfitabilityResult`: Analysis result with costTotal, hdvPrice, benefit, marginPercent

### Data Management

**Dataset Generation:**
The `items.json` files are generated using the `crawlit-dofus-encyclopedia-parser` tool (kept in `.gitignore`). To regenerate:

1. Clone `crawlit-dofus-encyclopedia-parser` at project root (not in git)
2. Run the Python normalization script (see `docs/progress-log.md` for details)
3. Output goes to `webapp/public/data/items.json` (craftables only)
4. Commit only the JSON file, not the crawler repo

**Important:** The app no longer uses Dofapi.fr API calls; everything runs from local JSON datasets.

### Performance Patterns

1. **Virtual Scrolling**: Index page loads 60 items initially, loads more on scroll (IntersectionObserver)
2. **Concurrent Limiting**: Recipe fetching limited to 4 parallel requests
3. **Memoization**: Heavy use of `useMemo` for filtered lists and computed values
4. **Debouncing**: Search inputs debounced (implemented in SearchBar)
5. **Caching**: Recipe cache in localStorage with 7-day TTL

### State Management Patterns

- **No global state library**: Uses React Context + hooks
- **localStorage as persistence layer**:
  - Prices per server + dataset version
  - Last analysis auto-restore
  - Recipe cache with TTL
- **Quantities stored as Record<itemId, number>**: Synced with selected items
- **View state**: Simple "search" | "results" toggle

## Common Tasks

### Adding a New Item Filter
1. Update `tagOptions` array in `Index.tsx` with new label/value
2. Filter logic is in `filteredItems` useMemo (checks `item.type.toLowerCase()`)
3. Filter is case-insensitive substring match

### Changing Price Storage Keys
Prices use this pattern: `dofinvest_prices:{server}:{dataset}:{resources|items}`
Update `RESOURCE_KEY` and `ITEM_KEY` functions in `hooks/usePrices.ts`

### Adding New Dataset Version
1. Add new JSON file to `public/data/` (e.g., `items-touch.json`)
2. Update `datasetVersion` type from `"20" | "129"` to include new version
3. Update Select options in Index.tsx
4. Update all hooks to handle new dataset key (useRecipes, usePrices, useItemsSearch)

### Testing Recipe Calculation
Profitability formula in `Index.tsx` > `handleConfirmPrices`:
```typescript
costTotal = sum(resource.unitPrice * ingredient.quantity * itemQuantity)
revenue = hdvPrice * itemQuantity
benefit = revenue - costTotal
marginPercent = (benefit / revenue) * 100
```

### Debugging localStorage Issues
Common keys to inspect:
- `dofinvest_prices:Abrak:20:resources`
- `dofinvest_prices:Abrak:20:items`
- `dofinvest_last_analysis:Abrak:20`
- `dofinvest_recipe_v2:20:{itemId}`

### Working with shadcn/ui Components
Components in `components/ui/` are from shadcn/ui library. To add new ones:
```bash
npx shadcn-ui@latest add [component-name]
```
They're customizable via Tailwind classes and theme variables.

## Code Conventions

- **File naming**: PascalCase for components, camelCase for utilities/hooks
- **Export style**: Default exports for pages/components, named exports for utilities
- **Type definitions**: Centralized in `types/` directory
- **Error handling**: Try-catch with console.error, graceful fallbacks
- **Comments**: Minimal; prefer self-documenting code
- **Formatting**: Handled by ESLint + Prettier (if configured)

## Important Notes

- The app is designed for the Abrak server by default but supports any server name
- Icon URLs in items.json point to Dofapi CDN or local cache
- No backend API required; fully client-side
- The crawler repo (`crawlit-dofus-encyclopedia-parser`) should never be committed
- Price data is never shared between dataset versions unless explicitly migrated
- All monetary values are in Dofus kamas (integers)
