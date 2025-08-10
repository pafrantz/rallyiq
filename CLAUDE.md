# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RallyIQ is a Progressive Web App (PWA) for real-time NFL play prediction built with React, TypeScript, and Vite. The app fetches live game data and uses a simple baseline model to predict whether the next play will be a run or pass.

## Development Commands

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

### Live Data Generation
```bash
python scripts/gen_live_json.py  # Generate/update simulated live game data
```

## Architecture

### Frontend Structure (`frontend/src/`)
- **App.tsx**: Main application component that fetches live data every 5 seconds and displays predictions
- **components/ProbChart.tsx**: Line chart visualization using Recharts showing probability trends over time
- **lib/model.ts**: Simple baseline prediction model based on down, distance, and field position

### Data Flow
1. `live.json` contains current game state (down, distance, yardline, quarter, clock)
2. App fetches this data every 5 seconds via `loadLive()` function
3. `nextPlayProb()` calculates run/pass probabilities based on game context
4. Results are displayed in metrics and historical chart (last 30 data points)

### PWA Configuration
- `public/manifest.json`: PWA manifest for installability
- `public/service-worker.js`: Service worker for offline functionality
- `public/icons/`: App icons for different screen sizes

### Deployment
- Vite config builds to `../docs` directory for GitHub Pages deployment
- GitHub Actions handle automatic deployment via `.github/workflows/`
- Base URL configured as `/rallyiq/` in `vite.config.ts`

### Prediction Model
The baseline model in `model.ts` adjusts probabilities based on:
- 3rd down & short distance: favors run plays (+12%)
- Long distance (≥8 yards): favors pass plays (+15%) 
- Red zone position (≤20 yard line): favors run plays (+8%)

### Live Data Simulation
`scripts/gen_live_json.py` generates realistic game progression by:
- Advancing down count (resets to 1 after 4th down)
- Randomly adjusting distance and yardline within bounds
- Decreasing game clock with random intervals
- Adding contextual notes (formation, strategy hints)