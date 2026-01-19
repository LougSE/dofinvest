# Dofinvest - Component Inventory

## Overview

| Category | Count |
|----------|-------|
| Custom Components | 8 |
| shadcn/ui Components | 48 |
| **Total** | **56** |

---

## Custom Components

Located in `webapp/src/components/`

### Core Application Components

| Component | File | Size | Purpose |
|-----------|------|------|---------|
| **ProfitabilityTable** | `ProfitabilityTable.tsx` | 27KB | Results display with sorting, row expansion, profit/loss indicators, editable quantities |
| **PriceInputModal** | `PriceInputModal.tsx` | 14KB | Modal for HDV price entry, resource grouping, price locking, pre-fill from localStorage |
| **SearchBar** | `SearchBar.tsx` | 3.6KB | Debounced search input with tag filter chips |
| **SelectionPanel** | `SelectionPanel.tsx` | 3.4KB | Panel showing selected items with remove functionality |
| **ItemCard** | `ItemCard.tsx` | 3.1KB | Individual item display card with icon, name, level, type |
| **Header** | `Header.tsx` | 2.4KB | Application header with navigation links |
| **ItemGrid** | `ItemGrid.tsx` | 1.4KB | Grid layout container for ItemCard components |
| **NavLink** | `NavLink.tsx` | 0.8KB | Navigation link wrapper with active state styling |

### Component Relationships

```
App.tsx
├── Header
│   └── NavLink (multiple)
└── Pages
    └── Index.tsx
        ├── SearchBar
        ├── ItemGrid
        │   └── ItemCard (multiple)
        ├── SelectionPanel
        │   └── ItemCard (multiple)
        ├── PriceInputModal
        └── ProfitabilityTable
```

### Component Details

#### ProfitabilityTable (Complex)
- **Props**: `results`, `quantities`, `onQuantityChange`, `onHdvPriceChange`
- **Features**:
  - Sortable columns (benefit, margin%, cost)
  - Expandable rows showing recipe breakdown
  - Inline editable HDV prices
  - Visual profit (green) / loss (red) indicators
  - Aggregated resource summary
- **Used in**: `Index.tsx`

#### PriceInputModal (Complex)
- **Props**: `isOpen`, `onClose`, `items`, `recipes`, `onConfirm`
- **Features**:
  - Auto-generates unique resource list from recipes
  - Pre-fills prices from localStorage
  - Lock/unlock price inputs
  - Resource grouping by item
  - Persists all prices on confirm
- **Used in**: `Index.tsx`

#### SearchBar
- **Props**: `value`, `onChange`, `tags`, `onTagToggle`
- **Features**:
  - Debounced input (prevents excessive filtering)
  - Tag filter chips (toggleable)
  - Clear button
- **Used in**: `Index.tsx`

---

## shadcn/ui Components

Located in `webapp/src/components/ui/`

### Layout Components

| Component | File | Usage |
|-----------|------|-------|
| Card | `card.tsx` | Item cards, result cards |
| Separator | `separator.tsx` | Visual dividers |
| Scroll Area | `scroll-area.tsx` | Scrollable containers |
| Resizable | `resizable.tsx` | Resizable panels |
| Sidebar | `sidebar.tsx` | Side navigation |
| Aspect Ratio | `aspect-ratio.tsx` | Maintain aspect ratios |

### Form Components

| Component | File | Usage |
|-----------|------|-------|
| Input | `input.tsx` | Text inputs, price inputs |
| Button | `button.tsx` | Actions, submit buttons |
| Checkbox | `checkbox.tsx` | Selection toggles |
| Select | `select.tsx` | Dropdowns (server, dataset) |
| Switch | `switch.tsx` | Toggle switches |
| Slider | `slider.tsx` | Range inputs |
| Textarea | `textarea.tsx` | Multi-line text |
| Radio Group | `radio-group.tsx` | Radio selections |
| Form | `form.tsx` | Form wrapper with validation |
| Label | `label.tsx` | Input labels |
| Input OTP | `input-otp.tsx` | OTP input fields |

### Overlay Components

| Component | File | Usage |
|-----------|------|-------|
| Dialog | `dialog.tsx` | Modal dialogs (PriceInputModal) |
| Alert Dialog | `alert-dialog.tsx` | Confirmation dialogs |
| Sheet | `sheet.tsx` | Side panels |
| Drawer | `drawer.tsx` | Bottom drawers |
| Popover | `popover.tsx` | Floating content |
| Tooltip | `tooltip.tsx` | Hover tooltips |
| Hover Card | `hover-card.tsx` | Rich hover content |
| Context Menu | `context-menu.tsx` | Right-click menus |
| Dropdown Menu | `dropdown-menu.tsx` | Dropdown menus |

### Navigation Components

| Component | File | Usage |
|-----------|------|-------|
| Tabs | `tabs.tsx` | Tab navigation |
| Navigation Menu | `navigation-menu.tsx` | Main nav |
| Menubar | `menubar.tsx` | Menu bars |
| Breadcrumb | `breadcrumb.tsx` | Breadcrumb trails |
| Pagination | `pagination.tsx` | Page navigation |
| Command | `command.tsx` | Command palette |

### Data Display Components

| Component | File | Usage |
|-----------|------|-------|
| Table | `table.tsx` | Data tables (ProfitabilityTable) |
| Badge | `badge.tsx` | Status badges, tags |
| Avatar | `avatar.tsx` | User/item avatars |
| Progress | `progress.tsx` | Progress bars |
| Skeleton | `skeleton.tsx` | Loading placeholders |
| Alert | `alert.tsx` | Alert messages |
| Chart | `chart.tsx` | Data visualization |
| Calendar | `calendar.tsx` | Date picker |
| Carousel | `carousel.tsx` | Image carousels |

### Feedback Components

| Component | File | Usage |
|-----------|------|-------|
| Toast | `toast.tsx` | Toast notifications |
| Toaster | `toaster.tsx` | Toast container |
| Sonner | `sonner.tsx` | Alternative toast |

### Utility Components

| Component | File | Usage |
|-----------|------|-------|
| Accordion | `accordion.tsx` | Collapsible sections |
| Collapsible | `collapsible.tsx` | Toggle visibility |
| Toggle | `toggle.tsx` | Toggle buttons |
| Toggle Group | `toggle-group.tsx` | Toggle button groups |

---

## Design System

### Colors (Custom)

| Name | Purpose | CSS Variable |
|------|---------|--------------|
| `profit` | Positive values | `--profit` |
| `loss` | Negative values | `--loss` |
| `lime` | Accent color | `--lime` |
| `forest` | Secondary accent | `--forest` |

### Typography

| Font | Usage |
|------|-------|
| Roboto | Body text (`font-sans`) |
| Poppins | Headings (`font-heading`) |

### Patterns

- All components use Tailwind CSS utilities
- Theme via CSS variables (HSL colors)
- Dark mode via `.dark` class on root
- `cn()` helper for conditional classes
