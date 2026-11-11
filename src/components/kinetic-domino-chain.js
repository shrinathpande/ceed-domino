// src/components/kinetic-domino-chain.js
/**
 * Kinetic Domino Chain Reaction Streak Component.
 * Interactive physics canvas simulating an 87-day domino chain reaction
 * leading to the CEED 2027 Monolith.
 */
import { getState, getBlocks, isDominoTask, getAccentColor } from '../core/state.js';
import { getTodayStr, getCampaignDayNumber, getExamCountdown, formatDateLocal } from '../utils/dates.js';
import { playRelayClick, playVictoryChime } from '../utils/sound.js';

let animationFrameId = null;
let cascadeInProgress = false;

export function renderKineticDominoChain(containerEl) {
  const state = getState();
  const blocks = getBlocks();
  const mandatoryBlocks = blocks.filter(isDominoTask);
  const records = state.records || {};
  const todayStr = getTodayStr();
  const currentDayNum = Math.min(87, Math.max(1, getCampaignDayNumber(todayStr)));
  const countdown = getExamCountdown();
  const accentColor = getAccentColor();

  // Calculate toppled count (days where mandatory dominos were finished or hours were logged)
  const startDate = new Date(2026, 9, 22);
  let toppledCount = 0;
  const dayStatusList = [];

  for (let i = 0; i < 87; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const iso = formatDateLocal(d);
    const rec = records[iso];
    const isPastOrToday = i + 1 <= currentDayNum;
    const isToday = i + 1 === currentDayNum;
    const isMandatoryComplete = rec && mandatoryBlocks.length > 0 && Array.isArray(rec.completed) &&
      mandatoryBlocks.every(b => rec.completed.includes(b.id));
    const totalHours = rec ? (Object.values(rec.durations || {}).reduce((a, b) => a + b, 0) / 60) : 0;
    const isToppled = isPastOrToday && (isMandatoryComplete || totalHours > 0 || i + 1 < currentDayNum);

    if (isToppled) toppledCount++;

    dayStatusList.push({
      dayNum: i + 1,
      iso,
      isToday,
      isToppled,
      totalHours,
      angle: isToday ? 28 : (isToppled ? 56 : 0) // 0 deg = standing, 28 deg = active tipping point, 56 deg = fallen
    });
  }

  const pct = Math.round((toppledCount / 87) * 100);

  const wrapper = document.createElement('div');
  wrapper.className = 'bento-card p-4 sm:p-5 mb-3.5 stagger-item stagger-delay-0 relative overflow-hidden select-none';
  wrapper.id = 'kinetic-chain-card';

  wrapper.innerHTML = `
    <!-- Card Header: Single Clean Row + Subtitle -->
    <div class="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: var(--domino-accent); box-shadow: 0 0 8px var(--domino-accent);"></span>
        <h2 class="text-[15px] sm:text-[17px] font-bold text-[var(--text-primary)] tracking-tight truncate">
          Domino Chain
        </h2>
        <span class="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-well)] border border-[var(--border-subtle)] text-[var(--domino-accent)] font-semibold uppercase shrink-0">
          Prototype
        </span>
      </div>

      <!-- Action Button: Trigger / Replay Cascade -->
      <button
        id="btn-trigger-cascade"
        type="button"
        class="px-3 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-wider btn-tactile transition-all shrink-0 flex items-center gap-1.5 bg-[var(--surface-well)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--domino-accent)] hover:text-[var(--domino-accent)]"
        title="Trigger sequential domino topple cascade"
        aria-label="Trigger domino chain reaction cascade"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span>TEST CASCADE</span>
      </button>
    </div>
    <p class="text-xs text-[var(--text-secondary)] mb-3">
      Kinetic streak: ${toppledCount} of 87 dominoes toppled toward CEED Monolith
    </p>

    <!-- Live Canvas Stage -->
    <div class="relative w-full rounded-xl bg-[#08080C] border border-[var(--border-subtle)] p-2 overflow-hidden shadow-inner">
      <canvas
        id="domino-physics-canvas"
        class="w-full h-[120px] sm:h-[140px] block cursor-pointer"
      ></canvas>

      <!-- Active Day Floating Indicator Pill -->
      <div id="domino-hover-tooltip" class="absolute bottom-2 left-3 text-[11px] font-mono text-[var(--text-secondary)] bg-[#121218]/90 px-2 py-0.5 rounded-md border border-white/10 pointer-events-none transition-opacity opacity-0">
        Day --
      </div>

      <!-- CEED 2027 Monolith Badge -->
      <div class="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--domino-accent)] bg-[#121218]/90 px-2 py-0.5 rounded-md border border-[var(--domino-accent)]/30 pointer-events-none">
        <span class="w-1.5 h-1.5 rounded-full bg-[var(--domino-accent)] animate-pulse"></span>
        <span>CEED 2027 MONOLITH</span>
      </div>
    </div>

    <!-- Bottom Telemetry Ribbon -->
    <div class="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[var(--border-subtle)] text-center">
      <div>
        <div class="text-[10.5px] text-[var(--text-muted)] font-medium">Cascade Momentum</div>
        <div class="text-[15px] sm:text-[16px] font-bold text-[var(--text-primary)] tabular-nums font-mono mt-0.5">
          ${pct}%
        </div>
      </div>
      <div>
        <div class="text-[10.5px] text-[var(--text-muted)] font-medium">Toppled Streak</div>
        <div class="text-[15px] sm:text-[16px] font-bold text-[var(--domino-accent)] tabular-nums font-mono mt-0.5">
          ${toppledCount}d
        </div>
      </div>
      <div>
        <div class="text-[10.5px] text-[var(--text-muted)] font-medium">To Monolith</div>
        <div class="text-[15px] sm:text-[16px] font-bold text-[var(--text-primary)] tabular-nums font-mono mt-0.5">
          ${countdown.days}d left
        </div>
      </div>
    </div>
  `;

  containerEl.prepend(wrapper);

  // Initialize Canvas Physics Renderer
  const canvas = wrapper.querySelector('#domino-physics-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }

  resizeCanvas();

  // Domino Drawing Parameters
  const totalTiles = 87;
  let hoveredTileIndex = null;

  function drawScene() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Ground Floor Hairline with Accent Glow
    const groundY = h - 24;
    ctx.beginPath();
    ctx.moveTo(8, groundY);
    ctx.lineTo(w - 8, groundY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Spacing
    const marginX = 24;
    const availableWidth = w - marginX * 2 - 30; // 30px reserved for monolith
    const tileSpacing = availableWidth / (totalTiles - 1);
    const tileWidth = 3.2;
    const tileHeight = 36;

    // Draw all dominoes
    dayStatusList.forEach((tile, idx) => {
      const baseX = marginX + idx * tileSpacing;
      const angleRad = (tile.angle * Math.PI) / 180;
      const isHovered = hoveredTileIndex === idx;

      ctx.save();
      ctx.translate(baseX, groundY);

      // Rotate around base pivot
      ctx.rotate(angleRad);

      // Domino Body
      let fillColor;
      let strokeColor;

      if (tile.isToday) {
        fillColor = accentColor;
        strokeColor = '#FFFFFF';
      } else if (tile.isToppled) {
        fillColor = accentColor;
        strokeColor = '#08080C';
      } else {
        fillColor = '#1F2028';
        strokeColor = 'rgba(255, 255, 255, 0.16)';
      }

      if (isHovered) {
        fillColor = '#FFFFFF';
        strokeColor = accentColor;
      }

      // Draw Domino Tile (Front Rect)
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isHovered || tile.isToday ? 1.5 : 1.0;

      ctx.beginPath();
      ctx.roundRect(-tileWidth / 2, -tileHeight, tileWidth, tileHeight, 1);
      ctx.fill();
      ctx.stroke();

      // Top Highlight Pip on Standing Dominoes
      if (!tile.isToppled) {
        ctx.fillStyle = isHovered || tile.isToday ? '#09090B' : 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(0, -tileHeight + 5, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // Draw CEED 2027 Monolith at finish line
    const monolithX = w - marginX;
    const monolithWidth = 14;
    const monolithHeight = 58;

    ctx.save();
    ctx.translate(monolithX, groundY);

    // Glowing base aura
    const grad = ctx.createLinearGradient(0, -monolithHeight, 0, 0);
    grad.addColorStop(0, accentColor);
    grad.addColorStop(1, '#0D0E14');

    ctx.fillStyle = grad;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.roundRect(-monolithWidth / 2, -monolithHeight, monolithWidth, monolithHeight, 3);
    ctx.fill();
    ctx.stroke();

    // Carved center notch
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#09090B';
    ctx.fillRect(-monolithWidth / 2 + 3, -monolithHeight + 10, monolithWidth - 6, 2);

    ctx.restore();
  }

  drawScene();

  // Resize listener
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawScene();
  });

  // Cascade Animation Runner
  function runCascade() {
    if (cascadeInProgress) return;
    cascadeInProgress = true;

    // Reset all angles to 0 (standing)
    dayStatusList.forEach(t => t.angle = 0);
    drawScene();

    let step = 0;
    const targetSteps = toppledCount;

    const interval = setInterval(() => {
      if (step >= targetSteps) {
        clearInterval(interval);
        cascadeInProgress = false;
        playVictoryChime();
        return;
      }

      // Animate current domino falling
      dayStatusList[step].angle = 62;
      playRelayClick();
      drawScene();
      step++;
    }, 45); // 45ms per domino gives a fluid kinetic ripple
  }

  // Bind Trigger Button
  const triggerBtn = wrapper.querySelector('#btn-trigger-cascade');
  triggerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    runCascade();
  });

  // Hover Tooltip Interaction
  const tooltip = wrapper.querySelector('#domino-hover-tooltip');
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const marginX = 24;
    const availableWidth = rect.width - marginX * 2 - 30;
    const tileSpacing = availableWidth / (totalTiles - 1);

    const index = Math.round((x - marginX) / tileSpacing);
    if (index >= 0 && index < totalTiles) {
      hoveredTileIndex = index;
      const tile = dayStatusList[index];
      if (tooltip) {
        tooltip.textContent = `Day ${tile.dayNum}: ${tile.iso} • ${tile.isToppled ? `Toppled (${tile.totalHours.toFixed(1)}h)` : 'Standing'}`;
        tooltip.style.opacity = '1';
      }
      drawScene();
    }
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredTileIndex = null;
    if (tooltip) tooltip.style.opacity = '0';
    drawScene();
  });

  canvas.addEventListener('click', (e) => {
    e.stopPropagation();
    runCascade();
  });
}
