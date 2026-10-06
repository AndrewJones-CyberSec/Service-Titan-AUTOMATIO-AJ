/*
  ServiceTitan Toolbox
  ====================
  One panel with three tools for the ServiceTitan Dispatch board:
    - Notes: adds a ready-made note (sorted into folders) to a job's customer in one click.
    - Job Notifications: checks or turns off job notifications for one tech's jobs.
    - Tech Messages: sends a saved message (Good Morning, ETA, ...) to everyone working or the techs you pick.

  HOW TO RELEASE AN UPDATE
    1. Edit this file on GitHub.
    2. Change VERSION below (1.0 -> 1.1, and so on) and add a line to WHATS_NEW.
    3. Commit. Everyone gets the new version the next time they click the bookmark
       (GitHub can take a few minutes to publish it).

  Each person's edited notes, messages and safety settings are saved in their own browser,
  so updates never wipe them.
*/
(() => {
  const VERSION = '1.4';
  const WHATS_NEW = {
    '1.4': 'Tech Messages: pick 🚚 Working (everyone with jobs on the board) or 👤 Picked under "Send to", and each message can remember which one it starts on. "🛡️ excluded" shows who your safety settings leave out, and why.',
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
  // Panel shell: header and the main menu
  // ===================================================================
  const panel = el('div', 'position:fixed;right:16px;bottom:16px;z-index:2147483647;width:290px;max-width:calc(100vw - 32px);' +
    'background:#fff;color:#111;border:1px solid #888;border-radius:10px;box-shadow:0 5px 20px rgba(0,0,0,.3);' +
    'font:13px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden;text-align:left');
  panel.id = ID;
  const pos = (get('stPos') || get('qnPos') || '').split(',').map(Number);
  if (pos.length === 2 && pos.every(n => isFinite(n))) {
    panel.style.left = Math.min(Math.max(0, pos[0]), innerWidth - 120) + 'px';
    panel.style.top = Math.min(Math.max(0, pos[1]), innerHeight - 60) + 'px';
    panel.style.right = panel.style.bottom = 'auto';
  }

  const header = el('div', 'padding:10px 12px;font-weight:700;background:#222;color:#fff;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none');
  const titleWrap = el('span', 'display:flex;align-items:baseline;gap:6px');
  const titleText = el('span', '', '🧰 Toolbox');
  titleWrap.append(titleText, el('span', 'font-weight:400;font-size:11px;opacity:.7', 'v' + VERSION));
  const closeX = el('span', 'cursor:pointer;padding:0 4px', '✕');
  closeX.title = 'Close';
  header.append(titleWrap, closeX);

  // "What's new" line, shown once after an update.
  const news = el('div', 'display:none;padding:7px 12px;background:#e8f4ea;color:#1b5e20;font-size:12px;border-bottom:1px solid #cfe5d2');
  const lastSeen = get('stSeenVersion');
  if (lastSeen !== VERSION) {
    news.textContent = (lastSeen ? '✨ Updated to v' + VERSION + ': ' : '✨ ') + (WHATS_NEW[VERSION] || 'New version.');
    news.style.display = 'block';
    set('stSeenVersion', VERSION);
    setTimeout(() => { news.style.display = 'none'; }, 12000);
  }

  // ===================================================================
  // Board reader: the one place that reads the Dispatch board for every tool.
  // Read-only: it only looks at what ServiceTitan is already showing. It never clicks,
  // scrolls or changes anything. It keeps only what the tools need: each tech's ID, name,
  // team and job IDs, whether a board filter is hiding them, and the day the board shows.
  // No customer names, addresses or phone numbers.
  // ===================================================================
  const board = (() => {
    const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
    // Each tech's team, remembered whenever the team headers are showing. A team or people
    // filter hides the headers, so then the remembered team is used (added in 1.2.3; the
    // storage name is unchanged so the teams people already learned carry over).
    const TEAM_KEY = 'stMsgTeamMap';
    let teamMap = (() => {
      try { const v = JSON.parse(get(TEAM_KEY)); if (v && typeof v === 'object' && !Array.isArray(v)) return v; } catch (e) {}
      return {};
    })();
    // ServiceTitan puts each team's rows in a .team-container, with the team's name in a
    // .team-name header somewhere before it (not always the element right before it).
    const liveTeamOf = id => {
      const row = document.getElementById('team-timeline-row-' + id);
      const tc = row && row.closest('.team-container');
      let h = tc && tc.previousElementSibling;
      while (h && !h.querySelector('.team-name')) h = h.previousElementSibling;
      const tn = h && h.querySelector('.team-name');
      return tn ? norm(tn.textContent) : null;
    };
    // The day the board is showing, e.g. "Tue, Oct 6, 2026", or null if it can't be read.
    // Only ServiceTitan's part of the page is read: the Toolbox's own results can contain dates.
    const DATE_RE = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun), [A-Z][a-z]{2} \d+, \d{4}/;
    const date = () => {
      for (const c of Array.from(document.body.children)) {
        if (c.id === ID || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|LINK|META)$/.test(c.tagName) || !visible(c)) continue;
        const m = (c.innerText || '').match(DATE_RE);
        if (m) return m[0];
      }
      return null;
    };
    // True if `day` (a board date like "Tue, Oct 6, 2026") is today on this computer.
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const isToday = day => {
      const m = String(day || '').match(/, ([A-Z][a-z]{2}) (\d+), (\d{4})/);
      if (!m) return false;
      const d = new Date();
      return MONTHS.indexOf(m[1]) === d.getMonth() && +m[2] === d.getDate() && +m[3] === d.getFullYear();
    };
    // One tech's job IDs (light enough to call over and over while waiting for the board).
    const jobsFor = techId => {
      const ids = new Set();
      document.querySelectorAll('a.appointment[data-technician-id="' + techId + '"][data-job-id]').forEach(a => ids.add(a.getAttribute('data-job-id')));
      return Array.from(ids);
    };
    // A fresh look at the whole board. Returns
    //   { date, at, techs: Map(id -> { id, name, named, team, jobIds, jobs, hidden }), jobs, filtered }
    // `hidden`: a board filter is hiding this tech right now (scrolled out of view is NOT hidden).
    // `named`: the name came from the tech's .name tag (not a fallback).
    const read = () => {
      // Job IDs per tech in one pass over the job bubbles (instead of one search per tech).
      // A board filter can leave hidden copies of things on the page, so IDs are de-duplicated.
      const jobMap = new Map();
      document.querySelectorAll('a.appointment[data-technician-id][data-job-id]').forEach(a => {
        const id = a.getAttribute('data-technician-id');
        if (!jobMap.has(id)) jobMap.set(id, new Set());
        jobMap.get(id).add(a.getAttribute('data-job-id'));
      });
      const techs = new Map();
      let learned = false, jobs = 0, filtered = false;
      document.querySelectorAll('.technician[data-technician-id]').forEach(t => {
        const id = t.getAttribute('data-technician-id');
        const showing = techShowing(t);
        // A board filter can leave a hidden copy of a tech next to the one that's showing.
        const have = techs.get(id);
        if (have) { if (showing) have.hidden = false; return; }
        const n = t.querySelector('.name');
        const name = n ? norm(n.textContent) : norm((t.textContent || '').trim().split('\n')[0]);
        if (!id || !name) return;
        const live = liveTeamOf(id);
        if (live && teamMap[id] !== live) { teamMap[id] = live; learned = true; }
        const team = live || (typeof teamMap[id] === 'string' ? teamMap[id] : null);
        const jobIds = Array.from(jobMap.get(id) || []);
        techs.set(id, { id, name, named: !!n, team, jobIds, jobs: jobIds.length, hidden: !showing });
      });
      techs.forEach(t => { jobs += t.jobs; if (t.hidden) filtered = true; });
      if (learned) set(TEAM_KEY, JSON.stringify(teamMap));
      // The date is only read if asked for (reading it makes the browser lay out the page).
      let day;
      return { get date() { if (day === undefined) day = date(); return day; }, at: Date.now(), techs, jobs, filtered };
    };
    return { read, date, isToday, jobsFor, knownTeams: () => Object.keys(teamMap).length };
  })();

  // ===================================================================
  // Health check: notices when ServiceTitan has changed something a tool relies on,
  // and says so in a yellow bar instead of failing quietly.
  // ===================================================================
  const health = (() => {
    const issues = new Map();   // key -> { tool, what, detail }
    const bar = el('div', 'display:none;padding:7px 12px;background:#fff4e5;color:#6b3f00;font-size:12px;border-bottom:1px solid #f0d3a6');
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
          const knownTeams = board.knownTeams();
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

  // Same look as the note buttons.
  const menuBtn = (label, onClick) => {
    const b = el('button', FULL + 'margin:5px 0;padding:8px 9px;cursor:pointer;border:1px solid #aaa;' +
      'border-radius:6px;background:#f5f5f5;color:#111;text-align:left;font:inherit', label);
    b.type = 'button';
    b.addEventListener('mousedown', e => e.preventDefault());
    b.onmouseenter = () => { b.style.background = '#e8e8e8'; };
    b.onmouseleave = () => { b.style.background = '#f5f5f5'; };
    b.onclick = onClick;
    return b;
  };

  const menuPane = el('div', 'display:none;padding:8px 10px 10px');
  const menuMsg = el('div', 'font-size:12px;color:#444;margin-bottom:4px;min-height:16px', 'Pick a tool.');
  const notesPane = el('div', 'display:none');
  const jobsPane = el('div', 'display:none');
  const msgsPane = el('div', 'display:none');
  const views = { menu: menuPane, notes: notesPane, jobs: jobsPane, msgs: msgsPane };
  const TITLES = { menu: '🧰 Toolbox', notes: '📝 Notes', jobs: '🔕 Job Notifications', msgs: '💬 Tech Messages' };
  const showView = name => {
    Object.keys(views).forEach(k => { views[k].style.display = k === name ? 'block' : 'none'; });
    titleText.textContent = TITLES[name];
    set('stView', name);
    if (name !== 'notes' && typeof notes !== 'undefined') notes.leave();
    if (name === 'jobs' && typeof notify !== 'undefined') notify.refresh();
    if (name === 'msgs' && typeof msgs !== 'undefined') msgs.refresh();
  };

  menuPane.append(
    menuMsg,
    menuBtn('📝 Notes', () => showView('notes')),
    menuBtn('🔕 Job Notifications', () => showView('jobs')),
    menuBtn('💬 Tech Messages', () => showView('msgs'))
  );
  const checkRow = el('div', 'display:flex;justify-content:flex-end;margin-top:4px');
  checkRow.append(smallBtn('🩺 Check', () => health.checkBoard(true)));
  menuPane.appendChild(checkRow);
  panel.append(header, news, health.bar, menuPane, notesPane, jobsPane, msgsPane);

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
    const btnList = el('div', 'max-height:calc(100vh - 290px);overflow:auto');
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
        bottomRow.append(smallBtn('← Menu', () => showView('menu')), smallBtn('✏️ Edit folders', () => openFolderEditor()), backBtn);
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
      bottomRow.append(smallBtn('← Menu', () => showView('menu')), smallBtn('✏️ Edit notes', () => openEditor()), backBtn);
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
        say('⚠️ Error: ' + (e && e.message ? e.message : e));
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
    const showOnly = x => { [main, editor, folderEditor].forEach(v => { v.style.display = v === x ? 'block' : 'none'; }); };
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
    const ed = listEditor('note', 'Button name (e.g. 📞 No Answer)', 'Note text that gets typed in', 'calc(100vh - 300px)', { allowEmpty: true, rowExtra: moveTo });
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
    const fList = el('div', 'max-height:calc(100vh - 300px);overflow:auto;margin:0 -4px;padding:0 4px');
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
    // The board is read through the shared board reader (see "Board reader" near the top).
    const boardDate = () => board.date() || 'the day shown';
    const nameOf = id => { const t = board.read().techs.get(id); return t ? t.name : null; };
    const jobsFor = board.jobsFor;
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
    const navRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    navRow.append(smallBtn('← Menu', () => { if (!running) showView('menu'); }));
    wrap.append(msg, pickRow, actions, confirmBox, progress, navRow);
    jobsPane.appendChild(wrap);
    let running = false, stop = false;
    const add = s => { log.textContent += s + '\n'; log.scrollTop = log.scrollHeight; };
    const setEnabled = on => { [pick, refreshBtn, checkBtn, offBtn].forEach(x => { x.disabled = !on; x.style.opacity = on ? '1' : '.5'; }); };
    const refresh = keepMsg => {
      if (running) return;
      if (!onBoard()) {
        pick.textContent = '';
        setEnabled(false);
        say('Open the Dispatch board to use this.');
        return;
      }
      const prev = pick.value || get('stNotifyTech') || '';
      const snap = board.read();
      const day = snap.date || 'the day shown';
      const rows = [];
      snap.techs.forEach(t => { if (t.jobs) rows.push({ id: t.id, name: t.name, n: t.jobs }); });
      pick.textContent = '';
      if (!rows.length) {
        setEnabled(false);
        refreshBtn.disabled = false; refreshBtn.style.opacity = '1';
        say('No jobs on the board for ' + day + '. Press ↻ after the board finishes loading.');
        return;
      }
      rows.forEach(r => {
        const o = el('option', '', r.name + '  (' + r.n + ' job' + (r.n === 1 ? '' : 's') + ')');
        o.value = r.id;
        pick.appendChild(o);
      });
      if (rows.some(r => r.id === prev)) pick.value = prev;
      setEnabled(true);
      if (!keepMsg || !msg.textContent) say(day + ': ' + rows.length + ' tech' + (rows.length === 1 ? '' : 's') + ' with jobs.');
    };
    const askConfirm = () => {
      if (!pick.value) return;
      const n = jobsFor(pick.value).length;
      const name = nameOf(pick.value) || 'this tech';
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
      if (running || !pick.value) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      running = true; stop = false; lock = 'Job Notifications';
      setEnabled(false);
      confirmBox.style.display = 'none';
      log.textContent = '';
      progress.style.display = 'grid';
      stopBtn.disabled = false; stopBtn.textContent = 'Stop'; stopBtn.style.display = 'inline-block';
      copyBtn.textContent = 'Copy results';
      const techId = pick.value;
      set('stNotifyTech', techId);
      const techName = nameOf(techId) || 'Tech';
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
          let st = !!(first(IN) || {}).checked, calm = 0;
          for (let w = 0; calm < 3 && w < 3000; w += 250) {
            await wait(250);
            const c = !!(first(IN) || {}).checked;
            if (c === st) calm++; else { st = c; calm = 0; }
          }
          const inp = first(IN);
          if (!inp) return res(NO_SWITCH, 'problem');
          if (!inp.checked) return res('already off', 'already off');
          if (!real) return res('ON (left alone)', 'on');
          (first(LB) || inp).click();
          const off = await until(() => { const x = first(IN); return x && !x.checked; }, 4000, 250);
          if (!off) return res('FAILED, still on', 'problem');
          await wait(1500);
          const x = first(IN);
          if (x && x.checked) return res('FLIPPED BACK ON (save may have failed)', 'problem');
          return res('turned off', 'turned off');
        } catch (e) {
          return res('ERROR: ' + (e && e.message ? e.message : e), 'problem');
        }
      };
      try {
        say('Finding ' + techName + '\'s jobs...');
        const list = await collectJobs(techId);
        if (!list.length) { say('No jobs found for ' + techName + ' on ' + date + '.'); return; }
        add(date + ' - ' + techName + (real ? '' : ' (checking only, nothing changed)'));
        for (let n = 0; n < list.length; n++) {
          if (stop) { add('Stopped. ' + (list.length - n) + ' job(s) not checked.'); break; }
          const j = list[n];
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
        say('⚠️ Stopped by an error: ' + (e && e.message ? e.message : e));
      } finally {
        if (location.hash !== home) { location.hash = home; await wait(800); }
        running = false; lock = null;
        stopBtn.style.display = 'none';
        refresh(true);
      }
    };
    return { refresh, isRunning: () => running, stop: requestStop };
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
    // (Each tech's remembered team, stMsgTeamMap, now lives in the shared board reader.)
    // stMsgAudDefaults (added in 1.4) is kept apart from stMsgs on purpose: stMsgs stays the
    // same [name, text] list as always, so older versions and old saved lists keep working.
    const K = { msgs: 'stMsgs', teams: 'stMsgTeams', never: 'stMsgNever', sel: 'stMsgSel', mode: 'stMsgMode', jobsOnly: 'stMsgJobsOnly', pick: 'stMsgPick', audDefaults: 'stMsgAudDefaults' };
    const loadJSON = (k, d) => { try { const v = JSON.parse(get(k)); return v == null ? d : v; } catch (e) { return d; } };
    const validMsgs = v => Array.isArray(v) && v.length > 0 && v.every(n => Array.isArray(n) && n.length === 2 && typeof n[0] === 'string' && typeof n[1] === 'string');
    let list = (() => { const v = loadJSON(K.msgs, null); return validMsgs(v) ? v : DEFAULT_MSGS.map(n => n.slice()); })();
    // Who each message usually goes to: { "message name": "working" }. A message that isn't in
    // here goes to the techs you picked (how every message worked before 1.4).
    // Someone new to Tech Messages starts with Good Morning going to everyone working.
    const AUD_WORKING = 'working', AUD_PICKED = 'picked';
    const newToMessages = get(K.sel) == null && get(K.audDefaults) == null;
    let audDefaults = loadJSON(K.audDefaults, null);
    if (!audDefaults || typeof audDefaults !== 'object' || Array.isArray(audDefaults)) audDefaults = newToMessages ? { '☀️ Good Morning': AUD_WORKING } : {};
    const usualAud = name => Object.prototype.hasOwnProperty.call(audDefaults, name) && audDefaults[name] === AUD_WORKING ? AUD_WORKING : AUD_PICKED;
    const saveAudDefaults = () => set(K.audDefaults, JSON.stringify(audDefaults));
    // Save the starting choice right away, so it isn't decided again on the next visit.
    if (newToMessages) saveAudDefaults();
    // teamRules: { teamName: true (OK) | false (blocked) }, or null if never set up.
    // never: { techId: name }. selected: tech IDs picked last time.
    let teamRules = loadJSON(K.teams, null);
    let never = loadJSON(K.never, {});
    let selected = new Set(loadJSON(K.sel, []));
    let pickIdx = Math.max(0, Math.min(parseInt(get(K.pick) || '0', 10) || 0, list.length - 1));

    // ---- Reading the board ----
    // Comes from the shared board reader. Each tech's team is remembered from the unfiltered
    // board, so a team or people filter doesn't lose it. A tech the Toolbox has never seen with
    // a team can't be messaged until it has.
    // Only techs whose name comes from their .name tag are used here: the name is what's
    // checked against the message panel before anything is typed.
    const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
    const readBoard = () => {
      const snap = board.read();
      snap.techs.forEach((t, id) => { if (!t.named) snap.techs.delete(id); });
      return snap;
    };
    const boardTechs = () => readBoard().techs;
    const teamsOnBoard = () => Array.from(new Set(Array.from(boardTechs().values()).map(t => t.team || '(no team)')));
    const teamAllowed = team => !!(teamRules && team && teamRules[team] === true);
    const canMessage = t => !!t && teamAllowed(t.team) && !never[t.id];
    // Why the 🛡️ settings leave someone out (only asked about people canMessage says no to).
    const whyNot = t => never[t.id] ? 'never-message list'
      : !t.team ? 'team unknown (if a board filter is on, clear it once)'
      : teamRules && teamRules[t.team] === false ? 'team blocked: ' + t.team
      : 'new team, not approved yet: ' + t.team;
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
    const sub = name => { Object.keys(views).forEach(k => { views[k].style.display = k === name ? 'block' : 'none'; }); };
    const mkView = name => { views[name] = el('div', 'display:none'); pane.appendChild(views[name]); return views[name]; };
    const msgLine = () => el('div', 'font-size:12px;color:#444;margin-bottom:6px;min-height:16px;white-space:pre-wrap');
    const head = text => el('div', 'font-weight:700;margin-bottom:4px', text);
    const row = () => el('div', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px');
    const scrollBox = css => el('div', 'max-height:calc(100vh - 300px);overflow:auto;border:1px solid #ddd;border-radius:6px;padding:4px 6px;background:#fafafa;' + (css || ''));
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
    // "Send to": everyone working on the day the board shows, or the techs you picked.
    // Starts on the picked message's usual choice; clicking a button changes it for now.
    let audience = usualAud((list[pickIdx] || [''])[0]);
    const sendTo = el('div', 'margin-top:8px');
    const audHead = el('div', 'display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:700;letter-spacing:.06em;color:#666');
    const reread = smallBtn('↻', () => { emptyRetries = 0; say('Board read again.'); renderMain(); }, 'padding:1px 7px;font-size:12px');
    reread.title = 'Read the board again';
    audHead.append(el('span', '', 'SEND TO'), reread);
    const audRow = el('div', 'display:flex;gap:6px;margin-top:4px');
    const audBtn = onClick => {
      const b = el('button', 'flex:1;min-width:0;padding:6px;cursor:pointer;border:1px solid #aaa;border-radius:6px;background:#f5f5f5;color:#111;font:inherit;text-align:center');
      b.type = 'button';
      b.addEventListener('mousedown', e => e.preventDefault());
      b.onclick = onClick;
      b.top = el('div', 'font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis');
      b.sub = el('div', 'font-size:11px;color:#555;margin-top:1px');
      b.append(b.top, b.sub);
      return b;
    };
    const showAud = (b, on, top, sub, title) => {
      b.style.borderColor = on ? '#1a6ed8' : '#aaa';
      b.style.background = on ? '#e3eefc' : '#f5f5f5';
      b.style.boxShadow = on ? 'inset 0 -3px 0 #1a6ed8' : 'none';
      b.top.textContent = top; b.sub.textContent = sub; b.title = title;
    };
    const workingBtn = audBtn(() => { audience = AUD_WORKING; exclOpen = false; renderMain(); });
    const pickedBtn = audBtn(() => { audience = AUD_PICKED; exclOpen = false; if (!selected.size) return openPicker(); renderMain(); });
    audRow.append(workingBtn, pickedBtn);
    // Offers to make the current choice the message's usual one (also in ✏️ Edit messages).
    const usualBtn = smallBtn('', () => {
      const name = list[pickIdx][0];
      if (audience === AUD_WORKING) audDefaults[name] = AUD_WORKING; else delete audDefaults[name];
      const ok = saveAudDefaults();
      say(ok ? '✅ ' + name + ' will start on ' + (audience === AUD_WORKING ? '🚚 Working' : '👤 Picked') + ' from now on.' : '⚠️ Changed for now, but this browser wouldn\'t save it for next time.');
      renderMain();
    }, 'display:none;margin-top:5px;padding:0;border:none;background:none;color:#1a6ed8;text-decoration:underline;font-size:11px;text-align:left');
    const toLine = el('div', 'font-size:12px;margin-top:6px;padding:6px 8px;border:1px solid #ddd;border-radius:6px;background:#fafafa');
    const toText = el('div', '');
    // "🛡️ 3 excluded": who the safety settings leave out of this group, and why. Click to see.
    let exclOpen = false;
    const exclBtn = smallBtn('', () => { exclOpen = !exclOpen; renderMain(); }, 'display:none;margin-top:5px;padding:2px 7px;font-size:11px');
    const exclList = el('div', 'display:none;margin-top:4px;max-height:120px;overflow:auto;font-size:11px;color:#444');
    const boardNote = el('div', 'display:none;margin-top:5px;font-size:11px;color:#8a5a00;white-space:pre-wrap');
    toLine.append(toText, exclBtn, exclList, boardNote);
    sendTo.append(audHead, audRow, usualBtn, toLine);
    const modeRow = el('div', 'margin-top:8px;font-size:12px;display:grid;gap:2px');
    let mode = get(K.mode) === 'auto' ? 'auto' : 'type';
    const mkRadio = (val, label) => {
      const l = el('label', 'display:flex;gap:6px;align-items:center;cursor:pointer');
      const r = el('input'); r.type = 'radio'; r.name = 'st-msg-mode'; r.checked = mode === val;
      r.onchange = () => { mode = val; set(K.mode, val); renderMain(); };
      l.append(r, document.createTextNode(label));
      return l;
    };
    modeRow.append(mkRadio('type', 'Type only: I press Send for each person'), mkRadio('auto', 'Auto-send: sends to everyone in the To list'));
    const startBtn = smallBtn('Start', () => openConfirm(), PRIMARY + 'margin-top:8px;' + FULL + 'padding:8px');
    const mainNav = row();
    mainNav.append(
      smallBtn('← Menu', () => showView('menu')),
      smallBtn('👥 Choose techs', () => openPicker()),
      smallBtn('✏️ Edit messages', () => openEditor()),
      smallBtn('🛡️ Who can be messaged', () => openSafety())
    );
    vMain.append(mainMsg, msgList, sendTo, modeRow, startBtn, mainNav);

    // Who the chosen group sends to right now, read fresh from the board.
    //   people:   who would be messaged (allowed by 🛡️ and showing on the board), in board order
    //             for "working" and in the order picked for "picked"
    //   excluded: who the 🛡️ settings leave out of this group (shown with the reason)
    //   hiddenPicked: picked techs a board filter is hiding (can't be messaged until it's cleared)
    // Safety settings always win: nobody in `excluded` is ever sent to.
    const recipients = () => {
      const snap = readBoard();
      const all = Array.from(snap.techs.values());
      const working = all.filter(t => t.jobs > 0 && !t.hidden);
      const picked = Array.from(selected).map(id => snap.techs.get(id)).filter(Boolean);
      const pickedShowing = picked.filter(t => !t.hidden);
      const pool = audience === AUD_WORKING ? working : pickedShowing;
      return {
        snap,
        people: pool.filter(canMessage),
        excluded: pool.filter(t => !canMessage(t)),
        hiddenPicked: audience === AUD_PICKED ? picked.filter(t => t.hidden && canMessage(t)).length : 0,
        workingCount: working.filter(canMessage).length,
        pickedCount: pickedShowing.filter(canMessage).length
      };
    };
    // "Tue, Oct 6, 2026" -> "today", or "Oct 6" for another day (short enough for the button).
    const shortDay = d => !d ? '' : board.isToday(d) ? 'today' : d.replace(/^[A-Za-z]+, /, '').replace(/, \d{4}$/, '');
    const longDay = d => !d ? 'the day shown' : board.isToday(d) ? 'today (' + d + ')' : d;
    const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');
    let emptyRetries = 0, emptyTimer = null;
    const renderMain = () => {
      msgList.textContent = '';
      list.forEach(([name, text], i) => {
        const on = i === pickIdx;
        const b = el('button', FULL + 'margin:5px 0;padding:8px 9px;cursor:pointer;border:1px solid ' + (on ? '#1a6ed8' : '#aaa') + ';border-radius:6px;background:' + (on ? '#e3eefc' : '#f5f5f5') + ';color:#111;text-align:left;font:inherit' + (on ? ';box-shadow:inset 3px 0 0 #1a6ed8' : ''), (on ? '✔ ' : '') + (name || '(no name)'));
        b.type = 'button';
        b.title = text;
        b.addEventListener('mousedown', e => e.preventDefault());
        // Picking a message also switches "Send to" to that message's usual group.
        b.onclick = () => { pickIdx = i; set(K.pick, String(i)); audience = usualAud(name); exclOpen = false; renderMain(); };
        msgList.appendChild(b);
      });
      const off = () => { startBtn.disabled = true; startBtn.style.opacity = '.5'; sendTo.style.display = 'none'; };
      if (!onBoard()) { say('Open the Dispatch board to send messages.'); off(); return; }
      if (!teamRules) { say('First, set up who can be messaged (🛡️ below). Nothing can be sent until you do.'); off(); return; }
      sendTo.style.display = 'block';
      const r = recipients();
      const n = r.people.length;
      const day = shortDay(r.snap.date);
      showAud(workingBtn, audience === AUD_WORKING, '🚚 Working' + (day ? ' ' + day : ''), plural(r.workingCount, 'tech'),
        'Everyone allowed by 🛡️ who has at least one job on the board for ' + longDay(r.snap.date));
      showAud(pickedBtn, audience === AUD_PICKED, '👤 Picked', plural(r.pickedCount, 'tech'),
        'The techs you chose with 👥 Choose techs');
      const name = list[pickIdx][0];
      usualBtn.style.display = usualAud(name) !== audience ? 'block' : 'none';
      usualBtn.textContent = '☆ Always use ' + (audience === AUD_WORKING ? '🚚 Working' : '👤 Picked') + ' for ' + (name || 'this message');

      if (n) {
        toText.textContent = 'To: ' + plural(n, 'tech') + ' (' + r.people.slice(0, 4).map(t => t.name).join(', ') + (n > 4 ? ', …' : '') + ')';
      } else if (audience === AUD_PICKED) {
        toText.textContent = 'Nobody picked yet. Click 👥 Choose techs.';
      } else if (!r.snap.techs.size || !r.snap.jobs) {
        toText.textContent = 'No jobs on the board for ' + longDay(r.snap.date) + ' yet. If the board is still loading, press ↻.';
      } else {
        toText.textContent = 'Nobody allowed has jobs on the board for ' + longDay(r.snap.date) + '.';
      }
      exclBtn.style.display = r.excluded.length ? 'inline-block' : 'none';
      exclBtn.textContent = '🛡️ ' + r.excluded.length + ' excluded ' + (exclOpen ? '▾' : '▸');
      exclBtn.title = 'Left out by your 🛡️ Who can be messaged settings';
      exclList.textContent = '';
      r.excluded.forEach(t => exclList.appendChild(el('div', 'padding:1px 0', '• ' + t.name + ' — ' + whyNot(t))));
      exclList.style.display = exclOpen && r.excluded.length ? 'block' : 'none';
      const notes = [];
      if (audience === AUD_WORKING && r.snap.filtered) notes.push('A board filter is on, so only techs showing on the board are included.');
      if (r.hiddenPicked) notes.push(r.hiddenPicked + ' picked ' + (r.hiddenPicked === 1 ? 'is' : 'are') + ' hidden by the board filter and won\'t be messaged.');
      if (n > MAX_PER_RUN) notes.push('⚠️ ' + n + ' is over the limit of ' + MAX_PER_RUN + ' per run. Use 👥 Choose techs to send in smaller groups.');
      boardNote.textContent = notes.join('\n');
      boardNote.style.display = notes.length ? 'block' : 'none';

      const canStart = n > 0 && n <= MAX_PER_RUN;
      startBtn.disabled = !canStart; startBtn.style.opacity = canStart ? '1' : '.5';
      startBtn.textContent = mode === 'auto' ? 'Review and send…' : 'Start (type only)';
      if (!mainMsg.textContent || /^(Open the Dispatch|First, set up|Pick a message)/.test(mainMsg.textContent)) say('Pick a message, check who it goes to, then ' + (mode === 'auto' ? 'Review and send.' : 'Start.'));
      // The Toolbox can open before ServiceTitan has drawn the board. While the board looks
      // empty, read it again every couple of seconds for a little while (reading only).
      clearTimeout(emptyTimer);
      if (!r.snap.jobs && emptyRetries < 10) {
        emptyRetries++;
        emptyTimer = setTimeout(() => { if (!running && panel.isConnected && views.main.style.display === 'block' && msgsPane.style.display === 'block') renderMain(); }, 2000);
      } else if (r.snap.jobs) emptyRetries = 0;
    };
    const say = s => { mainMsg.textContent = s; };

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
      smallBtn('Done', () => { audience = AUD_PICKED; exclOpen = false; sub('main'); renderMain(); }, PRIMARY)
    );
    vPick.append(head('👥 Choose techs'), pickMsg, search, jobsOnlyRow, pickList, pickNav);
    search.oninput = () => renderPicker();
    let shown = [];
    const saveSel = () => set(K.sel, JSON.stringify(Array.from(selected)));
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
    const teamList = scrollBox('max-height:calc(50vh - 120px)');
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
    const EDIT_HINT = 'Use {first} for the tech\'s first name. 🚚 Working / 👤 Picked under each message is who it starts on when you pick it (you can still change it before sending). Saved in this browser.';
    editMsg.textContent = EDIT_HINT;
    // "Starts on" picker on each message. It rides along on the row as `.to` (the list editor
    // keeps it through edits and reordering) and is saved separately, matched by message name.
    const startsOn = n => {
      const sel = el('select', 'max-width:130px;padding:3px 4px;border:1px solid #aaa;border-radius:6px;font:inherit;font-size:12px;color:#111;background:#fff');
      sel.title = 'Starts on: who this message goes to when you pick it';
      [['', '👤 Picked'], [AUD_WORKING, '🚚 Working']].forEach(([v, label]) => {
        const o = el('option', '', label); o.value = v; sel.appendChild(o);
      });
      sel.value = n.to === AUD_WORKING ? AUD_WORKING : '';
      sel.onchange = () => { if (sel.value) n.to = sel.value; else delete n.to; };
      return sel;
    };
    const ed = listEditor('message', 'Button name (e.g. ☀️ Good Morning)', 'Message text', 'calc(100vh - 300px)', { rowExtra: startsOn });
    const openEditor = () => {
      ed.load(list.map(n => { const c = n.slice(); if (usualAud(n[0]) === AUD_WORKING) c.to = AUD_WORKING; return c; }));
      sub('edit');
    };
    const editNav = row();
    editNav.append(
      smallBtn('Save', () => {
        const r = ed.clean();
        if (r.error) { editMsg.textContent = r.error; return; }
        // Messages are saved as plain [name, text] pairs, exactly as before 1.4.
        list = r.list.map(n => [n[0], n[1]]);
        const ok = set(K.msgs, JSON.stringify(list));
        audDefaults = {};
        r.list.forEach(n => { if (n.to === AUD_WORKING) audDefaults[n[0]] = AUD_WORKING; });
        saveAudDefaults();
        pickIdx = Math.min(pickIdx, list.length - 1); set(K.pick, String(pickIdx));
        audience = usualAud(list[pickIdx][0]);
        editMsg.textContent = EDIT_HINT;
        sub('main'); say(ok ? '✅ Messages saved.' : '⚠️ Messages updated for now, but this browser wouldn\'t save them for next time.'); renderMain();
      }, PRIMARY),
      smallBtn('Cancel', () => { editMsg.textContent = EDIT_HINT; sub('main'); renderMain(); }),
      smallBtn('+ Add a message', () => ed.add())
    );
    vEdit.append(head('✏️ Edit messages'), editMsg, ed.box, editNav);

    // ===== Confirm =====
    const vConfirm = mkView('confirm');
    const confText = el('div', 'font-size:12px;white-space:pre-wrap;max-height:calc(100vh - 330px);overflow:auto;border:1px solid #ddd;border-radius:6px;padding:6px;background:#fafafa');
    const confAsk = el('div', 'font-size:12px;margin-top:8px');
    const confInput = el('input', 'width:70px;padding:5px 6px;border:1px solid #aaa;border-radius:6px;font:inherit;color:#111;background:#fff;margin-left:6px');
    confInput.type = 'text'; confInput.id = 'st-msg-confirm-count'; confInput.inputMode = 'numeric';
    const confGo = smallBtn('Send', () => go(), DANGER);
    const confNav = row();
    confNav.append(confGo, smallBtn('Cancel', () => { sub('main'); renderMain(); }));
    vConfirm.append(head('Check before sending'), confText, confAsk, confNav);
    let pending = [], pendingWho = '';
    const openConfirm = () => {
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      // Read the board again now: the list on this screen is exactly who gets messaged.
      const r = recipients();
      pending = r.people;
      if (!pending.length) { renderMain(); return say(audience === AUD_WORKING ? 'Nobody to send to: no allowed techs have jobs on the board.' : 'Nobody picked. Click 👥 Choose techs.'); }
      if (pending.length > MAX_PER_RUN) { renderMain(); return say('⚠️ ' + pending.length + ' people. For safety the limit is ' + MAX_PER_RUN + ' per run.'); }
      pendingWho = audience === AUD_WORKING ? 'working ' + (r.snap.date ? (board.isToday(r.snap.date) ? 'today, ' : 'on ') + r.snap.date : 'on the day shown') : 'you picked';
      const tmpl = list[pickIdx][1];
      confText.textContent = 'Message: "' + tmpl + '"\n\nTo ' + plural(pending.length, 'tech') + ' ' + pendingWho + ':\n' + pending.map(t => '• ' + t.name + '  (' + (t.team || 'no team') + ')').join('\n') +
        (r.excluded.length ? '\n\n🛡️ Not included (your safety settings):\n' + r.excluded.map(t => '• ' + t.name + ' — ' + whyNot(t)).join('\n') : '') +
        (r.hiddenPicked ? '\n\nNot included: ' + plural(r.hiddenPicked, 'picked tech') + ' hidden by the board filter.' : '');
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
      running = true; stopRun = false; lock = 'Tech Messages';
      const auto = mode === 'auto';
      const tmpl = list[pickIdx][1];
      const people = pending.slice();
      runLog.textContent = ''; runMsg.textContent = '';
      stopBtn.disabled = false; stopBtn.textContent = 'Stop'; stopBtn.style.display = 'inline-block';
      doneBtn.style.display = 'none'; copyBtn.textContent = 'Copy results';
      sub('run');
      add((auto ? 'Auto-send' : 'Type only') + ': "' + tmpl + '" to ' + people.length + ' (' + pendingWho + ')');
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
        runMsg.textContent = '⚠️ Stopped by an error: ' + (e && e.message ? e.message : e);
      } finally {
        running = false; lock = null;
        stopBtn.style.display = 'none'; doneBtn.style.display = 'inline-block';
        if (stepResolve) stepResolve('stop');
      }
    };

    msgsPane.appendChild(pane);
    sub('main');
    return {
      refresh: () => { if (!running) { emptyRetries = 0; sub('main'); renderMain(); } },
      isRunning: () => running,
      stop: requestStop
    };
  })();

  // ===================================================================
  // Dragging, closing, and starting up
  // ===================================================================
  header.addEventListener('mousedown', e => {
    if (e.target === closeX) return;
    e.preventDefault();
    const r = panel.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    const move = ev => {
      panel.style.left = Math.min(Math.max(0, ev.clientX - dx), innerWidth - 120) + 'px';
      panel.style.top = Math.min(Math.max(0, ev.clientY - dy), innerHeight - 40) + 'px';
      panel.style.right = panel.style.bottom = 'auto';
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      set('stPos', parseInt(panel.style.left, 10) + ',' + parseInt(panel.style.top, 10));
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });

  // Closing while Job Notifications or Tech Messages is running would hide the panel but
  // leave the run going in the background. So ask first, stop the run, and only close once
  // the run has really stopped. If it's slow to stop, the Toolbox stays open and says so.
  const closeBar = el('div', 'display:none;padding:8px 12px;background:#fdecec;color:#7a1010;font-size:12px;border-bottom:1px solid #e0a0a8');
  const closeText = el('div', 'margin-bottom:6px');
  const closeBtns = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
  closeBar.append(closeText, closeBtns);
  header.after(closeBar);
  let closing = false, closeAttempt = 0;
  const anyRunning = () => notify.isRunning() || msgs.isRunning();
  const finishClose = () => {
    // Last guard: never remove the panel while a run is still going.
    if (anyRunning()) return false;
    notes.cleanup();
    panel.remove();
    delete window.__stToolbox;
    return true;
  };
  const close = () => {
    const runner = notify.isRunning() ? notify : msgs.isRunning() ? msgs : null;
    if (!runner) return finishClose();
    if (closing) return;
    const toolName = runner === notify ? 'Job Notifications' : 'Tech Messages';
    closeText.textContent = toolName + ' is still running. Closing now would leave it running out of sight.';
    closeBtns.textContent = '';
    closeBtns.append(
      smallBtn('Stop it and close', async () => {
        closing = true;
        const attempt = ++closeAttempt;
        closeBtns.textContent = '';
        closeText.textContent = 'Stopping, then closing...';
        runner.stop();
        const stopped = await until(() => !anyRunning(), 30000, 250);
        if (stopped && finishClose()) return;
        // Still going after 30 seconds: keep the Toolbox open so the run isn't hidden,
        // and let the person close it once the run has actually stopped.
        closing = false;
        closeText.textContent = '⚠️ ' + toolName + ' is still stopping. The Toolbox will stay open so the running task isn\'t hidden.';
        closeBtns.append(smallBtn('Keep it open', () => { closeBar.style.display = 'none'; }));
        await until(() => !anyRunning(), 10 * 60000, 500);
        // Only update the bar if it's still the one this attempt put up.
        if (anyRunning() || !panel.isConnected || attempt !== closeAttempt || closeBar.style.display === 'none') return;
        closeText.textContent = '✅ ' + toolName + ' has stopped. You can close the Toolbox now.';
        closeBtns.textContent = '';
        closeBtns.append(smallBtn('Close now', () => finishClose(), DANGER), smallBtn('Keep it open', () => { closeBar.style.display = 'none'; }));
      }, DANGER),
      smallBtn('Keep running', () => { closeBar.style.display = 'none'; })
    );
    closeBar.style.display = 'block';
  };
  closeX.onclick = close;
  window.__stToolbox = { version: VERSION, close };

  document.body.appendChild(panel);
  const startView = get('stView');
  showView(['notes', 'jobs', 'msgs'].indexOf(startView) > -1 ? startView : 'menu');
  health.checkBoard(false);
})();
