# Zweho-Park

# SmartPark Amahoro — Client Applications

> Smart parking ecosystem for Amahoro Stadium, Kigali. This repository contains the four client applications: the visitor mobile app, the public booking website, the staff scanner tablet app, and the management dashboard.

## What This Repo Is

This repo holds the software the users touch. The backend, computer-vision edge service, and infrastructure live in separate repos. These four apps talk to the backend through one shared contract: [`contracts/openapi.yaml`](./contracts/openapi.yaml).

| App | Path | What it does | Stack |
|||||
| 📱 Mobile | `apps/mobile` | Visitors book & pay for parking, get a QR | Flutter (Android + iOS) |
| 🌐 Web | `apps/web` | Public booking site (same flow, browser) | React + TypeScript |
| 🛂 Tablet | `apps/tablet` | Gate staff scan & validate QR codes (offline-capable) | React PWA |
| 📊 Dashboard | `apps/dashboard` | Management: live occupancy, revenue, reports | React + TypeScript |



## Quick Start

Prerequisites: Node 20 (`.nvmrc`), pnpm 9, Flutter 3.x (for mobile only), Git.

bash
# 1. Clone and bootstrap everything in one command
git clone <repo-url> smartpark-amahoro
cd smartpark-amahoro
./scripts/setup.sh          # installs deps, generates the API client

# 2. Copy env files (then fill in real values — ask the Product Lead)
cp apps/web/.env.example       apps/web/.env
cp apps/tablet/.env.example    apps/tablet/.env
cp apps/dashboard/.env.example apps/dashboard/.env

# 3. Run what you're working on
make dev-web        # web booking site        -> localhost:5173
make dev-tablet     # staff scanner PWA       -> localhost:5174
make dev-dashboard  # management dashboard    -> localhost:5175
make dev-mobile     # flutter run (device/emulator required)


You only run the app you're working on. You do not need every app running to develop one.



## Repository Layout


apps/
  mobile/      Flutter visitor app          [Denys & Tresor: Mobile Eng]
  web/         React public booking site    [Tresor: Web Eng]
  tablet/      React PWA staff scanner       [Emile & Tresor: Web Eng]
  dashboard/   React management console      [Emile: Web Eng]
contracts/     openapi.yaml — shared API source of truth
packages/      shared JS/TS (api-client, ui, config) — used by web/tablet/dashboard
docs/          onboarding, coding standards, git workflow
scripts/       setup.sh, gen-api-client.sh
.github/       path-filtered CI workflows


Each app has its own `README.md` with app-specific details (build, release, env keys). Read that before working in an app.

## The One Rule That Matters: The Contract

All four apps depend on the backend's API. The neutral source of truth is `contracts/openapi.yaml`.

- Never hand-write API types in an app.
- The three React apps import the generated TypeScript SDK from `packages/api-client`.
- The Flutter app generates its own Dart client from the same file.
- When the API changes: the contract is updated first (in its own PR), then run `make gen-api` to regenerate clients. CI will fail a PR that changes `openapi.yaml` without regenerating.

This is why Mobile (Dart) and the React apps stay in sync despite being different languages — they generate from one file, not from each other.

## Common Commands

| Command | Does |
|||
| `./scripts/setup.sh` | Bootstrap a fresh machine |
| `make dev-web` / `dev-tablet` / `dev-dashboard` / `dev-mobile` | Run one app |
| `make gen-api` | Regenerate API clients after a contract change |
| `make test` | Run every test suite |
| `make lint` | Lint + format-check everything |
| `pnpm --filter web test` | Run tests for one React app only |



## Tech Stack

- Mobile: Flutter / Dart · Riverpod · GoRouter · Dio
- Web / Tablet / Dashboard: React · TypeScript · Vite · Tailwind CSS
- Tablet extras: PWA / service worker · IndexedDB (offline queue)
- Dashboard extras: Recharts · WebSocket (live occupancy)
- Shared: `packages/ui` design system · `packages/api-client` generated SDK
- Tooling: pnpm workspace (React apps only) · GitHub Actions · ESLint + Prettier

> Mobile is Flutter and does not join the pnpm workspace. It is managed by `pubspec.yaml`. This is intentional — don't try to wire it into the JS tooling.



## Git Workflow

- `main` is always deployable. Branch off it; keep branches short-lived (hours–days).
- Branch names: `feat/booking-expiry`, `fix/qr-double-scan`, `chore/...`, `docs/...`.
- Commits follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Open a PR -> CI must be green -> one approval from the directory's CODEOWNER -> squash-merge.
- PR template asks: what / why / how tested / did the contract change?


## Who Owns What

| Engineer | Works in |
|||
| Mobile Engineer | `apps/mobile/` |
| Web/Dashboard Engineer | `apps/web/`, `apps/tablet/`, `apps/dashboard/`, `packages/` |
| Backend Engineer | `contracts/` (writes the API spec) |
| CV/AI Engineer | `contracts/` (MQTT/ingestion side, separate repo) |
| DevOps Lead | `.github/`, `scripts/` |
| Product Lead | `docs/`, `CODEOWNERS`, reviews everything |

Path-filtered CI means a mobile-only PR never runs web CI, and vice versa — fast feedback, fewer queues.



## Environment & Secrets

- Every app ships a committed `.env.example` listing keys with dummy values.
- Real `.env` files are git-ignored. Never commit a secret. Get real values from the Product Lead.
- Three environments via env files (not branches): `development` (local), `staging` (pre-prod), `production` (stadium-facing).
- Frontend config is read once via `import.meta.env` — no scattered `process.env`.



## Documentation

| Doc | What |

Project-level docs (roadmap, budget, risk register, architecture diagram) live in the team Google Drive under the documented folder structure.


## Contributing

1. Pick up an issue, assign yourself.
2. Branch from `main` with a conventional name.
3. Work in your owned directory; keep PRs small and focused.
4. Green CI + CODEOWNER approval required to merge.
5. If you touched the API, update `contracts/openapi.yaml` first and run `make gen-api`.

Questions about structure or ownership → ask the Product Lead in `#general`.


*SmartPark Amahoro · Zweho Park · MVP v1.0 · Built by a 6-person team in Kigali.*
