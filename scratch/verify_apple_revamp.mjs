import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9265;
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
  const tmpDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `chrome_apple_revamp_${Date.now()}`);
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

    async function capture(filename) {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }

    async function checkMetrics(name) {
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          hasFloatingDock: !!document.getElementById('nativeIosBottomTabBar'),
          title: document.title
        })`,
        returnByValue: true
      });
      console.log(`[${name}] Metric check:`, evalRes.result.value);
      return evalRes.result.value;
    }

    console.log('=== Step 1: Auditing Today View on iPhone 12 ===');
    await cdp.send('Page.navigate', { url: 'http://localhost:4173/#/' });
    await sleep(1500);
    await checkMetrics('Today');
    await capture('iphone12_revamped_today.png');

    console.log('=== Step 2: Auditing Goal View (Command Subview) ===');
    await cdp.send('Page.navigate', { url: 'http://localhost:4173/#/goal' });
    await sleep(1500);
    await checkMetrics('Goal - Command');
    await capture('iphone12_revamped_command.png');

    console.log('=== Step 3: Auditing Clock Subview (Timeline Spine) ===');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="clock"]')?.click()`
    });
    await sleep(800);
    await checkMetrics('Goal - Clock');
    await capture('iphone12_revamped_clock.png');

    console.log('=== Step 4: Auditing Conquest Subview (Chanakya Inset Rows) ===');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="conquest"]')?.click()`
    });
    await sleep(800);
    await checkMetrics('Goal - Conquest');
    await capture('iphone12_revamped_conquest.png');

    console.log('=== Step 5: Auditing 54d Plan Subview (Milestone Stepper) ===');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="roadmap"]')?.click()`
    });
    await sleep(800);
    await checkMetrics('Goal - 54d Plan');
    await capture('iphone12_revamped_roadmap.png');

    console.log('=== Step 6: Auditing Scorecard Subview (Rubric Matrix) ===');
    await cdp.send('Runtime.evaluate', {
      expression: `document.querySelector('button[data-subview="scorecard"]')?.click()`
    });
    await sleep(800);
    await checkMetrics('Goal - Scorecard');
    await capture('iphone12_revamped_scorecard.png');

    console.log('\n=== Verification Summary ===');
    console.log('Console errors encountered:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    } else {
      console.log('PASS: 0 console errors.');
    }

    cdp.close();
  } catch (err) {
    console.error('Test run failed:', err);
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
