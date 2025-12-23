# Repository Guidelines

## Project Structure & Module Organization
- `webapp/`: Vite + React + TypeScript app. Source lives in `webapp/src` with feature components under `components/`, pages in `pages/`, shared hooks in `hooks/`, utilities in `lib/`, typed shapes in `types/`, and sample data in `data/`. Public assets live in `webapp/public`.
- `docs/`: Product notes and design ideas (for context only, not bundled).
- Configuration: Tailwind (`tailwind.config.ts`), Vite (`vite.config.ts`), ESLint (`eslint.config.js`), and TS configs (`tsconfig*.json`). Path alias `@/` points to `webapp/src`.

## Build, Test, and Development Commands
- From `webapp/`, install dependencies with `npm install` (uses `package-lock.json`).
- `npm run dev`: Start the Vite dev server (default http://localhost:5173).
- `npm run build`: Production build to `webapp/dist`.
- `npm run build:dev`: Development-mode build for quicker artifact inspection.
- `npm run preview`: Serve the built app for local verification.
- `npm run lint`: ESLint check across the project.

## Coding Style & Naming Conventions
- Language: TypeScript + React functional components. Prefer hooks and composition over class components.
- Formatting: 2-space indentation; keep JSX props on separate lines when long. No Prettier config—follow existing patterns and run `npm run lint` before pushing.
- Naming: PascalCase for components (`Header.tsx`, `PriceInputModal.tsx`); camelCase for functions, hooks, and variables; kebab-case for non-component files under `components/ui` when matching shadcn exports.
- Styling: Tailwind CSS with `cn` helper from `src/lib/utils`. Favor utility classes over inline styles.

## Testing Guidelines
- No automated test suite is present yet. When adding tests, colocate by feature (e.g., `src/pages/__tests__/Index.test.tsx`) and mirror filenames. Ensure new tests run via `npm test` or document any added command.
- Use descriptive test names; prefer integration-level checks over snapshot-heavy coverage.

## Commit & Pull Request Guidelines
- Commits: Keep messages imperative and concise (e.g., "Add price input modal"), grouping related changes together.
- Pull Requests: Include a short summary, screenshots or clips for UI changes, linked issues/tickets, and reproduction steps if fixing a bug. Note any new env vars or scripts.
- Keep PRs focused; favor smaller, reviewable changes over large batches.

## Security & Configuration Tips
- Do not commit secrets. Use environment variables via Vite’s `import.meta.env` (prefix with `VITE_`). Add `.env.local` to `.gitignore` if new env files are introduced.
- Validate user-facing data and keep network calls within typed clients or hooks for easier auditing.
