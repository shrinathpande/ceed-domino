/**
 * MITRA — CEED 2027 AIR 1 Structured Master Data
 * Single Source of Truth for the 54-Day Sprint (Nov 24, 2026 – Jan 17, 2027)
 */

export const MITRA_METADATA = {
  systemName: 'MITRA (Solar Precision Architecture)',
  targetExam: 'CEED 2027 (IIT Bombay IDC)',
  examDate: '2027-01-17',
  examWindow: '09:00 - 12:00 IST (Part A: 09:00-10:00 | Part B: 10:00-12:00)',
  admitCardDate: '2027-01-01T13:00:00+05:30',
  targetRank: 'AIR 1 (General / Open Category)',
  campaignWindow: 'Day 0: 2026-11-24 | Days 1-53: 2026-11-25 to 2027-01-16 | Day 54: 2027-01-17',
  totalDays: 54,
  formula: '0.25 * Part A (150) + 0.75 * Part B (100)',
  totalMeritMax: 112.5,
  baselineMerit: 63.5,
  targetMeritMin: 91.0,
  targetMeritMax: 95.0,
  targetPartAMin: 112,
  targetPartAMax: 122,
  targetPartBMin: 80,
  targetPartBMax: 86
};

export const MITRA_SECTIONS = [
  {
    id: 'part_a_nat',
    title: 'Part A — Section I: NAT',
    questions: 8,
    marksPerQ: 4,
    negativeMarks: 0,
    maxMarks: 32,
    targetScore: '24–28 / 32 (75–88%)',
    timeAllocation: '15m (1.87m / Q)',
    protocol: '100% attempt rate mandatory. Zero negative penalty. Verify 3D cavities, complement counting, and π value.'
  },
  {
    id: 'part_a_msq',
    title: 'Part A — Section II: MSQ',
    questions: 10,
    marksPerQ: 4,
    negativeMarks: -1,
    maxMarks: 40,
    targetScore: '28–32 / 40 (≤1 penalty)',
    timeAllocation: '15m (1.50m / Q)',
    protocol: 'Partial harvesting theorem: 2-option sweet spot has 61.5% historical accuracy. Never guess a 3rd/4th option without ≥75% certainty.'
  },
  {
    id: 'part_a_mcq',
    title: 'Part A — Section III: MCQ',
    questions: 26,
    marksPerQ: 3,
    negativeMarks: -0.5,
    maxMarks: 78,
    targetScore: '60–66 / 78 (≥80% acc)',
    timeAllocation: '25m (0.96m / Q)',
    protocol: '1:6 risk-reward ratio. Eliminate 1 option -> EV = +0.67; eliminate 2 options -> EV = +1.25. Commit when narrowed to 2 options.'
  },
  {
    id: 'part_b_mandatory',
    title: 'Part B — Q1 to Q5 Mandatory',
    questions: 5,
    marksPerQ: 20,
    negativeMarks: 0,
    maxMarks: 100,
    targetScore: '80–86 / 100',
    timeAllocation: '120m (24m hard stop / Q)',
    protocol: '3x Final Merit Leverage! Strict 24-minute allocation per 20-mark slot. At min 22 accent line weights, at min 24 turn page.'
  }
];

export const MITRA_TIMETABLE = [
  {
    start: '06:00',
    end: '06:15',
    tag: 'BIO',
    name: 'Solar Ignition',
    protocol: 'Alarm wake (zero snooze), 500 ml water + pinch of salt, 5–10 min outdoor morning sky light. Zero phone.'
  },
  {
    start: '06:15',
    end: '07:45',
    tag: 'BIO',
    name: 'Exercise & Conditioning (1.5h)',
    protocol: 'Mon/Wed/Fri: Resistance training; Tue/Thu/Sat/Sun: Zone-2 cardio + mobility. Elevates BDNF and executive focus.'
  },
  {
    start: '07:45',
    end: '08:05',
    tag: 'BIO',
    name: 'Bath & Cold Finish',
    protocol: 'Shower with 60–90s cool finish for clean alertness.'
  },
  {
    start: '08:05',
    end: '08:20',
    tag: 'NEURO',
    name: 'Meditation & Box Breathing',
    protocol: '15-min seated box breathing (4-4-4-4) and stillness transition into executive precision.'
  },
  {
    start: '08:20',
    end: '08:45',
    tag: 'BIO',
    name: 'Breakfast + Caffeine #1',
    protocol: 'High-protein, low-GI meal. Caffeine Dose #1 (100–150 mg) at 08:25 AM. Peak plasma hits at 09:00 AM.'
  },
  {
    start: '08:45',
    end: '09:00',
    tag: 'PART B',
    name: 'Q1 Rapid Warm-Up',
    protocol: '2 A4 pages: single-stroke straight lines, ellipses, 2-pt horizon cubes, 10x 30s human gesture figures.'
  },
  {
    start: '09:00',
    end: '10:00',
    tag: 'PART A',
    name: 'Exam Sync (NAT / MSQ / MCQ)',
    protocol: 'REAL EXAM HOUR: 0–15m NAT (8 Qs, 100% attempt) -> 15–30m MSQ (10 Qs, 2-opt rule) -> 30–55m MCQ (26 Qs, 2-opt elim) -> 55–60m audit. ≥35s Anti-Rush Lock.'
  },
  {
    start: '10:00',
    end: '12:00',
    tag: 'PART B',
    name: 'Exam Sync (Q1–Q5 Full Slots)',
    protocol: 'REAL EXAM HOURS: 5 mandatory Qs on A4 sheets, strict 24-min hard stop each: Q1 (10:00) -> Q2 (10:24) -> Q3 (10:48) -> Q4 (11:12) -> Q5 (11:36).'
  },
  {
    start: '12:00',
    end: '12:45',
    tag: 'BIO',
    name: 'Lunch & Eye Rest',
    protocol: 'High-protein, moderate-complex-carb lunch. Zero screens.'
  },
  {
    start: '12:45',
    end: '13:10',
    tag: 'NEURO',
    name: 'Power Nap / NSDR (25m)',
    protocol: '25-min strict timer in dark room. Generates Stage N2 sleep spindles that lock morning sketching motor skills without sleep inertia.'
  },
  {
    start: '13:10',
    end: '13:20',
    tag: 'BIO',
    name: 'Caffeine #2 & Hard Cutoff',
    protocol: 'Cold water splash + optional ≤80 mg caffeine. ABSOLUTE CAFFEINE CUTOFF AT 13:30 PM (8.5h before sleep).'
  },
  {
    start: '13:20',
    end: '14:20',
    tag: 'PART A',
    name: 'NAT Surgery & Error Audit',
    protocol: 'Log all morning Part A errors (NAT off-by-one, MSQ over-click, <30s rush, concept gap) + 10 targeted NAT spatial drills with double-count proof.'
  },
  {
    start: '14:20',
    end: '14:30',
    tag: 'NEURO',
    name: 'Ultradian Reset',
    protocol: '20-20-20 distant gaze, hydration, wrist and shoulder mobility.'
  },
  {
    start: '14:30',
    end: '15:45',
    tag: 'PART A',
    name: 'Tier-1 Subpart Mastery',
    protocol: 'Daily rotating Tier-1 weak subpart: concept drill + 25 mastery questions (see 7-Day Rotation Matrix).'
  },
  {
    start: '15:45',
    end: '16:00',
    tag: 'BIO',
    name: 'Snack & Wrist Prep',
    protocol: 'Nuts + fruit + finger/wrist mobility warm-up.'
  },
  {
    start: '16:00',
    end: '17:15',
    tag: 'PART B',
    name: 'Q1 & Q2 Rescue Studio',
    protocol: 'Mon/Wed/Fri: Q1 Extreme POV & Human Perspective. Tue/Thu/Sat: Q2 4-Frame Constrained Storytelling. Sun: Weakest Morning Sheet Re-Render.'
  },
  {
    start: '17:15',
    end: '20:15',
    tag: 'WORK',
    name: 'Protected Freelance Block (Fri–Sun)',
    weekendOnly: true,
    protocol: 'FRI / SAT / SUN ONLY: Protected 3-hour freelance client block before night. Hard stop at 20:15 sharp so work never bleeds into exam prep.'
  },
  {
    start: '17:15',
    end: '17:45',
    tag: 'NEURO',
    name: 'Sunset Sunlight Walk (Mon–Thu)',
    weekdayOnly: true,
    protocol: 'MON–THU ONLY: Outdoor evening walk (anchors nocturnal melatonin onset + flushes cortisol + Q5 real-world friction observation).'
  },
  {
    start: '17:45',
    end: '18:45',
    tag: 'PART B',
    name: 'Secondary Studio: Q3 / Q4 / Q5 (Mon–Thu)',
    weekdayOnly: true,
    protocol: 'MON–THU ONLY: Mon & Thu = Q3 Icons/Typography; Tue = Q5 HMW & Solutions; Wed = Q4 Primitive/Biomimetic 3D Form.'
  },
  {
    start: '18:45',
    end: '19:00',
    tag: 'BIO',
    name: 'Mini Reset (Mon–Thu)',
    weekdayOnly: true,
    protocol: 'Hydration and transition back to analytical mode.'
  },
  {
    start: '19:00',
    end: '20:15',
    tag: 'PART A',
    name: 'MSQ Lab & PYQ Twins (Mon–Thu)',
    weekdayOnly: true,
    protocol: 'MON–THU ONLY: 30m pure MSQ partial-credit drills (2-opt sweet spot) + 45m 2017–2026 PYQ Question-Twin extraction.'
  },
  {
    start: '20:15',
    end: '20:45',
    tag: 'BIO',
    name: 'Early Dinner',
    protocol: 'Light, low-spice dinner finished ≥75–90 min before sleep. Zero screens.'
  },
  {
    start: '20:45',
    end: '21:30',
    tag: 'CONSOLIDATION',
    name: 'Grading + Paper Flashcards',
    protocol: '20:45–21:10: Score morning Part B sheets out of 100 on IITB Rubric. 21:10–21:30: Physical paper flashcards (Art/Crafts/Ergo/Visemes). Blue-light cutoff at 21:30.'
  },
  {
    start: '21:30',
    end: '22:00',
    tag: 'NEURO',
    name: 'Shutdown Ritual',
    protocol: 'Warm dim light only. Zero screens. Lay out tomorrow’s A4 sheets & pencils; log MITRA Daily Scorecard.'
  },
  {
    start: '22:00',
    end: '06:00',
    tag: 'BIO',
    name: 'Sleep Fortress (8.0 Hours)',
    protocol: 'Lights out at 22:00 sharp (5 complete 90-min sleep cycles) for deep N3 tissue recovery and REM motor consolidation.'
  }
];

export const MITRA_ROTATION_MATRIX = [
  {
    dayIndex: 1,
    dayName: 'Monday',
    partASubpart: 'Spatial 3D: Boolean unions/cuts, surface & edge counting, 270° partial revolutions, hollow cylinders',
    partBRescue: 'Q1 Sketching: Worm’s-eye & object POV, horizon line, floor grid perspective',
    eveningMode: 'Sunset Walk + Q3 Icons (B&W 4-icon set) + MSQ/PYQ Lab',
    pyqTarget: '2017–2018 PYQs',
    isFreelance: false
  },
  {
    dayIndex: 2,
    dayName: 'Tuesday',
    partASubpart: 'Practical Physics: Gears, pulleys, toy cams, crown/bevel linkages, springs, levers, optics/camera',
    partBRescue: 'Q2 Creativity: 12-symbol bank 4-frame narrative (strict 2/frame, unmodified)',
    eveningMode: 'Sunset Walk + Q5 Problem ID (HMW + 2 Visual Solutions) + MSQ/PYQ',
    pyqTarget: '2019–2020 PYQs',
    isFreelance: false
  },
  {
    dayIndex: 3,
    dayName: 'Wednesday',
    partASubpart: 'Spatial 2D→3D: Paper folding/punching area NATs, unfolded polyhedron nets, 45° parallel shadows',
    partBRescue: 'Q1 Sketching: Adult-child-animal scale contrast, dynamic action, expressions',
    eveningMode: 'Sunset Walk + Q4 Form Sens. (Primitive/Bio → Product) + MSQ/PYQ',
    pyqTarget: '2021–2022 PYQs',
    isFreelance: false
  },
  {
    dayIndex: 4,
    dayName: 'Thursday',
    partASubpart: 'Analytical & Quant Speed: Mensuration, locus/cycloids, dice/board puzzles (cut 85s → 60s)',
    partBRescue: 'Q2 Creativity: Forced metaphors & continuous panoramic 4-frame canvas',
    eveningMode: 'Sunset Walk + Q3 Custom Typography & Monogram + MSQ/PYQ',
    pyqTarget: '2023–2024 PYQs',
    isFreelance: false
  },
  {
    dayIndex: 5,
    dayName: 'Friday',
    partASubpart: 'Design Methods: Traditional crafts/operations, wax undercuts, 5th/95th ergonomics, Indic scripts',
    partBRescue: 'Q1 Sketching: Bird’s-eye CCTV POV + 4-frame sequential weight/anticipation',
    eveningMode: 'FREELANCE BLOCK (3 Hours Exact: 17:15–20:15)',
    pyqTarget: '2025 PYQ (in 13:20 block)',
    isFreelance: true
  },
  {
    dayIndex: 6,
    dayName: 'Saturday',
    partASubpart: 'Animation & Visual Logic: Animated GIF orbit ratios, lip-sync visemes, 180° rule, UI bugs, matrices',
    partBRescue: 'Q2 Creativity: 12-thumbnail speed divergence + 24-min timed 4-frame story',
    eveningMode: 'FREELANCE BLOCK (3 Hours Exact: 17:15–20:15)',
    pyqTarget: '2026 PYQ + Weekly Error Audit',
    isFreelance: true
  },
  {
    dayIndex: 0,
    dayName: 'Sunday',
    partASubpart: 'FULL MOCK AUTOPSY: Exhaustive Part A error classification from 09:00–12:00 Championship Mock',
    partBRescue: 'PART B FULL RE-RENDER: Redraw lowest-scoring morning Part B answer in 24 min',
    eveningMode: 'FREELANCE BLOCK (3 Hours Exact: 17:15–20:15)',
    pyqTarget: 'Full 3-Hr Exam Mock (09:00–12:00)',
    isFreelance: true
  }
];

export const CHANAKYA_MATRIX = [
  {
    tier: 'Tier 1: Disgusting Mastery',
    badge: 'TIER 1 — CORE YIELD',
    color: '#F59E0B',
    description: 'Accounts for ~85% of Part A question weightage. Must achieve ≥80% accuracy with fast execution.',
    topics: [
      {
        name: 'Visualization & Spatial Reasoning',
        weight: '~20.6 Qs/yr (47% of paper)',
        baselineAcc: '55% (195 Qs)',
        targetAcc: '≥85%',
        speed: '55s / Q',
        subtopics: 'Boolean unions/cuts, surface counting, 270° partial revolutions, folding area NATs, unfolded polyhedron nets, 45° parallel shadows.'
      },
      {
        name: 'Practical & Scientific Knowledge',
        weight: '~6.1 Qs/yr (Mechanics/Optics)',
        baselineAcc: '46% (39 Qs)',
        targetAcc: '≥80%',
        speed: '53s / Q',
        subtopics: 'Gears, pulleys, toy cams, crown/bevel linkages, springs, levers, optics/camera focal length, reflections.'
      },
      {
        name: 'Analytical, Logical & Numerical',
        weight: '4.3 Qs/yr Quant + 53 Analytical',
        baselineAcc: '50% (44 Qs)',
        targetAcc: '≥75%',
        speed: '85s -> 60s target (Slowest leak)',
        subtopics: 'Mensuration, locus/cycloids, dice/board puzzles, combinatorics, series and pattern continuation.'
      },
      {
        name: 'Design Methods & Practices',
        weight: '~9.0 Qs/yr (Anim, Type, Ergo)',
        baselineAcc: '52% (42 Qs)',
        targetAcc: '≥85%',
        speed: '52s / Q',
        subtopics: 'Traditional crafts/wax casting, 5th/95th percentile ergonomics, Indic script anatomy, animation orbit ratios, lip-sync visemes.'
      }
    ]
  },
  {
    tier: 'Tier 2: Surgical Polish',
    badge: 'TIER 2 — HIGH YIELD',
    color: '#38BDF8',
    description: 'Embedded across visual matrices and creative prompts. Focus on speed and pattern recognition.',
    topics: [
      {
        name: 'Observation & Design Sensitivity',
        weight: 'Embedded in visual matrices',
        baselineAcc: '60% (47 Qs)',
        targetAcc: '≥80%',
        speed: '83s -> 50s target',
        subtopics: 'Micro-detail audits, negative space anomalies, real-world affordances, texture differences.'
      },
      {
        name: 'Creativity & Analogies',
        weight: 'Visual signs & metaphors',
        baselineAcc: '66% (47 Qs)',
        targetAcc: '≥85%',
        speed: '39s / Q',
        subtopics: 'Visual analogies, conceptual blendings, symbolic representation, semiotics.'
      }
    ]
  },
  {
    tier: 'Tier 3: Maintenance Only',
    badge: 'TIER 3 — PASSIVE',
    color: '#34D399',
    description: 'Current accuracy is already strong. Maintain via nightly 20-min paper flashcards.',
    topics: [
      {
        name: 'Environment & Society',
        weight: 'Sustainability & geography',
        baselineAcc: '72% (39 Qs)',
        targetAcc: 'Maintain ≥75%',
        speed: '38s / Q',
        subtopics: 'Ecology, environmental regulations, cultural geography, sustainable materials.'
      },
      {
        name: 'Art & Design Knowledge',
        weight: '~4.0 Qs/yr',
        baselineAcc: '73% (59 Qs)',
        targetAcc: 'Maintain ≥75%',
        speed: '39s / Q',
        subtopics: 'Art movements (Bauhaus, De Stijl, Art Nouveau), North-to-South Indian monuments, UNESCO heritage sites.'
      }
    ]
  },
  {
    tier: 'Tier 4: Strategic Abandon',
    badge: 'TIER 4 — ABANDON',
    color: '#EF4444',
    description: 'Zero study investment. Historical yield is statistically insignificant.',
    topics: [
      {
        name: 'Language & English Grammar Trivia',
        weight: 'Only 7 Qs in 10 years (0 in 2020/22/23/25/26)',
        baselineAcc: '24% (17 Qs)',
        targetAcc: 'STRATEGIC ABANDON',
        speed: '28s / Q',
        subtopics: 'Do not spend study hours on vocabulary lists or grammar rules.'
      },
      {
        name: 'Isolated Colour / Materials Trivia',
        weight: '2 Colour & 5 Material Qs in 10 years',
        baselineAcc: 'N/A',
        targetAcc: 'PASSIVE REVIEW ONLY',
        speed: 'N/A',
        subtopics: 'Review only what appears naturally in PYQs.'
      }
    ]
  }
];

export const GAME_THEORY_LAWS = [
  {
    id: 'law_nat',
    title: '1. The 100% NAT Protocol',
    rule: 'Attempt ALL 8 Numerical Answer Type questions unconditionally.',
    rationale: 'NAT carries ZERO negative marking (+4 / 0). Skipping a NAT guarantees 0 marks, whereas attempting yields non-zero expected value.',
    protocol: 'Budget 15 minutes total (~1.87 min/Q). Decompose 3D assemblies into 6 orthogonal faces + inner cavities. Use complement counting (Total - Hidden).'
  },
  {
    id: 'law_msq',
    title: '2. MSQ Partial-Harvesting Theorem',
    rule: 'Protect the proven 2-Option Sweet Spot (61.5% accuracy). Never click a 3rd/4th option without ≥75% subjective certainty.',
    rationale: 'Locking 2 correct options guarantees +2.00 marks. Adding a 3rd option with certainty p has EV = 5p - 1. Break-even requires p > 60%.',
    protocol: 'Evaluate options A, B, C, D as 4 independent True/False statements. 4-option attempts historically have a 25.0% accuracy bleed zone (+1M across all trials).'
  },
  {
    id: 'law_mcq',
    title: '3. MCQ Calculated Elimination (1:6 Ratio)',
    rule: 'Eliminate 1 option -> EV = +0.67/Q. Eliminate 2 options -> EV = +1.25/Q. Commit whenever narrowed to 2 options.',
    rationale: 'Marking is +3 for correct, -0.5 for wrong. The 1:6 asymmetry heavily rewards calculated risk once you rule out 1 or 2 distractors.',
    protocol: 'Skip only if 3 or more options remain entirely indistinguishable.'
  },
  {
    id: 'law_antirush',
    title: '4. The 35-Second Anti-Rush Lock',
    rule: 'No answer submission permitted in under 35 seconds.',
    rationale: 'Historical audit revealed 64 rushed errors occurred in <30 seconds per question, bleeding massive preventable marks.',
    protocol: 'Mandatory double-check: verify question stem for NOT / INCORRECT inversions and chiral/mirror handedness.'
  },
  {
    id: 'law_partb_hardstop',
    title: '5. The 24-Minute Part B Hard Stop',
    rule: 'Strict 24-minute allocation per 20-mark Part B question (Q1 through Q5).',
    rationale: 'Every Part B slot carries equal 20 marks. Spending 40 minutes on Q1 leaves Q5 under-rendered, sacrificing easy +12 marks for an incremental +2.',
    protocol: 'At minute 20: transition to callout annotations; at minute 22: final line-weight hierarchy; at minute 24: turn the page unconditionally.'
  }
];

export const PRE_MORTEM_SHIELDS = [
  {
    trigger: 'Mental Fatigue & Focus Drift (Hour 2–3)',
    shield: 'Hydration with electrolytes at 08:00, 15m meditation at 08:05, and 08:25 caffeine timing ensuring peak plasma at 09:00–12:00.'
  },
  {
    trigger: 'Blank Canvas Panic in Part B Q1/Q2',
    shield: 'Execute the mandatory 08:45–09:00 gesture warm-up (straight strokes, horizon lines, 10x 30s figures). Pencil is warm before 10:00.'
  },
  {
    trigger: 'Over-Clicking MSQs (Greed Bias)',
    shield: 'Memorize the formula: 2 locked options = +2.00 guaranteed marks. Treat MSQ options as independent true/false gates.'
  },
  {
    trigger: 'Time Bleed in Part B Q1',
    shield: 'Physical timer on desk. When clock hits 10:24, page turns to Q2 regardless of completion.'
  },
  {
    trigger: 'Late Evening Burnout & Freelance Spillover',
    shield: 'Freelance work locked strictly to Fri–Sun 17:15–20:15. Lights out at 22:00 sharp guarantees 5 complete 90-min sleep cycles.'
  }
];

export const PREDICTIVE_CHECKLIST_2027 = {
  partA: [
    { title: 'NAT Frustum / Boolean Assembly', desc: '3D stepped volume surface counts, cylinder intersections, and frustum mensuration.' },
    { title: 'NAT Paper-Folding Area', desc: 'Quantitative punched paper unfolding remaining area and motif counts.' },
    { title: 'NAT Mechanical Gears / Dice Moves', desc: 'Minimum moves on board / gear rotation direction and ratio puzzle.' },
    { title: 'MSQ Polyhedron Cross-Sections', desc: 'Cutting planes across dodecahedron/icosahedron yielding polygons.' },
    { title: 'MSQ Mould Undercuts & Parting Lines', desc: 'Vertical lift injection moulding undercuts and split lines.' },
    { title: 'MCQ Indic Script Identification', desc: 'Discriminating Kannada, Malayalam, Odia, Telugu, or Devanagari character features.' },
    { title: 'MCQ Animation Lip-Sync Visemes', desc: 'Closed M/B/P bilabial vs round O/U/W mouth shapes across frame sequences.' },
    { title: 'MCQ Ergonomics 5th vs 95th Percentile', desc: 'Reach vs clearance dimensions in workstation and cockpit design.' }
  ],
  partB: [
    { title: 'Q1: Extreme Non-Human POV', desc: 'Worm’s eye floor perspective, CCTV bird’s eye, or reflection in curved mirror with human context.' },
    { title: 'Q2: 12-Symbol Combinatorial Story', desc: '4-frame visual narrative integrating 2 unmodified symbols per frame with witty visual twist.' },
    { title: 'Q3: Custom Display Typography / 4-Icon System', desc: '55% probability of display letterform extrapolation; 45% probability of 4-icon B&W system.' },
    { title: 'Q4: Biomimetic Form to Functional Product', desc: 'Translating nautilus shell, lotus pod, or pangolin scale into ergonomic consumer seating/device.' },
    { title: 'Q5: Multi-Stakeholder Journey & HMW Problem ID', desc: '4–8 crisp How-Might-We statements + 2 annotated visual solutions addressing physical & cognitive friction.' }
  ]
};

export const MITRA_ROADMAP_PHASES = [
  {
    phase: 1,
    name: 'Phase 1: Reconstruction',
    days: 'Days 1–18',
    dates: '2026-11-25 to 2026-12-12',
    partAKPI: 'NAT 62% acc; MSQ ≤2 penalties; <30s rushes ≤2/test',
    partBKPI: 'Q1 5.5/10, Q2 6.0/10; 100-item Indian visual library; Total 64/100',
    mockCadence: 'Weekly Sunday 3-Hr Mocks (29 Nov, 6 Dec, 13 Dec)',
    status: 'ACTIVE'
  },
  {
    phase: 2,
    name: 'Phase 2: Velocity & Storytelling',
    days: 'Days 19–36',
    dates: '2026-12-13 to 2026-12-30',
    partAKPI: 'NAT 75% acc; MCQ 78% acc; Analytical ≤62s/Q; Score 102–110/150',
    partBKPI: 'Q1 & Q2 7.5/10 on strict 24m clock; Q3 Type+Icons; Total 76/100',
    mockCadence: '3 Part A Mocks/wk + Sunday 3-Hr Mocks (20 Dec, 27 Dec)',
    status: 'UPCOMING'
  },
  {
    phase: 3,
    name: 'Phase 3: AIR 1 Championship Peak',
    days: 'Days 37–49',
    dates: '2026-12-31 to 2027-01-12',
    partAKPI: 'NAT 75–88%; MSQ 28–32/40; <30s rushes 0; Score 112–122/150',
    partBKPI: 'Q1 16, Q2 16, Q3 17, Q4 18, Q5 17; Total 82–86/100',
    mockCadence: '1 Jan: Admit Card Release. 4 Full Dress Rehearsals (3, 6, 9, 12 Jan)',
    status: 'UPCOMING'
  },
  {
    phase: 4,
    name: 'Phase 4: Neuro-Taper & Banking',
    days: 'Days 50–53',
    dates: '2027-01-13 to 2027-01-16',
    partAKPI: 'Zero new theory; Error Ledger & 11-Twin review only',
    partBKPI: 'Light 20-min confidence sketches; stationery kit check on 15 Jan',
    mockCadence: 'Sleep banking (8.5h/night); 16 Jan lights out 21:30',
    status: 'UPCOMING'
  },
  {
    phase: 5,
    name: 'Day 54: Exam Day',
    days: 'Day 54',
    dates: '2027-01-17 (Sunday)',
    partAKPI: '09:00–10:00: NAT 15m -> MSQ 15m -> MCQ 25m -> Audit 5m',
    partBKPI: '10:00–12:00: Strict 24m x 5 questions; clear annotations',
    mockCadence: '05:45 wake -> 07:00 breakfast -> 08:15 caffeine -> 09:00–12:00 EXECUTION',
    status: 'FINAL'
  }
];

export const IITB_RUBRIC = [
  {
    id: 'q1',
    title: 'Q1: Perspective / POV Sketching (20 Marks)',
    criteria: [
      { id: 'c1', name: 'Camera POV & Horizon Accuracy', max: 5, desc: 'Correct eye level, 2-point/3-point perspective grid, vanishing convergence without distortion.' },
      { id: 'c2', name: 'Human Proportion & Expression', max: 5, desc: 'Anatomical head-to-body ratios (7.5 heads), realistic gestures, natural drape and joints.' },
      { id: 'c3', name: 'Line-Weight Hierarchy (FG/MG/BG)', max: 5, desc: 'Bold foreground silhouettes, medium midground details, fine atmospheric background lines.' },
      { id: 'c4', name: 'Contextual Props & Cast Shadows', max: 5, desc: 'Believable environment props, textures (wood, metal, fabric), consistent directional shadow cast.' }
    ]
  },
  {
    id: 'q2',
    title: 'Q2: 4-Frame Creativity & Storytelling (20 Marks)',
    criteria: [
      { id: 'c1', name: 'Statistical Originality (Non-Cliché)', max: 5, desc: 'Avoids first-thought clichés; surprising narrative angle that stands out from 5000+ candidates.' },
      { id: 'c2', name: 'Unmodified Stimulus Integration', max: 5, desc: 'Given geometric/visual symbols incorporated cleanly without altering core geometric identity.' },
      { id: 'c3', name: 'Narrative Arc & Visual Twist', max: 5, desc: 'Clear Setup -> Confrontation -> Escalation -> Climactic Resolution or Punchline.' },
      { id: 'c4', name: 'Framing, Contrast & Witty Titles', max: 5, desc: 'Dynamic camera shot variety (wide, close-up, Dutch angle), crisp ink fills, concise witty title.' }
    ]
  },
  {
    id: 'q3',
    title: 'Q3: Visual Sensitivity & Icon/Type Design (20 Marks)',
    criteria: [
      { id: 'c1', name: 'Systemic Consistency', max: 5, desc: 'Uniform stroke weights, consistent corner radiuses, matching visual grid and bounding boxes.' },
      { id: 'c2', name: 'Semantic Legibility Without Text', max: 5, desc: 'Instantly recognizable metaphors across diverse demographics without language labels.' },
      { id: 'c3', name: 'Figure-Ground Equilibrium', max: 5, desc: 'Balanced positive/negative space, optically centered visual mass, no accidental traps.' },
      { id: 'c4', name: 'Edge Crispness & Solid Black Fill', max: 5, desc: 'High-craft contour control, zero smudging, authoritative pen/marker execution.' }
    ]
  },
  {
    id: 'q4',
    title: 'Q4: 3D Form Sensitivity & Product Design (20 Marks)',
    criteria: [
      { id: 'c1', name: 'Inspiration Visual DNA Retention', max: 5, desc: 'Biomimetic or geometric stimulus character clearly expressed in the functional form.' },
      { id: 'c2', name: 'Ergonomics & Manufacturing Details', max: 5, desc: 'Human interface affordances, parting lines, assembly seams, ventilation, fasteners.' },
      { id: 'c3', name: '3D Perspective & Aligned Ellipses', max: 5, desc: 'Major/minor ellipse axes aligned to cylindrical centerlines, accurate planar intersections.' },
      { id: 'c4', name: 'Surface Shading & Material Texture', max: 5, desc: 'Convincing rendering of matte plastic, brushed metal, rubber, glass, or turned wood.' }
    ]
  },
  {
    id: 'q5',
    title: 'Q5: Problem Identification & Design Solutions (20 Marks)',
    criteria: [
      { id: 'c1', name: 'Non-Trivial Actionable Design Friction', max: 5, desc: '4–8 crisp How-Might-We statements capturing genuine pain points rather than generic complaints.' },
      { id: 'c2', name: 'Multi-Dimensional Friction Diversity', max: 5, desc: 'Covers physical ergonomics, cognitive overload, safety risks, and environmental factors.' },
      { id: 'c3', name: 'Feasibility & Ingenuity of 2 Solutions', max: 5, desc: 'Two distinct, realistic design concepts that directly solve identified core frictions.' },
      { id: 'c4', name: 'Sketch Clarity & Callout Annotations', max: 5, desc: 'Explanatory exploded views, directional motion arrows, concise readable callout text.' }
    ]
  }
];

export const DEFAULT_SCORECARD = {
  date: new Date().toISOString().slice(0, 10),
  dayNumber: 1,
  sleepHours: 7.5,
  wake0600Hit: true,
  exercise90mHit: true,
  meditation15mHit: true,
  caffeineCutoff1330Held: true,
  powerNap25mHit: true,
  partASync: {
    natScore: 24,
    msqScore: 28,
    mcqScore: 62,
    totalPartA: 114,
    rushedErrorsUnder30s: 0
  },
  partBSyncRubric: {
    q1Sketching: 16,
    q2Creativity: 16,
    q3VisualSens: 17,
    q4FormSens: 18,
    q5ProblemId: 17,
    totalPartB: 84,
    hardStop24mHeld: true
  },
  projectedMerit: 91.5,
  top3ErrorPatterns: [
    'MSQ: Selected 3rd option on questionable ambiguity',
    'Part B: Spent 26m on Q1, pinching Q5 review',
    'NAT: Off-by-one on cylinder cavity surface count'
  ],
  tomorrowSinglePriorityFix: 'Strict 2-option MSQ ceiling and 22-minute pen lift on Q1.'
};
