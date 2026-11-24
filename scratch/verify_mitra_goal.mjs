import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9255;
const SCREENSHOT_DIR = 'C:\\Users\\SHRINATH\\.gemini\\antigravity\\brain\\72572bdd-e9ed-494b-b98b-f12b2964029f\\screenshots';

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
  }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() { this.ws.close(); }
}

async function run() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const tmpDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `chrome_mitra_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tmpDir}`,
    'about:blank'
  ], { stdio: 'ignore' });

  await sleep(1500);

  try {
    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');

    const consoleErrors = [];
    cdp.ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(m.params.exceptionDetails.text);
      }
    });

    // Test on Pixel 7 mobile viewport (412x915)
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2.625, mobile: true });

    console.log('--- Step 1: Navigating to http://localhost:4173/#/ ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:4173/#/' });
    await sleep(800);

    const todayCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        headerTabs: Array.from(document.querySelectorAll('nav a')).map(a => a.innerText.trim()),
        dayLabel: document.querySelector('#topInstrumentHeader')?.innerText.slice(0, 30),
        activeTab: document.querySelector('nav a[aria-current="page"]')?.innerText.trim()
      }))()`,
      returnByValue: true
    });
    console.log('Today View Check:', JSON.stringify(todayCheck.result.value));

    console.log('--- Step 2: Navigating to #/goal (Command & Merit) ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:4173/#/goal' });
    await sleep(800);

    const goalCommandCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        title: document.querySelector('h1')?.innerText,
        meritScore: document.querySelector('#displayMeritScore')?.innerText,
        partATotal: document.querySelector('#displayPartATotal')?.innerText,
        partBTotal: document.querySelector('#displayPartBTotal')?.innerText,
        subviewPills: Array.from(document.querySelectorAll('.mitra-nav-pill')).map(p => p.innerText.trim())
      }))()`,
      returnByValue: true
    });
    console.log('Goal Command Check:', JSON.stringify(goalCommandCheck.result.value));

    // Capture Command Subview
    const snap1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'mitra_goal_command.png'), Buffer.from(snap1.data, 'base64'));
    console.log('Saved screenshot: mitra_goal_command.png');

    // Test Merit Simulator Interactivity (slider adjustments)
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const sliderQ1 = document.querySelector('#slider_q1');
        if (sliderQ1) {
          sliderQ1.value = 20;
          sliderQ1.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`
    });
    await sleep(300);

    const meritUpdated = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        updatedMerit: document.querySelector('#displayMeritScore')?.innerText,
        updatedPartB: document.querySelector('#displayPartBTotal')?.innerText
      }))()`,
      returnByValue: true
    });
    console.log('Merit Simulator Interactivity Check (Q1 -> 20):', JSON.stringify(meritUpdated.result.value));

    console.log('--- Step 3: Switch to Subview "clock" ---');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="clock"]')?.click()`
    });
    await sleep(600);

    const clockCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        hasActiveClock: !!document.querySelector('#liveClockDisplay'),
        clockText: document.querySelector('#liveClockDisplay')?.innerText,
        rotationTitle: document.querySelector('.bento-card:nth-child(2) h1, .bento-card:nth-child(2) .font-bold')?.innerText,
        rotationDays: Array.from(document.querySelectorAll('[data-rotation-day]')).length
      }))()`,
      returnByValue: true
    });
    console.log('Clock Subview Check:', JSON.stringify(clockCheck.result.value));

    const snap2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'mitra_goal_clock.png'), Buffer.from(snap2.data, 'base64'));
    console.log('Saved screenshot: mitra_goal_clock.png');

    console.log('--- Step 4: Switch to Subview "conquest" ---');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="conquest"]')?.click()`
    });
    await sleep(600);

    const conquestCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        tierCount: document.querySelectorAll('.bento-card:first-child .rounded-2xl').length,
        lawCount: document.querySelectorAll('.bento-card:nth-child(2) .rounded-xl').length,
        shieldCount: document.querySelectorAll('.bento-card:nth-child(3) .rounded-xl').length
      }))()`,
      returnByValue: true
    });
    console.log('Conquest Subview Check:', JSON.stringify(conquestCheck.result.value));

    const snap3 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'mitra_goal_conquest.png'), Buffer.from(snap3.data, 'base64'));
    console.log('Saved screenshot: mitra_goal_conquest.png');

    console.log('--- Step 5: Switch to Subview "roadmap" ---');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="roadmap"]')?.click()`
    });
    await sleep(600);

    const roadmapCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        phaseCards: document.querySelectorAll('.bento-card:first-child .rounded-2xl').length,
        hasDay54: document.body.innerText.includes('DAY 54 PROTOCOL')
      }))()`,
      returnByValue: true
    });
    console.log('Roadmap Subview Check:', JSON.stringify(roadmapCheck.result.value));

    const snap4 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'mitra_goal_roadmap.png'), Buffer.from(snap4.data, 'base64'));
    console.log('Saved screenshot: mitra_goal_roadmap.png');

    console.log('--- Step 6: Switch to Subview "scorecard" ---');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="scorecard"]')?.click()`
    });
    await sleep(600);

    const scorecardCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        rubricTotal: document.querySelector('#rubricTotalDisplay')?.innerText,
        hasForm: !!document.querySelector('#mitraScorecardForm'),
        hasCopyYaml: !!document.querySelector('#btnCopyScorecardYaml'),
        hasSaveCard: !!document.querySelector('#btnSaveScorecard')
      }))()`,
      returnByValue: true
    });
    console.log('Scorecard Subview Check:', JSON.stringify(scorecardCheck.result.value));

    // Test Rubric button interaction: decrement Q1 criteria 1
    await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        document.querySelector('.btn-rubric-dec[data-qid="q1"][data-cid="c1"]')?.click();
      })()`
    });
    await sleep(300);

    const rubricAfterDec = await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('#rubricTotalDisplay')?.innerText`,
      returnByValue: true
    });
    console.log('Rubric Total after decrementing Q1 C1:', rubricAfterDec.result.value);

    const snap5 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'mitra_goal_scorecard.png'), Buffer.from(snap5.data, 'base64'));
    console.log('Saved screenshot: mitra_goal_scorecard.png');

    console.log('--- Step 7: Test Timeline Mode Toggle ---');
    const toggleCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('#btn-timeline-toggle');
        const before = btn?.innerText;
        btn?.click();
        const after = document.querySelector('#btn-timeline-toggle')?.innerText;
        return { before, after, dayText: document.querySelector('#topInstrumentHeader')?.innerText.slice(0, 35) };
      })()`,
      returnByValue: true
    });
    console.log('Timeline Mode Toggle Result:', JSON.stringify(toggleCheck.result.value));

    console.log('--- Step 8: Desktop Resolution Check (1200x800) ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:4173/#/goal' });
    await sleep(800);

    const desktopCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        docOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }))()`,
      returnByValue: true
    });
    console.log('Desktop Layout Check:', JSON.stringify(desktopCheck.result.value));

    const snap6 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'mitra_goal_desktop.png'), Buffer.from(snap6.data, 'base64'));
    console.log('Saved screenshot: mitra_goal_desktop.png');

    console.log('Total Console Errors Caught:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Errors:', consoleErrors);
    }

    cdp.close();
  } finally {
    chromeProc.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

run();
