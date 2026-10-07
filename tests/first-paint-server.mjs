/** Manual browser regression fixture: delays app.js to expose the pre-app paint.
 * Run: node tests/first-paint-server.mjs; visit http://127.0.0.1:4174/.
 * Uses a separate origin, leaving the user's actual archive/preferences intact.
 * The hidden proof output records DOM/computed styles; it never mutates app state.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const probe = `<script>
(() => {
  const samples = [], start = performance.now();
  const rect = element => { const r=element.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; };
  const record = () => {
    const tabs = [...document.querySelectorAll('[data-module]')];
    if (tabs.length === 4) {
      samples.push({time: Math.round(performance.now() - start),
        active: document.documentElement.dataset.activeModule,
        selected: tabs.filter(t => t.getAttribute('aria-selected') === 'true').map(t => t.dataset.module),
        glowing: tabs.filter(t => getComputedStyle(t).boxShadow !== 'none').map(t => t.dataset.module),
        transitions: tabs.map(t => getComputedStyle(t).transitionDuration),
        theme: document.documentElement.dataset.theme,
        toggle: rect(document.getElementById('theme-toggle')),
        themeLabel: document.getElementById('theme-name').innerText,
        themeIcon: [...document.querySelectorAll('#theme-icon svg')].filter(i => getComputedStyle(i).display !== 'none').map(i => i.classList.contains('optical-icon-sun') ? 'sun' : 'moon'),
        iconSlot: rect(document.getElementById('theme-icon')),
        header: [...document.querySelectorAll('.top-meta,#clock,.version')].map(rect),
        panels: [...document.querySelectorAll('main > [role=tabpanel]')].filter(p => getComputedStyle(p).display !== 'none').map(p => p.id),
        ready: document.documentElement.classList.contains('app-ready'),
        preload: document.documentElement.classList.contains('preload'),
        mainVisibility: getComputedStyle(document.querySelector('main')).visibility});
    }
    let proof = document.getElementById('first-paint-proof');
    if (!proof && document.body) { proof = document.createElement('output'); proof.id = 'first-paint-proof'; proof.hidden = true; document.body.append(proof); }
    if (proof) proof.textContent = JSON.stringify(samples);
    if (samples.length < 600 && (!document.documentElement.classList.contains('app-ready') || samples.filter(s => s.ready).length < 12)) requestAnimationFrame(record);
  };
  requestAnimationFrame(record);
})();
</script>`;
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(resolve(root) + sep)) { res.writeHead(403); res.end(); return; }
    let data = await readFile(path);
    if (pathname === '/app.js') await new Promise(done => setTimeout(done, 1500));
    if (path.endsWith('index.html')) data = data.toString().replace('</body>', probe + '</body>');
    res.writeHead(200, {'Content-Type':mime[extname(path)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4174, '127.0.0.1', () => console.log('First-paint fixture: http://127.0.0.1:4174/ (app delayed 1500ms)'));
