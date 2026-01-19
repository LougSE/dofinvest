# Dofinvest - Data Models

## Overview

Dofinvest uses a fully client-side data architecture:
- **No database** - All data from local JSON files
- **localStorage** for persistence across sessions
- **TypeScript interfaces** for type safety

---

## Core TypeScript Types

Located in `webapp/src/types/dofus.ts`

### DofusItem

The primary item entity loaded from JSON datasets.

```typescript
interface DofusItem {
  id: number;           // Unique item identifier
  name: string;         // Display name (e.g., "Épée du Bouftou")
  level: number;        // Required crafting level
  type: string;         // Item category (e.g., "Épée", "Chapeau")
  iconUrl: string;      // URL to item icon image
  recipe?: RecipeIngredient[];  // Crafting recipe (if craftable)
  isCraftable: boolean; // Whether item can be crafted
}
```

**Source**: `/public/data/items.json` or `items-129.json`

### RecipeIngredient

A single ingredient in a crafting recipe.

```typescript
interface RecipeIngredient {
  itemId: number;   // Reference to ingredient item ID
  name: string;     // Ingredient name
  quantity: number; // Amount required
  iconUrl: string;  // Ingredient icon URL
}
```

### Resource

Computed resource with pricing information.

```typescript
interface Resource {
  id: number;           // Resource item ID
  name: string;         // Resource name
  iconUrl: string;      // Resource icon URL
  totalQuantity: number; // Total needed across all selected items
  unitPrice: number;    // Price per unit (from localStorage)
  totalCost: number;    // unitPrice × totalQuantity
}
```

### SelectedItem

An item selected for analysis with HDV pricing.

```typescript
interface SelectedItem {
  item: DofusItem;   // The selected item
  hdvPrice: number;  // Selling price in HDV
  hdvMin?: number;   // Minimum HDV price (optional)
  hdvMax?: number;   // Maximum HDV price (optional)
}
```

### ProfitabilityResult

The output of a profitability calculation.

```typescript
interface ProfitabilityResult {
  item: DofusItem;        // The analyzed item
  quantity?: number;      // Quantity to craft (default: 1)
  costTotal: number;      // Total crafting cost (sum of resources)
  hdvPrice: number;       // Expected selling price
  benefit: number;        // hdvPrice - costTotal
  marginPercent: number;  // (benefit / hdvPrice) × 100
  resources: Resource[];  // Breakdown of required resources
}
```

### ServerPrices

Price dictionary indexed by resource ID.

```typescript
interface ServerPrices {
  [resourceId: number]: number;  // resourceId → unit price
}
```

### DofapiItem (Legacy)

Compatibility type for raw data from different sources.

```typescript
interface DofapiItem {
  _id?: number;
  ankamaId?: number;
  id?: number;
  name: string;
  level: number;
  type: string;
  icon?: string;
  imgUrl?: string;
  imageUrl?: string;
  recipe?: Array<{
    id?: number;
    ankamaId?: number;
    name?: string;
    quantity: number;
    image?: string;
    imageUrl?: string;
    icon?: string;
  }>;
}
```

---

## localStorage Schemas

### Resource Prices

**Key**: `dofinvest_prices:{server}:{dataset}:resources`

```typescript
// Example: dofinvest_prices:Abrak:20:resources
{
  "12345": 150,    // resourceId: unitPrice (kamas)
  "67890": 2500,
  "11111": 50
}
```

### Item HDV Prices

**Key**: `dofinvest_prices:{server}:{dataset}:items`

```typescript
// Example: dofinvest_prices:Abrak:20:items
{
  "98765": 50000,  // itemId: hdvPrice (kamas)
  "43210": 125000
}
```

### Last Analysis

**Key**: `dofinvest_last_analysis:{server}:{dataset}`

```typescript
// Example: dofinvest_last_analysis:Abrak:20
{
  "selectedItems": [
    { "id": 12345, "name": "Item Name", ... }
  ],
  "results": [
    { "item": {...}, "costTotal": 10000, "benefit": 5000, ... }
  ],
  "quantities": {
    "12345": 5,
    "67890": 10
  },
  "timestamp": "2026-01-16T12:00:00Z"
}
```

### Recipe Cache

**Key**: `dofinvest_recipe_v2:{dataset}:{itemId}`

```typescript
// Example: dofinvest_recipe_v2:20:12345
{
  "recipe": [
    { "itemId": 111, "name": "Resource A", "quantity": 5, "iconUrl": "..." },
    { "itemId": 222, "name": "Resource B", "quantity": 3, "iconUrl": "..." }
  ],
  "cachedAt": 1705420800000,  // Unix timestamp
  "ttl": 604800000            // 7 days in ms
}
```

---

## JSON Dataset Structure

### items.json (Dofus 2.0)

**Location**: `/public/data/items.json`
**Size**: ~2.4MB
**Items**: ~3,600 craftable items

```json
[
  {
    "id": 12345,
    "name": "Épée du Bouftou",
    "level": 10,
    "type": "Épée",
    "iconUrl": "/icons/sword.png",
    "isCraftable": true,
    "recipe": [
      { "itemId": 111, "name": "Cuir de Bouftou", "quantity": 5, "iconUrl": "..." },
      { "itemId": 222, "name": "Fer", "quantity": 3, "iconUrl": "..." }
    ]
  },
  // ... ~3,600 more items
]
```

### items-129.json (Dofus 1.29 Retro)

**Location**: `/public/data/items-129.json`
**Size**: ~890KB
**Items**: ~1,286 craftable items

Same structure as items.json but for the Retro version.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    JSON Datasets                             │
│  /public/data/items.json    /public/data/items-129.json     │
└──────────────────────────┬──────────────────────────────────┘
                           │ Load on app start
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  localDataClient.ts                          │
│  - Fetches JSON file                                         │
│  - In-memory caching                                         │
│  - Returns DofusItem[]                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Custom Hooks                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐  │
│  │ useItemsSearch  │ │   useRecipes    │ │   usePrices   │  │
│  │ - Filter items  │ │ - Get recipes   │ │ - Get/set     │  │
│  │ - Debounce      │ │ - Cache w/ TTL  │ │   prices      │  │
│  └────────┬────────┘ └────────┬────────┘ └───────┬───────┘  │
└───────────┼───────────────────┼──────────────────┼──────────┘
            │                   │                  │
            │                   │                  ▼
            │                   │     ┌────────────────────────┐
            │                   │     │     localStorage       │
            │                   │     │  - Resource prices     │
            │                   │     │  - Item HDV prices     │
            │                   │     │  - Recipe cache        │
            │                   │     │  - Last analysis       │
            │                   │     └────────────────────────┘
            │                   │
            ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│  Index.tsx → PriceInputModal → ProfitabilityTable           │
└─────────────────────────────────────────────────────────────┘
```

---

## Profitability Calculation Formula

```typescript
// For each item in analysis:
const costTotal = resources.reduce((sum, r) =>
  sum + (r.unitPrice * r.quantity * itemQuantity), 0
);

const revenue = hdvPrice * itemQuantity;
const benefit = revenue - costTotal;
const marginPercent = (benefit / revenue) * 100;
```

**Where:**
- `unitPrice`: Price per resource from localStorage
- `quantity`: Recipe ingredient quantity
- `itemQuantity`: How many items to craft
- `hdvPrice`: Selling price from HDV (user input)
