# CEED 87-Day Domino Tracker ⚡

> **Industrial Brutalist Zero-Clock Routine & Athletic Focus Terminal for CEED 2027 Preparation.**

A high-performance, local-first Progressive Web App (PWA) designed for intense, disciplined creative and design-aptitude preparation. Built with an **Achromatic Industrial Ledger** aesthetic, Web Audio mechanical feedback, a GitHub-authentic 5-tier contribution matrix, and Strava-style athletic telemetry.

---

## 🚀 Key Features

### 1. Zero-Clock Circadian Domino Routine
- **Wake-Offset Time Engine**: Eliminates rigid alarm panic. Blocks cascade relative to when you tap **START DAY** (`Wake + 0:00`, `Wake + 0:15`, etc.).
- **4 Core Domino Pillars (Mandatory)**:
  - **DOMINO 1 (120m)**: *Peaceful Walk & Run* (Circadian sunlight lock, 8–10 km).
  - **DOMINO 2 (90m)**: *Sketching & Assignments* (Perspective grids, human figures, foreshortening).
  - **DOMINO 3 (120m)**: *CEED Full Paper Part B* (Studio prompts & timed execution).
  - **DOMINO 4 (120m)**: *Creative & Blender* (Design systems, 3D modeling, portfolio).
- **Circadian Habit Recovery**: Step 0 Launchpad, Siesta Nap Reset (95m), and Core Night Sleep (6h). Non-dominos track routines without breaking streaks or diluting study metrics.

### 2. Studio Proctor HUD (CEED Part B)
- **120-Minute Master Proctor Timer**: Synchronized with automated 24-minute slot transitions and audio cues.
- **5 Mandatory Studio Prompts (Q1–Q5)**: Curated daily question bank with official evaluation rubrics (Creativity, Form, Ergonomics, Technical Detailing).
- **Game Theory Strategy Panel**: Time allocation tactics, marking criteria breakdown, and scoring matrix.

### 3. GitHub Profile Contribution Matrix (Green Square Grid)
- **5-Tier Green Intensity Palette**: Scales with focus hours logged:
  - **Level 0**: 0 hrs (neutral empty cell)
  - **Level 1**: < 4 hrs (Under floor)
  - **Level 2**: 4–6 hrs (Standard floor met)
  - **Level 3**: 6–8 hrs (Over-delivered deep work)
  - **Level 4**: 8+ hrs (Studio Beast Mode)
- **Interactive Tooltip HUD**: Inspect any node's exact date, completed dominos, and focus hours.
- **Tactile Jump**: Tap any cell in the 87-day timeline to inspect or log that day on the dashboard.
- **Special Status Badges**: Amber outline for Bad-Day Emergency floors, Blue outline for Streak Shields.

### 4. Strava-Style Athletic Telemetry (`#/stats`)
- **Master Gauges**: Lifetime Volume (`Σ hrs`), Daily Average Pace, Current Streak, and Exam Day Forecast.
- **Personal Records (PRs) Board**:
  - 🏆 Longest Single-Day Focus Session (Hours & Date)
  - 🔥 All-Time Max Streak
  - 🏔️ Peak Volume Week
  - 📝 Total Part B Prompts Solved
- **500-Hour Mastery Goal**: Rolling 7-day velocity, required pace/day, and progress gauge.
- **Discipline Splits**: Per-domino breakdown, average session length, completion rate %, and estimated aerobic walking/running distance ($5.5\text{ km/h}$).
- **Data Export & Portability**:
  - 📥 **CSV Spreadsheet Download**: Complete 87-day row-by-row table for Google Sheets / Excel.
  - 📥 **Structured Telemetry JSON**: Full state and metric archive.

### 5. Local-First & Offline PWA
- **Zero Cloud Lock-in**: All state is persisted to `localStorage` on-device with zero telemetry trackers.
- **Synthesized Audio Engine**: Mechanical relay tactile click synthesized via Web Audio API—zero external audio file dependencies.
- **PWA Ready**: Works offline on iOS, Android, and Desktop with web app manifest and service worker caching.

---

## 🛠️ Tech Stack

- **Bundler**: [Vite 8](https://vitejs.dev/)
- **Core**: Vanilla JavaScript (Modern ES Modules, zero bulky runtime frameworks)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Typography**: [Geist & Geist Mono](https://vercel.com/font)
- **Icons**: Custom Apple-style SVG stroke icons (inline currentColor)
- **Audio**: Web Audio API (Synthesized dual-stage transient click & relay thud)
- **PWA**: `vite-plugin-pwa` with Workbox offline precaching

---

## 📦 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v22)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ceed-domino.git
cd ceed-domino

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will start at `http://localhost:5173/`.

### Production Build

```bash
npm run build
```

The production assets will be output to `/dist`.

---

## 🚀 Deployment to Vercel

The repository includes a battle-tested [`vercel.json`](./vercel.json) configured with SPA route rewrites and strict security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).

### Deploy via Vercel CLI:
```bash
npm install -g vercel
vercel
```

### Deploy via GitHub:
1. Push this repository to GitHub.
2. Import the project into your [Vercel Dashboard](https://vercel.com/new).
3. Framework Preset: **Vite** (Build command: `npm run build`, Output directory: `dist`).
4. Click **Deploy**.

---

## 📄 License

MIT License. Crafted for CEED & design aspirants.
