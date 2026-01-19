# Dofinvest - Source Tree Analysis

## Project Root Structure

```
dofinvest/
├── webapp/                    # 🎯 Main React application
├── docs/                      # 📄 Documentation (you are here)
├── openspec/                  # 📋 Spec-driven development config
├── _bmad/                     # 🔧 BMad Method workflows
├── _bmad-output/              # 📁 BMad generated artifacts
├── crawlit-dofus-encyclopedia-parser/  # 🔄 Data generation tool (gitignored)
├── scrapstuff/                # 🗂️ Scratch/temporary files
├── CLAUDE.md                  # 🤖 AI assistant instructions
└── AGENTS.md                  # 📝 Agent guidelines
```

## Webapp Source Structure

```
webapp/
├── src/                       # Source code root
│   ├── components/            # React components
│   │   ├── ui/               # 🎨 shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ... (40+ components)
│   │   │
│   │   ├── Header.tsx         # App header/navigation
│   │   ├── SearchBar.tsx      # Item search with filters
│   │   ├── ItemCard.tsx       # Individual item display
│   │   ├── ItemGrid.tsx       # Grid layout for items
│   │   ├── SelectionPanel.tsx # Selected items panel
│   │   ├── PriceInputModal.tsx    # 📝 HDV price entry (14KB)
│   │   └── ProfitabilityTable.tsx # 📊 Results table (27KB)
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useItemsSearch.ts  # Search/filter items
│   │   ├── useRecipes.ts      # Recipe fetching + caching
│   │   ├── usePrices.ts       # Price persistence
│   │   ├── use-mobile.tsx     # Mobile detection
│   │   └── use-toast.ts       # Toast notifications
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── localDataClient.ts # 📦 Dataset loading
│   │   ├── dofapi.ts          # (Legacy) API client
│   │   └── utils.ts           # Tailwind helpers (cn)
│   │
│   ├── pages/                 # Route components
│   │   ├── Index.tsx          # 🏠 Main calculator (15KB)
│   │   ├── Dashboard.tsx      # 📈 Analytics (future)
│   │   ├── Prices.tsx         # 💰 Bulk price management
│   │   └── NotFound.tsx       # 404 page
│   │
│   ├── types/                 # TypeScript definitions
│   │   └── dofus.ts           # Core domain types
│   │
│   ├── data/                  # Mock/development data
│   │   └── mockItems.ts
│   │
│   ├── App.tsx                # Root component + routing
│   ├── App.css                # Global app styles
│   ├── main.tsx               # Entry point
│   ├── index.css              # Tailwind base + theme
│   └── vite-env.d.ts          # Vite type declarations
│
├── public/                    # Static assets
│   ├── data/                  # 📊 Item datasets
│   │   ├── items.json         # Dofus 2.0 (~2.4MB, ~3.6k items)
│   │   └── items-129.json     # Dofus 1.29 Retro (~890KB)
│   ├── icons/                 # Local icon cache
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript config (references)
├── tsconfig.app.json          # App-specific TS config
├── tsconfig.node.json         # Node/build TS config
├── vite.config.ts             # Vite build configuration
├── tailwind.config.ts         # Tailwind CSS config
├── postcss.config.js          # PostCSS config
├── eslint.config.js           # ESLint configuration
└── README.md                  # Webapp documentation
```

## Critical Folders

### `src/components/`
Main UI components implementing the application interface. Key files:
- **ProfitabilityTable.tsx** (27KB) - Complex results table with sorting, expansion, profit/loss indicators
- **PriceInputModal.tsx** (14KB) - Modal for HDV price entry with resource grouping and locking

### `src/hooks/`
Custom hooks implementing core business logic:
- **useRecipes.ts** - Recipe fetching with localStorage caching (7-day TTL)
- **usePrices.ts** - Price management with server+dataset scoping
- **useItemsSearch.ts** - Debounced search with filtering

### `src/pages/`
Route-level components:
- **Index.tsx** (15KB) - Main workflow: search → select → analyze → view results

### `src/lib/`
Data access layer:
- **localDataClient.ts** - Loads items.json with in-memory caching

### `public/data/`
Static datasets (generated externally):
- **items.json** - All craftable Dofus 2.0 items with recipes
- **items-129.json** - All craftable Dofus 1.29 Retro items

## Entry Points

| File | Purpose |
|------|---------|
| `src/main.tsx` | Application entry point |
| `src/App.tsx` | Root component with React Router |
| `index.html` | HTML template (Vite) |

## File Size Analysis

| File | Size | Purpose |
|------|------|---------|
| ProfitabilityTable.tsx | 27KB | Complex results display |
| Index.tsx | 15KB | Main page workflow |
| PriceInputModal.tsx | 14KB | Price entry modal |
| Dashboard.tsx | 8KB | Analytics dashboard |
| items.json | 2.4MB | Dofus 2.0 dataset |
| items-129.json | 890KB | Retro dataset |
