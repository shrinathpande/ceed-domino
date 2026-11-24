import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9260;
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
  const tmpDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `chrome_iphone12_${Date.now()}`);
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

    // Emulate iPhone 12: 390 x 844, DPR = 3.0, mobile = true
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true
    });

    await cdp.send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
    });

    console.log('=== Step 1: Auditing Today View on iPhone 12 (390x844) ===');
    await cdp.send('Page.navigate', { url: 'http://localhost:4173/#/' });
    await sleep(800);

    const todayMetrics = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const header = document.querySelector('#topInstrumentHeader');
        const bottomNav = document.querySelector('#nativeIosBottomTabBar');
        const bottomTabs = Array.from(bottomNav?.querySelectorAll('a') || []).map(a => a.innerText.trim().replace('\\n', ' '));
        const docW = document.documentElement.scrollWidth;
        const clientW = document.documentElement.clientWidth;
        return {
          headerH: header ? header.offsetHeight : 0,
          hasBottomNav: !!bottomNav,
          bottomTabs,
          docOverflowX: docW > clientW,
          docW,
          clientW
        };
      })()`,
      returnByValue: true
    });
    console.log('Today View Metrics:', JSON.stringify(todayMetrics.result.value));

    const snapToday = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'iphone12_today_view.png'), Buffer.from(snapToday.data, 'base64'));
    console.log('Saved: iphone12_today_view.png');

    console.log('=== Step 2: Testing Bottom Tab Bar Navigation to Goal [AIR 1] ===');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('#nativeIosBottomTabBar a[href="#/goal"]')?.click()`
    });
    await sleep(800);

    const goalNavCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        hash: window.location.hash,
        title: document.querySelector('h1')?.innerText,
        subviewButtons: Array.from(document.querySelectorAll('.mitra-nav-pill')).map(b => b.innerText.trim()),
        activeBottomTab: document.querySelector('#nativeIosBottomTabBar a[aria-current="page"]')?.innerText.trim().replace('\\n', ' ')
      }))()`,
      returnByValue: true
    });
    console.log('Goal Tab Navigation Check:', JSON.stringify(goalNavCheck.result.value));

    const snapGoalCommand = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'iphone12_goal_command.png'), Buffer.from(snapGoalCommand.data, 'base64'));
    console.log('Saved: iphone12_goal_command.png');

    console.log('=== Step 3: Testing Clock Sub-View on iPhone 12 ===');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="clock"]')?.click()`
    });
    await sleep(600);

    const clockMetrics = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        clockDisplay: document.querySelector('#liveClockDisplay')?.innerText,
        hasActiveEngagement: !!document.querySelector('.bento-card .animate-ping'),
        rotationDayPills: Array.from(document.querySelectorAll('[data-rotation-day]')).length,
        docOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
      }))()`,
      returnByValue: true
    });
    console.log('Clock Sub-View Metrics:', JSON.stringify(clockMetrics.result.value));

    const snapGoalClock = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'iphone12_goal_clock.png'), Buffer.from(snapGoalClock.data, 'base64'));
    console.log('Saved: iphone12_goal_clock.png');

    console.log('=== Step 4: Testing Conquest Sub-View on iPhone 12 ===');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="conquest"]')?.click()`
    });
    await sleep(600);

    const conquestMetrics = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        chanakyaTiers: document.querySelectorAll('.bento-card:first-child .space-y-3 > div').length,
        theorems: document.querySelectorAll('.bento-card:nth-child(2) .space-y-2\\.5 > div').length,
        docOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
      }))()`,
      returnByValue: true
    });
    console.log('Conquest Sub-View Metrics:', JSON.stringify(conquestMetrics.result.value));

    const snapGoalConquest = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'iphone12_goal_conquest.png'), Buffer.from(snapGoalConquest.data, 'base64'));
    console.log('Saved: iphone12_goal_conquest.png');

    console.log('=== Step 5: Testing Scorecard & Input Auto-Zoom Guard on iPhone 12 ===');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="scorecard"]')?.click()`
    });
    await sleep(600);

    const scorecardCheck = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const inputs = Array.from(document.querySelectorAll('#mitraScorecardForm input[type="text"], #mitraScorecardForm input[type="number"]'));
        const fontSizes = inputs.map(i => window.getComputedStyle(i).fontSize);
        const allAtLeast16px = fontSizes.every(s => parseFloat(s) >= 16);
        const rubricDecButtons = Array.from(document.querySelectorAll('.btn-rubric-dec')).length;
        return {
          totalInputs: inputs.length,
          allAtLeast16px,
          sampleFontSize: fontSizes[0],
          rubricDecButtons,
          docOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      })()`,
      returnByValue: true
    });
    console.log('Scorecard & iOS Input Zoom Guard Check:', JSON.stringify(scorecardCheck.result.value));

    const snapGoalScorecard = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'iphone12_goal_scorecard.png'), Buffer.from(snapGoalScorecard.data, 'base64'));
    console.log('Saved: iphone12_goal_scorecard.png');

    console.log('=== Step 6: Testing Bottom Nav to Stats, Studio, and Config ===');
    for (const [targetTab, expectedHash] of [
      ['Stats', '#/stats'],
      ['Studio', '#/studio'],
      ['Config', '#/settings']
    ]) {
      await cdp.send('Runtime.evaluate', {
        expression: `document.querySelector('#nativeIosBottomTabBar a[href="${expectedHash}"]')?.click()`
      });
      await sleep(600);
      const navVerify = await cdp.send('Runtime.evaluate', {
        expression: `(() => ({
          hash: window.location.hash,
          docOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          bottomTabActive: document.querySelector('#nativeIosBottomTabBar a[aria-current="page"]')?.innerText.trim().replace('\\n', ' ')
        }))()`,
        returnByValue: true
      });
      console.log(`Nav to ${targetTab}:`, JSON.stringify(navVerify.result.value));
    }

    console.log('Total Console Errors Caught:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
    }

    cdp.close();
  } finally {
    chromeProc.kill();
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

run();
