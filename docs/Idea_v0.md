Dofinvest Project Specification Document
Version: 1.0
Date: December 23, 2025
Author: User (Dofus player/developer on Abrak server)
Purpose: Detailed spec for building "Dofinvest", a React web app to automate Dofus crafting profitability calculations, replacing manual Excel work (see attached Abrak.xlsx example with Arc Adie/Dragoeuf crafts).

Project Overview
Dofinvest solves the pain of manually tracking Dofus item crafts for kamas farming: fetch recipes auto from Dofapi.fr, let user input HDV prices (resources + items), compute total costs/benefits, display sorted table by profitability.
Target: Any dofus server. Theme: Dofus/Wakfu aesthetic (pixel art, blue/red gradients, item icons).
MVP Goal: Single-page React app, offline-capable, beautiful UI, exportable results. Stack: React 18+, Dofapi.fr API, TailwindCSS.

Core User Flow (Use Case 1)
Item Search & Selection

Homepage: Search bar for all Dofus items (fetch /items from Dofapi, ~10k items, lazy-load).

Results: Grid/list with item name, icon (https://dofapi.fr/items/{id}), level, type. Filter by "craftable only".

Multi-select (checkboxes): User picks 1-N items (e.g., "Arc Dragoeuf", "Arc Adie").

Button: "Analyze Selection" → Fetch recipes for each (/items/{id}/recipe).

Resource Price Input

Auto-generate unique list of ALL resources needed across selected items (dedupe).

Form: Table/grid per resource: Icon | Name | Qty per craft (sum if multi-items) | Unit Price (input, pre-filled from localStorage) | Total Cost (auto: qty*unit).

UX: Modal per resource or grouped, "Copy from HDV" tooltip, validate numeric only.

Persist prices: localStorage key="dofinvest_prices_{server}_resources" (JSON: {resourceId: price}).

Item HDV Price Input

Separate section: For each selected item: Name | Icon | Avg HDV Price (input) | Min/Max (optional toggles).

Pre-fill from localStorage if exists. Button: "Confirm All Prices".

Calculation & Display

Per Item: Cost Total = SUM(resource totals). Benefit = HDV Avg - Cost Total. Margin % = (Benefit / HDV Avg) * 100.

Output: Responsive table, sorted DESC by Benefit (or toggle: Margin %, HDV Price). Columns: Item Icon/Name | Recipe Summary (click expand) | Cost Total | HDV Avg/Min/Max | Benefit | Margin %.

Visuals: Green/red rows (profitable/loss), sparkline graph for benefits.

Global Stats: Total Potential Kamas (sum benefits), Best Item highlight.

Extras

Export: CSV/Excel button (mimic Abrak.xlsx format).

Reset/Clear prices. Server selector (default: "Abrak").

Example from Abrak.xlsx:
Arc Dragoeuf: Resources (Os de pékeualak 30@2000=60k, etc.) → Cost 855,950 → HDV 2.1M → Benef 1,244,050.
​

Technical Requirements
API Integration (Dofapi.fr)
Base URL: https://dofapi.fr.

Key Endpoints:

Endpoint	Purpose	Example
GET /items	List all items (paginated, search ?name=arc)	Filter craftable: check recipe field exists 
​.
GET /items/{id}	Item details: name, icon_url, level, type.	/items/12345 for Arc Dragoeuf.
GET /items/{id}/recipe	Craft recipe: [{itemId: resId, qty: 30}] array.	Parse to resource list/map.
GET /items/{id}/image	PNG icon (64x64).	Use in <img src={url} alt={name} />.
Handle CORS (proxy via public API or React proxy). Rate-limit: Cache all recipes in localStorage (JSON blob, ~50MB max).

Fallback: If Dofapi down, load cached data.

Frontend Stack & Features
React: Vite/Create React App. Hooks: useState (selections, prices), useEffect (API fetch, localStorage sync), useCallback (optim).

UI/Styling: TailwindCSS + Heroicons. Theme:

css
/* Dofus-inspired */
:root { --primary: #1e3a8a; --accent: #dc2626; --bg: linear-gradient(135deg, #0f172a, #1e293b); }
.item-card { border: 2px solid #fbbf24; box-shadow: 0 4px 8px rgba(251,191,36,0.3); }
.profitable { background: linear-gradient(90deg, green, lime); }
Components: ItemSearch, ResourceForm, ProfitTable (sortable headers), ItemModal (full recipe).

State Management: Zustand or Context API (prices, items, server).

Persistence: localStorage + optional IndexedDB for large caches.

Responsive: Mobile-first (HDV checks on phone). PWA: Add manifest/service worker for offline.

Performance: Virtualize long lists (react-window), debounce search (300ms).

Data Structures (JSON Schemas)
json
// Item
{ "id": 12345, "name": "Arc Dragoeuf", "icon": "url", "recipe": [{ "itemId": 678, "qty": 30 }] }

// Selected Items State
[{ id: 12345, hdvAvg: 2100000, hdvMin: 1900000, hdvMax: 2300000 }]

// Resources (deduped)
[{ id: 678, name: "Os de pékeualak", icon: "url", totalQty: 30, unitPrice: 2000, totalCost: 60000 }]
Edge Cases & Polish
Non-craftable items: Hide or warn.

Shared resources: Aggregate qty across items (e.g., Os used in 2 crafts → qty*2).

Zero/negative prices: Validate >0, error messages.

Loading states: Spinners with Dofus GIFs.

Accessibility: ARIA labels, keyboard nav.

i18n: French/EN (user bilingual).

Analytics: Track top profitable crafts (local only).

Development Phases
Week 1 (MVP): Search/select → Recipe fetch → Manual price input → Basic table.

Week 2: localStorage, sorting/export, Tailwind theme, icons.

Polish: Modals, graphs (Recharts: benefit bar chart), PWA.

Success Metrics
Saves 30+ min per session (vs Excel).

Handles 10+ items at once.

100% offline after first load.

Beautiful: "putain" level (pixel perfection, animations on hover/profit reveal).

Build this exactly as spec'd. Ask for clarifications if needed. GitHub repo structure: /src/components, /src/hooks, /src/api/dofapi.js. Deploy: Vercel/Netlify free. Let's make kamas farming easy! 🚀