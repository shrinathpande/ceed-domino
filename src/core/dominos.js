/**
 * Domino Definitions — default blocks + custom override support.
 */
import { getState } from './state.js';

export const DEFAULT_DOMINOS = [
  {
    id: 'launchpad',
    badge: 'STEP 0',
    title: 'Launchpad',
    subtitle: 'No Phone Zone',
    offset: 'Wake + 0:00',
    normalMins: 15,
    emergencyMins: 10,
    desc: 'Water + pinch of salt, shoes on immediately. Zero social media.',
    icon: 'rocket',
    color: 'indigo',
  },
  {
    id: 'd1',
    badge: 'DOMINO 1',
    title: 'Peaceful Walk',
    subtitle: '8–10 km / 1 km Run',
    offset: 'Wake + 0:15',
    normalMins: 120,
    emergencyMins: 45,
    desc: 'Quiet morning walk + run. Outdoor sunlight locks circadian rhythm.',
    icon: 'walk',
    color: 'green',
  },
  {
    id: 'd2',
    badge: 'DOMINO 2',
    title: 'Sketching & Assignments',
    subtitle: 'Perspective, Figures, Drills',
    offset: 'Wake + 3:00',
    normalMins: 90,
    emergencyMins: 30,
    desc: 'Perspective grids, human figures, foreshortening & assignment drills.',
    icon: 'pencil',
    color: 'amber',
  },
  {
    id: 'd3',
    badge: 'DOMINO 3',
    title: 'CEED Full Paper',
    subtitle: 'Part B Studio Prompts',
    offset: 'Wake + 4:30',
    normalMins: 120,
    emergencyMins: 60,
    desc: '2h timed Part B studio paper (5 Mandatory Questions: Q1-Q5).',
    icon: 'document',
    color: 'blue',
  },
  {
    id: 'siesta',
    badge: 'SIESTA',
    title: 'Biphasic Nap Reset',
    subtitle: '90-Min Sleep Cycle',
    offset: 'Wake + 8:00',
    normalMins: 95,
    emergencyMins: 25,
    desc: '1 full 90-min sleep cycle to wipe out afternoon crash.',
    icon: 'moon',
    color: 'violet',
  },
  {
    id: 'd4',
    badge: 'DOMINO 4',
    title: 'Creative & Framework Work',
    subtitle: 'Blender, Design Systems',
    offset: 'Wake + 10:00',
    normalMins: 120,
    emergencyMins: 60,
    desc: '100% guilt-free deep creative work. Open ceiling — push to 3–4+ hrs.',
    icon: 'palette',
    color: 'rose',
  },
  {
    id: 'sleep',
    badge: 'NIGHT',
    title: 'Core Night Sleep',
    subtitle: '4 Full 90-Min Cycles',
    offset: 'Wake + 18:00',
    normalMins: 360,
    emergencyMins: 360,
    desc: '6h night + 1.5h Siesta = 7.5h total daily recovery.',
    icon: 'moon',
    color: 'slate',
  },
];

/** Get active dominos (custom if set, otherwise defaults) */
export function getDominos() {
  const state = getState();
  if (state.settings.customDominos && state.settings.customDominos.length > 0) {
    return state.settings.customDominos;
  }
  return DEFAULT_DOMINOS;
}

/** Get core domino IDs (used for streak calculation — excludes launchpad, siesta, sleep) */
export function getCoreDominoIds() {
  return getDominos()
    .filter((d) => !['launchpad', 'siesta', 'sleep'].includes(d.id))
    .map((d) => d.id);
}

/** Find a domino by ID */
export function getDominoById(id) {
  return getDominos().find((d) => d.id === id);
}
