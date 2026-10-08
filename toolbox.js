/*
  ServiceTitan Toolbox
  ====================
  One panel with five tools for the ServiceTitan Dispatch board (tabs across the top switch between them):
    - Notes: adds a ready-made note (sorted into folders) to a job's customer in one click.
    - Job Notifications: checks or turns off job notifications for one tech's jobs, or jobs you pick.
    - Tech Messages: sends a saved message (Good Morning, ETA, ...) to the techs you pick (by team or on the board).
    - Business Unit: switches the jobs you pick to a branch (Mendenhall Branch by default).
    - Customer Texts: texts customers a saved message (holds, tech updates, reschedules, ...).

  HOW TO RELEASE AN UPDATE
    1. Edit this file on GitHub.
    2. Change VERSION below (1.0 -> 1.1, and so on) and add a line to WHATS_NEW.
    3. Commit. Everyone gets the new version the next time they click the bookmark
       (GitHub can take a few minutes to publish it).

  Each person's edited notes, messages and safety settings are saved in their own browser,
  so updates never wipe them.
*/
(() => {
  const VERSION = '1.5.2';
  const WHATS_NEW = {
    '1.5.2': 'New look: tabs switch tools in one click, ⌂ goes Home, – shrinks the Toolbox to its title bar, and the corner resizes it. It stays where you put it, always on screen. Less-used buttons are under ⋯ More.',
    '1.5.1': 'Faster and smarter: Check jobs in Job Notifications and Business Unit now takes seconds instead of minutes, and Customer Texts checks everyone before it starts, so you see exactly who will be texted (and who is skipped, and why). Every job-picking tool also has + All in the list.',
    '1.5': 'New: 📱 Customer Texts. Text customers a saved message from folders (Holds, Tech Updates, Reschedule). Load every hold at once and filter by job type, or pick jobs on the board. {dispatcher} fills in your first name. Also: Tech Messages can pick techs by clicking them on the board, Job Notifications can work on jobs you pick, and every tool can pick from the Unassigned / Hold list.',
    '1.4': 'New: 🏢 Business Unit. Pick jobs on the board (or type their numbers) and switch them all to Mendenhall Branch, or another branch, in one go. ↩ Put back undoes it.',
    '1.3.1': 'Tech Messages can now send to up to 57 people per run (was 50).',
    '1.3': 'Quick Notes is now 📝 Notes, with folders: Updates, Techs and Reschedule. Your notes are in Updates. Add your own folders with ✏️ Edit folders, and move notes between folders with ✏️ Edit notes.',
    '1.2.5': 'Safer closing: closing the Toolbox during a run now asks to stop the run first. Tech Messages is lighter on the board, and Quick Notes rests while you use other tools.',
    '1.2.4': 'Job Notifications now retries any job that had a problem, once, after the rest of the run is done.',
    '1.2.3': 'Fix: Tech Messages works with the board filtered. It remembers each tech\'s team from the unfiltered board, so a filter no longer shows the "ServiceTitan may have changed" warning.',
    '1.2.2': 'Fix: Tech Messages works with the board filtered by team or people. Pick techs the same way as before; anyone the filter hides is skipped instead of stopping the run.',
    '1.2': 'New: a yellow warning bar if ServiceTitan changes something a tool needs, plus a 🩺 Check button in the menu.',
    '1.1': 'New: 💬 Tech Messages. Send your Good Morning or ETA message to the techs you pick, with safety checks so it never messages blocked teams or people.',
    '1.0.1': 'Test update',
    '1.0': 'First version: Quick Notes and Job Notifications in one toolbox.'
  };

  // Clicking the bookmark while the toolbox is open closes it.
  if (window.__stToolbox) { window.__stToolbox.close(); return; }

  // ===================================================================
  // Shared helpers
  // ===================================================================
  const ID = 'st-toolbox';
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const until = async (fn, max, gap) => {
    const end = Date.now() + max;
    while (Date.now() < end) { const v = fn(); if (v) return v; await wait(gap || 250); }
    return fn() || null;
  };
  const visible = el => !!(el && el.getClientRects().length);
  // True if a tech's name is actually showing on the board (a team or people filter hides the rest).
  const techShowing = t => visible((t && t.querySelector('.name')) || t);
  const onBoard = () => /dispatchboard/i.test(location.hash);
  // A job clicked on the Dispatch board: a bubble on the timeline, or a row in the job list at
  // the bottom (Unassigned, Hold and the other tabs). Returns the job number, or null.
  const clickedJob = target => {
    if (!target || !target.closest) return null;
    const a = target.closest('a.appointment[data-job-id]');
    if (a) return a.getAttribute('data-job-id');
    const tr = target.closest('.job-list tr[class*="qa-job-"]');
    const m = tr && /(?:^|\s)qa-job-(\d+)(?:\s|$)/.exec(String(tr.className));
    return m ? m[1] : null;
  };
  // What the job list at the bottom of the board knows about a job on the tab showing.
  const listJob = j => {
    try {
      const jl = document.querySelector('.job-list');
      const vm = jl && window.ko && window.ko.dataFor(jl);
      const list = (vm && vm.JobList && window.ko.unwrap(vm.JobList.AllVisibleJobs)) || [];
      const x = list.find(y => String(window.ko.unwrap(y.JobId)) === String(j));
      if (!x) return null;
      return { customer: String(window.ko.unwrap(x.Customer) || '').replace(/\s+/g, ' ').trim(), customerId: window.ko.unwrap(x.CustomerId) || null };
    } catch (e) { return null; }
  };
  // Highlights picked jobs on the timeline and in the job list.
  const pickedCss = (ids, color, soft) => !ids.length ? '' :
    ids.map(j => 'a.appointment[data-job-id="' + j + '"]').join(',') + '{outline:3px solid ' + color + ' !important;outline-offset:-3px !important;box-shadow:0 0 0 3px ' + soft + ' !important}' +
    ids.map(j => '.job-list tr.qa-job-' + j + ' > td').join(',') + '{background:' + soft + ' !important;box-shadow:inset 0 2px 0 ' + color + ',inset 0 -2px 0 ' + color + ' !important}';
  const isMac = /Mac|iPhone|iPad/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '');
  const ALT = isMac ? 'Option' : 'Alt';
  const el = (tag, css, text) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; return e; };
  const FULL = 'display:block;box-sizing:border-box;width:100%;';
  const smallBtn = (label, onClick, extra) => {
    const b = el('button', 'padding:5px 8px;cursor:pointer;border:1px solid #aaa;border-radius:6px;background:#fff;color:#111;font:inherit;font-size:12px;' + (extra || ''), label);
    b.type = 'button';
    b.onclick = onClick;
    return b;
  };
  const PRIMARY = 'background:#1a6ed8;color:#fff;border-color:#1a6ed8;font-weight:600;';
  const DANGER = 'background:#c62828;color:#fff;border-color:#c62828;font-weight:600;';
  const norm = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const same = (a, b) => norm(a).toLowerCase() === norm(b).toLowerCase();
  const plural = (n, word, many) => n + ' ' + (n === 1 ? word : (many || word + 's'));
  const last10 = s => String(s == null ? '' : s).replace(/\D/g, '').slice(-10);
  const errText = e => (e && e.message ? e.message : String(e));

  // ===================================================================
  // Reading ServiceTitan's own data
  // The same requests ServiceTitan's pages make to show a job or a conversation. Reading them
  // directly takes a fraction of a second, where opening the page takes a few seconds. Nothing
  // here changes anything; changes still go through the page, like a person would do them.
  // ===================================================================
  const st = (() => {
    const HEADERS = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' };
    const getJSON = async (url, ms) => {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => ctl.abort(), ms || 15000) : null;
      try {
        const r = await fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + '_=' + Date.now(), { credentials: 'include', headers: HEADERS, signal: ctl ? ctl.signal : undefined });
        if (!r.ok) throw new Error('ServiceTitan answered ' + r.status);
        return await r.json();
      } catch (e) {
        throw e && e.name === 'AbortError' ? new Error('ServiceTitan took too long to answer') : e;
      } finally { if (timer) clearTimeout(timer); }
    };
    // Runs fn on each item, a few at a time (gentle on ServiceTitan), keeping the order.
    // A failed item gives { error } instead of stopping the rest.
    const pool = async (items, limit, fn, progress) => {
      const out = new Array(items.length);
      let next = 0, done = 0;
      const worker = async () => {
        while (next < items.length) {
          const i = next++;
          try { out[i] = await fn(items[i], i); } catch (e) { out[i] = { error: e }; }
          done++;
          if (progress) progress(done, items.length);
        }
      };
      await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
      return out;
    };
    const job = id => getJSON('/Job/Index/?id=' + encodeURIComponent(id) + '&skipForms=true');
    const jobEdit = id => getJSON('/Job/Edit/' + encodeURIComponent(id));
    // The conversation with a phone number: { ThreadId, ReadStatus, BlockedStatus, Messages: [last] },
    // or null if there's never been one.
    const chatThread = async num => {
      const d = await getJSON('/GrowthChatCenter/ChatThread?number=' + encodeURIComponent(num));
      if (!d || !Array.isArray(d.Threads)) throw new Error('the conversation came back in a shape the Toolbox doesn\'t know');
      return d.Threads.find(t => last10(t.ContactNumber) === num) || (d.Threads.length === 1 ? d.Threads[0] : null);
    };
    const chatMessages = async (threadId, count) => {
      const d = await getJSON('/GrowthChatCenter/Messages?threadId=' + encodeURIComponent(threadId) + '&skip=0&count=' + (count || 100));
      if (!d || !Array.isArray(d.Messages)) throw new Error('the messages came back in a shape the Toolbox doesn\'t know');
      return d.Messages;
    };
    // ServiceTitan's own code numbers (from the page), with the values seen in Oct 2026 as backup.
    const code = (group, name, backup) => {
      try { const g = window.App && window.App.Enums && window.App.Enums[group]; if (g && typeof g[name] === 'number') return g[name]; } catch (e) {}
      return backup;
    };
    return { getJSON, pool, job, jobEdit, chatThread, chatMessages, code };
  })();

  // The editable list used by ✏️ Edit notes and ✏️ Edit messages: a name and a text per item,
  // with ↑ ↓ to reorder and Delete. `word` is 'note' or 'message' (used in warnings).
  // opts.allowEmpty: an empty list is OK to save. opts.rowExtra(item): extra control for a row.
  // An item can carry a `to` value (Notes uses it for "Move to folder"); it's kept through edits.
  const listEditor = (word, namePlaceholder, textPlaceholder, maxHeight, opts) => {
    opts = opts || {};
    const keep = (from, to) => { if (from.to != null) to.to = from.to; return to; };
    const box = el('div', 'max-height:' + maxHeight + ';overflow:auto;margin:0 -4px;padding:0 4px');
    let draft = [];
    const render = () => {
      box.textContent = '';
      draft.forEach((n, i) => {
        const row = el('div', 'border:1px solid #ccc;border-radius:8px;padding:7px;margin-bottom:8px;background:#fafafa');
        const name = el('input', FULL + 'padding:5px 6px;border:1px solid #aaa;border-radius:5px;font:inherit;font-weight:600;color:#111;background:#fff');
        name.type = 'text'; name.value = n[0]; name.placeholder = namePlaceholder;
        name.oninput = () => { n[0] = name.value; };
        const text = el('textarea', FULL + 'margin-top:5px;padding:5px 6px;border:1px solid #aaa;border-radius:5px;font:inherit;font-size:12px;color:#111;background:#fff;resize:vertical');
        text.rows = 3; text.value = n[1]; text.placeholder = textPlaceholder;
        text.oninput = () => { n[1] = text.value; };
        const tools = el('div', 'display:flex;gap:4px;margin-top:5px');
        const moveBy = d => () => { const j = i + d; if (j < 0 || j >= draft.length) return; const t = draft[i]; draft[i] = draft[j]; draft[j] = t; render(); };
        tools.append(
          smallBtn('↑', moveBy(-1), i === 0 ? 'opacity:.4' : ''),
          smallBtn('↓', moveBy(1), i === draft.length - 1 ? 'opacity:.4' : ''),
          smallBtn('Delete', () => { draft.splice(i, 1); render(); }, 'margin-left:auto;color:#b00020;border-color:#e0a0a8')
        );
        if (opts.rowExtra) tools.insertBefore(opts.rowExtra(n), tools.lastChild);
        row.append(name, text, tools);
        box.appendChild(row);
      });
    };
    const Word = word.charAt(0).toUpperCase() + word.slice(1);
    return {
      box,
      get: () => draft,
      load: items => { draft = items.map(n => keep(n, n.slice())); render(); },
      add: () => {
        draft.push(['', '']);
        render();
        box.scrollTop = box.scrollHeight;
        const inputs = box.querySelectorAll('input');
        if (inputs.length) inputs[inputs.length - 1].focus();
      },
      // Trims and checks the list. Returns { list } if it's OK to save, or { error }.
      clean: () => {
        const cleaned = draft.map(n => keep(n, [n[0].trim(), n[1].trim()])).filter(n => n[0] || n[1]);
        if (!cleaned.length && !opts.allowEmpty) return { error: '⚠️ Keep at least one ' + word + '.' };
        const missing = cleaned.findIndex(n => !n[1]);
        if (missing > -1) return { error: '⚠️ ' + Word + ' ' + (missing + 1) + ' has no text.' };
        cleaned.forEach((n, i) => { if (!n[0]) n[0] = Word + ' ' + (i + 1); });
        return { list: cleaned };
      }
    };
  };

  // Only one tool can drive the page at a time (both of them navigate around).
  let lock = null;

  // Types text into a box in a way the page notices (so its Save buttons see the change).
  const insert = (box, text) => {
    if (!box || !document.contains(box)) return false;
    box.focus();
    if (box.tagName === 'TEXTAREA' || box.tagName === 'INPUT') {
      const s = box.selectionStart == null ? box.value.length : box.selectionStart;
      const before = box.value.slice(0, s);
      if (before && !/\s$/.test(before)) text = (box.tagName === 'TEXTAREA' ? '\n' : ' ') + text;
      if (document.execCommand && document.execCommand('insertText', false, text) && box.value.indexOf(text) > -1) return true;
      const e = box.selectionEnd == null ? s : box.selectionEnd;
      const v = box.value.slice(0, s) + text + box.value.slice(e);
      const proto = box.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(box, v);
      box.selectionStart = box.selectionEnd = s + text.length;
      box.dispatchEvent(new Event('input', { bubbles: true }));
      box.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return !!(document.execCommand && document.execCommand('insertText', false, text));
  };
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) { prompt('Copy this:', text); return false; }
  };

  // ===================================================================
  // Panel shell: header, tool tabs, Home screen; moving, resizing and minimizing
  // ===================================================================
  const panel = el('div', 'position:fixed;right:16px;bottom:16px;z-index:2147483647;width:300px;box-sizing:border-box;display:flex;flex-direction:column;' +
    'background:#fff;color:#111;border:1px solid #8a9099;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.24),0 2px 6px rgba(0,0,0,.12);' +
    'font:13px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden;text-align:left');
  panel.id = ID;
  // The look of the panel's frame. Everything is scoped to the panel, so the page is untouched.
  const sheet = el('style');
  sheet.textContent = [
    '#ID button:focus-visible{outline:2px solid #1a6ed8;outline-offset:1px}',
    '#ID button:disabled{cursor:default}',
    '#ID .st-head{display:flex;align-items:center;gap:2px;padding:6px 6px 6px 12px;background:#1f2933;color:#fff;cursor:move;user-select:none;flex:none}',
    '#ID .st-title{flex:1;min-width:0;display:flex;align-items:baseline;gap:6px;font-weight:700;white-space:nowrap;overflow:hidden}',
    '#ID .st-title>span:first-child{overflow:hidden;text-overflow:ellipsis}',
    '#ID .st-ver{font-weight:400;font-size:11px;opacity:.65}',
    '#ID .st-run{display:none;flex:none;margin-right:4px;padding:1px 7px;border-radius:9px;background:#f9a825;color:#1f2933;font-size:11px;font-weight:700}',
    '#ID .st-hbtn{flex:none;width:28px;height:26px;padding:0;border:0;border-radius:6px;background:transparent;color:#fff;font:inherit;font-size:15px;line-height:26px;text-align:center;cursor:pointer;opacity:.85}',
    '#ID .st-hbtn:hover:not(:disabled){background:rgba(255,255,255,.16);opacity:1}',
    '#ID .st-hbtn:disabled{opacity:.3}',
    '#ID .st-hbtn.on{background:rgba(255,255,255,.14)}',
    '#ID .st-tabs{display:flex;gap:2px;padding:4px 5px;background:#eef0f3;border-bottom:1px solid #dde0e5;flex:none}',
    '#ID .st-tab{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 1px 3px;border:0;border-radius:7px;background:transparent;color:#4a5361;font:inherit;font-size:10.5px;line-height:1.2;cursor:pointer}',
    '#ID .st-tab b{font-size:15px;line-height:1.1;font-weight:400}',
    '#ID .st-tab:hover:not(:disabled){background:#e1e4e9;color:#111}',
    '#ID .st-tab.on{background:#fff;color:#111;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.14),inset 0 -2px 0 #1a6ed8}',
    '#ID .st-tab:disabled{opacity:.35;cursor:not-allowed}',
    '#ID .st-body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain}',
    '#ID .st-body::-webkit-scrollbar{width:9px}',
    '#ID .st-body::-webkit-scrollbar-thumb{background:#c5cad2;border-radius:9px;border:2px solid #fff}',
    '#ID .st-grip{position:absolute;right:0;bottom:0;width:16px;height:16px;cursor:nwse-resize;z-index:2;' +
      'background:linear-gradient(135deg,transparent 0 55%,#9aa1ab 55% 61%,transparent 61% 71%,#9aa1ab 71% 77%,transparent 77%)}',
    '#ID.st-min .st-tabs,#ID.st-min .st-body,#ID.st-min .st-grip,#ID.st-min .st-bar{display:none !important}',
    '#ID .st-cards{display:grid;gap:6px}',
    '#ID .st-card{display:grid;grid-template-columns:30px 1fr;align-items:center;column-gap:8px;width:100%;padding:8px 10px;border:1px solid #d5d9df;border-radius:9px;background:#f8f9fb;color:#111;font:inherit;text-align:left;cursor:pointer}',
    '#ID .st-card:hover{background:#eef3fb;border-color:#9dbbe8}',
    '#ID .st-card b{grid-row:span 2;font-size:20px;font-weight:400;text-align:center}',
    '#ID .st-card strong{font-size:13px}',
    '#ID .st-card small{font-size:11.5px;color:#5a6270}',
    '#ID .st-tip{font-size:11px;color:#6b7280}',
    '#ID .st-sec{border:1px solid #dfe2e7;border-radius:8px;margin-top:8px}',
    '#ID .st-sec-head{display:flex;align-items:center;gap:6px;width:100%;padding:6px 8px;border:0;border-radius:8px;background:#f5f6f8;color:#111;font:inherit;font-size:12px;text-align:left;cursor:pointer}',
    '#ID .st-sec-head:hover{background:#eceef2}',
    '#ID .st-sec-head[aria-expanded="true"]{border-radius:8px 8px 0 0;border-bottom:1px solid #dfe2e7}',
    '#ID .st-sec-head span:nth-child(2){font-weight:700;flex:none}',
    '#ID .st-sec-sum{flex:1;min-width:0;text-align:right;color:#5a6270;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#ID .st-sec-body{padding:4px 8px 8px}'
  ].join('\n').replace(/#ID/g, '#' + ID);
  panel.appendChild(sheet);
  // Most screens scroll inside the panel; long lists use this much of its height (it follows the
  // panel's size, see place() below).
  const room = px => 'max(110px,calc(var(--st-h,100vh) - ' + (px + 40) + 'px))';

  // While a tool is picking jobs, pressing on a job must not start a drag or move the page.
  // (The job list at the bottom takes focus when pressed, and the browser then jumps back to
  // its top.) So the press is swallowed, the tool handles the click, and if anything still
  // scrolled, the scroll is put back.
  const pickers = [];   // one per tool: { active: is it picking right now?, hit: is this target something it picks? }
  let pressSnap = null;
  const scrollersOf = node => {
    const out = [];
    for (let e = node; e && e !== document.documentElement; e = e.parentElement) {
      if (e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1) out.push(e);
    }
    const root = document.scrollingElement || document.documentElement;
    if (out.indexOf(root) < 0) out.push(root);
    return out.map(e => [e, e.scrollTop, e.scrollLeft]);
  };
  const putBack = snap => snap && snap.forEach(([e, top, left]) => { if (e.scrollTop !== top) e.scrollTop = top; if (e.scrollLeft !== left) e.scrollLeft = left; });
  const pressGuard = e => {
    if (!onBoard() || panel.contains(e.target) || !pickers.some(p => p.active() && p.hit(e.target))) return;
    if (e.type === 'click') {
      // Let the tool handle the click; undo any jump after the page has had its turn.
      const snap = pressSnap; pressSnap = null;
      requestAnimationFrame(() => putBack(snap));
      setTimeout(() => putBack(snap), 150);
      return;
    }
    if (e.type === 'pointerdown') pressSnap = scrollersOf(e.target);
    if (e.type === 'mousedown') e.preventDefault();   // no focus change, no text selection
    e.stopPropagation(); e.stopImmediatePropagation();
  };
  const PRESS_EVENTS = ['pointerdown', 'mousedown', 'click'];
  PRESS_EVENTS.forEach(t => window.addEventListener(t, pressGuard, true));

  // A job on the board's timeline: its customer, and the tech's first name (for {tech}).
  const timelineJob = j => {
    try {
      const jl = document.querySelector('.job-list');
      const vm = jl && window.ko && window.ko.dataFor(jl);
      const list = (vm && window.ko.unwrap(vm.Assignments)) || [];
      const u = window.ko.unwrap;
      const a = list.find(x => String(u(x.JobId)) === String(j));
      if (!a) return null;
      const tech = norm(u(a.FirstName) || u(a.TechnicianName)).split(' ')[0] || '';
      return { customer: norm(u(a.Customer)), customerId: u(a.CustomerId) || null, tech: tech ? tech.charAt(0).toUpperCase() + tech.slice(1).toLowerCase() : '' };
    } catch (e) { return null; }
  };

  // ===================================================================
  // Picking jobs: shared by Job Notifications, Business Unit and Customer Texts.
  // With 🖱️ Pick on board on, clicking a job on the timeline, or a row in the job list at the
  // bottom, adds it (click again to take it off). Jobs can also be typed in, or a whole list
  // tab added at once. Picked jobs are highlighted only while their tool is open.
  //   opts: { color, soft, max, shown() (tool open and using picked jobs), busy() (a run is
  //           going), say(text), changed() (the list changed) }
  // ===================================================================
  const jobPicker = opts => {
    const picked = new Map();   // job number -> label (usually the customer's name)
    let picking = false, enabled = true;
    const style = el('style');
    (document.head || document.documentElement).appendChild(style);
    const labelOf = j => {
      const t = timelineJob(j); if (t && t.customer) return t.customer;
      const l = listJob(j); if (l && l.customer) return l.customer;
      const a = document.querySelector('a.appointment[data-job-id="' + j + '"]');
      return a ? norm(a.innerText || a.textContent).slice(0, 38) : '';
    };
    const say = t => opts.say && opts.say(t);
    const box = el('div', 'display:grid;gap:5px');
    const head = el('div', 'display:flex;gap:6px;align-items:center;flex-wrap:wrap');
    const count = el('span', 'font-size:12px;font-weight:600;margin-right:auto');
    const pickBtn = smallBtn('🖱️ Pick on board', () => setPicking(!picking));
    const allBtn = smallBtn('+ All in the list', () => addListTab());
    allBtn.title = 'Adds every job showing in the list at the bottom of the board (the tab and page that are open)';
    const clearBtn = smallBtn('Clear', () => { if (opts.busy()) return; picked.clear(); changed(); say('List cleared.'); });
    head.append(count, pickBtn, allBtn, clearBtn);
    const list = el('div', 'max-height:150px;overflow:auto;border:1px solid #ddd;border-radius:6px;background:#fafafa');
    const typedRow = el('div', 'display:flex;gap:6px');
    const typed = el('input', 'flex:1;min-width:0;padding:5px 6px;border:1px solid #aaa;border-radius:6px;font:inherit;font-size:12px;color:#111;background:#fff');
    typed.type = 'text'; typed.placeholder = 'Or type job #s (any day)';
    const typedAdd = smallBtn('Add', () => addTyped());
    typed.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addTyped(); } };
    typedRow.append(typed, typedAdd);
    box.append(head, list, typedRow);

    const paint = () => { style.textContent = opts.shown() ? pickedCss(Array.from(picked.keys()), opts.color, opts.soft) : ''; };
    const render = () => {
      count.textContent = plural(picked.size, 'job') + ' picked';
      pickBtn.textContent = picking ? '🖱️ Picking: ON' : '🖱️ Pick on board';
      pickBtn.style.background = picking ? opts.color : '#fff';
      pickBtn.style.color = picking ? '#fff' : '#111';
      pickBtn.style.borderColor = picking ? opts.color : '#aaa';
      pickBtn.style.fontWeight = picking ? '600' : '400';
      list.textContent = '';
      if (!picked.size) list.appendChild(el('div', 'padding:6px 8px;font-size:12px;color:#666', picking ? 'Click jobs on the board, or in the Unassigned / Hold list at the bottom, to add them. Click again to take one off.' : 'Press 🖱️ Pick on board, use + All in the list, or type job numbers.'));
      picked.forEach((lab, j) => {
        const r = el('div', 'display:flex;gap:6px;align-items:center;padding:3px 6px;border-bottom:1px solid #eee;font-size:12px');
        const n = el('span', 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap');
        n.append(el('b', '', '#' + j), document.createTextNode(lab ? '  ' + lab : ''));
        n.title = lab;
        const x = smallBtn('✕', () => { if (opts.busy()) return; picked.delete(j); changed(); }, 'padding:1px 6px');
        x.title = 'Take this job off the list';
        r.append(n, x);
        list.appendChild(r);
      });
      [pickBtn, allBtn, clearBtn, typed, typedAdd].forEach(x => { x.disabled = !enabled; x.style.opacity = enabled ? '1' : '.5'; });
      paint();
    };
    const changed = () => { render(); if (opts.changed) opts.changed(); };
    const add = j => {
      if (picked.has(j)) return false;
      if (opts.max && picked.size >= opts.max) { say('⚠️ The list is full (' + opts.max + ' jobs per run).'); return false; }
      picked.set(j, labelOf(j));
      return true;
    };
    const addTyped = () => {
      if (opts.busy()) return;
      const nums = typed.value.match(/\d{4,}/g) || [];
      if (!nums.length) { say('Type one or more job numbers first.'); return; }
      let n = 0;
      nums.forEach(j => { if (add(j)) n++; });
      typed.value = '';
      changed();
      say('Added ' + plural(n, 'job') + '. ' + plural(picked.size, 'job') + ' picked.');
    };
    // Every job showing in the list at the bottom of the board (the open tab and page).
    const addListTab = () => {
      if (opts.busy()) return;
      let caption = '', jobs = [];
      try {
        const jl = document.querySelector('.job-list');
        const vm = jl && window.ko && window.ko.dataFor(jl);
        const JL = vm && vm.JobList;
        const view = JL && window.ko.unwrap(JL.View);
        caption = (view && view.Caption) || '';
        jobs = ((JL && window.ko.unwrap(JL.AllVisibleJobs)) || []).map(x => String(window.ko.unwrap(x.JobId)));
      } catch (e) {}
      if (!jobs.length) document.querySelectorAll('.job-list tr[class*="qa-job-"]').forEach(tr => { const j = clickedJob(tr); if (j && visible(tr)) jobs.push(j); });
      if (!jobs.length) { say('The list at the bottom of the board is empty. Open a tab there (Unassigned, Hold, …) first.'); return; }
      let n = 0;
      jobs.forEach(j => { if (/^\d+$/.test(j) && add(j)) n++; });
      changed();
      say('Added ' + plural(n, 'job') + (caption ? ' from the ' + caption + ' list' : ' from the list') + ' (the page showing).');
    };
    const setPicking = on => {
      picking = !!on && enabled && !opts.busy();
      if (picking && !onBoard()) say('Open the Dispatch board to pick jobs there.');
      else if (picking) say('Click jobs on the board, or in the Unassigned / Hold list at the bottom, to add them. Click one again to take it off.');
      render();
    };
    const onClick = e => {
      if (!picking || opts.busy() || !onBoard() || !opts.shown() || panel.contains(e.target)) return;
      const j = clickedJob(e.target);
      if (!j) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (picked.has(j)) { picked.delete(j); say('Took #' + j + ' off. ' + plural(picked.size, 'job') + ' picked.'); }
      else if (add(j)) say('Added #' + j + '. ' + plural(picked.size, 'job') + ' picked.');
      changed();
    };
    window.addEventListener('click', onClick, true);
    pickers.push({ active: () => picking && !opts.busy() && opts.shown(), hit: t => !!clickedJob(t) });
    render();
    return {
      box,
      size: () => picked.size,
      ids: () => Array.from(picked.keys()),
      has: j => picked.has(j),
      label: j => picked.get(j) || '',
      remove: j => { picked.delete(j); render(); },
      render,
      setPicking,
      isPicking: () => picking,
      setEnabled: on => { enabled = !!on; if (!enabled) picking = false; render(); },
      cleanup: () => { window.removeEventListener('click', onClick, true); style.remove(); }
    };
  };
  // Header: the tool's name, then ⌂ Home, – Minimize and ✕ Close. Drag it to move the panel;
  // double-click it to minimize.
  const header = el('div');
  header.className = 'st-head';
  const titleWrap = el('div');
  titleWrap.className = 'st-title';
  const titleText = el('span', '', '🧰 Toolbox');
  const verText = el('span', '', 'v' + VERSION);
  verText.className = 'st-ver';
  titleWrap.append(titleText, verText);
  const runBadge = el('span', '', '● Running');
  runBadge.className = 'st-run';
  const headBtn = (text, title, act) => {
    const b = el('button', '', text);
    b.type = 'button'; b.className = 'st-hbtn'; b.title = title;
    b.setAttribute(act[0], act[1]);
    b.addEventListener('mousedown', e => e.preventDefault());
    return b;
  };
  const homeBtn = headBtn('⌂', 'Home: all tools', ['data-nav', 'menu']);
  const minBtn = headBtn('–', 'Minimize (double-click the title bar works too)', ['data-act', 'min']);
  const closeX = headBtn('✕', 'Close', ['data-act', 'close']);
  header.append(titleWrap, runBadge, homeBtn, minBtn, closeX);

  // One tab per tool, so any tool is one click away.
  const TABS = [['notes', '📝', 'Notes', 'Notes'], ['jobs', '🔕', 'Notify', 'Job Notifications'], ['msgs', '💬', 'Techs', 'Tech Messages'],
    ['biz', '🏢', 'Units', 'Business Unit'], ['texts', '📱', 'Texts', 'Customer Texts']];
  const tabBar = el('div');
  tabBar.className = 'st-tabs';
  const tabs = {};
  TABS.forEach(([key, icon, short, full]) => {
    const b = el('button');
    b.type = 'button'; b.className = 'st-tab'; b.title = full;
    b.setAttribute('data-nav', key);
    b.append(el('b', '', icon), el('span', '', short));
    b.addEventListener('mousedown', e => e.preventDefault());
    tabBar.appendChild(b);
    tabs[key] = b;
  });

  // "What's new" line, shown once after an update.
  const news = el('div', 'display:none;padding:7px 12px;background:#e8f4ea;color:#1b5e20;font-size:12px;border-bottom:1px solid #cfe5d2;flex:none');
  news.className = 'st-bar';
  const lastSeen = get('stSeenVersion');
  if (lastSeen !== VERSION) {
    news.textContent = (lastSeen ? '✨ Updated to v' + VERSION + ': ' : '✨ ') + (WHATS_NEW[VERSION] || 'New version.');
    news.style.display = 'block';
    set('stSeenVersion', VERSION);
    setTimeout(() => { news.style.display = 'none'; }, 12000);
  }

  // ===================================================================
  // Health check: notices when ServiceTitan has changed something a tool relies on,
  // and says so in a yellow bar instead of failing quietly.
  // ===================================================================
  const health = (() => {
    const issues = new Map();   // key -> { tool, what, detail }
    const bar = el('div', 'display:none;padding:7px 12px;background:#fff4e5;color:#6b3f00;font-size:12px;border-bottom:1px solid #f0d3a6;flex:none;max-height:40%;overflow:auto');
    bar.className = 'st-bar';
    const barText = el('div', 'white-space:pre-wrap');
    const barBtns = el('div', 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px');
    bar.append(barText, barBtns);
    const report = () => {
      const lines = ['ServiceTitan Toolbox v' + VERSION + ' health report', 'When: ' + new Date().toLocaleString(), 'Page: ' + location.hash.split('?')[0], ''];
      issues.forEach(i => lines.push('- ' + i.tool + ': ' + i.what + (i.detail ? ' [' + i.detail + ']' : '')));
      return lines.join('\n');
    };
    const render = () => {
      if (!issues.size) { bar.style.display = 'none'; return; }
      const list = Array.from(issues.values());
      barText.textContent = '⚠️ ServiceTitan may have changed. ' + (list.length === 1 ? 'This' : 'These') + ' may not work right now:\n' +
        list.map(i => '• ' + i.tool + ': ' + i.what).join('\n');
      barBtns.textContent = '';
      const cp = smallBtn('Copy report', async () => { if (await copy(report())) cp.textContent = 'Copied'; });
      barBtns.append(cp, smallBtn('Check again', () => checkBoard(true)), smallBtn('Hide', () => { bar.style.display = 'none'; }));
      bar.style.display = 'block';
    };
    // group 'board' = startup checks (cleared on each re-check); 'use' = found while a tool was running.
    const flag = (tool, what, detail, group) => {
      const key = (group || 'use') + '|' + tool + '|' + what;
      if (issues.has(key)) return;
      issues.set(key, { tool, what, detail });
      render();
    };
    // Clears problems a tool found while running, once that tool works again.
    const clear = tool => {
      let changed = false;
      Array.from(issues.keys()).forEach(k => { if (k.indexOf('use|' + tool + '|') === 0) { issues.delete(k); changed = true; } });
      if (changed) render();
    };

    // Board checks run without clicking anything. They only look at the Dispatch board,
    // and wait for it to finish loading before deciding anything is missing.
    let checking = false, manualWaiting = false;
    const checkBoard = async manual => {
      // If a check is already running, show its result when it finishes.
      if (checking) { if (manual) manualWaiting = true; return; }
      if (!/dispatchboard/i.test(location.hash)) { if (manual) { issues.size ? render() : flashOk('Open the Dispatch board to check it.'); } return; }
      checking = true;
      try {
        const techEls = await until(() => { const t = document.querySelectorAll('.technician[data-technician-id]'); return t.length ? t : null; }, 12000, 500);
        Array.from(issues.keys()).forEach(k => { if (k.indexOf('board|') === 0) issues.delete(k); });
        const BOARD = 'Job Notifications & Tech Messages';
        if (!techEls) {
          flag(BOARD, 'can\'t find the techs on the Dispatch board', '.technician[data-technician-id]', 'board');
        } else {
          // Check a tech that's showing: with a board filter on, hidden techs can be missing pieces.
          const first = Array.from(techEls).find(techShowing) || techEls[0];
          const id = first.getAttribute('data-technician-id');
          const nameEl = first.querySelector('.name');
          if (!nameEl || !nameEl.textContent.trim()) flag(BOARD, 'can\'t read tech names', '.technician .name', 'board');
          // A team or people filter hides the team headers. That's fine once the Toolbox has
          // learned everyone's team from an unfiltered board (Tech Messages remembers them).
          let knownTeams = 0;
          try { knownTeams = Object.keys(JSON.parse(localStorage.getItem('stMsgTeamMap') || '{}') || {}).length; } catch (e) {}
          const FILTER_HINT = ' (if a board filter is on, clear it once so the Toolbox can learn the teams)';
          if (!knownTeams && !document.querySelector('.team-name')) flag('Tech Messages', 'can\'t find team names' + FILTER_HINT, '.team-name', 'board');
          const row = document.getElementById('team-timeline-row-' + id);
          if (!row) flag(BOARD, 'can\'t find the tech\'s row on the timeline', '#team-timeline-row-<id>', 'board');
          else if (!knownTeams) {
            const tc = row.closest('.team-container');
            let h = tc && tc.previousElementSibling;
            while (h && !h.querySelector('.team-name')) h = h.previousElementSibling;
            if (!h && document.querySelector('.team-name')) flag('Tech Messages', 'can\'t tell which team each tech is on', '.team-container / .team-name', 'board');
          }
          // Job bubbles: only a problem if bubbles exist but are missing their job/tech tags.
          const bubbles = document.querySelectorAll('a.appointment');
          if (bubbles.length && !document.querySelector('a.appointment[data-job-id][data-technician-id]')) flag('Job Notifications', 'job bubbles are missing their job/tech tags', 'a.appointment[data-job-id][data-technician-id]', 'board');
        }
        render();
        if ((manual || manualWaiting) && !issues.size) flashOk('✅ Everything the Toolbox needs is where it should be.');
      } finally { checking = false; manualWaiting = false; }
    };
    let okTimer = null;
    const flashOk = text => {
      barText.textContent = text; barBtns.textContent = '';
      bar.style.display = 'block';
      clearTimeout(okTimer);
      okTimer = setTimeout(() => render(), 5000);
    };
    return { bar, flag, clear, checkBoard };
  })();
  const CHANGED = ' ServiceTitan may have changed (see the yellow bar).';

  const menuPane = el('div', 'display:none;padding:10px');
  const notesPane = el('div', 'display:none');
  const jobsPane = el('div', 'display:none');
  const msgsPane = el('div', 'display:none');
  const bizPane = el('div', 'display:none');
  const textsPane = el('div', 'display:none');
  const views = { menu: menuPane, notes: notesPane, jobs: jobsPane, msgs: msgsPane, biz: bizPane, texts: textsPane };
  const TITLES = { menu: '🧰 Toolbox', notes: '📝 Notes', jobs: '🔕 Job Notifications', msgs: '💬 Tech Messages', biz: '🏢 Business Unit', texts: '📱 Customer Texts' };
  // The screens scroll in here; the header, tabs and warning bars stay put.
  const body = el('div');
  body.className = 'st-body';
  const toTop = () => { body.scrollTop = 0; };
  // A row of buttons with the less-used ones tucked behind ⋯ More.
  const moreRow = (main, extra) => {
    const wrap = el('div', 'margin-top:10px');
    const top = el('div', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center');
    const rest = el('div', 'display:none;flex-wrap:wrap;gap:6px;margin-top:6px;padding-top:6px;border-top:1px dashed #d5d9df');
    let open = false;
    const toggle = smallBtn('', () => { open = !open; paint(); }, 'margin-left:auto');
    toggle.setAttribute('data-act', 'more');
    const paint = () => {
      rest.style.display = open ? 'flex' : 'none';
      toggle.textContent = open ? '▴ Less' : '⋯ More';
      toggle.title = open ? 'Hide these buttons' : extra.map(b => b.textContent.replace(/^\S+\s/, '')).join(', ');
    };
    extra.forEach(b => {
      const run = b.onclick;
      b.onclick = e => { open = false; paint(); run(e); toTop(); };
    });
    top.append(...main, toggle);
    rest.append(...extra);
    wrap.append(top, rest);
    paint();
    return wrap;
  };
  // While a tool is running, the other tools wait (only one can drive the page at a time).
  const LOCK_VIEW = { 'Notes': 'notes', 'Job Notifications': 'jobs', 'Tech Messages': 'msgs', 'Business Unit': 'biz', 'Customer Texts': 'texts' };
  let current = 'menu';
  const blocked = name => !!lock && LOCK_VIEW[lock] !== name;
  let navKey = '';
  const syncNav = () => {
    const key = (lock || '') + '|' + current;
    if (key === navKey) return;   // nothing changed since last time
    navKey = key;
    Object.keys(tabs).forEach(k => {
      const t = tabs[k], no = blocked(k) && k !== current;
      t.classList.toggle('on', k === current);
      t.disabled = no;
      t.title = no ? 'Wait for ' + lock + ' to finish' : TITLES[k].replace(/^\S+\s/, '');
    });
    homeBtn.disabled = !!lock && current !== 'menu';
    homeBtn.classList.toggle('on', current === 'menu');
    homeBtn.title = homeBtn.disabled ? 'Wait for ' + lock + ' to finish' : 'Home: all tools';
    runBadge.style.display = lock ? 'inline-block' : 'none';
    runBadge.title = lock ? lock + ' is running' : '';
  };
  const go = name => { if (name === current || blocked(name)) return; showView(name); };
  const showView = name => {
    Object.keys(views).forEach(k => { views[k].style.display = k === name ? 'block' : 'none'; });
    titleText.textContent = TITLES[name];
    current = name;
    set('stView', name);
    toTop();
    syncNav();
    if (name !== 'notes' && typeof notes !== 'undefined') notes.leave();
    if (name !== 'jobs' && typeof notify !== 'undefined') notify.leave();
    if (name === 'jobs' && typeof notify !== 'undefined') notify.refresh();
    if (name !== 'msgs' && typeof msgs !== 'undefined') msgs.leave();
    if (name === 'msgs' && typeof msgs !== 'undefined') msgs.refresh();
    if (name !== 'biz' && typeof biz !== 'undefined') biz.leave();
    if (name === 'biz' && typeof biz !== 'undefined') biz.refresh();
    if (name !== 'texts' && typeof texts !== 'undefined') texts.leave();
    if (name === 'texts' && typeof texts !== 'undefined') texts.refresh();
  };

  // Home: every tool with a line on what it does.
  const ABOUT = {
    notes: 'Add a ready-made note to a job\'s customer.',
    jobs: 'Check or turn off job notifications.',
    msgs: 'Send Good Morning or ETA messages to techs.',
    biz: 'Switch jobs to Mendenhall or another branch.',
    texts: 'Text customers about holds, updates and reschedules.'
  };
  const cards = el('div');
  cards.className = 'st-cards';
  TABS.forEach(([key, icon, , full]) => {
    const c = el('button');
    c.type = 'button'; c.className = 'st-card';
    c.setAttribute('data-nav', key);
    c.append(el('b', '', icon), el('strong', '', full), el('small', '', ABOUT[key]));
    c.addEventListener('mousedown', e => e.preventDefault());
    cards.appendChild(c);
  });
  const homeFoot = el('div', 'display:flex;gap:8px;align-items:center;margin-top:10px');
  const tip = el('span', 'flex:1', 'Drag the top bar to move me, the corner to resize, – to shrink.');
  tip.className = 'st-tip';
  homeFoot.append(tip, smallBtn('🩺 Check', () => health.checkBoard(true)));
  menuPane.append(cards, homeFoot);
  body.append(menuPane, notesPane, jobsPane, msgsPane, bizPane, textsPane);
  const grip = el('div');
  grip.className = 'st-grip';
  grip.title = 'Drag to resize. Double-click to go back to the normal size.';
  panel.append(header, tabBar, news, health.bar, body, grip);
  // Tabs, Home cards and ⌂ all switch tools the same way.
  panel.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-nav]');
    if (b && panel.contains(b) && !b.disabled) go(b.getAttribute('data-nav'));
  });

  // ===================================================================
  // Tool 1: Notes
  // Ready-made notes, sorted into folders (Updates, Techs, Reschedule, plus any you add).
  // Pick a folder, then a note, and it's added to the clicked job's customer.
  // ===================================================================
  const notes = (() => {
    const DEFAULT_NOTES = [
      ['📞 No Answer', 'Attempted to contact customer. No answer. Left voicemail requesting call back.'],
      ['✅ Customer Confirmed', 'Spoke with customer and confirmed appointment.'],
      ['📬 Left Voicemail', 'Called customer. No answer. Left voicemail.'],
      ['🔁 Follow Up', 'Customer requires follow-up. Please review notes and contact customer.'],
      ['🚫 Cancelled', 'Customer requested cancellation of appointment.']
    ];
    const DEFAULT_FOLDERS = [
      { name: '📞 Updates', notes: DEFAULT_NOTES },
      { name: '🚚 Techs', notes: [
        ['🚗 Tech On The Way', 'Contacted customer to let them know the technician is on the way.'],
        ['📍 Tech Arrived', 'Technician has arrived at the customer\'s home.'],
        ['⏰ Tech Running Late', 'Contacted customer to let them know the technician is running behind schedule.'],
        ['🏁 Tech Finished', 'Technician has completed the visit.']
      ] },
      { name: '📅 Reschedule', notes: [
        ['📅 Customer Request', 'Appointment rescheduled at the customer\'s request.'],
        ['👷 Tech Availability', 'Appointment rescheduled due to technician availability. Customer has been notified.'],
        ['🌧️ Weather', 'Appointment rescheduled due to weather. Customer has been notified.'],
        ['📞 Couldn\'t Reach Customer', 'Attempted to contact customer to reschedule. No answer. Left voicemail.']
      ] }
    ];
    // qnNotes/qnStamp are the old Quick Notes keys. qnNotes is only read once, to fill the
    // Updates folder the first time someone opens a version with folders. It's left alone.
    const KEY_NOTES = 'qnNotes', KEY_STAMP = 'qnStamp', KEY_FOLDERS = 'stNoteFolders', KEY_OPEN = 'stNoteFolder';
    const validPairs = v => Array.isArray(v) &&
      v.every(n => Array.isArray(n) && n.length === 2 && typeof n[0] === 'string' && typeof n[1] === 'string');
    const validNotes = v => validPairs(v) && v.length > 0;
    const validFolders = v => Array.isArray(v) && v.length > 0 && v.every(f => f && typeof f.name === 'string' && validPairs(f.notes));
    const copyFolders = fs => fs.map(f => ({ name: f.name, notes: f.notes.map(n => n.slice()) }));
    let folders = (() => {
      try { const v = JSON.parse(get(KEY_FOLDERS)); if (validFolders(v)) return v; } catch (e) {}
      // First time with folders: the notes this person already had become the Updates folder.
      const fs = copyFolders(DEFAULT_FOLDERS);
      try { const old = JSON.parse(get(KEY_NOTES)); if (validNotes(old)) fs[0].notes = old.map(n => n.slice()); } catch (e) {}
      set(KEY_FOLDERS, JSON.stringify(fs));
      return fs;
    })();
    const saveFolders = () => set(KEY_FOLDERS, JSON.stringify(folders));
    // The open folder (-1 = the folder list). Remembered for next time.
    let open = parseInt(get(KEY_OPEN), 10);
    if (!(open >= -1 && open < folders.length)) open = -1;
    const cur = () => (open >= 0 && folders[open] ? folders[open].notes : []);

    // Where things are in ServiceTitan.
    const openDrawers = () => Array.from(document.querySelectorAll('.Drawer--open'));
    const noteDrawer = () => openDrawers().find(d => d.querySelector('[data-tracking-id="add-note-button"]')) || null;
    const noteBox = () => { const d = noteDrawer(); return d ? d.querySelector('textarea') : null; };
    const jobCustomerLink = () => {
      for (const d of openDrawers()) {
        const a = d.querySelector('a[href^="#/Customer/"], a[href^="#/customer/"]');
        if (a) return a;
      }
      return null;
    };
    const onCustomerPage = id => { const m = location.hash.match(/#\/customer\/(\d+)/i); return m && (!id || m[1] === id); };
    const addNoteBtn = () => {
      const b = document.querySelector('button[data-tracking-id="crm-notes-add-note-button"]') ||
        Array.from(document.querySelectorAll('button')).find(x => x.textContent.trim() === 'Add Note' && !x.closest('.Drawer--open'));
      return visible(b) ? b : null;
    };
    const saveReady = () => {
      const s = (noteDrawer() || document).querySelector('[data-tracking-id="add-note-button"]');
      return s && !s.disabled && !/Button--disabled/.test(s.className) ? s : null;
    };

    // The last text box you clicked in on the page (used when you're not on the board).
    const isField = x => x && x.closest && !x.closest('#' + ID) &&
      (x.tagName === 'TEXTAREA' || (x.tagName === 'INPUT' && /^(text|search|)$/i.test(x.type || '')) || x.isContentEditable);
    let lastField = isField(document.activeElement) ? document.activeElement : null;
    const onFocus = e => { if (isField(e.target)) lastField = e.target; };
    document.addEventListener('focusin', onFocus, true);

    // ---- UI ----
    const main = el('div', 'padding:8px 10px 10px');
    const msg = el('div', 'font-size:12px;color:#444;margin-bottom:4px;min-height:16px');
    const say = s => { msg.textContent = s; };
    const crumb = el('div', 'display:none;align-items:center;gap:8px;margin-bottom:2px');
    const crumbName = el('span', 'font-weight:700');
    crumb.append(smallBtn('← Folders', () => openFolder(-1)), crumbName);
    const btnList = el('div', 'max-height:' + room(290) + ';overflow:auto');
    const stampRow = el('label', 'display:flex;gap:6px;align-items:center;margin-top:6px;font-size:12px;cursor:pointer');
    stampRow.addEventListener('mousedown', e => e.preventDefault());
    const stamp = el('input');
    stamp.type = 'checkbox';
    stamp.checked = get(KEY_STAMP) === '1';
    stamp.onchange = () => set(KEY_STAMP, stamp.checked ? '1' : '0');
    const stampText = () => {
      const d = new Date();
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };
    stampRow.append(stamp, document.createTextNode('Add time stamp (e.g. ' + stampText() + ')'));
    const backBtn = smallBtn('← Back to Dispatch board', () => { if (boardHash) location.hash = boardHash; backBtn.style.display = 'none'; }, 'display:none');
    const bottomRow = el('div', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px');
    main.append(msg, crumb, btnList, stampRow, bottomRow);

    let busy = false, boardHash = null, armed = null;

    // A list button in the same style everywhere in Notes.
    const listBtn = (label, title, onClick, highlight) => {
      const bg = highlight ? '#e3eefc' : '#f5f5f5';
      const b = el('button', FULL + 'margin:5px 0;padding:8px 9px;cursor:pointer;border:1px solid ' + (highlight ? '#1a6ed8' : '#aaa') + ';' +
        'border-radius:6px;background:' + bg + ';color:#111;text-align:left;font:inherit' + (highlight ? ';box-shadow:inset 3px 0 0 #1a6ed8' : ''), label);
      b.type = 'button';
      b.title = title;
      b.addEventListener('mousedown', e => e.preventDefault());
      b.onmouseenter = () => { b.style.background = '#e8e8e8'; };
      b.onmouseleave = () => { b.style.background = bg; };
      b.onclick = onClick;
      return b;
    };
    const keyHint = i => (i < 9 ? '\n(' + ALT + '+' + (i + 1) + ')' : '');
    const num = i => (i < 9 ? (i + 1) + '. ' : '');

    const renderList = () => {
      btnList.textContent = '';
      bottomRow.textContent = '';
      if (open < 0) {
        // The folder list.
        crumb.style.display = 'none';
        stampRow.style.display = 'none';
        folders.forEach((f, i) => {
          const n = f.notes.length;
          btnList.appendChild(listBtn(num(i) + (f.name || '(no name)') + '  (' + n + ')', 'Open this folder' + keyHint(i), () => openFolder(i)));
        });
        bottomRow.append(smallBtn('✏️ Edit folders', () => openFolderEditor()), backBtn);
        return;
      }
      // Inside a folder.
      crumbName.textContent = folders[open].name || '(no name)';
      crumb.style.display = 'flex';
      stampRow.style.display = 'flex';
      const list = cur();
      list.forEach(([name, text], i) => {
        const isArmed = armed !== null && armed === text;
        btnList.appendChild(listBtn((isArmed ? '👉 ' : '') + num(i) + (name || '(no name)'), text + keyHint(i), () => run(text), isArmed));
      });
      if (!list.length) btnList.appendChild(el('div', 'font-size:12px;color:#666;padding:6px 0', 'No notes in this folder yet. Click ✏️ Edit notes to add some.'));
      bottomRow.append(smallBtn('✏️ Edit notes', () => openEditor()), backBtn);
    };
    const openFolder = i => {
      open = i;
      set(KEY_OPEN, String(i));
      if (!/^(✅|⚠️|👉)/.test(msg.textContent)) say('');
      renderList();
      idleHint();
    };

    const build = text => (stamp.checked ? stampText() + ' - ' : '') + text;

    // Waits until the Add Note button has stopped changing (the page has finished drawing it).
    const steadyAddNoteBtn = async max => {
      const end = Date.now() + max;
      let last = null, since = 0;
      while (Date.now() < end) {
        const b = addNoteBtn();
        if (b && b === last) { if (Date.now() - since >= 500) return b; }
        else { last = b; since = Date.now(); }
        await wait(100);
      }
      return addNoteBtn();
    };

    // Clicks Add Note, and clicks again if the box doesn't open (up to 4 tries).
    const openNoteBox = async () => {
      for (let attempt = 1; attempt <= 4; attempt++) {
        if (noteBox()) return true;
        const b = await steadyAddNoteBtn(attempt === 1 ? 20000 : 5000);
        if (!b) {
          if (noteBox()) return true;
          health.flag('Notes', 'can\'t find the Add Note button on the customer page', 'button[data-tracking-id="crm-notes-add-note-button"]');
          return false;
        }
        b.scrollIntoView({ block: 'center' });
        b.click();
        if (await until(noteBox, attempt === 1 ? 6000 : 4000)) return true;
        if (attempt < 4) say('Add Note didn\'t open yet, trying again (' + (attempt + 1) + ' of 4)...');
      }
      if (noteBox()) return true;
      health.flag('Notes', 'Add Note doesn\'t open the note box', '.Drawer--open [data-tracking-id="add-note-button"] + textarea');
      return false;
    };

    // Waits until the note box has finished opening (same box, not moving) before typing.
    const settledNoteBox = async () => {
      const end = Date.now() + 4000;
      let last = null, lastKey = '', since = 0;
      while (Date.now() < end) {
        const t = noteBox();
        const r = t ? t.getBoundingClientRect() : null;
        const key = r ? Math.round(r.left) + ',' + Math.round(r.top) : '';
        if (t && t === last && key === lastKey) { if (Date.now() - since >= 400) return t; }
        else { last = t; lastKey = key; since = Date.now(); }
        await wait(80);
      }
      return noteBox();
    };

    // Types the note, then checks it's really there (the page can clear the box right after
    // it opens). Tries up to 3 times.
    const fill = async note => {
      const core = note.trim();
      for (let attempt = 1; attempt <= 3; attempt++) {
        const t = await settledNoteBox();
        if (!t) return say('⚠️ The note box closed before the note could be typed.');
        if (t.value.indexOf(core) === -1) {
          insert(t, note);
        }
        await wait(500);
        const t2 = noteBox();
        if (t2 && t2.value.indexOf(core) > -1) {
          const ready = await until(saveReady, 2000);
          return say(ready ? '✅ Note typed in. Check it, then click Add Note to save.'
                           : '⚠️ Text is in the box, but the Add Note button still looks greyed out. Type a space in the box if it won\'t save.');
        }
      }
      health.flag('Notes', 'the note box won\'t keep the typed note', '.Drawer--open textarea');
      say('⚠️ Couldn\'t type into the note box. Pick the note again.' + CHANGED);
    };

    const run = async text => {
      if (busy) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      busy = true;
      lock = 'Notes';
      try {
        if (armed && (noteBox() || onCustomerPage() || jobCustomerLink())) { armed = null; renderList(); }
        const note = build(text);

        // 1. Add Note box already open: just fill it.
        if (noteBox()) return await fill(note);

        // 2. A job is open on the board: go to its customer (the name on the left).
        if (!onCustomerPage()) {
          const link = jobCustomerLink();
          if (!link) {
            // On the board with no job open yet: hold this note and add it when a job is clicked.
            if (onBoard()) {
              armed = armed === text ? null : text;
              renderList();
              return say(armed ? '👉 Now click a job. This note will be added to it.' : 'Cancelled.');
            }
            // Somewhere else: use the box you last clicked in, or copy.
            if (insert(lastField, note)) return say('✅ Added to the box you clicked in.');
            if (await copy(note)) return say('Click a job on the Dispatch board first. (Note copied, so you can also paste it.)');
            return;
          }
          const custId = (link.getAttribute('href').match(/(\d+)/) || [])[1];
          if (onBoard()) boardHash = location.hash;
          say('Opening customer...');
          location.hash = link.getAttribute('href');
          if (!await until(() => onCustomerPage(custId), 10000)) {
            health.flag('Notes', 'the customer link didn\'t open the customer page', 'expected #/customer/<id>, got ' + location.hash.split('?')[0].replace(/\d+/g, '<id>'));
            return say('⚠️ The customer page didn\'t open.' + CHANGED);
          }
        }

        // 3. On the customer page: click Add Note (retrying if the page ignores it) and fill it.
        say('Opening Add Note...');
        if (!await openNoteBox()) return say('⚠️ Couldn\'t open the Add Note box. Click Add Note on the page, then pick the note again.' + CHANGED);
        await fill(note);
        if (/^✅/.test(msg.textContent)) health.clear('Notes');
      } catch (e) {
        say('⚠️ Error: ' + errText(e));
      } finally {
        busy = false;
        lock = null;
        backBtn.style.display = boardHash && !onBoard() ? 'inline-block' : 'none';
      }
    };

    const showing = () => notesPane.style.display !== 'none';
    const idleHint = () => {
      if (busy || !showing() || editing) return;
      if (armed) {
        if (onBoard()) say('👉 Now click a job. The highlighted note will be added. (Esc to cancel)');
        else { armed = null; renderList(); }
        return;
      }
      if (!jobCustomerLink() && openDrawers().some(d => /Job #\d+/.test(d.textContent || ''))) {
        health.flag('Notes', 'the job panel doesn\'t show the customer link where expected', '.Drawer--open a[href^="#/Customer/"]');
      }
      const pick = open < 0 ? 'Pick a folder, then a note.' : 'Pick a note.';
      if (noteBox()) say('Add Note box is open. ' + pick);
      else if (onCustomerPage()) say(pick + ' It goes on this customer.');
      else if (jobCustomerLink()) say('Job selected. ' + pick);
      else if (!/^(✅|⚠️)/.test(msg.textContent)) say(open < 0 ? 'Pick a folder. Then click a job and a note (either order).' : 'Click a job, then pick a note (or the other way round).');
    };

    let editing = false;
    const showOnly = x => { [main, editor, folderEditor].forEach(v => { v.style.display = v === x ? 'block' : 'none'; }); toTop(); };
    const closeEditors = () => { editing = false; showOnly(main); renderList(); };

    // ---- Edit notes (the notes in the open folder) ----
    const editor = el('div', 'display:none;padding:8px 10px 10px');
    const editHead = el('div', 'font-weight:700;margin-bottom:4px', '✏️ Edit notes');
    const NOTES_HINT = 'Change the button name and the note text. "Move to" puts a note in another folder. Saved in this browser.';
    const editMsg = el('div', 'font-size:12px;color:#444;margin-bottom:6px', NOTES_HINT);
    // "Move to" picker on each note.
    const moveTo = n => {
      const sel = el('select', 'max-width:130px;padding:3px 4px;border:1px solid #aaa;border-radius:6px;font:inherit;font-size:12px;color:#111;background:#fff');
      sel.title = 'Move to another folder';
      folders.forEach((f, i) => {
        const o = el('option', '', (i === open ? 'Stay in ' : 'Move to ') + (f.name || '(no name)'));
        o.value = String(i);
        sel.appendChild(o);
      });
      sel.value = String(n.to != null ? n.to : open);
      sel.onchange = () => { const v = parseInt(sel.value, 10); if (v === open) delete n.to; else n.to = v; };
      return sel;
    };
    const ed = listEditor('note', 'Button name (e.g. 📞 No Answer)', 'Note text that gets typed in', room(300), { allowEmpty: true, rowExtra: moveTo });
    const openEditor = () => {
      if (open < 0) return;
      editing = true;
      armed = null;
      editHead.textContent = '✏️ Edit notes: ' + (folders[open].name || '(no name)');
      editMsg.textContent = NOTES_HINT;
      ed.load(cur());
      showOnly(editor);
    };
    const saveEditor = () => {
      const r = ed.clean();
      if (r.error) { editMsg.textContent = r.error; return; }
      const stay = [], moved = {};
      r.list.forEach(n => {
        const pair = [n[0], n[1]];
        if (n.to != null && n.to !== open && folders[n.to]) { folders[n.to].notes.push(pair); moved[n.to] = (moved[n.to] || 0) + 1; }
        else stay.push(pair);
      });
      folders[open].notes = stay;
      const ok = saveFolders();
      closeEditors();
      const movedText = Object.keys(moved).map(i => moved[i] + ' moved to ' + folders[i].name).join(', ');
      say(ok ? '✅ Notes saved.' + (movedText ? ' ' + movedText + '.' : '') : '⚠️ Notes updated for now, but this browser wouldn\'t save them for next time.');
    };
    const editButtons = el('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-top:4px');
    editButtons.append(smallBtn('Save', saveEditor, PRIMARY), smallBtn('Cancel', closeEditors));
    const addBtn = smallBtn('+ Add a note', () => ed.add(), FULL + 'margin-bottom:2px');
    editor.append(editHead, editMsg, ed.box, addBtn, editButtons);

    // ---- Edit folders ----
    const folderEditor = el('div', 'display:none;padding:8px 10px 10px');
    const FOLDERS_HINT = 'Rename, reorder, add or delete folders. Saved in this browser.';
    const fMsg = el('div', 'font-size:12px;color:#444;margin-bottom:6px', FOLDERS_HINT);
    const fList = el('div', 'max-height:' + room(300) + ';overflow:auto;margin:0 -4px;padding:0 4px');
    // Draft rows: { name, notes, src } where src is the folder it came from (null for new ones).
    let fDraft = [];
    const renderFolders = () => {
      fList.textContent = '';
      fDraft.forEach((f, i) => {
        const row = el('div', 'border:1px solid #ccc;border-radius:8px;padding:7px;margin-bottom:8px;background:#fafafa');
        const name = el('input', FULL + 'padding:5px 6px;border:1px solid #aaa;border-radius:5px;font:inherit;font-weight:600;color:#111;background:#fff');
        name.type = 'text'; name.value = f.name; name.placeholder = 'Folder name (e.g. 🧾 Billing)';
        name.oninput = () => { f.name = name.value; };
        const tools = el('div', 'display:flex;gap:4px;margin-top:5px;align-items:center');
        const moveBy = d => () => { const j = i + d; if (j < 0 || j >= fDraft.length) return; const t = fDraft[i]; fDraft[i] = fDraft[j]; fDraft[j] = t; renderFolders(); };
        const n = f.notes.length;
        // Deleting a folder with notes in it takes a second click.
        const del = smallBtn('Delete', () => {
          if (n && !del.dataset.sure) { del.dataset.sure = '1'; del.textContent = 'Delete it and its ' + n + ' note' + (n === 1 ? '' : 's') + '?'; return; }
          fDraft.splice(i, 1); renderFolders();
        }, 'margin-left:auto;color:#b00020;border-color:#e0a0a8');
        tools.append(
          smallBtn('↑', moveBy(-1), i === 0 ? 'opacity:.4' : ''),
          smallBtn('↓', moveBy(1), i === fDraft.length - 1 ? 'opacity:.4' : ''),
          el('span', 'font-size:12px;color:#666', n + ' note' + (n === 1 ? '' : 's')),
          del
        );
        row.append(name, tools);
        fList.appendChild(row);
      });
    };
    const loadFolderDraft = (fs, fromSaved) => {
      fDraft = fs.map(f => ({ name: f.name, notes: fromSaved ? f.notes : f.notes.map(n => n.slice()), src: fromSaved ? f : null }));
      renderFolders();
    };
    const openFolderEditor = () => {
      editing = true;
      armed = null;
      fMsg.textContent = FOLDERS_HINT;
      fResetRow.style.display = 'none';
      loadFolderDraft(folders, true);
      showOnly(folderEditor);
    };
    const saveFolderEditor = () => {
      if (!fDraft.length) { fMsg.textContent = '⚠️ Keep at least one folder.'; return; }
      const wasOpen = open >= 0 ? folders[open] : null;
      folders = fDraft.map((f, i) => ({ name: f.name.trim() || 'Folder ' + (i + 1), notes: f.notes }));
      const still = wasOpen ? fDraft.findIndex(f => f.src === wasOpen) : -1;
      open = still;
      set(KEY_OPEN, String(open));
      const ok = saveFolders();
      closeEditors();
      say(ok ? '✅ Folders saved.' : '⚠️ Folders updated for now, but this browser wouldn\'t save them for next time.');
    };
    // "Reset" asks for confirmation inside the panel (no pop-up).
    const fResetRow = el('div', 'display:none;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px;font-size:12px');
    fResetRow.append(
      document.createTextNode('Put back the original folders and notes? Your own folders and notes will be removed.'),
      smallBtn('Yes, reset', () => { loadFolderDraft(DEFAULT_FOLDERS, false); fResetRow.style.display = 'none'; fMsg.textContent = 'Original folders and notes loaded. Click Save to keep them.'; }),
      smallBtn('No', () => { fResetRow.style.display = 'none'; })
    );
    const fButtons = el('div', 'display:flex;flex-wrap:wrap;gap:6px;margin-top:4px');
    fButtons.append(
      smallBtn('Save', saveFolderEditor, PRIMARY),
      smallBtn('Cancel', closeEditors),
      smallBtn('Reset to original', () => { fResetRow.style.display = 'flex'; }),
      smallBtn('Copy all', async () => {
        const s = JSON.stringify(fDraft.map(f => ({ name: f.name, notes: f.notes })));
        try { await navigator.clipboard.writeText(s); fMsg.textContent = 'Folders and notes copied. Use "Paste all" in another browser to load them.'; }
        catch (e) { prompt('Copy this:', s); }
      }),
      smallBtn('Paste all', () => {
        const s = prompt('Paste what you copied with "Copy all" (or an old "Copy list" from Quick Notes):');
        if (!s) return;
        try {
          const v = JSON.parse(s);
          if (validFolders(v)) { loadFolderDraft(v, false); fMsg.textContent = 'Folders loaded. Click Save to keep them.'; }
          else if (validNotes(v)) { fDraft.push({ name: '📋 Pasted notes', notes: v.map(n => n.slice()), src: null }); renderFolders(); fMsg.textContent = 'Old notes list added as a new folder. Click Save to keep it.'; }
          else throw new Error('bad');
        } catch (e) { fMsg.textContent = '⚠️ That didn\'t look like copied folders or notes.'; }
      })
    );
    const fAdd = smallBtn('+ Add a folder', () => {
      fDraft.push({ name: '', notes: [], src: null });
      renderFolders();
      fList.scrollTop = fList.scrollHeight;
      const inputs = fList.querySelectorAll('input');
      if (inputs.length) inputs[inputs.length - 1].focus();
    }, FULL + 'margin-bottom:2px');
    folderEditor.append(el('div', 'font-weight:700;margin-bottom:4px', '✏️ Edit folders'), fMsg, fList, fAdd, fButtons, fResetRow);

    notesPane.append(main, editor, folderEditor);
    renderList();
    idleHint();
    const hintTimer = setInterval(idleHint, 800);

    // When a note is waiting, add it as soon as a job is clicked.
    const armTimer = setInterval(() => {
      if (armed && showing() && !editing && !busy && !lock && jobCustomerLink()) {
        const t = armed;
        armed = null;
        renderList();
        run(t);
      }
    }, 200);

    // Alt+1..9 (Option+1..9 on a Mac) follows what's on screen: in a folder it adds that
    // note, on the folder list it opens that folder. Reads the physical key, because on a
    // Mac Option+1 types a symbol instead of "1". Esc cancels a waiting note.
    const onKey = e => {
      if (e.key === 'Escape' && armed) { armed = null; renderList(); say('Cancelled.'); return; }
      if (editing || !e.altKey || e.ctrlKey || e.metaKey) return;
      const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code || '');
      const n = m ? parseInt(m[1], 10) : parseInt(e.key, 10);
      if (!(n >= 1 && n <= 9)) return;
      if (open < 0 ? n > folders.length : n > cur().length) return;
      e.preventDefault();
      if (lock && lock !== 'Notes') return;   // another tool is running
      if (isField(document.activeElement)) lastField = document.activeElement;
      if (!showing()) showView('notes');   // so you can see what the shortcut is doing
      if (open < 0) openFolder(n - 1);
      else run(cur()[n - 1][1]);
    };
    document.addEventListener('keydown', onKey, true);

    return {
      // Leaving Notes cancels a note that's waiting for a job click.
      leave: () => { if (armed) { armed = null; renderList(); say(''); } },
      cleanup: () => {
        document.removeEventListener('focusin', onFocus, true);
        document.removeEventListener('keydown', onKey, true);
        clearInterval(hintTimer);
        clearInterval(armTimer);
      }
    };
  })();

  // ===================================================================
  // Tool 2: Job Notifications
  // Pick a tech from the list (only techs with jobs on the day shown), then check
  // their jobs' notification switches or turn them off, with live progress.
  // ===================================================================
  const notify = (() => {
    const IN = ['.qa-job-notification-toggle input.ToggleSwitch__input', '.qa-job-notification-toggle input[type=checkbox]'];
    const LB = ['.qa-job-notification-toggle label.ToggleSwitch__html-label', '.qa-job-notification-toggle label'];
    const first = sels => { for (const s of sels) { const x = document.querySelector(s); if (x) return x; } return null; };
    // The day the board shows, from the board itself (e.g. "Wed, Oct 7, 2026").
    const boardDate = () => {
      try {
        const d = window.ko.unwrap(window.ko.dataFor(document.querySelector('.job-list')).Date);
        if (d && typeof d.toLocaleDateString === 'function') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {}
      return (document.body.innerText.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun), [A-Z][a-z]{2} \d+, \d{4}/) || ['the day shown'])[0];
    };
    const techsOnBoard = () => {
      const seen = new Map();
      document.querySelectorAll('.technician[data-technician-id]').forEach(t => {
        const id = t.getAttribute('data-technician-id');
        if (seen.has(id)) return;
        const n = t.querySelector('.name');
        const name = (n ? n.textContent : t.textContent).trim().split('\n')[0].trim();
        if (name) seen.set(id, name);
      });
      return seen;
    };
    const jobsFor = techId => {
      const ids = new Set();
      document.querySelectorAll('a.appointment[data-technician-id="' + techId + '"][data-job-id]').forEach(a => ids.add(a.getAttribute('data-job-id')));
      return Array.from(ids);
    };
    // How many jobs each tech has on the board, in one pass over the board.
    const jobCounts = () => {
      const m = new Map();
      document.querySelectorAll('a.appointment[data-technician-id][data-job-id]').forEach(a => {
        const id = a.getAttribute('data-technician-id');
        let ids = m.get(id);
        if (!ids) m.set(id, ids = new Set());
        ids.add(a.getAttribute('data-job-id'));
      });
      return m;
    };
    // A job's notification setting from ServiceTitan's job data (no page to open): true, false,
    // or null if it couldn't be read.
    const apiState = async j => {
      try { const d = await st.job(j); return typeof d.NotificationsEnabled === 'boolean' ? d.NotificationsEnabled : null; }
      catch (e) { return null; }
    };
    const wrap = el('div', 'padding:8px 10px 10px;display:grid;gap:8px');
    const msg = el('div', 'font-size:12px;color:#444;min-height:16px');
    const say = s => { msg.textContent = s; };
    const pickRow = el('div', 'display:flex;gap:6px;align-items:center');
    const pick = el('select', 'flex:1;min-width:0;padding:6px;border:1px solid #aaa;border-radius:6px;font:inherit;color:#111;background:#fff');
    pick.id = 'st-notify-tech';
    const refreshBtn = smallBtn('↻', () => refresh(true));
    refreshBtn.title = 'Reload the list of techs';
    pickRow.append(pick, refreshBtn);
    const actions = el('div', 'display:flex;flex-wrap:wrap;gap:6px');
    const checkBtn = smallBtn('Check jobs (changes nothing)', () => start(false), PRIMARY);
    const offBtn = smallBtn('Turn off notifications…', () => askConfirm(), 'color:#c62828;border-color:#e0a0a8');
    actions.append(checkBtn, offBtn);
    const confirmBox = el('div', 'display:none;padding:8px;border:1px solid #e0a0a8;background:#fdecec;border-radius:6px;font-size:12px;gap:6px;flex-wrap:wrap;align-items:center');
    const confirmText = el('span', 'flex-basis:100%');
    confirmBox.append(confirmText, smallBtn('Yes, turn them off', () => { confirmBox.style.display = 'none'; start(true); }, DANGER), smallBtn('Cancel', () => { confirmBox.style.display = 'none'; }));
    const progress = el('div', 'display:none;gap:6px');
    const log = el('pre', 'max-height:200px;overflow:auto;margin:0;padding:6px;background:#f6f6f6;border:1px solid #ddd;border-radius:6px;white-space:pre-wrap;font:12px/1.35 ui-monospace,Consolas,monospace');
    const progRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    const requestStop = () => { stop = true; stopBtn.disabled = true; stopBtn.textContent = 'Stopping after this job...'; };
    const stopBtn = smallBtn('Stop', () => requestStop());
    const copyBtn = smallBtn('Copy results', async () => { if (await copy(log.textContent)) copyBtn.textContent = 'Copied'; });
    progRow.append(stopBtn, copyBtn);
    progress.append(log, progRow);
    // Which jobs: one tech's jobs (the list above), or jobs you pick yourself.
    let src = get('stNotifySrc') === 'picked' ? 'picked' : 'tech';
    const srcRow = el('div', 'display:grid;gap:1px;font-size:12px');
    const srcRadio = (val, text) => {
      const l = el('label', 'display:flex;gap:6px;align-items:center;cursor:pointer');
      const r = el('input'); r.type = 'radio'; r.name = 'st-notify-src'; r.checked = src === val;
      r.onchange = () => { src = val; set('stNotifySrc', val); if (val !== 'picked') picker.setPicking(false); confirmBox.style.display = 'none'; refresh(); };
      l.append(r, document.createTextNode(text));
      return { l, r };
    };
    const srcTech = srcRadio('tech', '👷 A tech\'s jobs'), srcPicked = srcRadio('picked', '🖱️ Jobs I pick (board, Unassigned / Hold list, or job #)');
    srcRow.append(srcTech.l, srcPicked.l);
    const pickedBox = el('div', 'display:none');
    wrap.append(msg, srcRow, pickRow, pickedBox, actions, confirmBox, progress);
    jobsPane.appendChild(wrap);
    let running = false, stop = false;
    const add = s => { log.textContent += s + '\n'; log.scrollTop = log.scrollHeight; };

    // ---- Jobs you pick (orange outline while this tool is open on "Jobs I pick") ----
    const picker = jobPicker({
      color: '#ef6c00', soft: 'rgba(239,108,0,.22)',
      shown: () => jobsPane.style.display !== 'none' && src === 'picked',
      busy: () => running,
      say: t => say(t),
      changed: () => refresh(true)
    });
    pickedBox.appendChild(picker.box);

    const setEnabled = on => {
      [pick, refreshBtn, checkBtn, offBtn].forEach(x => { x.disabled = !on; x.style.opacity = on ? '1' : '.5'; });
      picker.setEnabled(on);
      // Switching between "a tech's jobs" and "jobs I pick" only locks during a run.
      [srcTech.r, srcPicked.r].forEach(x => { x.disabled = running; });
    };
    const refresh = keepMsg => {
      if (running) return;
      pickRow.style.display = src === 'tech' ? 'flex' : 'none';
      pickedBox.style.display = src === 'picked' ? 'block' : 'none';
      setEnabled(true);   // also redraws the picked list and its highlights
      if (src === 'picked') {
        if (!picker.size()) [checkBtn, offBtn].forEach(x => { x.disabled = true; x.style.opacity = '.5'; });
        if (!keepMsg && !msg.textContent) say(onBoard() ? 'Pick jobs, then check them or turn their notifications off.' : 'Open the Dispatch board to pick jobs there, or type job numbers.');
        return;
      }
      if (!onBoard()) {
        pick.textContent = '';
        setEnabled(false);
        say('Open the Dispatch board to use this.');
        return;
      }
      const prev = pick.value || get('stNotifyTech') || '';
      const techs = techsOnBoard();
      const counts = jobCounts();
      const rows = [];
      techs.forEach((name, id) => { const n = counts.has(id) ? counts.get(id).size : 0; if (n) rows.push({ id, name, n }); });
      pick.textContent = '';
      if (!rows.length) {
        setEnabled(false);
        refreshBtn.disabled = false; refreshBtn.style.opacity = '1';
        say('No jobs on the board for ' + boardDate() + '. Press ↻ after the board finishes loading.');
        return;
      }
      rows.forEach(r => {
        const o = el('option', '', r.name + '  (' + r.n + ' job' + (r.n === 1 ? '' : 's') + ')');
        o.value = r.id;
        pick.appendChild(o);
      });
      if (rows.some(r => r.id === prev)) pick.value = prev;
      setEnabled(true);
      if (!keepMsg || !msg.textContent) say(boardDate() + ': ' + rows.length + ' tech' + (rows.length === 1 ? '' : 's') + ' with jobs.');
    };
    const askConfirm = () => {
      if (src === 'picked') {
        if (!picker.size()) return;
        confirmText.textContent = 'Turn OFF notifications on ' + plural(picker.size(), 'picked job') + '?';
        confirmBox.style.display = 'flex';
        return;
      }
      if (!pick.value) return;
      const n = jobsFor(pick.value).length;
      const name = techsOnBoard().get(pick.value) || 'this tech';
      confirmText.textContent = 'Turn OFF notifications on ' + n + ' job' + (n === 1 ? '' : 's') + ' for ' + name + ' on ' + boardDate() + '?';
      confirmBox.style.display = 'flex';
    };
    const collectJobs = async techId => {
      const row = document.getElementById('team-timeline-row-' + techId);
      if (row) row.scrollIntoView({ block: 'center' });
      let lastKey = '', calm = 0, ids = [];
      for (let w = 0; calm < 4 && w < 4000; w += 250) {
        await wait(250);
        ids = jobsFor(techId);
        const key = ids.join(',');
        if (key === lastKey) calm++; else { calm = 0; lastKey = key; }
      }
      return ids;
    };
    const start = async real => {
      const usePicked = src === 'picked';
      if (running || (usePicked ? !picker.size() : !pick.value)) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      picker.setPicking(false);
      running = true; stop = false; lock = 'Job Notifications';
      setEnabled(false);
      confirmBox.style.display = 'none';
      log.textContent = '';
      progress.style.display = 'grid';
      stopBtn.disabled = false; stopBtn.textContent = 'Stop'; stopBtn.style.display = 'inline-block';
      copyBtn.textContent = 'Copy results';
      const techId = usePicked ? '' : pick.value;
      if (!usePicked) set('stNotifyTech', techId);
      const techName = usePicked ? 'Picked jobs' : techsOnBoard().get(techId) || 'Tech';
      const date = boardDate();
      const home = location.hash;
      const NO_SWITCH = 'COULD NOT FIND SWITCH';
      const results = new Map();   // job -> { text, kind }; a retry replaces the first result
      const record = (j, r, retry) => { results.set(j, r); add(j + ': ' + (retry ? 'retry: ' : '') + r.text); };
      // Opens one job and checks (or turns off) its switch. Returns { text, kind }.
      const doJob = async j => {
        const res = (text, kind) => ({ text, kind });
        try {
          location.hash = '#/Job/Index/' + j;
          const found = await until(() => { const x = first(IN); return x && document.body.innerText.indexOf(j) > -1 ? x : null; }, 12000, 300);
          if (!found) return res(NO_SWITCH, 'problem');
          let state = !!(first(IN) || {}).checked, calm = 0;
          for (let w = 0; calm < 3 && w < 3000; w += 250) {
            await wait(250);
            const c = !!(first(IN) || {}).checked;
            if (c === state) calm++; else { state = c; calm = 0; }
          }
          const inp = first(IN);
          if (!inp) return res(NO_SWITCH, 'problem');
          if (!inp.checked) return res('already off', 'already off');
          if (!real) return res('ON (left alone)', 'on');
          (first(LB) || inp).click();
          const off = await until(() => { const x = first(IN); return x && !x.checked; }, 4000, 250);
          if (!off) return res('FAILED, still on', 'problem');
          // Saved? The job data says so as soon as ServiceTitan has it. Until then, keep an eye on
          // the switch for a moment in case it flips back.
          const t0 = Date.now();
          while (Date.now() - t0 < 1500) {
            await wait(300);
            if (await apiState(j) === false) { const y = first(IN); if (!y || !y.checked) return res('turned off', 'turned off'); }
          }
          const x = first(IN);
          if (x && x.checked) return res('FLIPPED BACK ON (save may have failed)', 'problem');
          return res('turned off', 'turned off');
        } catch (e) {
          return res('ERROR: ' + errText(e), 'problem');
        }
      };
      try {
        let list;
        if (usePicked) {
          list = picker.ids();
          add(techName + ' (' + list.length + ')' + (real ? '' : ' (checking only, nothing changed)'));
        } else {
          say('Finding ' + techName + '\'s jobs...');
          list = await collectJobs(techId);
          if (!list.length) { say('No jobs found for ' + techName + ' on ' + date + '.'); return; }
          add(date + ' - ' + techName + (real ? '' : ' (checking only, nothing changed)'));
        }
        // Read every job's setting first, a few at a time. Jobs that are already off (and, when
        // only checking, every job) need no page at all. The rest are opened one at a time.
        say('Reading ' + plural(list.length, 'job') + '...');
        const pre = await st.pool(list, 4, apiState, (d, t) => say('Reading jobs... ' + d + ' of ' + t));
        for (let n = 0; n < list.length; n++) {
          if (stop) { add('Stopped. ' + (list.length - n) + ' job(s) not checked.'); break; }
          const j = list[n];
          if (pre[n] === false) { record(j, { text: 'already off', kind: 'already off' }); continue; }
          if (pre[n] === true && !real) { record(j, { text: 'ON (left alone)', kind: 'on' }); continue; }
          say((real ? 'Turning off ' : 'Checking ') + (n + 1) + ' of ' + list.length + ' (job ' + j + ')');
          record(j, await doJob(j));
        }
        // Second chance: once the run is done, try each job that had a problem one more time.
        const failed = list.filter(j => results.has(j) && results.get(j).kind === 'problem');
        if (failed.length && !stop) {
          add('');
          add('Retrying ' + failed.length + ' job' + (failed.length === 1 ? '' : 's') + ' that had a problem...');
          say('Retrying ' + failed.length + ' job' + (failed.length === 1 ? '' : 's') + '...');
          // Back to the board for a moment so each retry opens a fresh job page.
          if (location.hash !== home) location.hash = home;
          await wait(2000);
          for (let n = 0; n < failed.length; n++) {
            if (stop) { add('Stopped. ' + (failed.length - n) + ' retry(s) not done.'); break; }
            const j = failed[n];
            say('Retrying ' + (n + 1) + ' of ' + failed.length + ' (job ' + j + ')');
            record(j, await doJob(j), true);
          }
          const still = failed.filter(j => results.get(j).kind === 'problem');
          add(still.length ? 'Still a problem after retry: ' + still.join(', ') : 'All retried jobs worked.');
        }
        // Picked jobs that are now off come off the list; anything with a problem stays.
        if (usePicked && real) results.forEach((r, j) => { if (r.kind === 'turned off' || r.kind === 'already off') picker.remove(j); });
        const tally = {};
        let noSwitch = 0;
        results.forEach(r => { tally[r.kind] = (tally[r.kind] || 0) + 1; if (r.text === NO_SWITCH) noSwitch++; });
        const summary = Object.keys(tally).map(k => tally[k] + ' ' + k).join(', ') || 'nothing done';
        const checked = results.size;
        if (checked && noSwitch === checked) {
          health.flag('Job Notifications', 'can\'t find the Job Notifications switch on job pages', '.qa-job-notification-toggle input');
          say('Done: ' + summary + '.' + CHANGED);
        } else {
          if (checked) health.clear('Job Notifications');
          say('Done: ' + summary + '.');
        }
      } catch (e) {
        say('⚠️ Stopped by an error: ' + errText(e));
      } finally {
        if (location.hash !== home) { location.hash = home; await wait(800); }
        running = false; lock = null;
        stopBtn.style.display = 'none';
        refresh(true);
      }
    };
    return {
      refresh,
      leave: () => picker.setPicking(false),
      isRunning: () => running,
      stop: requestStop,
      cleanup: () => picker.cleanup()
    };
  })();

  // ===================================================================
  // Tool 3: Tech Messages
  // Sends a saved message (Good Morning, ETA, ...) to the techs you pick, one at a time,
  // through each tech's "Send Message" panel. Built with guard rails:
  //   - Only teams you've marked "OK to message" can ever be picked (new teams start blocked).
  //   - A "Never message" list for individual people, checked again right before each send.
  //   - Before typing, it checks the panel shows the right person, nothing is covering it,
  //     and the box is empty. If anything looks wrong it skips that person.
  //   - In auto-send mode you confirm by typing how many people it will message.
  //   - It stops the whole run if a send can't be confirmed.
  // ===================================================================
  const msgs = (() => {
    const DEFAULT_MSGS = [
      ['☀️ Good Morning', 'Good morning {first}! Hope you have a great day today.'],
      ['⏱️ ETA', 'ETA']
    ];
    // Teams that start out blocked. Every other team must still be approved once in
    // "Who can be messaged" before anyone on it can be picked.
    const SUGGEST_BLOCK = /^(leadership team|executive leadership)$|human resources|accounts (payable|receivable)|compliance|^dispatch$|client care|account executive|concierge|client benefits/i;
    const MAX_PER_RUN = 57;
    const K = { msgs: 'stMsgs', teams: 'stMsgTeams', never: 'stMsgNever', sel: 'stMsgSel', mode: 'stMsgMode', jobsOnly: 'stMsgJobsOnly', pick: 'stMsgPick', teamMap: 'stMsgTeamMap' };
    const loadJSON = (k, d) => { try { const v = JSON.parse(get(k)); return v == null ? d : v; } catch (e) { return d; } };
    const validMsgs = v => Array.isArray(v) && v.length > 0 && v.every(n => Array.isArray(n) && n.length === 2 && typeof n[0] === 'string' && typeof n[1] === 'string');
    let list = (() => { const v = loadJSON(K.msgs, null); return validMsgs(v) ? v : DEFAULT_MSGS.map(n => n.slice()); })();
    // teamRules: { teamName: true (OK) | false (blocked) }, or null if never set up.
    // never: { techId: name }. selected: tech IDs picked last time.
    let teamRules = loadJSON(K.teams, null);
    let never = loadJSON(K.never, {});
    let selected = new Set(loadJSON(K.sel, []));
    let pickIdx = Math.max(0, Math.min(parseInt(get(K.pick) || '0', 10) || 0, list.length - 1));

    // ---- Reading the board ----
    const liveTeamOf = id => {
      const row = document.getElementById('team-timeline-row-' + id);
      const tc = row && row.closest('.team-container');
      let h = tc && tc.previousElementSibling;
      while (h && !h.querySelector('.team-name')) h = h.previousElementSibling;
      const tn = h && h.querySelector('.team-name');
      return tn ? norm(tn.textContent) : null;
    };
    // Each tech's team, remembered from the board whenever the team headers are showing.
    // A team or people filter hides those headers, so then the remembered team is used.
    // A tech the Toolbox has never seen with a team can't be messaged until it has.
    let teamMap = loadJSON(K.teamMap, {});
    if (!teamMap || typeof teamMap !== 'object' || Array.isArray(teamMap)) teamMap = {};
    let teamMapDirty = false;
    const teamOf = id => {
      const live = liveTeamOf(id);
      if (live) {
        if (teamMap[id] !== live) { teamMap[id] = live; teamMapDirty = true; }
        return live;
      }
      return typeof teamMap[id] === 'string' ? teamMap[id] : null;
    };
    const boardTechs = () => {
      const out = new Map();
      teamMapDirty = false;
      // Job bubbles per tech, counted in one pass over the board.
      const jobCount = new Map();
      document.querySelectorAll('a.appointment[data-technician-id][data-job-id]').forEach(a => {
        const id = a.getAttribute('data-technician-id');
        jobCount.set(id, (jobCount.get(id) || 0) + 1);
      });
      document.querySelectorAll('.technician[data-technician-id]').forEach(t => {
        const id = t.getAttribute('data-technician-id');
        if (out.has(id)) return;
        const n = t.querySelector('.name');
        const name = norm(n ? n.textContent : '');
        if (!name) return;
        out.set(id, { id, name, team: teamOf(id), jobs: jobCount.get(id) || 0, hidden: true });
      });
      // Everyone stays in the list. "hidden" just notes who a board filter is hiding right now.
      document.querySelectorAll('.technician[data-technician-id]').forEach(t => {
        const x = out.get(t.getAttribute('data-technician-id'));
        if (x && x.hidden && techShowing(t)) x.hidden = false;
      });
      if (teamMapDirty) set(K.teamMap, JSON.stringify(teamMap));
      return out;
    };
    const teamsOnBoard = () => Array.from(new Set(Array.from(boardTechs().values()).map(t => t.team || '(no team)')));
    const teamAllowed = team => !!(teamRules && team && teamRules[team] === true);
    const canMessage = t => !!t && teamAllowed(t.team) && !never[t.id];
    const firstName = name => norm(name).split(' ')[0] || '';

    // ---- The Send Message panel (lives inside ServiceTitan's Activity Center) ----
    // Finding it means looking through every element on the page, so remember it once found,
    // and while it's missing, look again at most twice a second.
    let acCache = null, acLastMiss = 0;
    const acHost = fresh => {
      if (acCache && acCache.isConnected) return acCache;
      acCache = null;
      if (!fresh && Date.now() - acLastMiss < 500) return null;
      acCache = Array.from(document.querySelectorAll('*')).find(e => /^SERVICETITAN-ACTIVITY-CENTER/i.test(e.tagName)) || null;
      if (!acCache) acLastMiss = Date.now();
      return acCache;
    };
    const acRoot = () => { const h = acHost(); return h && h.shadowRoot; };
    const q = sel => { const r = acRoot(); const x = r && r.querySelector(sel); return x && visible(x) ? x : null; };
    const chatBox = () => q('[data-cy=technician-chat-input]');
    const sendBtn = () => q('[data-cy=send-chat-message]');
    const panelName = () => { const r = acRoot(); const h = r && Array.from(r.querySelectorAll('h3')).find(visible); return h ? norm(h.textContent) : ''; };
    const jobDrawer = () => Array.from(document.querySelectorAll('.Drawer--open')).find(d => d.querySelector('a[href^="#/Customer/"], a[href^="#/customer/"]')) || null;
    const closeJobDrawer = async () => {
      const d = jobDrawer();
      if (!d) return true;
      const b = d.querySelector('[aria-label="close drawer"], .Drawer__header-close');
      if (b) b.click();
      return !!(await until(() => !jobDrawer(), 3000));
    };
    // True only if the message box is the thing actually showing on screen at that spot.
    const boxOnTop = () => {
      const box = chatBox(), host = acHost();
      if (!box || !host) return false;
      const r = box.getBoundingClientRect();
      if (r.width < 20 || r.bottom > innerHeight || r.top < 0) return false;
      const topEl = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).find(e => !panel.contains(e));
      return topEl === host;
    };
    // Moves the Toolbox panel to the left of the message panel so it doesn't cover it.
    const dodge = () => {
      const h = acHost();
      if (!h) return;
      const hr = h.getBoundingClientRect(), pr = panel.getBoundingClientRect();
      if (hr.width && pr.right > hr.left && pr.left < hr.right) {
        panel.style.left = Math.max(0, hr.left - pr.width - 16) + 'px';
        panel.style.right = 'auto';
      }
    };
    // A missing ServiceTitan piece (not a one-off glitch): flag it and stop the whole run.
    const changed = (what, detail) => { health.flag('Tech Messages', what, detail); return { changed: true, what }; };
    const openChatFor = async t => {
      // A board filter can leave a hidden copy of a tech on the page, so use the copy that's showing.
      const copies = Array.from(document.querySelectorAll('[id="team-technician-' + t.id + '"]'));
      const el2 = copies.find(techShowing) || copies[0];
      if (!el2) return 'not on the board';
      const openMenu = async () => {
        el2.scrollIntoView({ block: 'center' });
        await wait(250);
        (el2.querySelector('.name') || el2).click();
        return until(() => Array.from(document.querySelectorAll('.technician-menu.dropdown-menu')).find(visible), 3000);
      };
      let menu = await openMenu();
      // Hidden by a team/people filter: skip just this person. That's not a ServiceTitan change.
      if (!menu && !techShowing(el2)) return 'hidden by the board filter right now (clear the filter to message them)';
      if (!menu) { await wait(500); menu = await openMenu(); }   // one retry for a slow board
      if (!menu && !techShowing(el2)) return 'hidden by the board filter right now (clear the filter to message them)';
      if (!menu) return changed('the tech menu didn\'t open when clicking a tech\'s name', '.technician-menu.dropdown-menu');
      // Only ever click the link whose text is exactly "Send Message" (never the memo "Send" button).
      const link = Array.from(menu.querySelectorAll('a')).find(a => norm(a.textContent) === 'Send Message');
      if (!link) return changed('the tech menu has no "Send Message" option', '.technician-menu a: Send Message');
      link.click();
      const ok = await until(() => chatBox() && panelName().toLowerCase() === t.name.toLowerCase(), 8000);
      if (!ok) {
        if (!acHost(true)) return changed('can\'t find the message panel', 'SERVICETITAN-ACTIVITY-CENTER-*');
        if (!chatBox()) return changed('can\'t find the message box', '[data-cy=technician-chat-input]');
        if (!panelName()) return changed('can\'t read whose messages are open', 'Activity Center h3');
        return 'panel showed "' + panelName() + '" instead';
      }
      return null;
    };
    const typeInto = (box, text) => {
      box.focus();
      try { box.setSelectionRange(box.value.length, box.value.length); } catch (e) {}
      if (!(document.execCommand && document.execCommand('insertText', false, text) && box.value === text)) {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(box, text);
        box.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        box.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      }
      return box.value === text;
    };
    const clearBox = box => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(box, '');
      box.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    };
    const attachBox = () => q('[data-cy=attach-message-to-job]');

    // ---- UI pieces ----
    const pane = el('div', 'padding:8px 10px 10px');
    const views = {};
    const sub = name => { Object.keys(views).forEach(k => { views[k].style.display = k === name ? 'block' : 'none'; }); toTop(); };
    const mkView = name => { views[name] = el('div', 'display:none'); pane.appendChild(views[name]); return views[name]; };
    const msgLine = () => el('div', 'font-size:12px;color:#444;margin-bottom:6px;min-height:16px;white-space:pre-wrap');
    const head = text => el('div', 'font-weight:700;margin-bottom:4px', text);
    const row = () => el('div', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px');
    const scrollBox = css => el('div', 'max-height:' + room(300) + ';overflow:auto;border:1px solid #ddd;border-radius:6px;padding:4px 6px;background:#fafafa;' + (css || ''));
    const check = (label, checked, onChange, disabled) => {
      const l = el('label', 'display:flex;gap:6px;align-items:center;padding:3px 0;cursor:' + (disabled ? 'not-allowed' : 'pointer') + ';font-size:12px;' + (disabled ? 'color:#999' : ''));
      const c = el('input'); c.type = 'checkbox'; c.checked = !!checked; c.disabled = !!disabled;
      c.onchange = () => onChange(c.checked);
      l.append(c, document.createTextNode(label));
      return l;
    };

    // ===== Main view =====
    const vMain = mkView('main');
    const mainMsg = msgLine();
    const msgList = el('div', '');
    const toLine = el('div', 'font-size:12px;margin-top:8px;padding:6px 8px;border:1px solid #ddd;border-radius:6px;background:#fafafa');
    const toTools = el('div', 'display:flex;gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap');
    const pickTechBtn = smallBtn('🖱️ Pick on board', () => setPicking(!picking));
    pickTechBtn.title = 'Click techs\' names on the board to add them (click again to take one off)';
    const clearSelBtn = smallBtn('Clear', () => { if (running) return; selected.clear(); saveSel(); renderMain(); });
    toTools.append(pickTechBtn, clearSelBtn);
    const toList = el('div', 'display:none;max-height:130px;overflow:auto;border:1px solid #ddd;border-radius:6px;background:#fafafa;margin-top:4px');
    const modeRow = el('div', 'margin-top:8px;font-size:12px;display:grid;gap:2px');
    let mode = get(K.mode) === 'auto' ? 'auto' : 'type';
    const mkRadio = (val, label) => {
      const l = el('label', 'display:flex;gap:6px;align-items:center;cursor:pointer');
      const r = el('input'); r.type = 'radio'; r.name = 'st-msg-mode'; r.checked = mode === val;
      r.onchange = () => { mode = val; set(K.mode, val); renderMain(); };
      l.append(r, document.createTextNode(label));
      return l;
    };
    modeRow.append(mkRadio('type', 'Type only: I press Send for each person'), mkRadio('auto', 'Auto-send: sends to everyone picked'));
    const startBtn = smallBtn('Start', () => openConfirm(), PRIMARY + 'margin-top:8px;' + FULL + 'padding:8px');
    // Shown until the safety settings are set up (the same screen as 🛡️ Who can be messaged).
    const setupBtn = smallBtn('🛡️ Set up', () => openSafety(), PRIMARY + 'display:none');
    setupBtn.title = 'Choose which teams can be messaged';
    const mainNav = moreRow(
      [setupBtn, smallBtn('👥 Choose techs', () => openPicker())],
      [smallBtn('✏️ Edit messages', () => openEditor()), smallBtn('🛡️ Who can be messaged', () => openSafety())]
    );
    vMain.append(mainMsg, msgList, toLine, toTools, toList, modeRow, startBtn, mainNav);

    const recipients = () => {
      const techs = boardTechs();
      return Array.from(selected).map(id => techs.get(id)).filter(t => canMessage(t));
    };
    const renderMain = () => {
      msgList.textContent = '';
      list.forEach(([name, text], i) => {
        const on = i === pickIdx;
        const b = el('button', FULL + 'margin:5px 0;padding:8px 9px;cursor:pointer;border:1px solid ' + (on ? '#1a6ed8' : '#aaa') + ';border-radius:6px;background:' + (on ? '#e3eefc' : '#f5f5f5') + ';color:#111;text-align:left;font:inherit' + (on ? ';box-shadow:inset 3px 0 0 #1a6ed8' : ''), (on ? '✔ ' : '') + (name || '(no name)'));
        b.type = 'button';
        b.title = text;
        b.addEventListener('mousedown', e => e.preventDefault());
        b.onclick = () => { pickIdx = i; set(K.pick, String(i)); renderMain(); };
        msgList.appendChild(b);
      });
      setupBtn.style.display = teamRules ? 'none' : 'inline-block';
      if (!onBoard()) { say('Open the Dispatch board to send messages.'); startBtn.disabled = true; startBtn.style.opacity = '.5'; toLine.textContent = ''; return; }
      if (!teamRules) { say('First, set up who can be messaged (🛡️ Set up, below). Nothing can be sent until you do.'); startBtn.disabled = true; startBtn.style.opacity = '.5'; toLine.textContent = 'To: nobody yet'; toList.style.display = 'none'; return; }
      const r = recipients();
      // The picked techs, each with ✕ to take them off.
      toList.textContent = '';
      toList.style.display = r.length ? 'block' : 'none';
      r.forEach(t => {
        const line = el('div', 'display:flex;gap:6px;align-items:center;padding:3px 6px;border-bottom:1px solid #eee;font-size:12px');
        const nm = el('span', 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap');
        nm.append(el('b', '', t.name), document.createTextNode('  · ' + (t.team || 'no team') + (t.hidden ? ' · hidden by board filter' : '')));
        line.append(nm, smallBtn('✕', () => { if (running) return; selected.delete(t.id); saveSel(); renderMain(); }, 'padding:1px 6px'));
        toList.appendChild(line);
      });
      toLine.textContent = 'To: ' + (r.length ? r.length + ' tech' + (r.length === 1 ? '' : 's') + ' (' + r.slice(0, 4).map(t => t.name).join(', ') + (r.length > 4 ? ', …' : '') + ')' : 'nobody picked yet. Click 👥 Choose techs.');
      const hiddenPicked = r.filter(t => t.hidden).length;
      if (hiddenPicked) toLine.textContent += ' · ' + hiddenPicked + ' hidden by the board filter will be skipped';
      startBtn.disabled = !r.length; startBtn.style.opacity = r.length ? '1' : '.5';
      startBtn.textContent = mode === 'auto' ? 'Review and send…' : 'Start (type only)';
      if (!mainMsg.textContent || /^(Open the Dispatch|First, set up)/.test(mainMsg.textContent)) say('Pick a message, choose techs (👥 or 🖱️ Pick on board), then Start.');
      paintTechs();
    };
    const say = s => { mainMsg.textContent = s; };

    // ---- Picking techs on the board ----
    // While it's on, clicking a tech's name on the board adds them (or takes them off) instead
    // of opening their menu. Only techs your 🛡️ settings allow can be added.
    let picking = false;
    const techStyle = el('style');
    (document.head || document.documentElement).appendChild(techStyle);
    const paintTechs = () => {
      const ids = msgsPane.style.display !== 'none' ? Array.from(selected).filter(id => /^\d+$/.test(id)) : [];
      techStyle.textContent = ids.length ? ids.map(id => '.technician[data-technician-id="' + id + '"]').join(',') +
        '{outline:3px solid #6a1b9a !important;outline-offset:-3px !important;background:rgba(106,27,154,.14) !important}' : '';
    };
    const clickedTech = target => {
      const t = target && target.closest && target.closest('.technician[data-technician-id]');
      return t ? t.getAttribute('data-technician-id') : null;
    };
    const setPicking = on => {
      if (on && !teamRules) { openSafety(); return; }
      picking = !!on && !running;
      pickTechBtn.textContent = picking ? '🖱️ Picking: ON' : '🖱️ Pick on board';
      pickTechBtn.style.background = picking ? '#6a1b9a' : '#fff';
      pickTechBtn.style.color = picking ? '#fff' : '#111';
      pickTechBtn.style.borderColor = picking ? '#6a1b9a' : '#aaa';
      pickTechBtn.style.fontWeight = picking ? '600' : '400';
      if (picking) say('Click techs\' names on the board to add them. Click again to take one off.');
    };
    const onTechClick = e => {
      if (!picking || running || !onBoard() || panel.contains(e.target) || views.main.style.display === 'none') return;
      const id = clickedTech(e.target);
      if (!id) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      const t = boardTechs().get(id);
      if (!t) return;
      if (selected.has(id)) { selected.delete(id); say('Took ' + t.name + ' off.'); }
      else if (!canMessage(t)) { say('🛡️ ' + t.name + ' can\'t be messaged: ' + (never[id] ? 'they\'re on the never-message list.' : !t.team ? 'their team isn\'t known yet (clear the board filter once).' : 'their team (' + t.team + ') is blocked.')); return; }
      else { selected.add(id); say('Added ' + t.name + '.'); }
      saveSel(); renderMain();
    };
    window.addEventListener('click', onTechClick, true);
    pickers.push({ active: () => picking && !running && views.main.style.display !== 'none', hit: tg => !!clickedTech(tg) });

    // ===== Choose techs =====
    const vPick = mkView('pick');
    const pickMsg = msgLine();
    const search = el('input', FULL + 'padding:6px 7px;border:1px solid #aaa;border-radius:6px;font:inherit;color:#111;background:#fff;margin-bottom:6px');
    search.type = 'text'; search.placeholder = 'Search names'; search.id = 'st-msg-search';
    let jobsOnly = get(K.jobsOnly) !== '0';
    const jobsOnlyRow = check('Only show techs with jobs on the board', jobsOnly, v => { jobsOnly = v; set(K.jobsOnly, v ? '1' : '0'); renderPicker(); });
    const pickList = scrollBox();
    const pickNav = row();
    pickNav.append(
      smallBtn('Select all shown', () => { shown.forEach(t => selected.add(t.id)); saveSel(); renderPicker(); }),
      smallBtn('Clear', () => { selected.clear(); saveSel(); renderPicker(); }),
      smallBtn('Done', () => { sub('main'); renderMain(); }, PRIMARY)
    );
    vPick.append(head('👥 Choose techs'), pickMsg, search, jobsOnlyRow, pickList, pickNav);
    search.oninput = () => renderPicker();
    let shown = [];
    const saveSel = () => { set(K.sel, JSON.stringify(Array.from(selected))); paintTechs(); };
    const openPicker = () => { if (!teamRules) return openSafety(); sub('pick'); renderPicker(); };
    const renderPicker = () => {
      const techs = Array.from(boardTechs().values());
      const qtext = search.value.trim().toLowerCase();
      // Drop anyone no longer allowed from the selection.
      Array.from(selected).forEach(id => { const t = techs.find(x => x.id === id); if (t && !canMessage(t)) selected.delete(id); });
      saveSel();
      shown = techs.filter(t => canMessage(t) && (!jobsOnly || t.jobs > 0) && (!qtext || t.name.toLowerCase().indexOf(qtext) > -1));
      pickList.textContent = '';
      const byTeam = new Map();
      shown.forEach(t => { const k = t.team || '(no team)'; if (!byTeam.has(k)) byTeam.set(k, []); byTeam.get(k).push(t); });
      byTeam.forEach((ts, team) => {
        const allOn = ts.every(t => selected.has(t.id));
        const th = check(team + ' (' + ts.length + ')', allOn, v => { ts.forEach(t => v ? selected.add(t.id) : selected.delete(t.id)); saveSel(); renderPicker(); });
        th.style.fontWeight = '700'; th.style.marginTop = '4px';
        pickList.appendChild(th);
        ts.forEach(t => {
          const c = check(t.name + (t.jobs ? '  · ' + t.jobs + ' job' + (t.jobs === 1 ? '' : 's') : '') + (t.hidden ? '  · hidden by board filter' : ''), selected.has(t.id), v => { v ? selected.add(t.id) : selected.delete(t.id); saveSel(); renderPicker(); });
          c.style.paddingLeft = '16px';
          pickList.appendChild(c);
        });
      });
      if (!shown.length) pickList.appendChild(el('div', 'font-size:12px;color:#666;padding:6px 0', jobsOnly ? 'No allowed techs with jobs on the board. Untick "Only show techs with jobs" or check 🛡️ Who can be messaged.' : 'No allowed techs found. Check 🛡️ Who can be messaged.'));
      const unknownTeam = techs.filter(t => !t.team).length;
      const blockedCount = techs.filter(t => t.team && !canMessage(t)).length;
      pickMsg.textContent = selected.size + ' picked. ' + blockedCount + ' people are hidden because their team is blocked or they\'re on the never-message list.' +
        (unknownTeam ? '\n' + unknownTeam + ' more are hidden because their team isn\'t showing (board filter). Clear the filter once and the Toolbox will remember their teams.' : '');
      pickMsg.style.whiteSpace = 'pre-wrap';
    };

    // ===== Who can be messaged (safety settings) =====
    const vSafe = mkView('safe');
    const safeMsg = msgLine();
    const teamList = scrollBox('max-height:max(90px,calc(var(--st-h,100vh) / 2 - 140px))');
    const neverHead = el('div', 'font-weight:700;margin-top:10px', '🚫 Never message these people');
    const neverList = el('div', 'font-size:12px;margin:4px 0');
    const neverAdd = el('input', FULL + 'padding:6px 7px;border:1px solid #aaa;border-radius:6px;font:inherit;color:#111;background:#fff');
    neverAdd.type = 'text'; neverAdd.placeholder = 'Type a name to block (e.g. the owner)'; neverAdd.id = 'st-msg-never';
    const neverResults = el('div', 'font-size:12px');
    let draftRules = {}, draftNever = {};
    const safeNav = row();
    safeNav.append(
      smallBtn('Save', () => saveSafety(), PRIMARY),
      smallBtn('Cancel', () => { sub('main'); renderMain(); })
    );
    vSafe.append(head('🛡️ Who can be messaged'), safeMsg, teamList, neverHead, neverList, neverAdd, neverResults, safeNav);
    const openSafety = () => {
      if (!onBoard()) { sub('main'); say('Open the Dispatch board first, so the Toolbox can see the teams.'); return; }
      const teams = teamsOnBoard();
      draftRules = Object.assign({}, teamRules || {});
      // First time: suggest. Later: any team we haven't seen before starts blocked.
      teams.forEach(t => { if (!(t in draftRules)) draftRules[t] = teamRules ? false : !SUGGEST_BLOCK.test(t) && t !== '(no team)'; });
      draftNever = Object.assign({}, never);
      sub('safe');
      renderSafety();
    };
    const renderSafety = () => {
      const techs = Array.from(boardTechs().values());
      const counts = {};
      techs.forEach(t => { const k = t.team || '(no team)'; counts[k] = (counts[k] || 0) + 1; });
      const isNew = t => teamRules && !(t in teamRules);
      safeMsg.textContent = (teamRules ? 'Ticked teams can be messaged. Anything unticked can never be picked.' : 'First-time setup: these are suggestions. Untick any team that isn\'t field techs (leadership, office, owner\'s team), then Save.');
      teamList.textContent = '';
      Object.keys(counts).sort((a, b) => a.localeCompare(b)).forEach(team => {
        const c = check((isNew(team) ? '🆕 ' : '') + team + ' (' + counts[team] + ')', draftRules[team] === true, v => { draftRules[team] = v; });
        teamList.appendChild(c);
      });
      neverList.textContent = '';
      const ids = Object.keys(draftNever);
      if (!ids.length) neverList.appendChild(el('div', 'color:#666', 'Nobody yet.'));
      ids.forEach(id => {
        const r = el('div', 'display:flex;gap:6px;align-items:center;padding:2px 0');
        r.append(el('span', 'flex:1', '🚫 ' + draftNever[id]), smallBtn('Remove', () => { delete draftNever[id]; renderSafety(); }, 'padding:2px 6px'));
        neverList.appendChild(r);
      });
      renderNeverSearch();
    };
    const renderNeverSearch = () => {
      neverResults.textContent = '';
      const qtext = neverAdd.value.trim().toLowerCase();
      if (!qtext) return;
      Array.from(boardTechs().values()).filter(t => t.name.toLowerCase().indexOf(qtext) > -1 && !draftNever[t.id]).slice(0, 6).forEach(t => {
        const r = el('div', 'display:flex;gap:6px;align-items:center;padding:2px 0');
        r.append(el('span', 'flex:1', t.name + ' · ' + (t.team || 'no team')), smallBtn('Block', () => { draftNever[t.id] = t.name; neverAdd.value = ''; renderSafety(); }, 'padding:2px 6px;color:#c62828'));
        neverResults.appendChild(r);
      });
    };
    neverAdd.oninput = renderNeverSearch;
    const saveSafety = () => {
      teamRules = draftRules; never = draftNever;
      set(K.teams, JSON.stringify(teamRules));
      set(K.never, JSON.stringify(never));
      sub('main');
      say('🛡️ Saved. ' + Object.values(teamRules).filter(v => v).length + ' teams can be messaged, ' + Object.keys(never).length + ' people are blocked.');
      renderMain();
    };

    // ===== Edit messages =====
    const vEdit = mkView('edit');
    const editMsg = msgLine();
    const EDIT_HINT = 'Use {first} for the tech\'s first name. Saved in this browser.';
    editMsg.textContent = EDIT_HINT;
    const ed = listEditor('message', 'Button name (e.g. ☀️ Good Morning)', 'Message text', room(300));
    const openEditor = () => { ed.load(list); sub('edit'); };
    const editNav = row();
    editNav.append(
      smallBtn('Save', () => {
        const r = ed.clean();
        if (r.error) { editMsg.textContent = r.error; return; }
        list = r.list; set(K.msgs, JSON.stringify(list));
        pickIdx = Math.min(pickIdx, list.length - 1); set(K.pick, String(pickIdx));
        editMsg.textContent = EDIT_HINT;
        sub('main'); say('✅ Messages saved.'); renderMain();
      }, PRIMARY),
      smallBtn('Cancel', () => { editMsg.textContent = EDIT_HINT; sub('main'); renderMain(); }),
      smallBtn('+ Add a message', () => ed.add())
    );
    vEdit.append(head('✏️ Edit messages'), editMsg, ed.box, editNav);

    // ===== Confirm =====
    const vConfirm = mkView('confirm');
    const confText = el('div', 'font-size:12px;white-space:pre-wrap;max-height:' + room(330) + ';overflow:auto;border:1px solid #ddd;border-radius:6px;padding:6px;background:#fafafa');
    const confAsk = el('div', 'font-size:12px;margin-top:8px');
    const confInput = el('input', 'width:70px;padding:5px 6px;border:1px solid #aaa;border-radius:6px;font:inherit;color:#111;background:#fff;margin-left:6px');
    confInput.type = 'text'; confInput.id = 'st-msg-confirm-count'; confInput.inputMode = 'numeric';
    const confGo = smallBtn('Send', () => go(), DANGER);
    const confNav = row();
    confNav.append(confGo, smallBtn('Cancel', () => { sub('main'); renderMain(); }));
    vConfirm.append(head('Check before sending'), confText, confAsk, confNav);
    let pending = [];
    const openConfirm = () => {
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      setPicking(false);
      pending = recipients();
      if (!pending.length) return say('Nobody picked. Click 👥 Choose techs.');
      if (pending.length > MAX_PER_RUN) return say('⚠️ ' + pending.length + ' people picked. For safety the limit is ' + MAX_PER_RUN + ' per run.');
      const tmpl = list[pickIdx][1];
      confText.textContent = 'Message: "' + tmpl + '"\n\nTo ' + pending.length + ' tech' + (pending.length === 1 ? '' : 's') + ':\n' + pending.map(t => '• ' + t.name + '  (' + (t.team || 'no team') + ')').join('\n');
      confAsk.textContent = '';
      confInput.value = '';
      if (mode === 'auto') {
        confAsk.append(document.createTextNode('Auto-send is on. To confirm, type how many people this sends to (' + pending.length + '):'), confInput);
        confGo.textContent = 'Send to ' + pending.length;
        setTimeout(() => confInput.focus(), 0);
      } else {
        confAsk.textContent = 'Type-only mode: it types the message for each person and waits for you to press Send.';
        confGo.textContent = 'Start';
      }
      sub('confirm');
    };
    confInput.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };

    // ===== Run =====
    const vRun = mkView('run');
    const runMsg = el('div', 'font-size:12px;color:#444;margin-bottom:6px;min-height:16px');
    const runLog = el('pre', 'max-height:220px;overflow:auto;margin:0;padding:6px;background:#f6f6f6;border:1px solid #ddd;border-radius:6px;white-space:pre-wrap;font:12px/1.35 ui-monospace,Consolas,monospace');
    const runStep = el('div', 'display:none;margin-top:8px;padding:8px;border:1px solid #1a6ed8;background:#e3eefc;border-radius:6px;font-size:12px');
    const stepText = el('div', 'margin-bottom:6px');
    const stepBtns = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    runStep.append(stepText, stepBtns);
    const runNav = row();
    let stopRun = false, running = false;
    const requestStop = () => { stopRun = true; stopBtn.disabled = true; stopBtn.textContent = 'Stopping...'; if (stepResolve) stepResolve('stop'); };
    const stopBtn = smallBtn('Stop', () => requestStop());
    const doneBtn = smallBtn('← Back', () => { sub('main'); renderMain(); });
    const copyBtn = smallBtn('Copy results', async () => { if (await copy(runLog.textContent)) copyBtn.textContent = 'Copied'; });
    runNav.append(stopBtn, copyBtn, doneBtn);
    vRun.append(head('Sending'), runMsg, runLog, runStep, runNav);
    const add = s => { runLog.textContent += s + '\n'; runLog.scrollTop = runLog.scrollHeight; };
    let stepResolve = null;
    const askStep = (text, buttons) => new Promise(resolve => {
      stepResolve = v => { stepResolve = null; runStep.style.display = 'none'; resolve(v); };
      stepText.textContent = text;
      stepBtns.textContent = '';
      buttons.forEach(([label, val, style]) => stepBtns.appendChild(smallBtn(label, () => stepResolve(val), style)));
      runStep.style.display = 'block';
    });

    const go = async () => {
      if (running) return;
      if (mode === 'auto' && confInput.value.trim() !== String(pending.length)) {
        confAsk.firstChild && (confAsk.firstChild.textContent = '⚠️ That number doesn\'t match. Type ' + pending.length + ' to send to ' + pending.length + (pending.length === 1 ? ' person:' : ' people:'));
        return;
      }
      if (lock) { sub('main'); return say('Wait for ' + lock + ' to finish first.'); }
      setPicking(false);
      running = true; stopRun = false; lock = 'Tech Messages';
      const auto = mode === 'auto';
      const tmpl = list[pickIdx][1];
      const people = pending.slice();
      runLog.textContent = ''; runMsg.textContent = '';
      stopBtn.disabled = false; stopBtn.textContent = 'Stop'; stopBtn.style.display = 'inline-block';
      doneBtn.style.display = 'none'; copyBtn.textContent = 'Copy results';
      sub('run');
      add((auto ? 'Auto-send' : 'Type only') + ': "' + tmpl + '" to ' + people.length);
      const tally = {};
      const out = (t, s, k) => { tally[k] = (tally[k] || 0) + 1; add(t.name + ': ' + s); };
      try {
        for (let n = 0; n < people.length; n++) {
          if (stopRun) { add('Stopped. ' + (people.length - n) + ' not messaged.'); break; }
          const planned = people[n];
          runMsg.textContent = (auto ? 'Sending ' : 'Typing ') + (n + 1) + ' of ' + people.length + ': ' + planned.name;
          if (!onBoard()) { out(planned, 'stopped: not on the Dispatch board', 'problem'); break; }
          // Re-check the live board right before each person.
          const t = boardTechs().get(planned.id);
          if (!t) { out(planned, 'skipped: not on the board any more', 'skipped'); continue; }
          if (!canMessage(t)) { out(t, 'skipped: blocked by your 🛡️ settings', 'skipped'); continue; }
          if (!(await closeJobDrawer())) { out(t, 'skipped: a job panel would not close', 'problem'); continue; }
          const err = await openChatFor(t);
          if (err && err.changed) {
            out(t, 'stopped: ' + err.what + '.', 'problem');
            add('Stopped the run.' + CHANGED);
            break;
          }
          if (err) { out(t, 'skipped: ' + err, 'problem'); continue; }
          await wait(400);
          dodge();
          if (!boxOnTop()) { await closeJobDrawer(); await wait(300); dodge(); }
          if (!boxOnTop()) { out(t, 'skipped: something is covering the message box', 'problem'); continue; }
          const box = chatBox();
          if (box.value.trim()) { out(t, 'skipped: their message box already had unsent text', 'problem'); continue; }
          const ab = attachBox();
          // Keep it a plain message, not attached to a job.
          if (ab && ab.checked && !ab.disabled) ab.click();
          const text = tmpl.replace(/\{first\}/g, firstName(t.name));
          if (panelName().toLowerCase() !== t.name.toLowerCase()) { out(t, 'skipped: panel changed to someone else', 'problem'); continue; }
          if (!typeInto(box, text)) {
            clearBox(box);
            changed('the message box won\'t take typed text', '[data-cy=technician-chat-input]');
            out(t, 'stopped: could not type the message.', 'problem');
            add('Stopped the run.' + CHANGED);
            break;
          }
          health.clear('Tech Messages');

          if (!auto) {
            const ans = await askStep('Typed to ' + t.name + '. Press Send in the message box, then click Next.', [['Next', 'next', PRIMARY], ['Skip', 'skip'], ['Stop', 'stop']]);
            if (ans === 'stop') { if (chatBox() && chatBox().value === text) clearBox(chatBox()); add('Stopped. ' + (people.length - n) + ' not messaged.'); break; }
            if (ans === 'skip') { if (chatBox() && chatBox().value === text) clearBox(chatBox()); out(t, 'skipped by you (text cleared)', 'skipped'); continue; }
            const b2 = chatBox();
            if (b2 && b2.value.trim()) { out(t, 'not sent? the text is still in the box', 'problem'); continue; }
            out(t, 'sent by you', 'sent');
            continue;
          }

          // Auto-send: last checks, then click the send arrow and confirm it went.
          const sb = sendBtn();
          if (!sb) {
            clearBox(box);
            changed('can\'t find the send button', '[data-cy=send-chat-message]');
            out(t, 'stopped: no send button. Nothing sent.', 'problem');
            add('Stopped the run.' + CHANGED);
            break;
          }
          if (sb.disabled || panelName().toLowerCase() !== t.name.toLowerCase() || chatBox() !== box || box.value !== text) {
            if (chatBox() && chatBox().value === text) clearBox(chatBox());
            out(t, 'skipped: final check failed, nothing sent', 'problem');
            continue;
          }
          sb.click();
          const went = await until(() => { const b3 = chatBox(); return b3 && b3.value === '' ? b3 : null; }, 8000);
          if (!went) { out(t, 'NOT CONFIRMED: the message may not have sent. Stopping to be safe.', 'problem'); break; }
          const r0 = acRoot();
          const seen = await until(() => r0 && Array.from(r0.querySelectorAll('p')).filter(visible).slice(-5).some(p => norm(p.textContent) === norm(text)), 4000);
          out(t, seen ? 'sent' : 'sent (not showing in the chat yet)', 'sent');
          await wait(1200);
        }
        const summary = Object.keys(tally).map(k => tally[k] + ' ' + k).join(', ') || 'nothing done';
        runMsg.textContent = 'Done: ' + summary + '.';
      } catch (e) {
        runMsg.textContent = '⚠️ Stopped by an error: ' + errText(e);
      } finally {
        running = false; lock = null;
        stopBtn.style.display = 'none'; doneBtn.style.display = 'inline-block';
        if (stepResolve) stepResolve('stop');
      }
    };

    msgsPane.appendChild(pane);
    sub('main');
    return {
      refresh: () => { if (!running) { sub('main'); renderMain(); } paintTechs(); },
      leave: () => { if (picking) setPicking(false); techStyle.textContent = ''; },
      isRunning: () => running,
      stop: requestStop,
      cleanup: () => { window.removeEventListener('click', onTechClick, true); techStyle.remove(); }
    };
  })();

  // ===================================================================
  // Tool 4: Business Unit
  // Switches the Business Unit on the jobs you pick to a branch (Mendenhall Branch unless
  // you pick another). Only branches are offered, never the departments.
  // For each job it opens the job's Edit page (the grey pencil on the job record), picks the
  // branch in the Business Unit list, presses Save, then opens the page again to check the
  // change stuck. "Check jobs" does all of that except Save. "Put back" undoes the last run.
  // If ServiceTitan pops up a question after Save, the run stops and leaves it for you.
  // ===================================================================
  const biz = (() => {
    const DEFAULT_BRANCH = 'Mendenhall Branch';
    const KNOWN_BRANCHES = ['Greenville Branch', 'Gulfport Branch', 'Mendenhall Branch', 'Tupelo Branch'];
    const MAX_PER_RUN = 50;
    const TOOL = 'Business Unit';
    const BU_SEL = 'select[name="BusinessUnit"]';
    const isBranch = name => /\bbranch\b/i.test(name);
    const ko = () => window.ko && typeof window.ko.dataFor === 'function' ? window.ko : null;
    const vmOf = s => { try { const k = ko(); return k ? k.dataFor(s) || null : null; } catch (e) { return null; } };
    const unwrap = v => { try { return typeof v === 'function' ? v() : v; } catch (e) { return v; } };

    // The branch list comes from ServiceTitan's own list of Business Units, keeping only the
    // ones named "... Branch". If the page doesn't have it, use the last list seen.
    const branches = () => {
      let names = [];
      try {
        const d = window.App && window.App.Data && window.App.Data.BusinessUnits;
        if (Array.isArray(d)) names = d.filter(b => b && b.Active !== false).map(b => norm(b.Name)).filter(isBranch);
      } catch (e) {}
      if (names.length) set('stBizBranches', JSON.stringify(names));
      else { try { names = (JSON.parse(get('stBizBranches') || '[]') || []).filter(isBranch); } catch (e) { names = []; } }
      if (!names.length) names = KNOWN_BRANCHES.slice();
      return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    };

    // ---------- Pane ----------
    const wrap = el('div', 'padding:8px 10px 10px;display:grid;gap:8px');
    const msg = el('div', 'font-size:12px;color:#444;min-height:16px');
    const say = s => { msg.textContent = s; };
    const toRow = el('div', 'display:flex;gap:6px;align-items:center');
    const toLabel = el('span', 'font-size:12px;font-weight:600', 'Change to');
    const branchPick = el('select', 'flex:1;min-width:0;padding:6px;border:1px solid #aaa;border-radius:6px;font:inherit;color:#111;background:#fff');
    branchPick.id = 'st-biz-branch';
    toRow.append(toLabel, branchPick);

    // The jobs to change: picked on the board or typed in. Blue outline while this tool is open.
    const picker = jobPicker({
      color: '#1a6ed8', soft: 'rgba(26,110,216,.25)', max: MAX_PER_RUN,
      shown: () => bizPane.style.display !== 'none',
      busy: () => running,
      say: t => say(t),
      changed: () => updateButtons()
    });

    const actions = el('div', 'display:flex;flex-wrap:wrap;gap:6px');
    const checkBtn = smallBtn('Check jobs (changes nothing)', () => startRun('check'), PRIMARY);
    const changeBtn = smallBtn('Change…', () => askConfirm('change'), 'color:#c62828;border-color:#e0a0a8');
    actions.append(checkBtn, changeBtn);
    const confirmBox = el('div', 'display:none;padding:8px;border:1px solid #e0a0a8;background:#fdecec;border-radius:6px;font-size:12px;gap:6px;flex-wrap:wrap;align-items:center');
    const confirmText = el('span', 'flex-basis:100%');
    const confirmYes = smallBtn('Yes', () => {}, DANGER);
    confirmBox.append(confirmText, confirmYes, smallBtn('Cancel', () => { confirmBox.style.display = 'none'; }));

    const progress = el('div', 'display:none;gap:6px');
    const log = el('pre', 'max-height:200px;overflow:auto;margin:0;padding:6px;background:#f6f6f6;border:1px solid #ddd;border-radius:6px;white-space:pre-wrap;font:12px/1.35 ui-monospace,Consolas,monospace');
    const progRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    const requestStop = () => { if (!running) return; stop = true; stopBtn.disabled = true; stopBtn.textContent = 'Stopping after this job...'; };
    const stopBtn = smallBtn('Stop', () => requestStop());
    const copyBtn = smallBtn('Copy results', async () => {
      const text = log.textContent + (details.length ? '\n--- details ---\n' + details.join('\n') : '');
      if (await copy(text)) copyBtn.textContent = 'Copied';
    });
    const undoBtn = smallBtn('↩ Put back', () => askConfirm('putback'));
    progRow.append(stopBtn, copyBtn, undoBtn);
    progress.append(log, progRow);
    wrap.append(msg, toRow, picker.box, actions, confirmBox, progress);
    bizPane.appendChild(wrap);

    let running = false, stop = false;
    let undo = [];      // [{ job, from }] for the jobs the last run changed
    let details = [];   // extra lines for "Copy results" (what happened after each Save)
    const add = s => { log.textContent += s + '\n'; log.scrollTop = log.scrollHeight; };
    const target = () => branchPick.value || DEFAULT_BRANCH;

    const renderBranches = () => {
      const list = branches();
      const prev = branchPick.value || get('stBizBranch') || DEFAULT_BRANCH;
      branchPick.textContent = '';
      list.forEach(n => { const o = el('option', '', n); o.value = n; branchPick.appendChild(o); });
      const keep = list.find(n => same(n, prev)) || list.find(n => same(n, DEFAULT_BRANCH)) || list[0];
      if (keep) branchPick.value = keep;
      updateButtons();
    };
    branchPick.onchange = () => { set('stBizBranch', branchPick.value); updateButtons(); };

    const updateButtons = () => {
      const on = !running;
      changeBtn.textContent = 'Change to ' + target() + '…';
      branchPick.disabled = !on; branchPick.style.opacity = on ? '1' : '.5';
      [checkBtn, changeBtn].forEach(x => { const ok = on && picker.size() > 0; x.disabled = !ok; x.style.opacity = ok ? '1' : '.5'; });
      undoBtn.style.display = !running && undo.length ? 'inline-block' : 'none';
      undoBtn.textContent = '↩ Put back (' + undo.length + ')';
    };

    // ---------- Confirm ----------
    const askConfirm = mode => {
      if (running) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      if (mode === 'change') {
        if (!picker.size()) return;
        confirmText.textContent = 'Change the Business Unit on ' + plural(picker.size(), 'job') + ' to ' + target() +
          '? Each job is saved in ServiceTitan. Jobs already on ' + target() + ' are left alone.';
        confirmYes.textContent = 'Yes, change them';
        confirmYes.onclick = () => { confirmBox.style.display = 'none'; startRun('change'); };
      } else {
        if (!undo.length) return;
        confirmText.textContent = 'Put back ' + plural(undo.length, 'job') + ' to the Business Unit each one had before the last run?';
        confirmYes.textContent = 'Yes, put them back';
        confirmYes.onclick = () => { confirmBox.style.display = 'none'; startRun('putback'); };
      }
      confirmBox.style.display = 'flex';
    };

    // ---------- The Edit Job page ----------
    const editHash = j => '#/Job/Edit/' + j;
    const onEdit = j => location.hash.split('?')[0] === editHash(j);
    // The Business Unit list on job j's Edit page, once it has loaded (not a leftover from
    // the page before).
    const buSelect = (j, stale) => {
      if (!onEdit(j)) return null;
      const s = document.querySelector(BU_SEL);
      if (!s || !s.options.length || !visible(s)) return null;
      const vm = vmOf(s);
      if (vm && vm.Id != null) { if (String(unwrap(vm.Id)) !== String(j)) return null; }
      else if (s === stale) return null;
      return s;
    };
    const selectedName = s => { const o = s && s.options[s.selectedIndex]; return o ? norm(o.text) : ''; };
    const isLocked = s => { const vm = vmOf(s); return !!(s.disabled || (vm && unwrap(vm.IsBusinessUnitReadOnly))); };
    // Opens job j's Edit page and waits until its Business Unit is showing and settled.
    const openEdit = async j => {
      const stale = document.querySelector(BU_SEL);
      if (onEdit(j)) { location.hash = '#/Job/Index/' + j; await wait(600); }
      location.hash = editHash(j);
      let s = await until(() => buSelect(j, stale), 15000, 300);
      if (!s) return null;
      let last = selectedName(s), calm = 0;
      for (let w = 0; calm < 3 && w < 3000; w += 250) {
        await wait(250);
        s = buSelect(j, stale) || s;
        const now = selectedName(s);
        if (now === last) calm++; else { last = now; calm = 0; }
      }
      return buSelect(j, stale);
    };
    // Visible pop-ups and error messages (to tell what happened after Save).
    const POPUP_SEL = '.modal.in, .modal.show, [role="dialog"], [role="alertdialog"], .bootbox';
    const ERROR_SEL = '.validation-summary-errors, .field-validation-error, .alert-danger, .alert-error, .error-message, .Toast--danger, .toast-error';
    const shown = sel => Array.from(document.querySelectorAll(sel)).filter(x => visible(x) && !panel.contains(x) && norm(x.innerText));
    const choose = (s, name) => {
      const opt = Array.from(s.options).find(o => same(o.text, name));
      if (!opt) return false;
      s.value = opt.value;
      s.dispatchEvent(new Event('change', { bubbles: true }));
      const vm = vmOf(s);
      if (vm && typeof vm.BusinessUnitId === 'function') return String(vm.BusinessUnitId()) === String(opt.value);
      return s.value === opt.value;
    };

    const res = (text, kind, extra) => Object.assign({ text, kind }, extra || {});
    // A job's Business Unit from ServiceTitan's job data, without opening the page: { from, locked }.
    const readJob = async j => {
      const d = await st.jobEdit(j);
      if (!d || typeof d.BusinessUnit !== 'string') throw new Error('no Business Unit in the job data');
      return { from: norm(d.BusinessUnit), locked: !!d.IsBusinessUnitReadOnly };
    };
    // Waits (up to a few seconds) for the job data to show the new branch. True once it does.
    const confirmedByData = async (j, to) => {
      for (let w = 0; w < 5000; w += 400) {
        await wait(400);
        let now;
        try { now = (await readJob(j)).from; } catch (e) { return false; }
        if (same(now, to)) return true;
      }
      return false;
    };

    // Opens one job's Edit page and checks or changes its Business Unit. Returns { text, kind, from, stopRun }.
    const doJob = async (j, to, real) => {
      try {
        const s = await openEdit(j);
        if (!s) {
          if (onEdit(j) && !document.querySelector(BU_SEL)) health.flag(TOOL, 'can\'t find the Business Unit list on the Edit Job page', BU_SEL);
          return res('COULD NOT OPEN THE EDIT PAGE', 'problem');
        }
        const from = selectedName(s);
        if (same(from, to)) return res('already ' + to, 'already');
        if (isLocked(s)) return res('locked in ServiceTitan (shows ' + from + ')', 'locked');
        if (!Array.from(s.options).some(o => same(o.text, to))) return res(to + ' is not in this job\'s list', 'problem');
        if (!real) return res(from + ' → would change to ' + to, 'would change', { from });

        if (!choose(s, to)) { choose(s, from); return res('COULD NOT PICK ' + to, 'problem'); }
        const form = s.closest('form');
        const save = form && Array.from(form.querySelectorAll('button, input[type="submit"]')).find(b => visible(b) && /^\s*save\s*$/i.test(b.innerText || b.value || ''));
        if (!save) {
          choose(s, from);
          health.flag(TOOL, 'can\'t find the Save button on the Edit Job page', 'form button "Save"');
          return res('COULD NOT FIND SAVE (nothing saved)', 'problem');
        }
        const popupsBefore = new Set(shown(POPUP_SEL));
        const errorsBefore = new Set(shown(ERROR_SEL));
        const t0 = Date.now();
        save.click();
        const outcome = await until(() => {
          if (!onEdit(j)) return { how: 'left' };
          const p = shown(POPUP_SEL).find(x => !popupsBefore.has(x));
          if (p) return { how: 'popup', text: norm(p.innerText).slice(0, 300) };
          const er = shown(ERROR_SEL).filter(x => !errorsBefore.has(x));
          if (er.length) return { how: 'error', text: er.map(x => norm(x.innerText)).join(' | ').slice(0, 300) };
          return null;
        }, 20000, 250) || { how: 'stayed' };
        details.push('#' + j + ' Save: ' + outcome.how + ' after ' + ((Date.now() - t0) / 1000).toFixed(1) + 's, page ' + location.hash.split('?')[0] + (outcome.text ? ', said: ' + outcome.text : ''));
        if (outcome.how === 'popup') {
          return res('ServiceTitan asked: "' + outcome.text.slice(0, 120) + '". Answer it yourself, then check this job.', 'problem', { from, stopRun: true, noRetry: true });
        }
        if (outcome.how === 'error') {
          const back = buSelect(j); if (back) choose(back, from);
          return res('NOT SAVED: ' + outcome.text.slice(0, 160), 'problem', { from });
        }
        // Make sure the change stuck: the job data should now show the new branch (quick).
        if (await confirmedByData(j, to)) {
          details.push('#' + j + ' confirmed: the job data shows ' + to);
          health.clear(TOOL);
          return res(from + ' → ' + to, 'changed', { from, changed: true });
        }
        // Couldn't confirm it from the data: open the job again and look (slower).
        const again = await openEdit(j);
        if (!again) return res('saved, but COULD NOT RE-OPEN TO CHECK', 'problem', { from, changed: true });
        const now = selectedName(again);
        details.push('#' + j + ' re-opened: shows ' + now);
        if (same(now, to)) { health.clear(TOOL); return res(from + ' → ' + to, 'changed', { from, changed: true }); }
        if (same(now, from)) return res('NOT SAVED, still ' + from, 'problem', { from });
        return res('SAVED BUT SHOWS ' + now, 'problem', { from, changed: true });
      } catch (e) {
        return res('ERROR: ' + errText(e), 'problem');
      }
    };
    // What to do with one job, using what its job data already says when possible: jobs already
    // on the branch, or locked, are reported without opening anything, and Check jobs only reads.
    const handle = async (it, real, pre) => {
      if (pre && !pre.error) {
        if (same(pre.from, it.to)) return res('already ' + it.to, 'already');
        if (pre.locked) return res('locked in ServiceTitan (shows ' + pre.from + ')', 'locked');
        if (!real) return res(pre.from + ' → would change to ' + it.to, 'would change', { from: pre.from });
      } else if (pre && pre.error) {
        details.push('#' + it.job + ' job data not readable (' + errText(pre.error) + '), opened the page instead');
      }
      return doJob(it.job, it.to, real);
    };

    // ---------- A run ----------
    // mode: 'check' (changes nothing), 'change' (to the picked branch), 'putback' (undo).
    const startRun = async mode => {
      if (running) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      const to = target();
      const items = mode === 'putback' ? undo.map(u => ({ job: u.job, to: u.from })) : picker.ids().map(j => ({ job: j, to }));
      if (!items.length) return;
      if (items.length > MAX_PER_RUN) return say('⚠️ ' + MAX_PER_RUN + ' jobs per run at most.');
      const real = mode !== 'check';
      picker.setPicking(false);
      running = true; stop = false; lock = TOOL;
      picker.setEnabled(false);
      confirmBox.style.display = 'none';
      log.textContent = ''; details = [];
      progress.style.display = 'grid';
      stopBtn.disabled = false; stopBtn.textContent = 'Stop'; stopBtn.style.display = 'inline-block';
      copyBtn.textContent = 'Copy results';
      updateButtons();
      const home = onBoard() ? location.hash : '#/DispatchBoard';
      const results = new Map();
      const record = (it, r, retry) => { results.set(it.job, r); add('#' + it.job + ': ' + (retry ? 'retry: ' : '') + r.text); };
      const verb = mode === 'check' ? 'Checking' : mode === 'putback' ? 'Putting back' : 'Changing';
      try {
        add(mode === 'check' ? 'Check for ' + to + ' (nothing is changed)' : mode === 'putback' ? 'Put back to how they were' : 'Change to ' + to);
        // Read every job's Business Unit first, a few at a time. No pages to open for that.
        say('Reading ' + plural(items.length, 'job') + '...');
        const pre = await st.pool(items, 4, it => readJob(it.job), (d, t) => say('Reading jobs... ' + d + ' of ' + t));
        let halted = false;
        for (let n = 0; n < items.length; n++) {
          if (stop) { add('Stopped. ' + plural(items.length - n, 'job') + ' not done.'); break; }
          const it = items[n];
          say(verb + ' ' + (n + 1) + ' of ' + items.length + ' (job ' + it.job + ')');
          const r = await handle(it, real, pre[n]);
          record(it, r);
          if (r.stopRun) { halted = true; add('Run stopped so you can answer ServiceTitan. ' + plural(items.length - n - 1, 'job') + ' not done.'); break; }
        }
        // One more try for jobs that had a problem, after the rest are done.
        const failed = items.filter(it => results.has(it.job) && results.get(it.job).kind === 'problem' && !results.get(it.job).noRetry && !results.get(it.job).changed);
        if (failed.length && !stop && !halted) {
          add('');
          add('Retrying ' + plural(failed.length, 'job') + ' that had a problem...');
          location.hash = home;
          await wait(2000);
          for (let n = 0; n < failed.length; n++) {
            if (stop) { add('Stopped. ' + (failed.length - n) + ' retry(s) not done.'); break; }
            say('Retrying ' + (n + 1) + ' of ' + failed.length + ' (job ' + failed[n].job + ')');
            const r = await doJob(failed[n].job, failed[n].to, real);
            record(failed[n], r, true);
            if (r.stopRun) { add('Run stopped so you can answer ServiceTitan.'); break; }
          }
        }
        // Remember what changed so it can be put back.
        if (mode === 'change') {
          undo = [];
          results.forEach((r, j) => { if (r.changed && r.from) undo.push({ job: j, from: r.from }); });
          // Done jobs come off the list; anything with a problem stays so you can try again.
          results.forEach((r, j) => { if (r.kind === 'changed' || r.kind === 'already') picker.remove(j); });
        } else if (mode === 'putback') {
          undo = undo.filter(u => { const r = results.get(u.job); return !(r && (r.kind === 'changed' || r.kind === 'already')); });
        }
        const tally = {};
        results.forEach(r => { tally[r.kind] = (tally[r.kind] || 0) + 1; });
        const summary = Object.keys(tally).map(k => tally[k] + ' ' + k).join(', ') || 'nothing done';
        const left = Array.from(results.entries()).filter(e => e[1].kind === 'problem').map(e => '#' + e[0]);
        if (left.length) add('Needs a look: ' + left.join(', '));
        if (undo.length && mode !== 'check') add('↩ Put back can undo ' + plural(undo.length, 'job') + '.');
        say('Done: ' + summary + '.');
      } catch (e) {
        say('⚠️ Stopped by an error: ' + errText(e));
      } finally {
        // Leave a pop-up for the person to answer; otherwise go back to the board.
        const popupOpen = shown(POPUP_SEL).length > 0;
        if (!popupOpen && location.hash !== home) { location.hash = home; await wait(800); }
        running = false; lock = null;
        stopBtn.style.display = 'none';
        picker.setEnabled(true);
        updateButtons();
      }
    };

    const refresh = () => { if (running) return; renderBranches(); picker.render(); if (!onBoard() && !msg.textContent) say('Open the Dispatch board to pick jobs.'); };
    renderBranches();
    return {
      refresh,
      leave: () => picker.setPicking(false),
      isRunning: () => running,
      stop: requestStop,
      cleanup: () => picker.cleanup()
    };
  })();

  // ===================================================================
  // Tool 5: Customer Texts
  // Texts customers a saved message through ServiceTitan's Chat Center, one at a time.
  // Messages are sorted into folders (Holds, Tech Updates, Reschedule, plus your own) and
  // each folder has its own repeat rule (for example: skip anyone texted in the last 7 days).
  //   - Who: the Hold list (every hold loads at once, then filter by job type), or jobs you
  //     pick on the board or by job number.
  //   - Which number: the Bill To's primary number. If that's a landline, their first mobile.
  //     Optionally every mobile number on the Bill To.
  //   - Before typing it checks: the right conversation is open, the box is empty, they
  //     haven't replied STOP, no unread reply is waiting, and the folder's repeat rule.
  //   - Type only: it types, you press Send (it notices and moves on).
  //     Auto-send: you confirm by typing how many it will text, and it checks each one went out.
  // ===================================================================
  const texts = (() => {
    const TOOL = 'Customer Texts';
    const BOX = 'textarea.cht-response-input';
    const K = { folders: 'stCtFolders', folder: 'stCtFolder', pick: 'stCtPick', mode: 'stCtMode', name: 'stCtName', all: 'stCtAllMobiles', never: 'stCtNever', types: 'stCtTypes', source: 'stCtSource', sections: 'stCtSec' };
    const loadJSON = (k, d) => { try { const v = JSON.parse(get(k)); return v == null ? d : v; } catch (e) { return d; } };
    const showNum = d => d ? '…' + String(d).slice(-4) : '?';
    const s1 = plural;
    const kov = () => window.ko && typeof window.ko.dataFor === 'function' ? window.ko : null;
    const vmOf = x => { try { const k = kov(); return k ? k.dataFor(x) || null : null; } catch (e) { return null; } };
    // Unwraps a Knockout observable; leaves anything else (including plain functions) alone.
    const un = v => { try { const k = kov(); return k && k.isObservable && k.isObservable(v) ? v() : v; } catch (e) { return undefined; } };
    const toJS = v => { try { const k = kov(); return k ? k.toJS(v) : v; } catch (e) { return v; } };
    const firstWord = s => norm(s).split(' ')[0] || '';
    const titleCase = w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '';

    // ---------- Folders and messages ----------
    const DEFAULT_FOLDERS = [
      { name: '⏸️ Holds', days: 7, same: false, msgs: [
        ['🆓 Free quote follow-up', 'Hey, this is {dispatcher} with AirSouth Cooling, Heating, Plumbing and Electrical. I am reaching out regarding the appointment we had scheduled for you in the past. I was trying to see if I could offer you some priority for a day you are available for a FREE quote. We offer free quotes on HVAC Heating & Cooling systems, Generators, Water Heaters, Ductwork, Duct Cleanings and more! Just give us a call at 601-847-9941.']
      ] },
      { name: '🚚 Tech Updates', days: 1, same: true, msgs: [
        ['⏱️ Running late', 'Hey, this is {dispatcher} with Air South Cooling and Heating. I am reaching out about your appointment. I wanted to update as I know your time is valuable. My expert has ran into a few delays, but is still scheduled to come out to see you. He will send you a text 30 minutes before his arrival. If you have any questions or concerns, please give me a call back at 601-847-9941. Thank you for being the best part of AirSouth!']
      ] },
      { name: '📅 Reschedule', days: 1, same: true, msgs: [
        ['📅 Need to reschedule', 'Hey, this is {dispatcher} with AirSouth Cooling, Heating, Plumbing and Electrical. We need to reschedule your appointment. Please give us a call at 601-847-9941 so we can find a time that works for you. Thank you!']
      ] }
    ];
    const cloneDefaults = () => DEFAULT_FOLDERS.map(f => ({ name: f.name, days: f.days, same: f.same, msgs: f.msgs.map(m => m.slice()) }));
    const validFolders = v => Array.isArray(v) && v.length > 0 && v.every(f => f && typeof f.name === 'string' && Array.isArray(f.msgs) &&
      f.msgs.every(n => Array.isArray(n) && n.length === 2 && typeof n[0] === 'string' && typeof n[1] === 'string'));
    const tidy = f => { f.days = Math.max(0, Math.min(365, parseInt(f.days, 10) || 0)); f.same = !!f.same; return f; };
    let folders = (() => { const v = loadJSON(K.folders, null); return validFolders(v) ? v : cloneDefaults(); })().map(tidy);
    const saveFolders = () => set(K.folders, JSON.stringify(folders));
    let fIdx = Math.max(0, Math.min(parseInt(get(K.folder) || '0', 10) || 0, folders.length - 1));
    let picks = loadJSON(K.pick, {});
    if (!picks || typeof picks !== 'object' || Array.isArray(picks)) picks = {};
    const curFolder = () => folders[fIdx];
    const curMsgIdx = () => { const f = curFolder(); return Math.max(0, Math.min(parseInt(picks[f.name], 10) || 0, f.msgs.length - 1)); };
    const curMsg = () => { const f = curFolder(); return f.msgs.length ? f.msgs[curMsgIdx()] : null; };
    const ruleText = f => !f.days ? 'Never skips anyone.' : 'Skips anyone who got ' + (f.same ? 'this same message' : 'any text from us') + (f.days === 1 ? ' today.' : ' in the last ' + f.days + ' days.');

    // ---------- Fill-ins ----------
    // {dispatcher}: your first name, from the ServiceTitan account you're signed in with
    // (or the name you set in ⚙️ Settings). {first}: customer's first name. {tech}: tech's first name.
    const autoName = () => {
      try {
        const id = window.App && window.App.Notifications && window.App.Notifications.store && window.App.Notifications.store.userId;
        const D = (window.App && window.App.Data) || {};
        const e = id != null && ((D.Employees || []).find(x => x && x.UserId === id) || (D.ActiveEmployees || []).find(x => x && x.UserId === id));
        if (e && e.Name) return titleCase(firstWord(e.Name));
      } catch (e) {}
      return '';
    };
    const myName = () => norm(get(K.name)) || autoName();
    const uses = (tmpl, key) => new RegExp('\\{' + key + '\\}', 'i').test(tmpl);
    const fill = (tmpl, r) => tmpl.replace(/\{dispatcher\}/gi, myName()).replace(/\{first\}/gi, r.first || '').replace(/\{tech\}/gi, r.tech || '');

    // ---------- Settings ----------
    let allMobiles = get(K.all) === '1';
    let never = (loadJSON(K.never, []) || []).map(last10).filter(n => n.length === 10);

    // ---------- Reading the board ----------
    const boardVM = () => { const jl = document.querySelector('.job-list'); return jl ? vmOf(jl) : null; };
    const boardDateISO = () => {
      try { const d = un(boardVM().Date); if (d && typeof d.toISOString === 'function') return d.toISOString(); } catch (e) {}
      const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString();
    };
    // The Business Units the board is filtered to (the Hold list uses the same filter).
    const boardBUs = () => {
      try { const f = boardVM().BusinessUnitFilter; const ids = f && typeof f.getIds === 'function' ? f.getIds() : []; return (ids || []).map(Number).filter(Boolean); } catch (e) { return []; }
    };
    const buNames = ids => {
      const all = (window.App && window.App.Data && window.App.Data.BusinessUnits) || [];
      return ids.map(id => (all.find(b => b.Id === id) || {}).Name).filter(Boolean);
    };
    const xhrHeaders = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' };

    // ---------- The Hold list ----------
    const groupOf = type => { const t = norm(type); if (/^non\s*-?\s*operational/i.test(t)) return 'Non Operational'; return norm(t.split(' - ')[0]) || '(no type)'; };
    let holds = null;   // { jobs: [{ jobId, customer, customerId, type }], total, bus, at }
    let holdsLoading = false;
    let typeSel = new Set(loadJSON(K.types, []) || []);
    const saveTypes = () => set(K.types, JSON.stringify(Array.from(typeSel)));
    // The Hold list, 500 at a time: the first page says how many there are, then the rest load
    // a few at a time.
    const loadHolds = async () => {
      const ids = boardBUs();
      const date = boardDateISO();
      const PAGE = 500;
      const page = async skip => {
        const r = await fetch('/Dispatch/GetJobs', { method: 'POST', credentials: 'include',
          headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, xhrHeaders),
          body: JSON.stringify({ JobType: 'Hold', Date: date, QueryFilter: { Skip: skip, Take: PAGE, Start: {}, Created: {}, BusinessUnitIds: ids } }) });
        if (!r.ok) throw new Error('ServiceTitan answered ' + r.status);
        const d = await r.json();
        if (!d || !Array.isArray(d.Jobs)) { health.flag(TOOL, 'the Hold list came back in a shape the Toolbox doesn\'t know', '/Dispatch/GetJobs'); throw new Error('unexpected reply'); }
        return d;
      };
      const seen = new Set(), jobs = [];
      const take = d => d.Jobs.forEach(j => {
        if (!j || !j.JobId || seen.has(j.JobId)) return;
        seen.add(j.JobId);
        jobs.push({ jobId: j.JobId, customer: norm(j.Customer), customerId: j.CustomerId, type: norm(j.Type) || '(no type)' });
      });
      const firstPage = await page(0);
      const total = firstPage.Count || 0;
      take(firstPage);
      const skips = [];
      for (let skip = PAGE; skip < Math.min(total, 20000); skip += PAGE) skips.push(skip);
      const rest = await st.pool(skips, 3, page);
      rest.forEach(d => { if (d && d.error) throw d.error; take(d); });
      health.clear(TOOL);
      return { jobs, total, bus: buNames(ids), at: new Date() };
    };

    // ---------- Jobs picked on the board ----------
    // Customer and tech: from the timeline if the job is on it, else from the job list at the bottom.
    const jobInfo = j => timelineJob(j) || listJob(j);

    // ---------- UI ----------
    const pane = el('div', 'padding:8px 10px 10px');
    const views = {};
    const sub = name => { Object.keys(views).forEach(k => { views[k].style.display = k === name ? 'block' : 'none'; }); toTop(); };
    const mkView = name => { views[name] = el('div', 'display:none'); pane.appendChild(views[name]); return views[name]; };
    const msgLine = () => el('div', 'font-size:12px;color:#444;margin-bottom:6px;min-height:16px;white-space:pre-wrap');
    const head = text => el('div', 'font-weight:700;margin-bottom:4px', text);
    const row = () => el('div', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px');
    const label = text => el('div', 'font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.03em;margin-top:10px;margin-bottom:3px', text);
    const check = (text, checked, onChange) => {
      const l = el('label', 'display:flex;gap:6px;align-items:center;padding:2px 0;cursor:pointer;font-size:12px');
      const c = el('input'); c.type = 'checkbox'; c.checked = !!checked;
      c.onchange = () => onChange(c.checked);
      l.append(c, document.createTextNode(text));
      return { l, c };
    };
    const chip = (text, on, onClick) => {
      const b = el('button', 'padding:4px 8px;cursor:pointer;border:1px solid ' + (on ? '#1a6ed8' : '#aaa') + ';border-radius:14px;background:' + (on ? '#e3eefc' : '#fff') + ';color:#111;font:inherit;font-size:12px;' + (on ? 'font-weight:600' : ''), text);
      b.type = 'button'; b.onclick = onClick;
      b.addEventListener('mousedown', e => e.preventDefault());
      return b;
    };
    const radio = (name, val, cur, text, onPick) => {
      const l = el('label', 'display:flex;gap:6px;align-items:center;cursor:pointer;font-size:12px;padding:1px 0');
      const r = el('input'); r.type = 'radio'; r.name = name; r.checked = val === cur;
      r.onchange = () => onPick(val);
      l.append(r, document.createTextNode(text));
      return l;
    };

    // ===== Main view =====
    const vMain = mkView('main');
    const mainMsg = msgLine();
    const folderRow = el('div', 'display:flex;flex-wrap:wrap;gap:5px');
    const ruleLine = el('div', 'font-size:11px;color:#666;margin-top:4px');
    const msgList = el('div', '');
    const whoRow = el('div', 'display:grid;gap:1px');
    const whoBox = el('div', 'margin-top:4px');
    const modeRow = el('div', 'display:grid;gap:1px');
    const startBtn = smallBtn('Start', () => openConfirm(), PRIMARY + 'margin-top:10px;' + FULL + 'padding:8px');
    const mainNav = moreRow([], [
      smallBtn('✏️ Edit messages', () => openEditor()),
      smallBtn('📁 Edit folders', () => openFolders()),
      smallBtn('⚙️ Settings', () => openSettings())
    ]);
    // Three steps you can fold up: ① Message ② Who ③ How. A folded step shows a summary.
    const secOpen = Object.assign({ msg: true, who: true, how: false }, loadJSON(K.sections, {}) || {});
    const section = (key, title) => {
      const wrap = el('div');
      wrap.className = 'st-sec';
      const headBtn = el('button');
      headBtn.type = 'button'; headBtn.className = 'st-sec-head';
      headBtn.setAttribute('data-sec', key);
      const arrow = el('span', 'width:10px;flex:none;color:#5a6270');
      const sum = el('span');
      sum.className = 'st-sec-sum';
      headBtn.append(arrow, el('span', '', title), sum);
      headBtn.addEventListener('mousedown', e => e.preventDefault());
      const inner = el('div');
      inner.className = 'st-sec-body';
      const paint = () => {
        const on = !!secOpen[key];
        inner.style.display = on ? 'block' : 'none';
        arrow.textContent = on ? '▾' : '▸';
        headBtn.setAttribute('aria-expanded', String(on));
        headBtn.title = on ? 'Fold this step up' : 'Open this step';
        sum.style.visibility = on ? 'hidden' : 'visible';
      };
      headBtn.onclick = () => { secOpen[key] = !secOpen[key]; set(K.sections, JSON.stringify(secOpen)); paint(); };
      wrap.append(headBtn, inner);
      paint();
      return { wrap, inner, sum };
    };
    const secMsg = section('msg', '① Message'), secWho = section('who', '② Who'), secHow = section('how', '③ How');
    msgList.style.marginTop = '6px';
    secMsg.inner.append(folderRow, ruleLine, msgList);
    secWho.inner.append(whoRow, whoBox);
    secHow.inner.append(modeRow);
    vMain.append(mainMsg, secMsg.wrap, secWho.wrap, secHow.wrap, startBtn, mainNav);
    const say = s => { mainMsg.textContent = s; };

    let stopRun = false, running = false, stepResolve = null;
    let source = get(K.source) === 'picked' ? 'picked' : 'holds';
    // Jobs you pick: green outline while this tool is open on "Jobs I pick".
    const picker = jobPicker({
      color: '#2e7d32', soft: 'rgba(46,125,50,.22)',
      shown: () => textsPane.style.display !== 'none' && source === 'picked',
      busy: () => running,
      say: t => say(t),
      changed: () => renderMain()
    });
    let mode = get(K.mode) === 'auto' ? 'auto' : 'type';
    const openGroups = new Set();

    // Who gets texted: one entry per customer (the first job found for them).
    const recipients = () => {
      const out = [], seen = new Set();
      const addOne = r => { const key = r.customerId ? 'c' + r.customerId : 'j' + r.jobId; if (seen.has(key)) return; seen.add(key); out.push(r); };
      if (source === 'holds') {
        if (!holds) return out;
        holds.jobs.forEach(h => { if (typeSel.has(h.type)) addOne({ jobId: h.jobId, customer: h.customer, customerId: h.customerId, tech: '' }); });
      } else {
        picker.ids().forEach(j => { const b = jobInfo(j) || {}; addOne({ jobId: j, customer: b.customer || picker.label(j) || '', customerId: b.customerId || null, tech: b.tech || '' }); });
      }
      return out;
    };

    const renderHolds = () => {
      whoBox.textContent = '';
      const top = el('div', 'display:flex;gap:6px;align-items:center;flex-wrap:wrap');
      const info = el('span', 'font-size:12px;flex:1;min-width:120px');
      const loadBtn = smallBtn(holds ? '↻ Reload' : 'Load holds', () => doLoadHolds());
      if (holdsLoading) { info.textContent = 'Loading holds…'; loadBtn.disabled = true; loadBtn.style.opacity = '.5'; }
      else if (!holds) info.textContent = onBoard() ? 'Loads every hold on the board\'s Hold list.' : 'Open the Dispatch board first.';
      else info.textContent = s1(holds.jobs.length, 'hold') + (holds.bus.length ? ' · ' + holds.bus.join(', ') : ' · all business units') +
        ' · ' + holds.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      top.append(info, loadBtn);
      whoBox.appendChild(top);
      if (!holds) return;
      const groups = new Map();
      holds.jobs.forEach(h => { const g = groupOf(h.type); if (!groups.has(g)) groups.set(g, new Map()); const m = groups.get(g); m.set(h.type, (m.get(h.type) || 0) + 1); });
      const box = el('div', 'max-height:190px;overflow:auto;border:1px solid #ddd;border-radius:6px;padding:3px 6px;background:#fafafa;margin-top:5px');
      Array.from(groups.entries()).sort((a, b) => sumOf(b[1]) - sumOf(a[1])).forEach(([g, types]) => {
        const tnames = Array.from(types.keys());
        const onCount = tnames.filter(t => typeSel.has(t)).length;
        const line = el('div', 'display:flex;align-items:center;gap:4px');
        const c = check(g + ' (' + sumOf(types) + ')', onCount === tnames.length, v => { tnames.forEach(t => v ? typeSel.add(t) : typeSel.delete(t)); saveTypes(); renderMain(); });
        c.c.indeterminate = onCount > 0 && onCount < tnames.length;
        c.l.style.flex = '1'; c.l.style.fontWeight = '600';
        const tog = smallBtn(openGroups.has(g) ? '▾' : '▸', () => { openGroups.has(g) ? openGroups.delete(g) : openGroups.add(g); renderMain(); }, 'padding:0 6px;border:none;background:transparent');
        tog.title = 'Show each job type';
        line.append(c.l, tog);
        box.appendChild(line);
        if (openGroups.has(g)) {
          Array.from(types.entries()).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => {
            const ct = check(t + ' (' + n + ')', typeSel.has(t), v => { v ? typeSel.add(t) : typeSel.delete(t); saveTypes(); renderMain(); });
            ct.l.style.paddingLeft = '18px';
            box.appendChild(ct.l);
          });
        }
      });
      whoBox.appendChild(box);
      const r = recipients();
      const ticked = holds.jobs.filter(h => typeSel.has(h.type)).length;
      const btns = el('div', 'display:flex;gap:6px;align-items:center;margin-top:4px;font-size:12px');
      btns.append(el('span', 'flex:1', s1(ticked, 'hold') + ' ticked → ' + s1(r.length, 'customer')),
        smallBtn('None', () => { typeSel.clear(); saveTypes(); renderMain(); }, 'padding:2px 6px'));
      whoBox.appendChild(btns);
    };
    const sumOf = m => Array.from(m.values()).reduce((a, b) => a + b, 0);
    const doLoadHolds = async () => {
      if (holdsLoading || running) return;
      if (!onBoard()) { say('Open the Dispatch board first.'); return; }
      holdsLoading = true; renderMain();
      try { holds = await loadHolds(); say('Loaded ' + s1(holds.jobs.length, 'hold') + '. Tick the kinds to text.'); }
      catch (e) { say('⚠️ Couldn\'t load the Hold list: ' + errText(e)); }
      finally { holdsLoading = false; renderMain(); }
    };

    const renderPicked = () => {
      whoBox.textContent = '';
      whoBox.appendChild(picker.box);
    };

    const renderMain = () => {
      if (running) return;
      folderRow.textContent = '';
      folders.forEach((f, i) => folderRow.appendChild(chip(f.name, i === fIdx, () => {
        fIdx = i; set(K.folder, String(i));
        // The Holds folder usually goes with the Hold list; the others with picked jobs.
        const want = /hold/i.test(f.name) ? 'holds' : 'picked';
        if (want !== source) { source = want; set(K.source, source); if (source !== 'picked') picker.setPicking(false); }
        renderMain();
      })));
      const f = curFolder();
      ruleLine.textContent = '🔁 ' + ruleText(f);
      msgList.textContent = '';
      if (!f.msgs.length) msgList.appendChild(el('div', 'font-size:12px;color:#666', 'No messages in this folder yet. Use ✏️ Edit messages.'));
      f.msgs.forEach(([name, text], i) => {
        const on = i === curMsgIdx();
        const b = el('button', FULL + 'margin:4px 0;padding:7px 9px;cursor:pointer;border:1px solid ' + (on ? '#1a6ed8' : '#aaa') + ';border-radius:6px;background:' + (on ? '#e3eefc' : '#f5f5f5') + ';color:#111;text-align:left;font:inherit' + (on ? ';box-shadow:inset 3px 0 0 #1a6ed8' : ''), (on ? '✔ ' : '') + (name || '(no name)'));
        b.type = 'button'; b.title = text;
        b.addEventListener('mousedown', e => e.preventDefault());
        b.onclick = () => { picks[f.name] = i; set(K.pick, JSON.stringify(picks)); renderMain(); };
        msgList.appendChild(b);
      });
      whoRow.textContent = '';
      whoRow.append(
        radio('st-ct-src', 'holds', source, '⏸️ Hold list (filter by job type)', v => { source = v; set(K.source, v); picker.setPicking(false); renderMain(); }),
        radio('st-ct-src', 'picked', source, '🖱️ Jobs I pick', v => { source = v; set(K.source, v); renderMain(); })
      );
      if (source === 'holds') { picker.setPicking(false); renderHolds(); } else renderPicked();
      modeRow.textContent = '';
      modeRow.append(
        radio('st-ct-mode', 'type', mode, 'Type only: I press Send for each one', v => { mode = v; set(K.mode, v); renderMain(); }),
        radio('st-ct-mode', 'auto', mode, 'Auto-send: sends to everyone in the list', v => { mode = v; set(K.mode, v); renderMain(); })
      );
      const r = recipients();
      const m = curMsg();
      const ok = onBoard() && r.length > 0 && !!m;
      startBtn.disabled = !ok; startBtn.style.opacity = ok ? '1' : '.5';
      startBtn.textContent = (mode === 'auto' ? 'Review and send to ' : 'Start (type only): ') + s1(r.length, 'customer');
      secMsg.sum.textContent = f.name + ' · ' + (m ? m[0] || '(no name)' : 'no message');
      secWho.sum.textContent = (source === 'holds' ? (holds ? 'Hold list' : 'Hold list (not loaded)') : 'Jobs I pick') + ' · ' + s1(r.length, 'customer');
      secHow.sum.textContent = mode === 'auto' ? 'Auto-send' : 'Type only';
      picker.render();   // the list and its highlights
      if (!onBoard()) say('Open the Dispatch board to use this.');
      else if (m && uses(m[1], 'dispatcher') && !myName()) say('⚠️ This message uses {dispatcher}, but your name couldn\'t be found. Set it in ⚙️ Settings.');
      else if (!mainMsg.textContent || /^(Open the Dispatch|⚠️ This message uses)/.test(mainMsg.textContent)) say(myName() ? 'Texts are signed as ' + myName() + '.' : '');
    };

    // ===== Edit messages =====
    const vEdit = mkView('edit');
    const editHead = head('');
    const editMsg = msgLine();
    const EDIT_HINT = 'Fill-ins: {dispatcher} = your first name, {first} = customer\'s first name, {tech} = the tech\'s first name (jobs on the board only). Saved in this browser.';
    const ed = listEditor('message', 'Button name (e.g. 🆓 Free quote)', 'Message text', room(320), { allowEmpty: true });
    const editNav = row();
    editNav.append(
      smallBtn('Save', () => {
        const r = ed.clean();
        if (r.error) { editMsg.textContent = r.error; return; }
        curFolder().msgs = r.list; saveFolders();
        sub('main'); say('✅ Messages saved.'); renderMain();
      }, PRIMARY),
      smallBtn('Cancel', () => { sub('main'); renderMain(); }),
      smallBtn('+ Add a message', () => ed.add())
    );
    vEdit.append(editHead, editMsg, ed.box, editNav);
    const openEditor = () => { if (running) return; editHead.textContent = '✏️ Edit messages: ' + curFolder().name; editMsg.textContent = EDIT_HINT; ed.load(curFolder().msgs); sub('edit'); };

    // ===== Edit folders =====
    const vFolders = mkView('folders');
    const foldMsg = msgLine();
    const foldBox = el('div', 'max-height:' + room(300) + ';overflow:auto;margin:0 -4px;padding:0 4px');
    let draftF = [];
    const renderFolders = () => {
      foldBox.textContent = '';
      draftF.forEach((f, i) => {
        const r = el('div', 'border:1px solid #ccc;border-radius:8px;padding:7px;margin-bottom:8px;background:#fafafa;font-size:12px');
        const nm = el('input', FULL + 'padding:5px 6px;border:1px solid #aaa;border-radius:5px;font:inherit;font-weight:600;color:#111;background:#fff');
        nm.type = 'text'; nm.value = f.name; nm.placeholder = 'Folder name'; nm.oninput = () => { f.name = nm.value; };
        const rule = el('div', 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:5px');
        const days = el('input', 'width:46px;padding:3px 5px;border:1px solid #aaa;border-radius:5px;font:inherit;color:#111;background:#fff');
        days.type = 'number'; days.min = '0'; days.max = '365'; days.value = String(f.days);
        days.oninput = () => { f.days = Math.max(0, Math.min(365, parseInt(days.value, 10) || 0)); };
        rule.append(document.createTextNode('Skip if texted in the last'), days, document.createTextNode('days (0 = never skip, 1 = today)'));
        const sameOnly = check('Only count this same message (not other texts)', f.same, v => { f.same = v; });
        sameOnly.l.style.marginTop = '3px';
        const tools = el('div', 'display:flex;gap:4px;margin-top:5px;align-items:center');
        const mv = d => () => { const j = i + d; if (j < 0 || j >= draftF.length) return; const t = draftF[i]; draftF[i] = draftF[j]; draftF[j] = t; renderFolders(); };
        tools.append(smallBtn('↑', mv(-1), i === 0 ? 'opacity:.4' : ''), smallBtn('↓', mv(1), i === draftF.length - 1 ? 'opacity:.4' : ''),
          el('span', 'flex:1;color:#666;padding-left:4px', s1(f.msgs.length, 'message')),
          smallBtn('Delete', () => { draftF.splice(i, 1); renderFolders(); }, 'color:#b00020;border-color:#e0a0a8'));
        r.append(nm, rule, sameOnly.l, tools);
        foldBox.appendChild(r);
      });
    };
    const foldNav = row();
    foldNav.append(
      smallBtn('Save', () => {
        const clean = draftF.map(f => tidy({ name: norm(f.name), days: f.days, same: f.same, msgs: f.msgs })).filter(f => f.name || f.msgs.length);
        if (!clean.length) { foldMsg.textContent = '⚠️ Keep at least one folder.'; return; }
        clean.forEach((f, i) => { if (!f.name) f.name = 'Folder ' + (i + 1); });
        const names = clean.map(f => f.name.toLowerCase());
        if (new Set(names).size !== names.length) { foldMsg.textContent = '⚠️ Two folders have the same name.'; return; }
        folders = clean; saveFolders();
        fIdx = Math.min(fIdx, folders.length - 1); set(K.folder, String(fIdx));
        sub('main'); say('✅ Folders saved.'); renderMain();
      }, PRIMARY),
      smallBtn('Cancel', () => { sub('main'); renderMain(); }),
      smallBtn('+ Add folder', () => { draftF.push({ name: '', days: 1, same: true, msgs: [] }); renderFolders(); foldBox.scrollTop = foldBox.scrollHeight; }),
      smallBtn('Reset to original', () => { draftF = cloneDefaults(); renderFolders(); foldMsg.textContent = 'Back to the original folders and messages. Press Save to keep this.'; })
    );
    vFolders.append(head('📁 Edit folders'), foldMsg, foldBox, foldNav);
    const openFolders = () => {
      if (running) return;
      draftF = folders.map(f => ({ name: f.name, days: f.days, same: f.same, msgs: f.msgs.map(m => m.slice()) }));
      foldMsg.textContent = 'Each folder has its own repeat rule. Deleting a folder deletes its messages when you Save.';
      renderFolders(); sub('folders');
    };

    // ===== Settings =====
    const vSet = mkView('settings');
    const setMsg = msgLine();
    const nameIn = el('input', FULL + 'padding:5px 6px;border:1px solid #aaa;border-radius:6px;font:inherit;color:#111;background:#fff');
    nameIn.type = 'text';
    const allChk = check('Text every mobile number on the Bill To (not just the primary)', allMobiles, () => {});
    const neverIn = el('textarea', FULL + 'padding:5px 6px;border:1px solid #aaa;border-radius:6px;font:inherit;font-size:12px;color:#111;background:#fff;resize:vertical');
    neverIn.rows = 4; neverIn.placeholder = 'One phone number per line';
    const setNav = row();
    setNav.append(
      smallBtn('Save', () => {
        set(K.name, norm(nameIn.value));
        allMobiles = allChk.c.checked; set(K.all, allMobiles ? '1' : '0');
        never = Array.from(new Set((neverIn.value.match(/[\d()+.\- ]{10,}/g) || []).map(last10).filter(n => n.length === 10)));
        set(K.never, JSON.stringify(never));
        sub('main'); say('⚙️ Saved.' + (myName() ? ' Texts are signed as ' + myName() + '.' : '')); renderMain();
      }, PRIMARY),
      smallBtn('Cancel', () => { sub('main'); renderMain(); })
    );
    vSet.append(head('⚙️ Settings'), setMsg,
      label('Your name for {dispatcher}'), nameIn,
      label('Numbers'), allChk.l,
      el('div', 'font-size:11px;color:#666;margin:2px 0 0 20px', 'Off: the primary number, or their first mobile if the primary is a landline.'),
      label('🚫 Never text these numbers'), neverIn, setNav);
    const openSettings = () => {
      if (running) return;
      const auto = autoName();
      nameIn.value = norm(get(K.name));
      nameIn.placeholder = auto ? auto + ' (from your ServiceTitan login)' : 'Your first name';
      setMsg.textContent = 'Leave the name empty to use the first name on your ServiceTitan login' + (auto ? ' (' + auto + ').' : '.');
      allChk.c.checked = allMobiles;
      neverIn.value = never.map(n => '(' + n.slice(0, 3) + ') ' + n.slice(3, 6) + '-' + n.slice(6)).join('\n');
      sub('settings');
    };

    // ===== Confirm =====
    // Before anything is typed, every customer is checked without opening their conversation:
    // their Bill To numbers, then each number's history (STOP, unread replies, the folder's
    // repeat rule, blocked in ServiceTitan). This screen then shows exactly who will be texted.
    const vConfirm = mkView('confirm');
    const confHead = head('Check before texting');
    const confText = el('div', 'font-size:12px;white-space:pre-wrap;max-height:' + room(340) + ';overflow:auto;border:1px solid #ddd;border-radius:6px;padding:6px;background:#fafafa');
    const confAsk = el('div', 'font-size:12px;margin-top:8px');
    const confInput = el('input', 'width:70px;padding:5px 6px;border:1px solid #aaa;border-radius:6px;font:inherit;color:#111;background:#fff;margin-left:6px');
    confInput.type = 'text'; confInput.inputMode = 'numeric'; confInput.id = 'st-ct-confirm-count';
    const confGo = smallBtn('Send', () => go(), DANGER);
    const confNav = row();
    let checkId = 0;   // a newer check (or Cancel) makes an older one stop updating the screen
    confNav.append(confGo, smallBtn('Cancel', () => { checkId++; sub('main'); renderMain(); }));
    vConfirm.append(confHead, confText, confAsk, confNav);
    let planned = null;   // { sends: [...], skips: [...], customers }
    const openConfirm = async () => {
      if (running) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      const m = curMsg();
      if (!m) return say('Pick a message first.');
      if (uses(m[1], 'dispatcher') && !myName()) return say('⚠️ Set your name in ⚙️ Settings first (the message uses {dispatcher}).');
      const pending = recipients();
      if (!pending.length) return say(source === 'holds' ? 'Load the holds and tick at least one kind.' : 'Pick some jobs first.');
      picker.setPicking(false);
      const f = curFolder(), tmpl = m[1];
      const id = ++checkId;
      planned = null;
      confHead.textContent = 'Checking before texting';
      confText.textContent = 'Checking ' + s1(pending.length, 'customer') + '…';
      confAsk.textContent = ''; confGo.style.display = 'none';
      sub('confirm');
      const t0 = Date.now();
      const result = await plan(pending, f, tmpl, (d, t) => { if (id === checkId) confText.textContent = 'Checking customers… ' + d + ' of ' + t; });
      if (id !== checkId) return;   // cancelled
      planned = Object.assign(result, { customers: pending.length });
      const sends = result.sends, skips = result.skips;
      const sample = sends[0] || null;
      const why = {};
      skips.forEach(x => { const k = x.why.replace(/ (today|yesterday|\d+ days ago)$/, ' recently'); why[k] = (why[k] || 0) + 1; });
      const lines = [
        'Folder: ' + f.name + '   🔁 ' + ruleText(f),
        'Message' + (sample ? ' (as the first customer will see it)' : '') + ':',
        '"' + (sample ? sample.text : tmpl) + '"',
        '',
        'Numbers: ' + (allMobiles ? 'every mobile on the Bill To' : 'Bill To primary (their first mobile if the primary is a landline)'),
        'Checked ' + s1(pending.length, 'customer') + (source === 'holds' ? ' from the Hold list' : '') + ' in ' + Math.max(1, Math.round((Date.now() - t0) / 1000)) + 's.',
        '',
        '✅ Will text ' + s1(sends.length, 'number') + ':'
      ];
      sends.slice(0, 40).forEach(x => lines.push('• ' + (x.r.customer || 'job #' + x.r.jobId) + ' ' + showNum(x.num) + '  (#' + x.r.jobId + ')' + (x.unchecked ? '  (checked on its page instead)' : '')));
      if (sends.length > 40) lines.push('…and ' + (sends.length - 40) + ' more');
      if (skips.length) {
        lines.push('', '⏭️ Skipping ' + skips.length + ': ' + Object.keys(why).map(k => why[k] + ' ' + k).join(', '));
        skips.slice(0, 40).forEach(x => lines.push('• ' + (x.r.customer || 'job #' + x.r.jobId) + (x.num ? ' ' + showNum(x.num) : '') + ': ' + x.why));
        if (skips.length > 40) lines.push('…and ' + (skips.length - 40) + ' more (all listed in the results)');
      }
      confHead.textContent = 'Check before texting';
      confText.textContent = lines.join('\n');
      confAsk.textContent = ''; confInput.value = '';
      if (!sends.length) {
        confAsk.textContent = 'Nobody to text: everyone was skipped.';
        return;
      }
      confGo.style.display = 'inline-block';
      if (mode === 'auto') {
        confAsk.append(document.createTextNode('Auto-send is on. To confirm, type how many texts this sends (' + sends.length + '):'), confInput);
        confGo.textContent = 'Send ' + s1(sends.length, 'text');
        setTimeout(() => confInput.focus(), 0);
      } else {
        confAsk.textContent = 'Type only: it opens each conversation and types the message. You press Send, and it moves to the next one.';
        confGo.textContent = 'Start';
      }
      confAsk.appendChild(el('div', 'color:#666;margin-top:4px', 'Keep this tab on screen while it runs (browsers slow down hidden tabs). About 4 seconds per text.'));
    };
    confInput.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };

    // ===== Run =====
    const vRun = mkView('run');
    const runMsg = el('div', 'font-size:12px;color:#444;margin-bottom:6px;min-height:16px');
    const runLog = el('pre', 'max-height:220px;overflow:auto;margin:0;padding:6px;background:#f6f6f6;border:1px solid #ddd;border-radius:6px;white-space:pre-wrap;font:12px/1.35 ui-monospace,Consolas,monospace');
    const runStep = el('div', 'display:none;margin-top:8px;padding:8px;border:1px solid #1a6ed8;background:#e3eefc;border-radius:6px;font-size:12px');
    const stepText = el('div', 'margin-bottom:6px');
    const stepBtns = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    runStep.append(stepText, stepBtns);
    const requestStop = () => { if (!running) return; stopRun = true; stopBtn.disabled = true; stopBtn.textContent = 'Stopping...'; if (stepResolve) stepResolve('stop'); };
    const stopBtn = smallBtn('Stop', () => requestStop());
    const copyBtn = smallBtn('Copy results', async () => { if (await copy(runLog.textContent)) copyBtn.textContent = 'Copied'; });
    const doneBtn = smallBtn('← Back', () => { sub('main'); renderMain(); });
    const runNav = row();
    runNav.append(stopBtn, copyBtn, doneBtn);
    vRun.append(head('Texting'), runMsg, runLog, runStep, runNav);
    const add = s => { runLog.textContent += s + '\n'; runLog.scrollTop = runLog.scrollHeight; };
    const askStep = (text, buttons) => new Promise(resolve => {
      stepResolve = v => { stepResolve = null; runStep.style.display = 'none'; resolve(v); };
      stepText.textContent = text;
      stepBtns.textContent = '';
      buttons.forEach(([lab, val, style]) => stepBtns.appendChild(smallBtn(lab, () => stepResolve && stepResolve(val), style)));
      runStep.style.display = 'block';
    });

    // ---------- Talking to ServiceTitan ----------
    // The Bill To's phone numbers, from the job's own data. Primary first.
    const billTo = async jobId => {
      let j;
      try { j = await st.job(jobId); } catch (e) { throw new Error('the job didn\'t load (' + errText(e) + ')'); }
      const c = j && j.Customer;
      if (!c || !Array.isArray(c.Contacts)) { health.flag(TOOL, 'can\'t read the Bill To phone numbers from a job', 'Job/Index Customer.Contacts'); throw new Error('no Bill To contacts in the job data'); }
      const phones = c.Contacts.filter(x => x && /phone/i.test(x.Type || '') && last10(x.Value).length === 10)
        .map(x => ({ num: last10(x.Value), mobile: /mobile/i.test(x.Type || '') }));
      return { name: norm(c.Name), phones };
    };
    const pickNumbers = phones => {
      const mobiles = phones.filter(p => p.mobile);
      if (allMobiles) return { nums: Array.from(new Set(mobiles.map(p => p.num))), note: '' };
      if (!phones.length) return { nums: [], note: '' };
      if (phones[0].mobile) return { nums: [phones[0].num], note: '' };
      if (mobiles.length) return { nums: [mobiles[0].num], note: ' (primary is a landline, used their mobile)' };
      return { nums: [], note: '' };
    };
    // The conversation for one number, once its messages have loaded.
    const chatFor = num => {
      const b = document.querySelector(BOX);
      if (!b || !visible(b)) return null;
      const v = vmOf(b);
      if (!v || last10(un(v.ContactNumber)) !== num) return null;
      if (un(v.LoadingMessages) || un(v.HasFetchedMessagePage) === false) return null;
      return { box: b, vm: v };
    };
    const openChat = async (num, jobId) => {
      const want = '#/ChatCenter/' + num;
      if (location.hash.split('?')[0] === want) { location.hash = '#/DispatchBoard'; await wait(800); }
      location.hash = want + (jobId ? '?jobid=' + jobId : '');
      const c = await until(() => chatFor(num), 15000, 250);
      if (!c) return null;
      await wait(400);   // let the message history settle
      return chatFor(num);
    };
    const messagesOf = v => {
      const days = toJS(un(v.MessagesByDay)) || [];
      const out = [];
      days.forEach(d => (d && d.Messages || []).forEach(m => out.push(m)));
      return out;
    };
    const timeOf = m => { const t = new Date(m.CreatedOn).getTime(); return isFinite(t) ? t : 0; };
    const STOP_WORDS = /^(stop|stop all|stopall|unsubscribe|cancel|end|quit|stop texting( me)?|remove me)[.!]*$/i;
    const START_WORDS = /^(start|unstop|yes)[.!]*$/i;
    const optedOut = list => {
      let out = false;
      list.filter(m => m.IsInbound).sort((a, b) => timeOf(a) - timeOf(b)).forEach(m => {
        const b = norm(m.Body);
        if (STOP_WORDS.test(b)) out = true; else if (START_WORDS.test(b)) out = false;
      });
      return out;
    };
    // The folder's repeat rule: was this customer texted (or sent this same text) recently?
    const recentText = (list, f, text) => {
      if (!f.days) return null;
      const since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - (f.days - 1));
      // Automatic notifications and texts that failed to send don't count.
      const hit = list.filter(m => m.IsOutbound && !m.IsNotification && !m.SmsSendErrorCode && !m.HasNotBeenDelivered && timeOf(m) >= since.getTime() &&
        (!f.same || norm(m.Body) === norm(text))).sort((a, b) => timeOf(b) - timeOf(a))[0];
      return hit ? new Date(timeOf(hit)) : null;
    };
    const ago = d => { const days = Math.floor((Date.now() - d.getTime()) / 86400000); return days < 1 ? 'today' : days === 1 ? 'yesterday' : days + ' days ago'; };
    const outCount = (v, text) => messagesOf(v).filter(m => m.IsOutbound && norm(m.Body) === norm(text)).length;
    const typeIn = (c, text) => {
      const box = c.box;
      box.focus();
      if (!(document.execCommand && document.execCommand('insertText', false, text) && box.value === text)) {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(box, text);
        box.dispatchEvent(new Event('input', { bubbles: true }));
      }
      box.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof c.vm.ResponseText === 'function' && un(c.vm.ResponseText) !== text) c.vm.ResponseText(text);
      return box.value === text && (typeof c.vm.ResponseText !== 'function' || un(c.vm.ResponseText) === text);
    };
    const clearIn = c => {
      if (!c || !c.box) return;
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(c.box, '');
      c.box.dispatchEvent(new Event('input', { bubbles: true }));
      c.box.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof c.vm.ResponseText === 'function') c.vm.ResponseText('');
    };
    // ServiceTitan's chat data (no page): raw messages turned into the same shape the Chat
    // Center page uses, so the same rules work on both.
    // Automatic messages, exactly as the Chat Center page decides it: the ones we sent of these
    // kinds. Texts a tech sends from his phone, and replies from customers, are not automatic.
    const AUTO_KINDS = [['BookingConfirmation', 6], ['JobReminder', 7], ['DispatchNotification', 8], ['JobCompletionSurvey', 9],
      ['AppointmentConfirmationResponse', 14], ['Autoresponder', 16], ['SmsCampaign', 21]];
    const codes = () => ({
      out: st.code('SmsDirection', 'Outbound', 1),
      auto: new Set(AUTO_KINDS.map(k => st.code('SmsChannel', k[0], k[1]))),
      unread: st.code('ChatThreadReadStatus', 'Unread', -10),
      blocked: st.code('ChatThreadBlockedStatus', 'Blocked', 10),
      sendErr: st.code('SmsDeliveryStatus', 'SmsSendingError', 1),
      deliveryErr: st.code('SmsDeliveryStatus', 'SmsDeliveryError', 2)
    });
    const asPageMsgs = (raw, c) => raw.map(m => {
      const outbound = m.SmsDirection === c.out;
      return {
        Body: m.Body, CreatedOn: m.CreatedOn, SmsId: m.SmsId,
        IsOutbound: outbound, IsInbound: !outbound,
        // Reminders, confirmations, surveys and the like are automatic, not texts from us.
        IsNotification: outbound && c.auto.has(m.Channel),
        SmsSendErrorCode: m.SmsSendErrorCode || 0,
        HasNotBeenDelivered: m.SmsDeliveryStatus === c.sendErr || m.SmsDeliveryStatus === c.deliveryErr
      };
    });
    // One number, checked from the chat data: { ok } or { skip: reason, kind }.
    const checkNumber = async (num, f, text) => {
      const c = codes();
      const t = await st.chatThread(num);
      if (!t) return { ok: true };   // never texted before
      if (t.BlockedStatus === c.blocked) return { skip: 'blocked in ServiceTitan (opted out)', kind: 'skipped' };
      if (t.ReadStatus === c.unread) return { skip: 'they have an unread reply. Read it first', kind: 'look' };
      const hist = asPageMsgs(await st.chatMessages(t.ThreadId, 100), c);
      if (optedOut(hist)) return { skip: 'they replied STOP', kind: 'skipped' };
      const recent = recentText(hist, f, text);
      if (recent) return { skip: (f.same ? 'got this message ' : 'texted ') + ago(recent), kind: 'skipped' };
      return { ok: true };
    };
    // Everyone in the list, checked a few at a time: who gets a text and who's skipped (and why).
    const plan = async (list, f, tmpl, progress) => {
      const results = await st.pool(list, 4, async r => {
        if (uses(tmpl, 'tech') && !r.tech) return { skips: [{ why: 'no tech on the board for {tech}', kind: 'skipped' }] };
        const info = await billTo(r.jobId);
        const name = info.name || r.customer;
        const pickN = pickNumbers(info.phones);
        if (!pickN.nums.length) return { info, skips: [{ why: 'no mobile number on the Bill To', kind: 'skipped' }] };
        if (uses(tmpl, 'first') && !firstWord(name)) return { info, skips: [{ why: 'no customer name for {first}', kind: 'skipped' }] };
        const text = fill(tmpl, { first: titleCase(firstWord(name)), tech: r.tech });
        const nums = await Promise.all(pickN.nums.map(async num => {
          if (never.indexOf(num) > -1) return { num, skip: 'on your 🚫 never-text list', kind: 'skipped' };
          // If the chat data can't be read, the conversation's own page is checked during the run.
          try { return Object.assign({ num }, await checkNumber(num, f, text)); }
          catch (e) { return { num, ok: true, unchecked: errText(e) }; }
        }));
        return { info, text, note: pickN.note, nums };
      }, progress);
      const sends = [], skips = [], seen = new Set();
      list.forEach((r, i) => {
        const x = results[i] || {};
        if (x.error) { skips.push({ r, num: '', why: errText(x.error), kind: 'problem' }); return; }
        if (x.info && !r.customer) r.customer = x.info.name;
        (x.skips || []).forEach(k => skips.push(Object.assign({ r, num: '' }, k)));
        (x.nums || []).forEach(n => {
          if (n.skip) { skips.push({ r, num: n.num, why: n.skip, kind: n.kind }); return; }
          if (seen.has(n.num)) { skips.push({ r, num: n.num, why: 'same number as another customer in this run (texted once)', kind: 'skipped' }); return; }
          seen.add(n.num);
          sends.push({ r, num: n.num, text: x.text, note: x.note, unchecked: n.unchecked || '' });
        });
      });
      return { sends, skips };
    };

    // True once our text shows in the conversation as sent and the box has emptied.
    const wentOut = (num, text, before) => {
      const c = chatFor(num);
      if (!c) return null;
      if (un(c.vm.SubmittingResponseInProgress)) return null;
      if (norm(c.box.value) !== '') return null;
      const mine = messagesOf(c.vm).filter(m => m.IsOutbound && norm(m.Body) === norm(text));
      return mine.length > before ? mine[mine.length - 1] : null;
    };

    // ---------- The run ----------
    const go = async () => {
      if (running || !planned) return;
      const sends = planned.sends;
      if (!sends.length) return;
      if (mode === 'auto' && confInput.value.trim() !== String(sends.length)) {
        if (confAsk.firstChild) confAsk.firstChild.textContent = '⚠️ That number doesn\'t match. Type ' + sends.length + ' to send ' + s1(sends.length, 'text') + ':';
        return;
      }
      if (lock) { sub('main'); return say('Wait for ' + lock + ' to finish first.'); }
      const f = curFolder(), m = curMsg();
      if (!m) { sub('main'); return; }
      running = true; stopRun = false; lock = TOOL;
      const auto = mode === 'auto';
      const home = onBoard() ? location.hash : '#/DispatchBoard';
      runLog.textContent = ''; runMsg.textContent = '';
      stopBtn.disabled = false; stopBtn.textContent = 'Stop'; stopBtn.style.display = 'inline-block';
      doneBtn.style.display = 'none'; copyBtn.textContent = 'Copy results';
      sub('run');
      add((auto ? 'Auto-send' : 'Type only') + ' · ' + f.name + ' · "' + m[0] + '" · ' + s1(planned.customers, 'customer') + ' checked, ' + s1(sends.length, 'text') + ' to send');
      const tally = {}, look = [];
      let failsInRow = 0;
      const out = (r, num, text, kind) => {
        tally[kind] = (tally[kind] || 0) + 1;
        add('#' + r.jobId + ' ' + (r.customer || '') + (num ? ' ' + showNum(num) : '') + ': ' + text);
        if (kind === 'problem' || kind === 'look') look.push('#' + r.jobId + ' ' + (r.customer || '') + ': ' + text);
      };
      if (planned.skips.length) {
        add('Skipped before starting:');
        planned.skips.forEach(x => out(x.r, x.num, 'skipped: ' + x.why, x.kind));
        add('');
      }
      // A few seconds after each text, ServiceTitan's chat data says whether it really went out.
      // That's checked in the background so the next text doesn't have to wait for it.
      const checks = [];
      const failed = (r, num, code) => {
        tally.sent = Math.max(0, (tally.sent || 0) - 1);
        out(r, num, 'ServiceTitan says it failed to send (code ' + (code || '?') + ')', 'problem');
        failsInRow++;
        if (failsInRow >= 3 && !stopRun) { add('3 failures in a row. Stopped to be safe.'); stopRun = true; }
      };
      const deliveryCheck = (r, num, text, sentAt) => {
        checks.push((async () => {
          await wait(4000);
          try {
            const t = await st.chatThread(num);
            if (!t) return;
            const mine = asPageMsgs(await st.chatMessages(t.ThreadId, 10), codes())
              .filter(x => x.IsOutbound && norm(x.Body) === norm(text) && timeOf(x) >= sentAt - 120000)
              .sort((a, z) => timeOf(z) - timeOf(a))[0];
            if (!mine) return;
            if (mine.SmsSendErrorCode || mine.HasNotBeenDelivered) failed(r, num, mine.SmsSendErrorCode);
            else failsInRow = 0;
          } catch (e) { /* the result just isn't known; the text did leave the Chat Center */ }
        })());
      };
      try {
        for (let n = 0; n < sends.length; n++) {
          if (stopRun) { add('Stopped. ' + s1(sends.length - n, 'text') + ' not sent.'); break; }
          const x = sends[n], r = x.r, num = x.num, text = x.text;
          runMsg.textContent = (auto ? 'Texting ' : 'Typing ') + (n + 1) + ' of ' + sends.length + ': ' + (r.customer || '#' + r.jobId);
          // A quick fresh look (no page): anything new since the check, like a reply or a STOP?
          if (!x.unchecked) {
            let fresh = null;
            try { fresh = await checkNumber(num, f, text); } catch (e) { /* the page's own checks below still run */ }
            if (fresh && fresh.skip) { out(r, num, 'skipped: ' + fresh.skip, fresh.kind); continue; }
          }
          const c = await openChat(num, r.jobId);
          if (!c) {
            if (!document.querySelector(BOX)) {
              health.flag(TOOL, 'the Chat Center\'s message box didn\'t show up', BOX);
              out(r, num, 'stopped: the Chat Center didn\'t open.', 'problem');
              add('Stopped the run.' + CHANGED);
              stopRun = true; break;
            }
            out(r, num, 'skipped: the conversation didn\'t load', 'problem'); continue;
          }
          // The same checks again on the open conversation, as a last guard.
          const hist = messagesOf(c.vm);
          if (optedOut(hist)) { out(r, num, 'skipped: they replied STOP', 'skipped'); continue; }
          if (un(c.vm.IsUnread)) { out(r, num, 'skipped: they have an unread reply. Read it first', 'look'); continue; }
          const recent = recentText(hist, f, text);
          if (recent) { out(r, num, 'skipped: ' + (f.same ? 'got this message ' : 'texted ') + ago(recent), 'skipped'); continue; }
          if (norm(c.box.value) || norm(un(c.vm.ResponseText))) { out(r, num, 'skipped: the message box already had unsent text', 'problem'); continue; }
          const before = outCount(c.vm, text);
          if (!typeIn(c, text)) {
            clearIn(c);
            health.flag(TOOL, 'the Chat Center\'s message box won\'t take typed text', BOX);
            out(r, num, 'stopped: could not type the message.', 'problem');
            add('Stopped the run.' + CHANGED);
            stopRun = true; break;
          }
          health.clear(TOOL);

          if (!auto) {
            // Wait for the person to press Send (noticed automatically), or Next / Skip / Stop.
            let watch = true;
            const watcher = (async () => {
              while (watch) { if (wentOut(num, text, before)) return 'sent'; await wait(300); }
              return null;
            })();
            const ans = await Promise.race([
              askStep('Typed to ' + (r.customer || 'customer') + ' ' + showNum(num) + '. Press Send in the chat. It moves on by itself once it\'s sent (or press Next if you changed the text first).', [['Next', 'next', PRIMARY], ['Skip', 'skip'], ['Stop', 'stop']]),
              watcher
            ]);
            watch = false;
            if (stepResolve) stepResolve(null);
            if (ans === 'sent') { out(r, num, 'sent by you' + x.note, 'sent'); deliveryCheck(r, num, text, Date.now()); await wait(300); continue; }
            const cNow = chatFor(num);
            if (ans === 'next') {
              if (cNow && norm(cNow.box.value)) { out(r, num, 'not sent? the text is still in the box', 'problem'); continue; }
              out(r, num, 'sent by you' + x.note, 'sent'); continue;
            }
            if (cNow && norm(cNow.box.value) === norm(text)) clearIn(cNow);
            if (ans === 'stop') { stopRun = true; add('Stopped. ' + s1(sends.length - n, 'text') + ' not sent.'); break; }
            out(r, num, 'skipped by you (text cleared)', 'skipped');
            continue;
          }

          // Auto-send: last checks, press Send, then make sure it left the Chat Center.
          const c2 = chatFor(num);
          const form = c2 && c2.box.closest('form');
          const send = form && Array.from(form.querySelectorAll('button[type="submit"], button')).find(bt => visible(bt) && /^\s*send\s*$/i.test(bt.innerText || ''));
          if (!c2 || c2.box !== c.box || norm(c2.box.value) !== norm(text) || !send) {
            if (c2 && norm(c2.box.value) === norm(text)) clearIn(c2);
            if (!send && c2) { health.flag(TOOL, 'can\'t find the Send button in the Chat Center', 'form button "Send"'); out(r, num, 'stopped: no Send button. Nothing sent.', 'problem'); add('Stopped the run.' + CHANGED); stopRun = true; break; }
            out(r, num, 'skipped: final check failed, nothing sent', 'problem'); continue;
          }
          const sentAt = Date.now();
          send.click();
          const sent = await until(() => wentOut(num, text, before), 15000, 300);
          if (!sent) {
            out(r, num, 'NOT CONFIRMED: it may not have sent. Stopping to be safe.', 'problem');
            stopRun = true; break;
          }
          if (sent.SmsSendErrorCode || sent.HasNotBeenDelivered) { tally.sent = (tally.sent || 0) + 1; failed(r, num, sent.SmsSendErrorCode); }
          else { out(r, num, 'sent' + x.note, 'sent'); deliveryCheck(r, num, text, sentAt); }
          await wait(300);
        }
        // Give the last few background checks a moment to come back.
        if (checks.length) { runMsg.textContent = 'Checking the last texts went out…'; await Promise.race([Promise.all(checks), wait(8000)]); }
        const summary = Object.keys(tally).filter(k => tally[k]).map(k => tally[k] + ' ' + k).join(', ') || 'nothing done';
        if (look.length) { add(''); add('Needs a look:'); look.forEach(z => add('• ' + z)); }
        runMsg.textContent = 'Done: ' + summary + '.';
      } catch (e) {
        runMsg.textContent = '⚠️ Stopped by an error: ' + errText(e);
      } finally {
        if (stepResolve) stepResolve('stop');
        if (location.hash !== home) { location.hash = home; await wait(800); }
        running = false; lock = null; planned = null;
        stopBtn.style.display = 'none'; doneBtn.style.display = 'inline-block';
      }
    };

    textsPane.appendChild(pane);
    sub('main');
    return {
      refresh: () => { if (!running) { sub('main'); renderMain(); } },
      leave: () => { checkId++; picker.setPicking(false); },
      isRunning: () => running,
      stop: requestStop,
      cleanup: () => picker.cleanup()
    };
  })();

  // ===================================================================
  // Moving, resizing, minimizing, closing, and starting up
  // The panel hangs from the screen edge it's nearest to (top or bottom), so it grows away from
  // that edge and never runs off the screen. Its place, size and minimized state are remembered.
  // ===================================================================
  const M = 8;                              // gap kept between the panel and the window's edge
  const W0 = 300, MIN_W = 260, MIN_H = 160; // normal width; smallest size the corner can drag to
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  let size = (() => { const s = (get('stSize') || '').split(',').map(Number); return { w: s[0] > 0 ? s[0] : 0, h: s[1] > 0 ? s[1] : 0 }; })();
  // Where it sits: { x, top } or { x, bottom } (px from that edge). null = bottom-right corner.
  let spot = (() => {
    const p = (get('stPos') || get('qnPos') || '').split(',').map(Number);
    if (p.length !== 2 || !p.every(n => isFinite(n))) return null;
    const d = get('stDock') || '';
    if (/^b:\d+$/.test(d)) return { x: p[0], bottom: Number(d.slice(2)) };
    return { x: p[0], top: p[1], old: d !== 't' };   // old: saved by an older version (top-left corner)
  })();
  let minimized = get('stMin') === '1';
  const place = () => {
    const W = innerWidth, H = innerHeight;
    const w = Math.min(Math.max(size.w || W0, MIN_W), Math.max(200, W - 2 * M));
    panel.style.width = w + 'px';
    panel.style.left = clamp(spot ? spot.x : W - w - 16, M, Math.max(M, W - w - M)) + 'px';
    panel.style.right = 'auto';
    const keep = Math.min(240, H - 2 * M);   // always leave at least this much height to show
    let roomH;
    if (spot && spot.top != null) {
      const y = clamp(spot.top, M, Math.max(M, H - M - keep));
      panel.style.top = y + 'px'; panel.style.bottom = 'auto';
      roomH = H - y - M;
    } else {
      const b = clamp(spot ? spot.bottom : 16, M, Math.max(M, H - M - keep));
      panel.style.bottom = b + 'px'; panel.style.top = 'auto';
      roomH = H - b - M;
    }
    panel.style.maxHeight = roomH + 'px';
    const h = size.h && !minimized ? Math.min(Math.max(size.h, MIN_H), roomH) : 0;
    panel.style.height = h ? h + 'px' : '';
    panel.style.setProperty('--st-h', (h || roomH) + 'px');
  };
  const saveSpot = () => {
    const r = panel.getBoundingClientRect();
    set('stPos', Math.round(r.left) + ',' + Math.round(r.top));
    set('stDock', spot.top != null ? 't' : 'b:' + Math.round(spot.bottom));
  };
  // Hang from the nearer edge (when it's about the same, keep the edge it had).
  const dockNearest = () => {
    const r = panel.getBoundingClientRect(), H = innerHeight;
    const up = r.top, down = H - r.bottom;
    const wasTop = !!(spot && spot.top != null);
    const top = Math.abs(up - down) < 60 ? wasTop : up < down;
    spot = top ? { x: Math.round(r.left), top: Math.round(r.top) } : { x: Math.round(r.left), bottom: Math.round(down) };
    saveSpot();
  };
  const onResize = () => place();
  window.addEventListener('resize', onResize);

  // Move: drag the title bar.
  header.addEventListener('mousedown', e => {
    if (e.button !== 0 || (e.target.closest && e.target.closest('button'))) return;
    e.preventDefault();
    const r = panel.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    let moved = false;
    const move = ev => {
      if (!moved && Math.abs(ev.clientX - e.clientX) + Math.abs(ev.clientY - e.clientY) < 3) return;
      if (!moved) { moved = true; panel.style.top = r.top + 'px'; panel.style.bottom = 'auto'; }   // held by its top-left corner while moving
      panel.style.left = clamp(ev.clientX - dx, M, Math.max(M, innerWidth - r.width - M)) + 'px';
      panel.style.top = clamp(ev.clientY - dy, M, Math.max(M, innerHeight - r.height - M)) + 'px';
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      if (moved) { dockNearest(); place(); }
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });

  // Resize: drag the bottom-right corner. Double-click it to go back to the normal size.
  grip.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const r = panel.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
    const maxW = Math.max(MIN_W, innerWidth - r.left - M), maxH = Math.max(MIN_H, innerHeight - r.top - M);
    let w = r.width, h = r.height, moved = false;
    const move = ev => {
      if (!moved && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 3) return;
      if (!moved) { moved = true; panel.style.top = r.top + 'px'; panel.style.bottom = 'auto'; panel.style.maxHeight = maxH + 'px'; }
      w = clamp(r.width + ev.clientX - sx, MIN_W, maxW);
      h = clamp(r.height + ev.clientY - sy, MIN_H, maxH);
      panel.style.width = w + 'px'; panel.style.height = h + 'px';
      panel.style.setProperty('--st-h', h + 'px');
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      if (!moved) return;
      size = { w: Math.round(w), h: Math.round(h) };
      set('stSize', size.w + ',' + size.h);
      // Stay hung from the same edge.
      const b = panel.getBoundingClientRect();
      spot = spot && spot.top != null ? { x: Math.round(b.left), top: Math.round(b.top) } : { x: Math.round(b.left), bottom: Math.round(innerHeight - b.bottom) };
      saveSpot();
      place();
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });
  grip.addEventListener('dblclick', () => { size = { w: 0, h: 0 }; set('stSize', ''); place(); });

  // Minimize: just the title bar shows (runs keep going). – or double-click the title bar.
  const setMin = on => {
    minimized = !!on;
    panel.classList.toggle('st-min', minimized);
    minBtn.textContent = minimized ? '▢' : '–';
    minBtn.title = minimized ? 'Restore' : 'Minimize (double-click the title bar works too)';
    set('stMin', minimized ? '1' : '0');
    place();
  };
  minBtn.onclick = () => setMin(!minimized);
  header.addEventListener('dblclick', e => { if (!(e.target.closest && e.target.closest('button'))) setMin(!minimized); });
  // Picking a tool while minimized opens the panel back up.
  homeBtn.addEventListener('click', () => { if (minimized) setMin(false); });

  // Keeps the tabs in step with runs (a running tool locks the others).
  const navTimer = setInterval(syncNav, 400);

  // Closing while a tool is running (Job Notifications, Tech Messages, Business Unit or Customer Texts) would
  // hide the panel but leave the run going in the background. So ask first, stop the run, then close.
  const closeBar = el('div', 'display:none;padding:8px 12px;background:#fdecec;color:#7a1010;font-size:12px;border-bottom:1px solid #e0a0a8;flex:none');
  const closeText = el('div', 'margin-bottom:6px');
  const closeBtns = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
  closeBar.append(closeText, closeBtns);
  header.after(closeBar);
  let closing = false;
  const finishClose = () => {
    PRESS_EVENTS.forEach(t => window.removeEventListener(t, pressGuard, true));
    window.removeEventListener('resize', onResize);
    clearInterval(navTimer);
    notes.cleanup();
    notify.cleanup();
    msgs.cleanup();
    biz.cleanup();
    texts.cleanup();
    panel.remove();
    delete window.__stToolbox;
  };
  const close = () => {
    const runners = [[notify, 'Job Notifications'], [msgs, 'Tech Messages'], [biz, 'Business Unit'], [texts, 'Customer Texts']];
    const found = runners.find(r => r[0].isRunning());
    if (!found) return finishClose();
    if (closing) return;
    const runner = found[0];
    closeText.textContent = found[1] + ' is still running. Closing now would leave it running out of sight.';
    closeBtns.textContent = '';
    closeBtns.append(
      smallBtn('Stop it and close', async () => {
        closing = true;
        closeBtns.textContent = '';
        closeText.textContent = 'Stopping, then closing...';
        runner.stop();
        await until(() => !runners.some(r => r[0].isRunning()), 60000, 250);
        finishClose();
      }, DANGER),
      smallBtn('Keep running', () => { closeBar.style.display = 'none'; })
    );
    closeBar.style.display = 'block';
  };
  closeX.onclick = close;
  window.__stToolbox = { version: VERSION, close };

  document.body.appendChild(panel);
  setMin(minimized);
  const startView = get('stView');
  showView(['notes', 'jobs', 'msgs', 'biz', 'texts'].indexOf(startView) > -1 ? startView : 'menu');
  // A place saved by an older version was the top-left corner: from now on, hang from the nearer edge.
  if (spot && spot.old) { dockNearest(); place(); }
  health.checkBoard(false);
})();
