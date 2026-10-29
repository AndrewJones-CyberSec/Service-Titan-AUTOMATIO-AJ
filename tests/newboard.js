// A stand-in for ServiceTitan's new Dispatch board (the Dispatch Center, Oct 2026) for the tests.
//
// Like the real board it lives in a sealed-off part of the page (an open shadow root on
// <servicetitan-dispatch-center-…>), marks things with test labels (data-cy), keeps its branch
// filter in session storage, and answers the same data requests the real board makes. On top of
// that, every card and row also carries the test-only labels the older tests click on
// (a.appointment[data-job-id], .technician, .job-list tr.qa-job-…), so the tests read the same.
// The Toolbox never uses those test-only labels.
//
// A fake page calls NB.setup(cfg) with functions returning its data (read fresh on every request):
//   day: Date (the board's day; default today), bus: [branch ids] (the board's filter),
//   techs(): [{ id, name, team, teamId, status }]  (status: 'Working', 'Dispatched', 'Idle'…)
//   appts(): [{ id, job, n, techs: [ids], customer, customerId, start, end, status, jobStatus,
//               confirmed, bu, buName, jobType, jobTypeId, city, zip, tags: [{ name, color }], windowStart, windowEnd, hidden }]
//   shifts(techId), events(techId): a tech's shifts ({ start, end, type }) and other events ({ start, end }) that day
//   past(): appointments before the board's day ({ id, job, techs, start, end, status, jobType, jobTypeId }),
//           for any other range asked for (Tech Router's last 4 weeks)
//   tray(): [{ job, n, customer, customerId, appt, tags }]   (the Jobs Tray rows), trayTab: 'Unassigned'
//   history(): [{ tech, appt, job, status, at }]
//   onCard(job, appt, el), onTech(id, el), onTray(job, el)   (what a normal click does)
//   menu: true   (a left click or a right-click on a tech's name opens their menu, with Send Message,
//                 as on the real board since Oct 29 2026; menuOn: 'left' or 'right' for only one;
//                 popoverMark: tech names marked data-hover-popover-trigger, as on Oct 27;
//                 menuWords: the menu's items have no data-cy labels; a tech with noMenu has none)
//   hydrateMs: n  (like the real board on Oct 29 2026: rows it has just drawn, at the start or
//                 after a scroll, show a plain name with no menu button and no menu for n ms,
//                 then the real name with its menu button)
//   filler: n    (n extra rows in the Jobs Tray, and a tall board above it)
// NB.render() draws the board when the page is on it. '#/DispatchBoard' goes to the new address,
// like ServiceTitan does. NB.setDay(d) changes the day. window.SENT lists [tech name, text] sent.
(function () {
  const pad2 = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const HOME = '#/widget-app/dispatch-center?orientation=horizontal&timeframe=day';
  const NB = window.NB = {
    cfg: null, host: null, calls: [], HOME,
    isBoard: h => /^#\/widget-app\/dispatch-center/.test(h),
    q: sel => NB.host && NB.host.shadowRoot ? NB.host.shadowRoot.querySelector(sel) : null,
    qa: sel => NB.host && NB.host.shadowRoot ? Array.from(NB.host.shadowRoot.querySelectorAll(sel)) : []
  };
  // document.querySelector that also looks inside the board (for the tests).
  window.sq = sel => document.querySelector(sel) || NB.q(sel);
  window.SENT = window.SENT || [];
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  NB.day = () => NB.cfg.day || today();
  NB.setDay = d => { NB.cfg.day = new Date(d.getFullYear(), d.getMonth(), d.getDate()); NB.render(); };
  const dateText = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const techs = () => (NB.cfg.techs ? NB.cfg.techs() : []);
  const appts = () => (NB.cfg.appts ? NB.cfg.appts() : []);
  const onDay = a => !a.start || sameDay(new Date(a.start), NB.day());
  const live = a => !a.hidden && onDay(a);

  NB.setup = cfg => {
    NB.cfg = Object.assign({ trayTab: 'Unassigned', bus: [621842244] }, cfg);
    // Where the board keeps its filter (this tab's session storage), and who's signed in.
    window.App = window.App || {};
    window.App.Notifications = window.App.Notifications || { store: { userId: 42 } };
    const uid = window.App.Notifications.store.userId;
    if (!NB.cfg.noFilter) sessionStorage.setItem('SHARED_DISPATCH_FILTERS_KEY_1_' + uid, JSON.stringify({ selectedBusinessUnitIds: NB.cfg.bus.map(String), selectedTeamIds: [], selectedSkillIds: [] }));
    // The board's data requests (anything else goes to the page's own fake).
    const prev = window.fetch;
    window.fetch = async (url, opts) => {
      const u = String(url);
      const json = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: { 'Content-Type': 'application/json' } });
      const body = opts && opts.body ? JSON.parse(opts.body) : null;
      if (u.indexOf('/app/api/data/user') === 0) {
        // PERM_HANG: the sign-in check never answers (until the Toolbox gives up on it).
        if (window.PERM_HANG) await new Promise((res, rej) => {
          const t = setTimeout(res, 600000);
          if (opts && opts.signal) opts.signal.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('The user aborted a request.', 'AbortError')); });
        });
        return window.API_401 ? new Response('', { status: 401 }) : json({ Id: window.App.Notifications.store.userId });
      }
      if (u.indexOf('/dispatch-center/') !== 0) return prev(url, opts);
      NB.calls.push(u.split('?')[0]);
      await new Promise(r => setTimeout(r, window.BOARD_DELAY || 20));
      if (window.API_401) return new Response('', { status: 401 });
      if (window.BOARD_DOWN) return json({ error: 'down' }, 500);
      const team = t => ({ id: t.id, name: t.name, teamId: t.teamId || 1, teamName: t.team || '' });
      if (u.indexOf('/dispatch-center/technicians/resources') === 0) { NB.lastResources = body; return json({ items: techs().filter(t => !t.offBoard).map(team) }); }
      if (u.indexOf('/dispatch-center/technicians/activity-history') === 0) {
        const hist = NB.cfg.history ? NB.cfg.history() : [];
        return json({ items: body.technicianIds.map(id => ({ technicianId: id, technicianActivityHistory: hist.filter(h => h.tech === id).map(h => ({ jobId: h.job, jobAppointmentId: h.appt, jobAppointmentAssignmentId: 1, status: h.status, activityTimestamp: new Date(h.at).toISOString() })) })).filter(x => x.technicianActivityHistory.length), page: 1, pageSize: body.pageSize, totalCount: 0 });
      }
      if (u.indexOf('/dispatch-center/technicians') === 0) return json({ items: techs().filter(t => body.technicianIds.indexOf(t.id) > -1).map(t => Object.assign(team(t), { status: t.status || 'Idle' })), page: 1, pageSize: body.pageSize, totalCount: techs().length });
      if (u.indexOf('/dispatch-center/daily-assignments') === 0) {
        // Another range than the board's day: the past (NB.cfg.past(), for Tech Router's 4 weeks).
        if (body.startDate !== iso(NB.day())) {
          NB.pastCalls = (NB.pastCalls || 0) + 1;
          if (window.PAST_BAD) return json({ nope: true });
          const from = new Date(body.startDate + 'T00:00:00'), to = new Date(body.endDate + 'T00:00:00');
          const past = (NB.cfg.past ? NB.cfg.past() : []).filter(a => new Date(a.start) >= from && new Date(a.start) < to);
          return json({ items: body.technicianIds.map(id => ({ technicianId: id, technicianSchedule: [{ dateTime: body.startDate + 'T00:00:00', shifts: [], nonJobEvents: [],
            assignments: past.filter(a => (a.techs || []).indexOf(id) > -1).map(a => ({ appointmentId: a.id, appointmentStart: new Date(a.start).toISOString(), appointmentEnd: new Date(a.end || a.start).toISOString(),
              appointmentStatus: a.status || 'Done', jobId: a.job, jobTypeId: a.jobTypeId, jobTypeName: a.jobType })) }] })), page: 1, pageSize: body.pageSize, totalCount: body.technicianIds.length });
        }
        NB.lastDaily = body;
        const list = appts().filter(live);
        const timed = (x, a, b) => ({ [a]: new Date(x.start).toISOString(), [b]: new Date(x.end).toISOString() });
        return json({ items: body.technicianIds.map(id => ({ technicianId: id, technicianSchedule: [{ dateTime: iso(NB.day()) + 'T00:00:00',
          // NB.cfg.shifts(id): [{ start, end, type ('Normal' or 'TimeOff') }]; NB.cfg.events(id): [{ start, end }].
          shifts: (NB.cfg.shifts ? NB.cfg.shifts(id) : []).map((x, i) => Object.assign({ id: i + 1, type: x.type || 'Normal', name: 'Day Shift', maxShiftOvertimeMinutes: 0 }, timed(x, 'startDate', 'endDate'))),
          nonJobEvents: (NB.cfg.events ? NB.cfg.events(id) : []).map((x, i) => Object.assign({ id: i + 1, name: 'Meeting' }, timed(x, 'appointmentStart', 'appointmentEnd'))),
          assignments: list.filter(a => (a.techs || []).indexOf(id) > -1).map(a => ({
            assignmentId: a.id * 10 + id, assignmentStatus: a.status || 'Scheduled', appointmentId: a.id, appointmentNumber: a.job + '-' + (a.n || 1),
            appointmentStart: a.start ? new Date(a.start).toISOString() : null, appointmentEnd: a.end ? new Date(a.end).toISOString() : null,
            arrivalWindowStart: a.windowStart ? new Date(a.windowStart).toISOString() : null, arrivalWindowEnd: a.windowEnd ? new Date(a.windowEnd).toISOString() : null,
            appointmentStatus: a.status || 'Scheduled', isConfirmed: !!a.confirmed, jobId: a.job, jobStatus: a.jobStatus || 'Scheduled', jobTypeName: a.jobType || 'Service', jobTypeId: a.jobTypeId || null,
            businessUnitId: a.bu || 621842244, businessUnitName: a.buName || 'Mendenhall Branch', customerId: a.customerId, customerName: a.customer, city: a.city || 'Magee', zip: a.zip || '39111',
            tags: (a.tags || []).map((t, i) => ({ tagTypeId: i + 1, name: t.name, color: t.color || '#cccccc', importance: 0 })), tagCount: (a.tags || []).length
          })) }] })), page: 1, pageSize: body.pageSize, totalCount: body.technicianIds.length });
      }
      return json({}, 404);
    };
    addEventListener('hashchange', NB.render);
    addEventListener('DOMContentLoaded', NB.render);
  };

  // ---- Drawing the board ----
  const CSS = ':host{display:block}.hdr{display:flex;gap:8px;padding:6px;border-bottom:1px solid #ccc}' +
    '.scroller{overflow:auto;border-bottom:2px solid #999}.techrow{display:flex;gap:6px;align-items:center;height:44px;border-bottom:1px solid #eee}' +
    '.technician{width:150px;padding:6px;cursor:pointer}.technician .tbtn{all:unset;cursor:pointer}.cards{display:flex;gap:4px}' +
    'a.appointment{display:inline-block;padding:6px 10px;background:#cfe;border:1px solid #9c9;cursor:pointer;color:#000;text-decoration:none;border-radius:6px}' +
    '.team-name{font-weight:bold;background:#ddd;padding:2px 6px}[role=menu]{position:fixed;background:#fff;border:1px solid #999;padding:4px;z-index:5}' +
    '[role=menuitem]{padding:4px 8px;cursor:pointer}.job-list table{border-collapse:collapse}.job-list td{padding:8px;border-bottom:1px solid #ddd}' +
    'servicetitan-activity-center-test01{display:none}';
  const ready = () => !NB.cfg.hydrateMs || Date.now() >= (NB.readyAt || 0);
  const techRow = (t, list) => '<div class="techrow"><div class="technician' + (ready() ? '' : ' lite') + '" id="team-technician-' + t.id + '" data-cy="ddb-technician-header-' + t.id + '" data-technician-id="' + t.id + '"' +
    (NB.cfg.popoverMark && !t.noMenu && ready() ? ' data-hover-popover-trigger=""' : '') + '>' +
    (ready() ? '<button type="button" class="tbtn" aria-haspopup="true" aria-expanded="false"><span class="name">' + esc(t.name) + '</span></button>' : '<span class="name">' + esc(t.name) + '</span>') + '</div>' +
    '<div class="cards" id="team-timeline-row-' + t.id + '">' + list.map(a => '<a class="appointment" data-cy="wdb-job-appt-card" data-job-appointment-id="' + a.id +
      '" data-technician-id="' + t.id + '" data-job-id="' + a.job + '" data-id="' + a.id + '">' + esc(a.label || a.customer) + '</a>').join('') + '</div></div>';
  NB.render = () => {
    const h = location.hash.split('?')[0];
    if (/^#\/DispatchBoard/i.test(h)) { location.replace(HOME); return; }
    const root = document.getElementById('root');
    if (!NB.isBoard(location.hash)) { if (NB.host && root.contains(NB.host)) { root.innerHTML = ''; NB.host = null; } return; }
    const c = NB.cfg;
    if (!NB.host || !root.contains(NB.host)) {
      root.innerHTML = '';
      NB.host = document.createElement('servicetitan-dispatch-center-test01');
      NB.host.attachShadow({ mode: 'open' });
      root.appendChild(NB.host);
    }
    const sr = NB.host.shadowRoot;
    const keep = Array.from(sr.querySelectorAll('style:not(#nb-css)'));   // styles the Toolbox put in
    const scroller = sr.querySelector('.scroller');
    const top = scroller ? scroller.scrollTop : 0;
    const week = c.week || new URLSearchParams(location.hash.split('?')[1] || '').get('timeframe') === 'week';
    const list = appts().filter(live);
    const ts = techs().filter(t => !t.offBoard);
    // Like the real board: only the rows on screen are drawn when c.virtual is on.
    const teams = [];
    ts.forEach(t => { const k = t.team || ''; let g = teams.find(x => x.name === k); if (!g) teams.push(g = { name: k, id: t.teamId || teams.length + 1, techs: [] }); g.techs.push(t); });
    let html = '<style id="nb-css">' + CSS + '</style><div class="hdr"><div data-cy="dc-header-timeframe-selector"><span data-cy="day">Day</span> <span data-cy="week">Week</span></div>' +
      '<button type="button" data-cy="dc-date">' + dateText(NB.day()) + '</button>' + (window.NO_REFRESH ? '' : '<button type="button" aria-label="Refresh" data-cy="nb-refresh">⟳</button>') + '</div>' +
      '<div class="scroller" style="' + (c.virtual ? 'height:' + (c.virtual * 44) + 'px' : '') + '"><div data-cy="dc-wdb-virtual-list">';
    if (week) {
      html += ts.map(t => '<div class="techrow"><div data-cy="wdb-technician-header-' + t.id + '" data-technician-id="' + t.id + '">' + esc(t.name) + '</div></div>').join('');
    } else if (c.virtual) {
      const rowsTop = Math.floor(top / 44), all = [];
      teams.forEach(g => g.techs.forEach(t => all.push(t)));
      html += '<div style="height:' + (rowsTop * 44) + 'px"></div>';
      all.slice(rowsTop, rowsTop + c.virtual + 1).forEach(t => { html += techRow(t, list.filter(a => (a.techs || []).indexOf(t.id) > -1)); });
      html += '<div style="height:' + (Math.max(0, all.length - rowsTop - c.virtual - 1) * 44) + 'px"></div>';
    } else {
      teams.forEach(g => {
        html += '<div data-cy="ddb-team-group-' + g.id + '" class="team-container"><div class="team-name">' + esc(g.name) + '</div>' +
          g.techs.map(t => techRow(t, list.filter(a => (a.techs || []).indexOf(t.id) > -1))).join('') + '</div>';
      });
    }
    const filler = typeof c.filler === 'function' ? c.filler() : (c.filler || 0);
    html += '</div></div>' + (filler ? '<div style="height:1500px">(board)</div>' : '');
    const tray = (c.tray ? c.tray() : []).concat(Array.from({ length: filler }, (x, i) => ({ job: 950000 + i, customer: 'Filler ' + i, filler: true })));
    html += '<div class="job-list"><button type="button" data-cy="custom-tab-item-1" aria-selected="true">' + esc(c.trayTab) + ' <span>' + tray.length + '</span></button>' +
      '<div><table class="k-grid-table" tabindex="0" data-cy="dc-jt-unassigned-table"><tbody>' +
      tray.map((r, i) => '<tr class="row__BK7JR qa-job-' + r.job + '" role="row" data-grid-row-index="' + i + '" style="height:40px"><td>Quote</td>' +
        '<td data-cy="dc-jt-job-appointment-cell">' + r.job + '-' + (r.n || 1) + '</td><td data-cy="dc-jt-customer-name-cell"><a href="#/Customer/' + (r.customerId || 1) + '">' + esc(r.customer) + '</a></td></tr>').join('') +
      '</tbody></table></div></div>';
    sr.innerHTML = html;
    keep.forEach(s => sr.appendChild(s));
    // The Jobs Tray rows carry their data the way the real ones do (the row's own data).
    const trs = Array.from(sr.querySelectorAll('tr[data-grid-row-index]'));
    trs.forEach((tr, i) => {
      const r = tray[i];
      if (r.filler) return;
      tr.__reactFiber$nb = { memoizedProps: { dataItem: { job: { id: r.job }, jobAppointment: { id: r.appt || r.job + 100000 }, customer: { id: r.customerId, name: r.customer }, tags: (r.tags || []).map(t => ({ name: t.name, color: t.color || '#cccccc' })) } } };
      tr.addEventListener('click', () => { window.opened = window.opened || []; window.opened.push('tray'); if (c.onTray) c.onTray(r.job, tr); });
    });
    // Like the real list: pressing a row focuses the list and jumps back to its top.
    const tbl = sr.querySelector('table');
    tbl.addEventListener('mousedown', () => { tbl.focus({ preventScroll: true }); const t = tbl.getBoundingClientRect().top; if (t < 0) window.scrollTo(0, t + window.scrollY - 40); });
    sr.querySelectorAll('a.appointment').forEach(a => a.addEventListener('click', () => {
      window.opened = window.opened || [];
      if (c.onCard) c.onCard(a.getAttribute('data-job-id'), a.getAttribute('data-job-appointment-id'), a);
      else window.opened.push(a.getAttribute('data-job-id'));
    }));
    sr.querySelectorAll('.technician').forEach(t => {
      const id = t.getAttribute('data-technician-id');
      const hasMenu = () => c.menu && !t.classList.contains('lite') && !(techs().find(x => String(x.id) === id) || {}).noMenu;
      t.addEventListener('click', e => {
        window.techOpened = (window.techOpened || 0) + 1; window.opened = window.opened || []; window.opened.push('tech' + id); if (c.onTech) c.onTech(id, t);
        if (hasMenu() && c.menuOn !== 'right') { window.menuBy = 'left'; openMenu(t, e); }
      });
      t.addEventListener('contextmenu', e => { e.preventDefault(); if (hasMenu() && c.menuOn !== 'left') { window.menuBy = 'right'; openMenu(t, e); } });
    });
    const sc = sr.querySelector('.scroller');
    if (sc) {
      sc.scrollTop = top;
      NB.lastTop = sc.scrollTop;
      if (c.virtual || c.hydrateMs) sc.addEventListener('scroll', () => {
        // Only a real move counts (drawing the list again puts its scroll back, which isn't one).
        if (sc.scrollTop === NB.lastTop) return;
        NB.lastTop = sc.scrollTop;
        clearTimeout(NB.vt);
        NB.vt = setTimeout(() => {
          if (c.hydrateMs) { NB.readyAt = Date.now() + c.hydrateMs; clearTimeout(NB.ht); NB.ht = setTimeout(NB.render, c.hydrateMs + 10); }
          NB.render();
        }, 30);
      });
    }
    const rb = sr.querySelector('[data-cy="nb-refresh"]');
    if (rb) rb.addEventListener('click', () => { window.refreshes = (window.refreshes || 0) + 1; setTimeout(NB.render, 150); });
  };

  // ---- The tech menu and the Send Message panel (ServiceTitan's Activity Center, inside the board) ----
  let ac = null;
  const activityCenter = () => {
    const sr = NB.host.shadowRoot;
    if (ac && sr.contains(ac)) return ac;
    ac = document.createElement('servicetitan-activity-center-test01');
    const r = ac.attachShadow({ mode: 'open' });
    r.innerHTML = '<style>.col{position:fixed;right:0;top:0;width:380px;height:100vh;background:#eef;box-sizing:border-box}</style>' +
      '<div class="col" style="padding:10px"><button data-cy="close-messaging">✕</button><h3 id="who"></h3><div id="hist"></div>' +
      '<textarea data-cy="technician-chat-input" style="width:340px;height:60px"></textarea>' +
      '<label><input type="checkbox" data-cy="attach-message-to-job"> Attach this message to the technician\'s current job</label>' +
      '<button data-cy="send-chat-message">Send</button></div>';
    const box = r.querySelector('textarea');
    r.querySelector('[data-cy="send-chat-message"]').addEventListener('click', () => {
      if (!box.value) return;
      window.SENT.push([r.getElementById('who').textContent, box.value]);
      const p = document.createElement('p'); p.textContent = box.value;
      r.getElementById('hist').appendChild(p);
      box.value = '';
    });
    r.querySelector('[data-cy="close-messaging"]').addEventListener('click', () => { ac.style.display = 'none'; });
    // NB.cfg.cover: 'always', or a number of ms after the panel opens, while something covers the
    // message box (a stand-in for whatever covered it on Oct 29 2026).
    const cover = document.createElement('div');
    cover.setAttribute('data-cy', 'test-cover');
    cover.style.cssText = 'position:fixed;right:0;bottom:0;width:400px;height:100vh;background:rgba(0,0,0,.3);z-index:9;display:none';
    r.appendChild(cover);
    ac.__cover = cover;
    sr.appendChild(ac);
    return ac;
  };
  const openMenu = (t, e) => {
    const sr = NB.host.shadowRoot;
    sr.querySelectorAll('[role=menu]').forEach(m => m.remove());
    window.menusOpen = 1;
    const name = t.querySelector('.name').textContent;
    const m = document.createElement('div');
    m.setAttribute('role', 'menu');
    m.style.left = (e.clientX || 10) + 'px'; m.style.top = (e.clientY || 10) + 'px';
    m.innerHTML = '<div role="menuitem" data-cy="tmi-add-edit-memo">Add/Edit Memo</div><div role="menuitem" data-cy="tmi-call-technician">Call Technician</div><div role="menuitem" data-cy="tmi-send-message"><span>Send Message</span></div>';
    const send = m.querySelector('[data-cy="tmi-send-message"]');
    if (NB.cfg.menuWords) m.querySelectorAll('[data-cy]').forEach(x => x.removeAttribute('data-cy'));
    // Like the real menu (Oct 29 2026): it stays open after Send Message, and an Escape on the
    // menu itself closes it (an Escape on the page doesn't).
    m.addEventListener('keydown', e => { if (e.key === 'Escape') { m.remove(); window.menusOpen = 0; } });
    send.addEventListener('click', () => {
      window.menuOpened = (window.menuOpened || 0) + 1;
      const host = activityCenter();
      host.shadowRoot.getElementById('who').textContent = name;
      host.shadowRoot.getElementById('hist').textContent = '';
      host.style.display = 'inline';
      const c = NB.cfg.cover;
      host.__cover.style.display = c ? 'block' : 'none';
      if (typeof c === 'number') setTimeout(() => { host.__cover.style.display = 'none'; }, c);
    });
    sr.appendChild(m);
  };
})();
