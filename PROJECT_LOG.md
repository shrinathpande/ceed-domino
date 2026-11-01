# PROJECT_LOG.md — CEED 87-Day Domino Tracker
**Handover Dossier & Complete Chronological Ledger for Gemini Argon 4**

> **Target Model**: Gemini Argon 4  
> **Repository**: [https://github.com/shrinathpande/ceed-domino.git](https://github.com/shrinathpande/ceed-domino.git)  
> **Deployment Target**: Vercel (PWA)  
> **Active Branch**: `main`  
> **Primary Target Device**: iPhone 12 (390px viewport, iOS Safari, Super Retina XDR OLED)  
> **Author**: Shrinath Pande  
> **Generated**: October 31, 2026 (Reflecting all commits through `aa6bc59`)

---

## 1. Executive Summary & Briefing for Gemini Argon 4

### 1.1 What This Application Is
**CEED 87-Day Domino Tracker** is a high-performance, mobile-first Progressive Web App (PWA) engineered specifically for disciplined preparation for the **CEED 2027 Design Entrance Exam** (Exam Date: **January 17, 2027 at 09:00 AM IST**). 

The app tracks an 87-day circadian study campaign (starting October 22, 2026). Unlike conventional task managers that rely on rigid wall-clock schedules, this app operates on a **Zero-Clock Circadian Domino Architecture**. The user's day begins whenever they wake up (`Wake + 0:00`), and daily blocks cascade forward dynamically relative to that wake timestamp.

### 1.2 Core Architectural Invariants (DO NOT VIOLATE)
When Gemini Argon 4 modifies or extends this codebase, you must adhere strictly to these non-negotiable rules:

1. **Zero Cloud Lock-in / Local-First**: All state is persisted exclusively to browser `localStorage`. No external databases, no cloud authentication, no third-party telemetry scripts.
2. **Mandatory DOMINO Filter Rule**: Only blocks whose badge string contains `'DOMINO'` (case-insensitive via `isDominoTask()`) count as mandatory timed study tasks. Circadian anchor blocks (`STEP 0: LAUNCHPAD`, `SIESTA`, `NIGHT SLEEP`) provide daily context but **MUST NEVER** penalize streaks or inflate study telemetry metrics.
3. **No Gamified Clutter**: The user explicitly eliminated XP points, confetti animations, chime sound effects, and subjective rating popups. Never reintroduce these elements.
4. **Pure Web Audio API Sound**: Sound effects must only use synthesized Web Audio API clicks (specifically the mechanical relay click in `src/utils/sound.js`). Never load external `.mp3`, `.wav`, or audio asset files.
5. **Industrial Brutalist "Achromatic Ledger" Aesthetic**:
   - Palette: Pure AMOLED Black (`#000000`), deep charcoal surface (`#0a0a0a`), stark white text/accents (`#ffffff`), and a sharp neon pink domino accent (`--domino-accent: #FF69AF`).
   - High data density, sharp 2px borders, monospace numeric metrics, zero gradients, zero decorative drop-shadows.
   - Emergency Mode dynamically triggers a deep red color shift across all surfaces (`--bg-primary: #120404`).
6. **iPhone 12 Optimization First**: The viewport is 390×844px. All screens must respect `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)`. Domino cards must remain compact; tapping anywhere on a card toggles its expansion; the header must remain single-line.

---

## 2. Core Idea & Design Concept

### 2.1 The Zero-Clock Circadian Cascading Engine
Traditional calendars fail exam aspirants because waking up 45 minutes late shatters rigid clock intervals. The Domino Tracker replaces wall-clock schedules with **cascading relative offsets**:

| Block Key | Badge | Name | Default Floor | Wake Offset | Mandatory? | Notes |
|:---|:---|:---|:---|:---|:---|:---|
| `launchpad` | `STEP 0` | Launchpad | 15 mins | `+00:00` | No | Hydration + salt, shoes on, zero phone scrolling |
| `d1` | `DOMINO 1` | Morning Workout & Walk | 120 mins | `+00:15` | **YES** | 8–10 km walk or 1 km run |
| `d2` | `DOMINO 2` | Sketching & Perspective Drills | 90 mins | `+03:00` | **YES** | Human figures, perspective grids, assignments |
| `d3` | `DOMINO 3` | CEED Paper Sprint (Part A + B) | 180 mins | `+04:30` | **YES** | Timed test simulation + error log |
| `siesta` | `SIESTA` | Biphasic Siesta Reset | 95 mins | `+08:00` | No | 90m sleep cycle + 5m fall-asleep buffer |
| `d4` | `DOMINO 4` | Creative & Framework Studio | 120 mins | `+10:00` | **YES** | Blender, industrial design, framework projects |
| `sleep` | `NIGHT` | Core Night Sleep | 360 mins | `+18:00` | No | 4 × 90-min sleep cycles |

### 2.2 Streak & Shield Mechanics
- **Streak Calculation**: A day is marked complete if and only if **all mandatory DOMINO blocks** are completed.
- **Under-Floor Adherence**: If the user completes a domino but logs less time than the recommended floor, the domino is marked completed and streak is preserved, but tagged with an `UNDER` chip.
- **Streak Shields (🛡️)**:
  - User starts with 2 shields (capped at 3).
  - Completing a 7-day perfect streak awards +1 shield.
  - If a day is missed, the user can consume a shield to save the streak.
- **Emergency Mode (Streak Saver)**:
  - Intended for severe illness, travel, or sleep deprivation.
  - Compresses daily floor times: D1 (45m), D2 (30m), D3 (60m), D4 (60m) = 3h 15m total study floor.
  - **Hard Rule**: Cannot be activated two consecutive days.

### 2.3 Leveling System
- `Level = floor(completed_domino_count / 4) + 1`
- Progress towards next level: `(completed_domino_count % 4) / 4`
- Exactly 4 completed mandatory dominos advance the user by 1 full level.

---

## 3. Architecture & Data Flow Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Single Page App Router                   │
│                          src/app.js                         │
│       #/ (Dashboard)  |  #/stats  |  #/studio  |  #/settings │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
       ┌───────▼────────┐             ┌───────▼────────┐
       │   Components   │             │   Views Layer  │
       │  - Header      │             │  - Dashboard   │
       │  - DominoCard  │             │  - Stats       │
       │  - NavDock     │             │  - Studio      │
       │  - Heatmap     │             │  - Settings    │
       │  - Modals      │             └───────┬────────┘
       └───────┬────────┘                     │
               └──────────────┬───────────────┘
                              │
               ┌──────────────▼───────────────┐
               │         Core State           │
               │      src/core/state.js       │
               │  - LocalStorage Engine       │
               │  - Day Records & Durations   │
               │  - Streak & Shields Engine   │
               └──────────────┬───────────────┘
                              │
               ┌──────────────▼───────────────┐
               │    Browser LocalStorage      │
               │  - ceed_domino_state         │
               │  - ceed_custom_dominos       │
               │  - ceed_theme                │
               │  - ceed_exam_target          │
               └──────────────────────────────┘
```

### 3.1 LocalStorage Keys & Data Shapes

#### `ceed_domino_state`
```json
{
  "records": {
    "2026-10-23": {
      "wakeTime": 1729643400000,
      "completed": ["d1", "d2", "d3", "d4"],
      "durations": {
        "d1": 120,
        "d2": 90,
        "d3": 180,
        "d4": 120
      },
      "emergency": false,
      "shieldUsed": false
    }
  },
  "streak": 5,
  "shields": 2,
  "lastShieldEarnDate": "2026-10-22",
  "theme": "dark"
}
```

#### `ceed_custom_dominos`
Stores customized or reordered domino block definitions (id, name, floor, ceiling, offset, badge, description, color).

#### `ceed_exam_target`
Stores target exam timestamp: defaults to `"2027-01-17T09:00:00+05:30"`.

---

## 4. Chronological Prompt & Implementation History

This section lists every user prompt verbatim, followed by the exact technical architectural actions and git commits implemented.

---

### Phase 1: Inception & Core Scaffolding

#### Step 0 (2026-10-23 00:13:53 IST)
**Verbatim User Prompt**:
> "I have added the .md file in the folder, so please read it and create a web application for me and also use skills that I have stated and which you have downloaded earlier. Make sure that you use /grill me before even thinking of starting development. First of all, make a solid plan, then ask me questions. Do not forget to read the files which I already added in the folder. And yeah, I will be deploying it to the Vercel. That's it.  
> `npx skills add vercel-labs/agent-skills --skill web-design-guidelines`  
> `npx skills add vercel/components.build --skill building-components`"

**Actions & Decisions**:
- Examined project folder and read foundational document `gemini-code-1792694116922md.md`.
- Formulated development plan `development-plan.md` adhering to Vercel design guidelines and clean component modularity.
- Initialized Vite + Vanilla JS + Tailwind CSS workspace.
- Configured `vercel.json` with SPA catch-all rewrites and security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).

#### Step 33 (2026-10-23 00:25:08 IST)
**User Feedback**:
> "The user has approved this document." (Plan approved)

**Actions & Decisions**:
- Executed core architecture across multi-agent pipelines:
  - `src/core/state.js`: LocalStorage state manager, streak tracker, shield bank, daily records.
  - `src/core/dominos.js`: Default circadian schedule with 7 domino/anchor blocks.
  - `src/core/streak.js`: Consecutive days algorithm and emergency mode toggling.
  - `src/components/header.js`: Wake time clock, streak counter, level badge, shield button.
  - `src/components/domino-card.js`: Modular domino card with completion toggle and timer button.
  - `src/components/duration-modal.js`: Adjuster modal for logging actual elapsed minutes.
  - `src/views/dashboard.js`: Daily view with date navigation and domino stream.
  - `src/views/heatmap.js`: 87-day calendar matrix.
  - `src/views/timer-modal.js`: Interactive timer with pause/resume and completion triggers.
  - `src/views/settings.js`: Emergency mode toggle, streak shields, and backup export/import.
- **Commit**: `7e3a1d5` — *feat: initial release of CEED 87-Day Domino Tracker PWA with Apple design system*

---

### Phase 2: Heatmap Bugfix & Brutalist Redesign

#### Step 122 (2026-10-23 00:39:49 IST)
**Verbatim User Prompt**:
> "fix this" (User uploaded screenshot showing template literal escaping errors in the heatmap view)

**Actions & Decisions**:
- Fixed escaped template literals (`\${...}`) inside `src/views/heatmap.js` that caused literal code strings to appear in the rendered DOM.
- Corrected day calculations and responsive grid styling for mobile viewports.
- **Commit**: `91573ef` — *fix(heatmap): remove escaped template literals and improve GitHub contribution matrix layout*

#### Step 136 (2026-10-23 00:43:48 IST)
**Verbatim User Prompt**:
> "Run `npx skills use "https://github.com/leonxlnx/taste-skill" --skill "industrial-brutalist-ui"` and follow the generated skill instructions now. Read its complete output, redirecting it to a temporary file first if necessary. Resolve relative paths from the supporting-files directory it provides."

**Actions & Decisions**:
- Completely overhauled aesthetic from soft Apple glassmorphism to **Industrial Brutalist Achromatic Ledger**:
  - Implemented Geist and Geist Mono typographic tokens.
  - Strict 2px borders, rectangular geometry, tactile buttons, high-contrast monospace metadata counters.
  - Dark mode with pure `#000000` ground and `#ffffff` high-contrast accents.
  - Integrated mechanical sound cue for interactions.
- **Commit**: `21dd6c8` — *feat(ui): apply industrial brutalist ledger design system via taste-skill*

---

### Phase 3: Interaction Polish & Sound Overhaul

#### Step 194 (2026-10-23 00:54:09 IST)
**Verbatim User Prompt**:
> "i dont like the confetti and the chime sound, can you give me some more options to select from"

**Actions & Decisions**:
- Completely deleted `canvas-confetti` integration and chime audio synthesizers.
- Engineered `src/utils/sound.js` using Web Audio API to produce a heavy mechanical relay switch sound (dual-frequency short square/saw impulse at 120Hz & 80Hz with exponential decay).
- Added visual haptic border-ripple feedback across completing cards.
- **Commit**: `3df046d` — *feat(feedback): replace confetti and chime with heavy mechanical relay thud and border ripple*

#### Step 214 (2026-10-23 00:58:57 IST)
**Verbatim User Prompt**:
> "i also need to reorder an edit the domino blocks so add that feature and when i tap the emergency make the whole ui transition into a red tone, also seeting should be brutalist ui too, and give me options on what you recommend can be added more to make the UX better"

**Actions & Decisions**:
- Added drag-and-drop / button-based reordering and editing of domino blocks in `src/views/settings.js`.
- Implemented global emergency theme transition: toggling Emergency Mode applies an immediate dark-red color shift (`--bg-primary: #120404`, `--border-color: #8b0000`, `--accent-primary: #ff3333`).
- Overhauled Settings view to a brutalist industrial terminal with monospace debug dumps.
- **Commit**: `e053761` — *feat: domino reordering & editing, full red emergency theme shift, and brutalist settings terminal*

#### Step 238 (2026-10-23 01:04:34 IST)
**Verbatim User Prompt**:
> "i like the ideas like Ambient Fullscreen Focus / Pomodoro Mode and Weekly Velocity & Time Burn-Down Chart"

**Actions & Decisions**:
- Built `src/components/weekly-velocity.js` to track rolling weekly focus velocity.
- Added Ambient Fullscreen Focus countdown mode inside the timer modal.
- **Commit**: `6c6db3a` — *feat: ambient fullscreen focus mode and weekly velocity burn-down ledger*

#### Step 258 (2026-10-23 01:09:52 IST)
**Verbatim User Prompt**:
> "the timer feature is behaving faulty"

**Actions & Decisions**:
- Diagnosed timer drift caused by `setInterval` lag in background tabs.
- Refactored `src/views/timer-modal.js` and `src/views/studio-proctor.js` to calculate elapsed time using wall-clock delta arithmetic (`Date.now() - startTime`).
- Guaranteed auto-save of elapsed time into domino duration state upon stop/close.
- **Commit**: `2c59a77` — *fix(timer): accurate wall-clock timestamp delta calculation and clean lifecycle event handlers*

---

### Phase 4: CEED Part B Studio Integration & Rating Removal

#### Step 276 & 280 (2026-10-23 09:53:17 IST)
**Verbatim User Prompt**:
> "I have attached a new folder named CEED Part A B. In that folder, there are questions for the three-hour domino that is solve seed CEED papers. Each day I will be solving Part A and Part B, so there are PDF in that folder. My idea was to integrate each question, each day questions into the app. First of all, give me ideas and use skill grill me so we can come up with some ideas that work. Also, if it is needed, how it will work exactly? There is a PDF named trends that explains game theory version."

**Actions & Decisions**:
- Parsed and indexed question papers from `CEED-Part-A-B/`.
- Built `src/data/part_b_questions.json` containing 87 daily studio problem sets across 5 core disciplines (Sketching, Visual Communication, Animation, Product Design, Interaction Design).
- Developed `src/views/studio-proctor.js`: A specialized 120-minute Part B simulation proctor with automatic 24-minute slot transitions and game-theoretic trend breakdowns.
- **Commit**: `056425f` — *feat: integrate CEED Part A & Part B question banks with game-theoretic studio proctor HUD*

#### Step 440 (2026-10-23 10:28:14 IST)
**Verbatim User Prompt**:
> "Well done with the Part B, Also, I would like to remove Part A and Evaluation. I will also remove the XP points. There is no reason to have XP points. Instead, the task completion leads to upgrade your level. When I tap on complete the task, whenever the task is completed, ask me a rating out of five. Honest rating. The rating system will be named as Be Honest. With each task, I want to rate my ability to complete the task. One is I did not do the task as I wanted to, and five is I did the task and I think it is a five. Ask me questions if you have any problems. Use the skill Grill Me"

**Actions & Decisions**:
- Removed Part A questions and scoring evaluation tabs.
- Removed arbitrary XP points; established task-completion leveling.
- Implemented "Be Honest" 5-star self-evaluation modal after task completion.
- **Commit**: `95d5758` — *feat: replace XP with Be Honest rating system and streamline Studio Proctor to Part B*

#### Step 514 (2026-10-23 10:38:03 IST)
**Verbatim User Prompt**:
> "Okay, I don't like the honest rating, please remove it."

**Actions & Decisions**:
- Completely purged `src/components/honest-modal.js` and all event listeners.
- Level progression transitioned directly to completed task counts (`completedTasks / 4`).
- **Commit**: `9c029de` — *feat: remove honest rating system and transition level progression to completed tasks count*

---

### Phase 5: Strava-Style Telemetry & Mandatory Domino Badge Rule

#### Step 594 (2026-10-23 10:50:21 IST)
**Verbatim User Prompt**:
> "I want to add a final feature that records the domino hour stats. The idea is if I push to do each domino a certain time, I need a log or a total hours stats into each domino. Suppose I completed two days and a domino is set for two hours, the total will be four hours. On the third day, if I only manage it for one hour, the total hours will be five hours. I still can complete it, but I have to log the timing into it. Each day we show the minimum time requirements for each domino, but when I log extra time or less time, the total hours should be reflected as stats. How can we achieve this? You are free to ask me questions. Also, you can grill me on this."

**Actions & Decisions**:
- Built cumulative hours ledger in `src/core/state.js` (`getDominoCumulativeMinutes(dominoId)`).
- Added inline duration chip adjuster on cards to edit actual logged time with ±15m/±30m quick actions.
- Introduced under-floor tagging (`UNDER`) when logged time is below minimum recommended floor without breaking streaks.
- **Commit**: `78f971e` — *feat: add domino hour stats tracking, inline duration adjuster, and master hours ledger*

#### Step 662 (2026-10-23 11:05:27 IST)
**Verbatim User Prompt**:
> "One more condition I want to add. If the batch code is named domino, then only you will consider it as a timed task, and you will not consider anything else as tasks. Right now there are four dominos, so there are four dominos, and if something named domino is added, you can add it as a time task and its completion is mandatory. Anything else is not mandatory. Use skill grill me on it. Come up with an idea similar to what I'm talking. Basically ask me questions on how will we implement this and if you are able to understand the task."

**Actions & Decisions**:
- Formulated `isDominoTask(d)`: checks `d.badge.toUpperCase().includes('DOMINO')`.
- Rewrote streak calculator, focus hour aggregates, and leveling: non-domino tasks (Launchpad, Siesta, Night) are completely excluded from streak failure conditions and study statistics.
- Updated settings editor with visual `[MANDATORY DOMINO]` vs `[ROUTINE]` tags.
- **Commit**: `785a6ef` — *feat: enforce mandatory DOMINO badge rule for streak, focus hours, and leveling*

#### Step 710 (2026-10-23 11:16:38 IST)
**Verbatim User Prompt**:
> "I want the momentum matrix to mimic the GitHub commit matrix... If we can create a separate page for stats for every stat like nitpicky stats stats. I want it to feel like really optimized like Strava shows you the stats of kilometers and other stats. That kind of thingy but with this app. What can we do about this? Ask me questions. Use skill/grill me. Grill me. Yeah, thank you."

**Actions & Decisions**:
- Built dedicated `#/stats` view with Strava-style athletic telemetry:
  - 4 Big Number Gauges: Cumulative Focus Hours, Current / Longest Streak, Floor Adherence %, Active Days.
  - 500-Hour Mastery Progress Bar toward CEED exam readiness.
  - Personal Records (PRs) Board: Highest single-day focus volume, longest streak, discipline masteries.
  - Per-Domino split breakdowns and floor adherence percentages.
  - Authentic GitHub 5-tier green contribution matrix with hover HUD tooltips.
- **Commit**: `c53e8ae` — *feat: implement GitHub green contribution matrix and Strava-style athletic telemetry page*

#### Step 772 (2026-10-23 11:25:00 IST)
**Verbatim User Prompt**:
> "Now let's do a final check before I upload this to GitHub and Vercel. In final check, I want you to test everything. Also, make sure that the stats are downloadable, the stats are saved, and the time is logged. Make sure that everything works. Report me about how the website is looking, and if you have any recommendations or suggestions, I'm open to hear."

**Actions & Decisions**:
- Verified full build and zero errors.
- Added CSV and JSON export engines in `src/core/telemetry.js` (`exportTelemetryCSV()`, `exportTelemetryJSON()`) with instant browser downloads.
- Authored comprehensive `README.md`.
- **Commit**: `d41d3d8` — *docs: add comprehensive README and implement CSV and JSON telemetry exports*

---

### Phase 6: iPhone 12 Optimization & GitHub Deployment

#### Step 814 (2026-10-23 11:46:21 IST)
**Verbatim User Prompt**:
> "When I open my site on iPhone 12, it is too much cramped. There is too much text. I don't want to see that too much text on it. Can you do something about it? Can you recommend me what to do, what not to do? You have all the permissions to do anything, but I will be using my iPhone 12 and it is not optimized at all for it. Please do something about it. Ask me multiple questions if you want to clarify."

**Actions & Decisions**:
- Tailored UI specifically for iPhone 12's 390px viewport:
  - Compressed header into a single line with abbreviated badges.
  - Collapsed card descriptions by default with subtle disclosure toggles.
  - Relocated heavy velocity charts and contribution heatmaps entirely to the `#/stats` page, leaving the dashboard clean and action-oriented.
  - Integrated CSS `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)`.
- **Commit**: `a69901d` — *perf: optimize UI for iPhone 12 with safe-areas, collapsible cards, single-line header, and uncluttered dashboard*

#### Step 867 (2026-10-23 11:53:00 IST)
**Verbatim User Prompt**:
> "now push this to https://github.com/shrinathpande/ceed-domino.git"

**Actions & Decisions**:
- Linked remote `origin` to `https://github.com/shrinathpande/ceed-domino.git` on branch `main` and pushed all commits cleanly.

---

### Phase 7: Touch Interactions, AMOLED Dark Theme & Exam Countdown

#### Step 881 (2026-10-23 12:03:17 IST)
**Verbatim User Prompt**:
> "The studio section is still not optimized for iPhone 12. Ask me questions and optimize it accordingly. Also, the dropdown is not too accessible. Make it such that if I tap the card, it expands. I do not want to tap the arrow which is barely touchable. Add interactions."

**Actions & Decisions**:
- Modified `src/components/domino-card.js`: Card body is directly clickable/tappable to expand or collapse details. Buttons (Timer, Complete, Duration) cancel event bubbling to prevent accidental collapse.
- Refactored `src/views/studio-proctor.js` with sticky HUD timer header and streamlined question cards for 390px mobile screens.
- **Commit**: `b85b099` — *feat: make domino card body tappable to expand and optimize Studio Proctor HUD for iPhone 12*

#### Step 907 (2026-10-23 12:10:42 IST)
**Verbatim User Prompt**:
> "I want to make changes for the colors of the dark theme. The blue accent is not really my thing, make it white. Each domino, if a card is set to be a domino, then the card shall have a different color. I will name the color as color-2, and the accent color will be color-1. The blue accent shall be removed. Instead, I will give you the color named color-1, and the white shall be replaced with color-2. Color-1 is #d4e0ff and color-2 is #FFCFE5"

**Actions & Decisions**:
- Replaced blue accents with `#d4e0ff` and customized domino card highlights with `#FFCFE5`.
- **Commit**: `02b2860` — *feat: customize dark theme with color-1 (#d4e0ff) accent and color-2 (#FFCFE5) domino card styling*

#### Step 943 (2026-10-23 12:14:04 IST)
**Verbatim User Prompt**:
> "run dev"

**Actions & Decisions**:
- Added `server: { host: true }` to `vite.config.js` to enable local network access from mobile devices.
- **Commit**: `823fe1a` — *chore: enable host listening for local network mobile testing*

#### Step 967 (2026-10-23 12:15:42 IST)
**Verbatim User Prompt**:
> "i want the dark theme to be pure black, amoled black and reset the colours"

**Actions & Decisions**:
- Reset theme from pastel tints to pure **AMOLED Black (`#000000`)** ground.
- Set high-contrast pure white (`#ffffff`) text and borders.
- Re-established minimalist industrial monochrome discipline.
- **Commit**: `b02a0d4` — *style: configure pure AMOLED black (#000000) dark theme and reset colors to high-contrast monochrome*

#### Step 987 (2026-10-23 12:18:20 IST)
**Verbatim User Prompt**:
> "The domino accent color should be #FF69AF"

**Actions & Decisions**:
- Defined `--domino-accent: #FF69AF` in `src/style.css`.
- Applied `#FF69AF` accent to mandatory domino badge tags, timer active states, and completion indicators.
- **Commit**: `01097fb` — *style: set domino accent color to #FF69AF across mandatory blocks and completion cues*

#### Step 1007 (2026-10-23 12:21:21 IST)
**Verbatim User Prompt**:
> "remove the Left accent border: crisp and add the whole border when completed"

**Actions & Decisions**:
- Removed the thick left border stripe (`border-l-4` / `border-l-2`) from domino cards.
- Configured completed cards to light up with a full 2px `#FF69AF` perimeter border (`border-2 border-[#FF69AF]`).
- **Commit**: `c4ca822` — *style: remove thick left accent border and highlight entire card border with #FF69AF on completion*

#### Step 1027 (2026-10-23 12:25:34 IST)
**Verbatim User Prompt**:
> "On the header, can you add the remaining time like days, hours till 17th of Jan, which is the exam date? Ask me questions on how to place the timer. Update the timer daily. How will it work? How will it perform? How will it look? Ask me all the questions necessary for it and implement it. Thank you."

**Actions & Decisions**:
- Engineered `getExamCountdown()` in `src/utils/dates.js`, targeting **January 17, 2027 at 09:00:00 IST**.
- Added compact countdown pill in `src/components/header.js` displaying `[XXd remaining]`.
- Tapping the pill displays a detailed breakdown toast (`XX days, YY hours, ZZ minutes until CEED 2027 Exam`).
- Updates dynamically on an interval and refreshes cleanly with zero layout shift on mobile headers.
- **Commit**: `aa6bc59` — *feat: add compact exam countdown pill to header targeting Jan 17 at 9:00 AM with tap details*

#### Step 1053 (2026-10-23 12:33:34 IST)
**Verbatim User Prompt**:
> "thanks!"

---

## 5. File Structure & Component Registry

```
CEED DOMINO/
├── .github/
├── CEED-Part-A-B/                # Source question paper PDFs and trends analysis
├── public/                       # PWA manifest, service worker icons
├── src/
│   ├── components/
│   │   ├── backup-controls.js    # JSON state export and file import restore
│   │   ├── domino-card.js        # Collapsible card, full-border completion, tap-to-expand
│   │   ├── duration-modal.js     # ±15m/±30m duration adjuster modal
│   │   ├── header.js             # Compact single-line header with countdown pill
│   │   ├── navigation.js         # Bottom dock navigation with iOS safe-area support
│   │   ├── theme-toggle.js       # Light / Dark / AMOLED system toggle
│   │   └── weekly-velocity.js    # 7-day rolling hours bar chart
│   ├── core/
│   │   ├── dominos.js            # Default schedule definition & isDominoTask()
│   │   ├── notifications.js      # Web notifications & navigator.vibrate()
│   │   ├── state.js              # LocalStorage engine, day records, hours ledger
│   │   ├── streak.js             # Consecutive streak, shield bank, emergency logic
│   │   └── telemetry.js          # Athletic stats: PRs, splits, CSV/JSON exports
│   ├── data/
│   │   └── part_b_questions.json # 87-day Part B questions bank
│   ├── icons/
│   │   └── index.js              # Lightweight inline SVG stroke icons
│   ├── utils/
│   │   ├── dates.js              # Date calculations, phase offsets, exam countdown
│   │   ├── format.js             # formatMins(m) helper (e.g. "2h 30m")
│   │   └── sound.js              # Web Audio API mechanical relay click synthesis
│   ├── views/
│   │   ├── dashboard.js          # Focused today stream, emergency toggle, date picker
│   │   ├── heatmap.js            # Authentic 87-day GitHub green matrix & tooltip HUD
│   │   ├── settings.js           # Reorderable domino pillars, shields, exam target
│   │   ├── stats.js              # Strava-style athletic telemetry dashboard
│   │   ├── studio-proctor.js     # 120m CEED Part B exam proctor with 24m auto-slots
│   │   └── timer-modal.js        # Wall-clock delta timer with ambient mode
│   ├── app.js                    # Hash-based SPA client router
│   ├── main.js                   # Application entry point
│   └── style.css                 # AMOLED black theme, CSS variables, typography
├── index.html                    # Root HTML document with mobile meta tags
├── package.json                  # Dependencies (Vite 8, Tailwind v4, PWA plugin)
├── vercel.json                   # Vercel deployment configuration
├── vite.config.js                # Vite build pipeline with PWA & host configuration
├── README.md                     # Project overview documentation
└── PROJECT_LOG.md                # This document
```

---

## 6. AI Continuation Directives for Gemini Argon 4

When you (Gemini Argon 4) take over this project, execute tasks following this playbook:

### 6.1 Architectural Mandates
1. **Never Break `isDominoTask()`**:
   ```javascript
   export function isDominoTask(domino) {
     if (!domino || !domino.badge) return false;
     return domino.badge.toUpperCase().includes('DOMINO');
   }
   ```
   Any feature touching streaks, total hours, or leveling must use this check.
2. **Never Add External Servers or Auth**: All records belong to the user's local browser storage. If syncing across devices is desired in the future, use standard file-based backup (`backup-controls.js`) or local peer-to-peer / WebRTC protocols.
3. **No External Audio Assets**:
   Use `playRelayClick()` from `src/utils/sound.js`. It generates click sounds programmatically via the Web Audio API without network fetches.
4. **Mobile Performance Rule**:
   Test every layout against the iPhone 12 viewport (390px width). Never allow horizontal overflow or buttons smaller than 44×44px touch targets. Keep card bodies expandable via tap.

### 6.2 Recommended Next Steps & Future Roadmap
If the user asks what to build or improve next, consider these high-leverage directions:

1. **Ambient Fullscreen Pomodoro HUD Expansion**:
   - Enhance the fullscreen focus mode in `src/views/timer-modal.js` with an ultra-minimal OLED screensaver display (showing only massive monospace countdown digits and the current domino name).
2. **Exam Countdown Granular Controls**:
   - Provide an option in Settings to toggle the header pill between `Compact` (`[78d remaining]`) and `Live Ticker` (`[78d 14h 22m]`).
3. **Offline Part B Sketch Template Export**:
   - Add a "Print A4 Grid Template" button inside `src/views/studio-proctor.js` that triggers a print-optimized CSS layout for physical sketching.
4. **Automated Weekly CSV Backup Prompt**:
   - If the user has accumulated more than 7 days of unbacked data, surface a discreet brutalist prompt to download a backup JSON file.
5. **Dynamic PWA Icon Badge**:
   - Utilize the App Badging API (`navigator.setAppBadge`) to display remaining uncompleted dominos on the home screen icon.

---

## 7. CEED Domino v2.0 Major Upgrade (Argoncodes Integration)

**Date**: November 1, 2026  
**Trigger**: Complete integration and reconciliation of new modules from `Argoncodes/` into core codebase.

### 7.1 Grill-Me Critical Alignment & Architectural Decisions
Before modifying code, the upgrade plan was grilled against core requirements and four key architectural decisions were aligned:
1. **Header & Navigation**: View-specific headers (Dashboard, Studio, Stats, Settings) each host their own integrated top instrument header displaying the compact Jan 17, 2027 09:00 AM IST countdown pill (`[XXd remaining]`) with tap-for-toast details, while the bottom navigation dock remains persistent.
2. **LocalStorage Migration**: Automatic on-mount migration implemented in `src/core/state.js`. Legacy state from `ceed_domino_state_v2` is seamlessly converted into `ceed_v2_state`, preserving historical records, completed tasks, and streak progress.
3. **Curated Question Bank**: The complete 87-day IIT Bombay question bank from `src/data/part_b_questions.json` (415 KB) is wired directly into the redesigned Part B Studio Deck, retaining calendar alignment and jump-to-day functionality.
4. **Non-Blocking Mobile Alarms**: Replaced thread-blocking `window.alert()` calls with synthesized Web Audio multi-tone harmonic chimes (`playAlarmTone()`), tactile in-app notification toasts, and standard native Notifications.

### 7.2 Deployed v2.0 Modules & File Registry
1. **`src/utils/lockscreen-timer.js`**:
   - Zero external audio files: Generates an in-memory 1-second silent mono 8kHz PCM WAV Data URI via pure JavaScript.
   - Live media session integration (`navigator.mediaSession`) broadcasting timer title, elapsed minutes/seconds, block badge, and target hours to the iPhone 12 Lock Screen.
   - Remote lock-screen `pause` and `stop` action handlers that auto-commit elapsed study time.
2. **`src/utils/sound.js`**:
   - Web Audio API dual-stage relay snap/thud (`playDing()` / `playRelayClick()`).
   - Pure sine-harmonic cascade chime (`playAlarmTone()`, 880Hz -> 1760Hz) for checkpoint alarms.
3. **`src/core/state.js`**:
   - Keys: `ceed_v2_state`, `ceed_v2_blocks`, `ceed_v2_alarms`.
   - Time-independent hour logger: Users can log hours at any time without wall-clock schedule restrictions.
   - Daily 35-Question Part A Micro-Counter (`logPartAQuestions`): Tracks daily Part A question count, automatically awarding +1.0h study credit to Paperwork Domino (`d3`) upon hitting 35/35.
   - Circadian Peak Productive Hour Analyzer: Aggregates timestamped logs into 4 biological windows (Morning 05:00–11:59, Afternoon 12:00–16:59, Evening 17:00–20:59, Night 21:00–04:59).
4. **`src/views/dashboard.js`**:
   - Dual Daily Hour Ledger (Study Hours vs. Total Productive Hours).
   - 4 Core Domino Cards with live progress bars and `#FF69AF` full-perimeter completion borders.
   - Tap-anywhere card body expansion.
   - Embedded Part A Micro-Counter with `-5`, `+5`, `+10`, and `35/35` quick buttons.
   - Checkpoint Alarms drawer (06:00 AM to 11:00 PM) with 1-tap quick actions (+1.5H WALK, +2H STUDY, etc.).
5. **`src/views/stats.js`**:
   - 4 Master Athletic Gauges (Cumulative Study, Cumulative Work, Total Productive, Domino Streak/Level).
   - Peak Biological Output breakdown bars with top window highlight.
   - 500-Hour Mastery Progress Bar & 3,045 Part A Campaign Progress Bar.
   - Authentic 87-Day GitHub 5-Tier Green Contribution Matrix with cell inspection HUD.
   - Single-click CSV and JSON data export downloads.
6. **`src/views/studio-proctor.js`**:
   - 4-Zone iPhone 12 layout: Sticky top HUD bar, 5-Pill Question Switcher (`SKETCH`, `PROD`, `VCD`, `ANIM`, `IXD`), single focused briefing card with collapsible Trend and Checklist drawers, and direct study domino sync.
   - OLED Desk Clock Mode for distraction-free physical sketching against desk-mounted timer.
7. **`src/views/settings.js`**:
   - System Terminal Configuration with live Domino Pillar and Badge editor.
   - Emergency Mode (Streak Saver) with 2-consecutive-day block rule and red theme shift.
   - Streak Shield Bank management.
   - Full JSON state backup and restore.

---

## 8. Radical OLED Experience & UX Overhaul (Skill-Driven Revamp)

**Date**: November 1, 2026  
**Trigger**: Complete UX, UI, and motion overhaul executed via `frontend-design`, `ui-taste`, `grill-with-docs`, `web-design-guidelines`, and `impeccable`.

### 8.1 Critical UX Bug Fixes (Clicking Resiliency & Toast Dismissal)
1. **iOS Safari `role="button"` Fix**: Cards converted into accessible touch targets with `role="button"`, `tabindex="0"`, and `min-h-[56px]`, eliminating dropped taps in mobile WebKit.
2. **Schema Array Protection**: Implemented `normalizeDayRecord` in `src/core/state.js` guaranteeing `rec.completed` is always an `Array`. Prevents fatal `TypeError: rec.completed.includes is not a function` when inspecting legacy records.
3. **Event Propagation Insulation**: All nested interactive buttons (`✓`, `🔒 TIMER`, `+0.5h`, `-5 Qs`, `35/35`) call `e.stopPropagation()` and feature dedicated spring scaling (`btn-tactile active:scale-96`), preventing accidental card collapse while logging.
4. **Toast Auto-Dismissal & Tap-to-Close Fix**: Rewrote `showInAppToast` in `src/components/header.js` with direct inline transition transforms (`translate(-50%, -10px)`) and `display: none` cleanup after 2.8s. Added tap-to-dismiss and `✕` close button, ensuring countdown details popups never remain stuck on screen.

### 8.2 Three Selectable Themes
1. **Cyber-Tactile OLED (`cyber`, Default)**: Pure AMOLED `#000000` ground, rich `#0c0c0c` charcoal surfaces, 10px pill curvatures, refined borders, spring motion (`cubic-bezier(0.16, 1, 0.3, 1)`), and `#FF69AF` accents.
2. **Industrial Brutalist (`brutalist`)**: Strict 0px rectangular geometry, raw monospace tokens, and sharp wireframe borders.
3. **Stealth Monochrome (`stealth`)**: High-contrast pure white on pitch black with graphite `#1f1f1f` dividers.
- **Instant 1-Tap Theme Switching**: Available on the Top Instrument Header and in Settings.

### 8.3 Mobile Motion & Navigation Upgrades
1. **Horizontal Swipe Gesture Navigation (`src/utils/gestures.js`)**: Fluid swipe left/right across screens (`TODAY` ⇄ `STATS` ⇄ `STUDIO` ⇄ `CONFIG`) with tactile haptic notch ticks.
2. **Top Instrument Header (`src/components/header.js`)**: Single-line compact header with C87 stamp, DXX day tracker, level indicator, exam countdown pill (`[XXd remaining]`), 3-theme toggle, shields, and streak counter.
3. **Screen Wake Lock API (`src/views/studio-proctor.js`)**: OLED Desk Clock Mode acquires a native screen wake lock (`navigator.wakeLock`) so the iPhone 12 display stays permanently awake during physical sketching drills on paper.

---

## 9. Precision Time Slider, Dedicated Timer Cell & Part A Elimination

**Date**: November 1, 2026  
**Commit Focus**: Tactile Ergonomics & Decluttering

### 9.1 Precision OLED Time Slider
- **User Problem**: The 8-button block grid (`+0.5h`, `+1.0h`, `+1.5h`, `+2.0h`, `+3.0h`, `+4.0h`, `-0.5h`, `TIMER`) was visually loud, bulky on iPhone 12 viewports, and inflexible for logging arbitrary times (e.g. 45m, 1h 15m, 2h 45m).
- **Solution**:
  - Replaced the button block grid with a sleek custom OLED range slider (`min="0"`, `max="360"`, `step="15"` minutes).
  - Features a glowing `#FF69AF` thumb, active scale bounce (`scale(1.25)`), and smooth gradient fill representing logged progress against target.
  - Paired with tactile `-15m` and `+15m` quick stepper buttons and a live readout: `${(loggedMins / 60).toFixed(1)}h (${loggedMins}m)`.
  - Backed by `setDominoDuration(blockId, dateStr, durationMins)` in `src/core/state.js`, triggering instant state persistence and mechanical relay click audio.

### 9.2 Dedicated Timer Cell
- **User Problem**: The stopwatch timer button was buried inside the hour button grid, leading to accidental timer activation or confusion about active timer status.
- **Solution**:
  - Isolated the timer into a prominent, dedicated card cell right below the time slider.
  - Displays clear operational status:
    * Idle: `🔒 [Domino Name] Timer — Lock-Screen Live Activity Ready` with white `START TIMER` button.
    * Running: `⏱️ [Domino Name] Timer — LIVE TIMER RUNNING` with neon pink pulse border and high-contrast `STOP & COMMIT` button.
  - Completely decoupled from duration adjustments to prevent misclicks.

### 9.3 Elimination of Part A Section from Domino 3
- **User Problem**: The Part A drill micro-counter (`-5`, `+5`, `+10`, `35/35`) and Part A progress bars were deemed unnecessary and distracting from the core domino focus.
- **Solution**:
  - Completely removed the Part A micro-counter drawer, question buttons, and badges from Domino 3 (`d3: Paperwork & CEED Sprint`).
  - Removed Part A question count indicators from the Today dashboard header metrics.
  - Removed the Part A 3,045 question campaign progress bar from `src/views/stats.js`, keeping the Stats view focused purely on the 500-Hour Mastery campaign and circadian telemetry.
  - Removed `hasPartACounter` flag from `DEFAULT_BLOCKS` in `src/core/state.js`.

### 9.4 Two-Way Toggle & Uncheck Progress Bar Reset
- **User Problem**: When unchecking a completed domino or tapping on the '3.0h' duration label, the pink progress bar did not go off (persisted at 100%), and tapping on the '3.0h' text did not untap/uncheck the domino.
- **Root Causes**:
  1. `data-manual-toggle` previously only removed the block from `rec.completed` without resetting `rec.durations[id]` to 0, leaving `loggedMins = 180` and `pct = 100%`.
  2. The `3.0h / 3.0h` text container was an inert `div` without `data-manual-toggle`, so tapping the hours readout did not trigger completion toggling.
  3. `setDominoDuration` and `logHours` only removed a block from `rec.completed` when minutes hit exactly 0, rather than whenever duration dropped below `effectiveTarget`.
- **Solution**:
  - Unified the `3.0h / 3.0h` hours readout and the `✓`/`○` button into a single interactive `<button data-manual-toggle>` touch target.
  - In `data-manual-toggle`: unchecking now resets `rec.durations[id] = 0`, clears `rec.completed`, recalculates the streak, flushes state, and immediately empties the progress bar to 0% (`0.0h / 3.0h`). Checking sets duration to `targetMins` and fills the bar to 100%.
  - Updated `setDominoDuration` and `logHours` in `src/core/state.js` to automatically uncheck whenever logged minutes drop below `effectiveTarget`.

### 10. Complete UX Architecture Revamp & Customization Overhaul

**Date**: November 1, 2026  
**Trigger**: Direct user UX alignment and decisive 10-point architecture blueprint.

### 10.1 Domino Card Face & Tap Model
- **Two-Way Completion Model**:
  - Tapping the dedicated square corner button (`✓`/`○`) completes the domino (sets duration to target floor, fills high-contrast bar to 100%, illuminates full neon border) OR uncompletes it (resets duration to 0.0h, empties bar to 0%, reverts border to neutral).
  - Tapping this corner button is isolated with `e.stopPropagation()` and `e.preventDefault()`, so it never accidentally expands/collapses the card.
- **Card Tap Affordance**:
  - Tapping the card body opens the drawer for time customization.
  - Inside the drawer: precision range slider with live readout `${(val/60).toFixed(1)}h (${val}m)` + `-15m` and `+15m` quick steppers.
- **Direct Card Face Timer**:
  - Direct `[ ▶ TIMER ]` / `[ ⏹ STOP ]` button located directly on each card face.
  - Starting the timer displays a prominent live stopwatch banner directly nested within that card on the Today page (`[ ⏱️ LIVE SESSION: mm:ss ] [ Lock-Screen Active ]`).
- **High-Contrast Percentage Hierarchy**:
  - Card face clearly displays percentage badge (`100%`, `67%`) and hours `(2.0h / 3.0h)` right next to title with a high-contrast liquid progress bar.

### 10.2 Complete Removal of Checkpoint Alarm Drawer
- Removed the 6 AM - 11 PM Checkpoint alarms drawer from the Today dashboard as requested.

### 10.3 Stats View Reorganization
- **87-Day Campaign Matrix on Top**: The 87-Day GitHub-style contribution matrix is now the first element at the top of the Stats view with day inspection HUD.
- **CEED Master Ledger (500h)**: Pinned directly beneath the campaign matrix, tracking cumulative productive hours against the 500h target.
- **Removed Per-Pillar Cumulative Breakdown**: Removed the redundant per-pillar list, streamlining the view to the 4 athletic gauges, circadian biological peak analyzer, and data exports.

### 10.4 Config & Terminal Customization
- **Custom Accent Color Chooser**:
  - Added native color picker (`<input type="color">`), hex code text input, live glowing preview swatch, and 6 instant OLED neon presets (`#FF69AF`, `#00E5FF`, `#10B981`, `#F59E0B`, `#8B5CF6`, `#FFFFFF`).
  - Automatically updates `--domino-accent` across CSS variables and localStorage (`settings.accentColor`).
- **Emergency Mode Removed**: Completely purged from settings, CSS, and UI.
- **Fully Customizable Domino Pillars & Badges**:
  - Non-hardcoded: users can edit badges, titles, categories (`STUDY`, `WORK`, `WALK`, `REST`, `OTHER`), and target floor hours.
  - Added `[ + ADD NEW DOMINO PILLAR ]` button to create custom pillars.
  - Added delete buttons (`✕`) for removing pillars.

### 11. Complete Visual & UX Transformation: Expressive Data-Driven Tactility

**Date**: November 1, 2026  
**Inspiration & Paradigms**: Bía Sleep, Moonbeam Analytics, Robinhood, and Ron Design Scheduler.

### 11.1 The New Visual Design System
- **Surfaces & Radii**:
  - Pure OLED Black ground (`#000000`).
  - Matte Obsidian Bento Cards (`#121215`, `22px` border radius, `p-5`, whisper-quiet `1px solid rgba(255, 255, 255, 0.07)` border).
  - Nested Sub-Cards (`#1A1A1F`, `14px` border radius).
- **Typography**:
  - Hero Metrics: `40px` tight bold sans-serif (`Inter` / `Geist Sans`, `tracking-tight`, `#FFFFFF`).
  - Card Titles: `17px` bold sans-serif (`#F4F4F5`).
  - Readouts & Tabular Metrics: `13px` tabular monospace (`Geist Mono`, `font-variant-numeric: tabular-nums`).
  - Muted Labels: `12px` medium sans-serif (`#71717A`).
- **Semantic Tinted Status Pills (`src/components/status-pill.js`)**:
  - Standardized pill helper supporting:
    - `COMPLETED`: bg `rgba(16, 185, 129, 0.14)`, border `rgba(16, 185, 129, 0.4)`, text `#34D399`, icon `✓`.
    - `LIVE / ACTIVE`: bg `rgba(59, 130, 246, 0.15)`, border `rgba(59, 130, 246, 0.45)`, text `#60A5FA`, icon `↗`.
    - `PENDING`: bg `rgba(245, 158, 11, 0.14)`, border `rgba(245, 158, 11, 0.4)`, text `#FBBF24`, icon `!`.
    - `UNDER_FLOOR`: bg `rgba(239, 68, 68, 0.14)`, border `rgba(239, 68, 68, 0.4)`, text `#F87171`, icon `✕`.
    - `ROUTINE`: bg `rgba(161, 161, 170, 0.12)`, border `rgba(161, 161, 170, 0.3)`, text `#A1A1AA`, icon `🕒`.

### 11.2 Global Navigation & 7-Day Calendar Strip
- **Top Instrument Header (`src/components/header.js`)**:
  - Single clean row: `Day XX of 87` + inline `[76d to CEED]` pill on left, `🔥 Xd` streak pill and `🛡️ X` shield badge on right.
  - Removed 3-theme switcher buttons from header and silenced noisy routine toast popups.
- **7-Day Horizontal Circular Calendar Strip (`src/views/dashboard.js`)**:
  - Directly beneath header on `Today`: `Mon Tue Wed Thu Fri Sat Sun` above 7 circular date buttons (`38x38px`, `rounded-full`).
  - Active date filled with `--domino-accent` and bold dark text. Past completed days marked with subtle bottom dot indicator. Tapping switches `activeDateStr` instantly.
- **Floating Bottom Navigation Dock (`src/components/bottom-dock.js`)**:
  - Moved `Today`, `Stats`, `Studio`, `Config` tabs to a floating bottom dock (`rounded-full`, `#16161A/90` with `backdrop-blur-md`, `border: 1px solid rgba(255,255,255,0.08)`, respecting safe area padding).

### 11.3 Today View Overhaul
- **Removed**: Redundant "+ Quick Log Activity" and "Today's Activity Log" boxes.
- **Hero Output & Chunky Segmented Allocation Card**:
  - Total Daily Output label + `40px` hero metric + right-aligned semantic status pill.
  - 1-sentence dynamic narrative with inline pill badge.
  - **36px Tall Segmented Allocation Bar**: Proportional rounded rectangles colored by pillar palette (`#34D399`, `#FF69AF`, `#A855F7`, `#38BDF8`) + vertical hatch pattern (`bg-hatch`) for remaining unlogged target time.
  - **2-Column Vertical-Bar Legend**: 2x2 grid with 3px vertical colored bars, pillar name, logged hours, and share percentage.
- **Expressive Domino Cards**:
  - Card face: Semantic Status Pill, hours fraction (`2.0h / 2.0h`), and `38x38px` circular check button (`✓`/`○`).
  - 3-Texture Progress Bar (Solid color fill + Hatched timer pattern + Track).
  - Tactile Ruler Slider inside single-expanded drawer with `-15m`/`+15m` circular buttons and high-contrast solid white pill CTA button (`▶ Start Timer` / `⏹ Stop Session`).

### 11.4 Stats View (Bento Architecture)
- **Top Row**: 2 Mini Bento Cards (`Active Days / Consistency` + `500h Mastery Progress` with 3-texture bar).
- **Consistency Matrix**: `13x7` rounded cells in sky-blue/accent shades + 1-line interactive inspection subtitle.
- **2-Column Streak Bento**: Current Streak (`🔥 X days` + 7 circular day indicators) + Longest Streak (`🔥 Y days` + date range).
- **Volume & Allocation Card**: Multi-segment horizontal bar with 4px gaps + 4-color dot legend.
- **`✦ Domino Intelligence` Card**: Warm amber header + dynamic 2-sentence analytical summary with bold white metrics.
- **Footer**: Clean pill buttons for `Export CSV` and `Backup JSON`.

### 11.5 Studio View (Asymmetric Peek Card Layout)
- **Top Navigation Pill**: `< Day XX of 87 >` + `Q1  Q2  Q3  Q4  Q5` circular/pill switcher.
- **Asymmetric Peek Card Layout**:
  - Left Card (82% width): High-contrast card with semantic pill (`20 Marks • 24m`), question title, and clean 14px prompt body.
  - Right Vertical Peek Card (18% width): Rotated vertical tab `Strategy & Checklist`. Tapping it smoothly flips sizes to 82%/18% with zero vertical scrolling, revealing examiner trend notes and 4-step checklist!
- **Bottom Floating Scheduler Bar**: Live countdown (`24:00`), `⛶ OLED` button for Fullscreen Desk Clock with Screen Wake Lock, and solid white pill CTA button (`▶ Start Drill` / `✓ Finish & Log`).

### 11.6 Config View
- Bento cards with 22px radii.
- Accent Palette Picker: 6 glowing circular swatches (`#FF69AF`, `#38BDF8`, `#10B981`, `#F59E0B`, `#A855F7`, `#FFFFFF`) with zero toast spam + custom hex input.
- Domino Architecture Editor: Clean bento rows with title input, category pill selector, target hour `-0.5h / +0.5h` steppers, delete, and `+ Add New Domino Pillar`.
- Backup & Reset pill buttons.

---

*This document was compiled directly from repository commits, transcripts, and verified codebase state.*
