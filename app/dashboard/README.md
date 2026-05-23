# Zweho Park · Management Dashboard

> SmartPark Amahoro · Kigali · CMU-Africa

The staff/admin web app for the Zweho Park smart parking system at Amahoro Stadium. Real-time occupancy monitoring, booking management, revenue analytics, and gate-side QR validation.

## Stack

Per the tech spec:

| Library | Purpose |
|--|--|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| Recharts | Charts |
| React Query | API data fetching & caching |
| React Router | SPA routing |
| Axios | HTTP client |

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Project Structure

```
src/
├── App.jsx                  # Root with routing
├── main.jsx                 # Entry point
├── index.css                # Tailwind + design tokens
├── components/
│   ├── TopBar.jsx           # Nav, clock, tickertape
│   └── ui.jsx               # Pill, Panel, MetricCard, etc.
├── views/
│   ├── LiveOccupancyView.jsx
│   ├── BookingsView.jsx
│   ├── RevenueView.jsx
│   ├── AnalyticsView.jsx
│   └── ScannerView.jsx
└── lib/
    ├── api.js               # API client (switch USE_MOCK off when backend live)
    ├── constants.js         # Zones, thresholds, config
    └── mockData.js          # Mock data generators (delete when API is live)
```

## Connecting to Bruno's Backend

When the FastAPI backend is deployed:

1. Open `src/lib/api.js`
2. Set `USE_MOCK = false`
3. Create a `.env` file:
   ```
   VITE_API_BASE=https://api.zwehopark.rw
   ```
4. Restart: `npm run dev`

All endpoints already match the tech spec exactly:
- `GET /admin/occupancy`
- `GET /bookings`
- `GET /admin/revenue`
- `GET /admin/analytics`
- `POST /qr/validate`
- `GET /admin/bookings/export`

## Build for Production

```bash
npm run build
```

Output in `dist/`. Deploy to Vercel, Netlify, or behind Nginx on the VPS.

## Maintainer

Emile Lucky Muhigira — emuhigir@andrew.cmu.edu
