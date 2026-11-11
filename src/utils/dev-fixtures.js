// src/utils/dev-fixtures.js
// Dev-only worst-case datasets based on Emil Kowalski's break-ui CATALOG.md

const DATASET_STORAGE_KEY = 'ceed_dev_dataset';

export const WORST_CASE_BLOCKS = [
  {
    id: 'd1_worst',
    badge: 'DOMINO 1: Đặng Thị Ngọc Hân & Aleksandra Wiśniewska-Kowalczyk [CRITICAL SPRINT]',
    name: 'Senior Product Design Engineer, Platform Infrastructure & Human-Computer Interface Architecture (Benachrichtigungseinstellungen)',
    category: 'INTERNATIONAL_COGNITIVE_STUDIO_RESEARCH_AND_DEVELOPMENT',
    targetMins: 720,
    hasPartACounter: false
  },
  {
    id: 'd2_worst',
    badge: 'D2',
    name: 'J',
    category: 'WORK',
    targetMins: 15,
    hasPartACounter: false
  },
  {
    id: 'd3_worst',
    badge: 'DOMINO 3 👩🏽‍💻 Priya & 🦊 Fox',
    name: '王秀英 — CJK Perspective & https://example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments&filter=unresolved',
    category: 'STUDY',
    targetMins: 60,
    hasPartACounter: true
  },
  {
    id: 'd4_worst',
    badge: 'DOMINO 4: نور الهدى عبد الرحمن',
    name: 'María José de la Cruz y Fernández — Part B Industrial Clay & Q3 Board Deck — FINAL (revised) v12 [approved by legal].pdf',
    category: 'DESIGN',
    targetMins: 180,
    hasPartACounter: false
  }
];

export const ONE_BLOCK = [
  {
    id: 'd1_one',
    badge: 'DOMINO 1',
    name: 'Walk & Fitness Focus Pillar',
    category: 'WALK',
    targetMins: 60,
    hasPartACounter: true
  }
];

// Generates 1,000 blocks for performance stress testing
export function get1000Blocks() {
  const blocks = [];
  for (let i = 1; i <= 1000; i++) {
    blocks.push({
      id: `d_stress_${i}`,
      badge: `DOMINO ${i}`,
      name: `Automated Load Pillar ${i} — Scalability Benchmark Verification Task`,
      category: i % 3 === 0 ? 'STUDY' : i % 2 === 0 ? 'WORK' : 'WALK',
      targetMins: 30 + (i % 8) * 15,
      hasPartACounter: i % 5 === 0
    });
  }
  return blocks;
}

export function getDevDataset() {
  if (typeof window === 'undefined') return 'demo';
  const urlParam = new URLSearchParams(window.location.search).get('data');
  if (urlParam && ['demo', 'worst', 'empty', 'one', '1000'].includes(urlParam)) {
    return urlParam;
  }
  const saved = sessionStorage.getItem(DATASET_STORAGE_KEY);
  if (saved && ['demo', 'worst', 'empty', 'one', '1000'].includes(saved)) {
    return saved;
  }
  return 'demo';
}

export function setDevDataset(mode) {
  if (!['demo', 'worst', 'empty', 'one', '1000'].includes(mode)) return;
  sessionStorage.setItem(DATASET_STORAGE_KEY, mode);
  const url = new URL(window.location.href);
  if (mode === 'demo') {
    url.searchParams.delete('data');
  } else {
    url.searchParams.set('data', mode);
  }
  window.history.replaceState({}, '', url.toString());
  document.dispatchEvent(new CustomEvent('dev-dataset-changed', { detail: mode }));
}

/** Check if dev features should be active */
export function isDevEnvironment() {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    !!import.meta.env?.DEV
  );
}

/** Remove the floating dev dock completely */
export function mountDevFixtureDock() {
  const existing = document.getElementById('dev-break-ui-dock');
  if (existing) existing.remove();
}
