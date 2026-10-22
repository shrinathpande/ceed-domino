/**
 * Confetti burst animation — lightweight canvas-based confetti.
 * Fires on domino completion for satisfying feedback.
 */

const COLORS = ['#30D158', '#FF9F0A', '#007AFF', '#FF3B30', '#5856D6', '#FF2D55', '#64D2FF'];
const PARTICLE_COUNT = 60;
const DURATION = 2000;

let _canvas = null;
let _ctx = null;
let _animId = null;

function ensureCanvas() {
  if (_canvas) return;
  _canvas = document.createElement('canvas');
  _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  _canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(_canvas);
  _ctx = _canvas.getContext('2d');
}

function resize() {
  if (!_canvas) return;
  _canvas.width = window.innerWidth;
  _canvas.height = window.innerHeight;
}

/** Fire a confetti burst from the center of the screen */
export function fireConfetti() {
  ensureCanvas();
  resize();

  const particles = [];
  const cx = _canvas.width / 2;
  const cy = _canvas.height / 2;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
    const speed = 4 + Math.random() * 8;
    const size = 4 + Math.random() * 6;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 4,
      size,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      gravity: 0.12 + Math.random() * 0.08,
      opacity: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    });
  }

  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    if (elapsed > DURATION) {
      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
      _animId = null;
      return;
    }

    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    const progress = elapsed / DURATION;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - progress * 1.2);

      _ctx.save();
      _ctx.translate(p.x, p.y);
      _ctx.rotate((p.rotation * Math.PI) / 180);
      _ctx.globalAlpha = p.opacity;
      _ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        _ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        _ctx.beginPath();
        _ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        _ctx.fill();
      }

      _ctx.restore();
    });

    _animId = requestAnimationFrame(animate);
  }

  if (_animId) cancelAnimationFrame(_animId);
  _animId = requestAnimationFrame(animate);
}
