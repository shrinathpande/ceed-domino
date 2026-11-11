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

/** Mount the floating segmented control dock at bottom center */
export function mountDevFixtureDock() {
  if (!isDevEnvironment()) return;
  let dock = document.getElementById('dev-break-ui-dock');
  if (!dock) {
    dock = document.createElement('div');
    dock.id = 'dev-break-ui-dock';
    document.body.appendChild(dock);
  }

  const current = getDevDataset();
  const options = [
    { id: 'demo', label: 'Demo' },
    { id: 'worst', label: 'Worst case' },
    { id: 'empty', label: 'Empty' },
    { id: 'one', label: 'One' },
    { id: '1000', label: '1,000 rows' }
  ];

  dock.innerHTML = `
    <div style="
      position: fixed;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 2px;
      background: rgba(18, 18, 22, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.16);
      padding: 3px;
      border-radius: 9999px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      font-weight: 500;
      user-select: none;
    ">
      <div style="padding: 0 8px 0 6px; color: #71717A; font-family: monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.05em;">
        DATA:
      </div>
      ${options.map(opt => {
        const isActive = opt.id === current;
        return `
          <button
            type="button"
            data-dev-dataset="${opt.id}"
            style="
              padding: 4px 10px;
              border-radius: 9999px;
              border: none;
              cursor: pointer;
              background: ${isActive ? '#FFFFFF' : 'transparent'};
              color: ${isActive ? '#09090B' : '#A1A1AA'};
              font-weight: ${isActive ? '700' : '500'};
              font-size: 11px;
              transition: all 120ms ease;
              outline: none;
              white-space: nowrap;
            "
          >
            ${opt.label}
          </button>
        `;
      }).join('')}
    </div>
  `;

  dock.querySelectorAll('[data-dev-dataset]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetMode = btn.getAttribute('data-dev-dataset');
      setDevDataset(targetMode);
      mountDevFixtureDock();
    });
  });
}
