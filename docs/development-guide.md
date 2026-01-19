# Dofinvest - Development Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)
- **Git** for version control

## Getting Started

### 1. Clone Repository

```bash
git clone <repository-url>
cd dofinvest
```

### 2. Install Dependencies

```bash
cd webapp
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Opens at: **http://localhost:8080**

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Production build to `dist/` |
| `npm run build:dev` | Development build with source maps |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint code checks |

## Project Configuration

### Path Aliases

Use `@/` to import from `src/`:

```typescript
// Instead of:
import { Button } from '../../../components/ui/button'

// Use:
import { Button } from '@/components/ui/button'
```

### Environment Variables

Create `.env.local` for local overrides (gitignored):

```bash
# Currently no env vars required
# App runs fully client-side
```

## Development Workflow

### Adding a New Page

1. Create component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`:
   ```tsx
   <Route path="/new-page" element={<NewPage />} />
   ```
3. Add navigation link in `Header.tsx` if needed

### Adding a New Component

1. Create in `src/components/ComponentName.tsx`
2. Use PascalCase for filename
3. Export as default
4. Import using path alias: `@/components/ComponentName`

### Adding shadcn/ui Components

```bash
npx shadcn-ui@latest add <component-name>
```

Components are added to `src/components/ui/`.

### Adding a Custom Hook

1. Create in `src/hooks/useHookName.ts`
2. Use camelCase with `use` prefix
3. Export as named export

## Code Style

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ItemCard.tsx` |
| Hooks | camelCase with `use` | `useRecipes.ts` |
| Utilities | camelCase | `localDataClient.ts` |
| Types | camelCase | `dofus.ts` |

### Component Structure

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { DofusItem } from '@/types/dofus'

interface Props {
  item: DofusItem
  onSelect: (item: DofusItem) => void
}

const ItemCard = ({ item, onSelect }: Props) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div onMouseEnter={() => setIsHovered(true)}>
      {/* Component content */}
    </div>
  )
}

export default ItemCard
```

### TypeScript

- Types in `src/types/` directory
- Interfaces preferred over type aliases for objects
- Use strict null checks where sensible

## Testing

> Note: No automated test suite is currently configured.

When adding tests:
1. Use Vitest (Vite-native)
2. Colocate test files: `ComponentName.test.tsx`
3. Or use `__tests__/` directories

## Debugging

### localStorage Issues

Common keys to inspect in DevTools → Application → Local Storage:

```
dofinvest_prices:Abrak:20:resources
dofinvest_prices:Abrak:20:items
dofinvest_last_analysis:Abrak:20
dofinvest_recipe_v2:20:{itemId}
```

### Clear Cache

```javascript
// In browser console
Object.keys(localStorage)
  .filter(k => k.startsWith('dofinvest'))
  .forEach(k => localStorage.removeItem(k))
```

### React DevTools

Install React DevTools browser extension for component inspection.

## Common Tasks

### Update Item Dataset

1. Run crawlit parser to generate new items.json
2. Replace `public/data/items.json`
3. Clear localStorage cache on first load

### Add New Item Filter

1. Update `tagOptions` array in `Index.tsx`
2. Filter logic in `filteredItems` useMemo

### Modify Profitability Formula

Location: `Index.tsx` → `handleConfirmPrices`

```typescript
costTotal = sum(resource.unitPrice * ingredient.quantity * itemQuantity)
revenue = hdvPrice * itemQuantity
benefit = revenue - costTotal
marginPercent = (benefit / revenue) * 100
```

## Build & Deployment

### Production Build

```bash
npm run build
```

Output in `dist/` - static files ready for any hosting.

### Preview Build

```bash
npm run preview
```

### Deployment Options

- **Static hosting**: Vercel, Netlify, GitHub Pages
- **Self-hosted**: Any web server serving static files
- No backend required

## Troubleshooting

### "Module not found" errors

1. Check path alias usage (`@/` prefix)
2. Run `npm install` again
3. Restart dev server

### Styling not applying

1. Check Tailwind class names
2. Verify `index.css` is imported in `main.tsx`
3. Check for CSS specificity conflicts

### Data not loading

1. Check browser console for errors
2. Verify `public/data/items.json` exists
3. Check network tab for file loading
