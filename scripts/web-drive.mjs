// Drive the web app in headless Chrome and screenshot it (dev server must be running).
// Usage: node scripts/web-drive.mjs <url> <outPrefix> [steps...]
//   steps: click:<text or aria-label> | wait:<ms> | shot:<name> (writes <outPrefix>-<name>.png) | eval:<js>
//   LIGHT=1 for light mode.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, out, ...steps] = process.argv.slice(2);
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9333', '--window-size=600,900', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp'))}`, process.env.LIGHT ? '--blink-settings=preferredColorScheme=1' : '--blink-settings=preferredColorScheme=0', 'about:blank']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets; for (let i = 0; i < 50; i++) { try { targets = await (await fetch('http://127.0.0.1:9333/json')).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (js) => (await send('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.navigate', { url }); await sleep(6000);
for (const s of steps) {
  const [k, ...rest] = s.split(':'); const v = rest.join(':');
  if (k === 'wait') await sleep(+v);
  if (k === 'eval') console.log(await ev(v));
  if (k === 'click') console.log('click', v, await ev(`(() => { const els=[...document.querySelectorAll('[role=button],[role=radio],[role=tab],a,button,div')].filter(e=>e.innerText?.trim()===${JSON.stringify(v)} || e.getAttribute('aria-label')===${JSON.stringify(v)}); const el=els[els.length-1]; if(!el) return false; el.click(); return true; })()`));
  if (k === 'shot') { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${out}-${v}.png`, Buffer.from(r.result.data, 'base64')); }
}
ws.close(); chrome.kill();
