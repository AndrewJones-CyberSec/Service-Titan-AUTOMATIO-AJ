/*
  ServiceTitan Toolbox
  ====================
  One panel with seven tools for the ServiceTitan Dispatch board:
    - Notes: adds a ready-made note (sorted into folders) to a job's customer in one click.
    - Job Notifications: shows whether job notifications are on or off for the jobs you pick (one at a time,
      a tech's day, or the whole board), and turns them off or on.
    - Tech Messages: sends a saved message (Good Morning, ETA, ...) to the techs you pick (by team or on the board).
    - Business Unit: switches the jobs you pick to a branch (Mendenhall Branch by default).
    - Customer Texts: texts customers a saved message (holds, tech updates, reschedules, ...).
    - Move Jobs: moves jobs to a tech, adds or unassigns techs, or swaps jobs or whole days, without dragging.
    - Tech Router (Beta, still being built): finds jobs to fill a tech's open time (customers to call and
      move up), plans a route and a tech for every Unassigned job (by arrival window: 8-12s, then 12-5s,
      then 5-9s), and finds the techs closest to a job. It only reads; Move Jobs makes any change.

  HOW TO RELEASE AN UPDATE
    1. Edit this file on GitHub.
    2. Change VERSION below (1.0 -> 1.1, and so on) and add a line to WHATS_NEW.
    3. Commit. Everyone gets the new version the next time they click the bookmark
       (GitHub can take a few minutes to publish it).

  Each person's edited notes, messages and safety settings are saved in their own browser,
  so updates never wipe them.
*/
(() => {
  const VERSION = '2.1';
  const WHATS_NEW = {
    '2.1': 'New: 🧭 Tech Router (Beta). 📞 Fill a spot: pick a tech whose day is already planned, and it finds their open time (first thing, mid-day or the end of the day) and the jobs that would fit there from the Unassigned list (this day and the next 14) and the Hold list, with the customer\'s phone number to call and move them up. 🗺️ Plan the day: a tech and a route for every Unassigned job, 8-12s first, then 12-5s, then 5-9s (a little late is OK), sent to Move Jobs to assign. It learns which jobs each department does from the last 4 weeks of schedules, so a project coordinator only gets quotes, not electrical or plumbing ones. 🔎 Closest techs is back too. It\'s still being built, so check before you call; it only reads, and changes nothing on its own.',
    '2.0.2': 'Fixed: 💬 Tech Messages skipped every tech with "their name on the board has no menu". When the board scrolls to a tech it shows their name first and their menu about a second later; the Toolbox now waits for the menu, then opens it the way you would (a right-click or a left click on their name).',
    '2.0.1': 'Nothing inside the Toolbox scrolls sideways any more, and you can make it wider or narrower by dragging its left edge or bottom-right corner (it remembers; double-click for the usual width). Plus a few quick animations: it fades in and out, tools slide in, – folds it smoothly, and loading buttons show a spinner.',
    '2.0': 'Built for ServiceTitan\'s new Dispatch board (use its Day view), with a new look. Every tool works on it again. New: tags show on every job, and ＋ Jobs with a tag… adds all the jobs with one tag. Jobs show how their day is going (🚚 Dispatched 10:20 AM, 🔧 Working). ＋ Whole board is quicker (the whole day comes in one request). 💬 Tech Messages adds everyone Working or Dispatched in one click. – folds the Toolbox down to its title bar.',
    '1.7.2': 'New in 📱 Customer Texts: ＋ A department… next to ＋ Everyone on the board adds just one team\'s customers for the day (Level 1 Service, Installers…) or just the Unassigned list. Pick another to add it too. 📥 Check replies then looks only at those customers.',
    '1.7.1': '📥 Check replies counts earlier confirm texts: a C to Saturday\'s text for Monday still counts after a newer reminder, if all they said after it was "already confirmed", "already did" or "thanks". A coworker\'s text that only says the weekday ("your appointment Monday") counts for that day, and one naming another day ("Saturday") no longer counts for Monday.',
    '1.7': 'Smarter 🔕 Job Notifications: one list instead of two modes. Add jobs by clicking them, clicking a tech\'s name on the board (their whole day), ＋ Whole board, or a tech from the list. Each job shows 🔔 on or 🔕 off as soon as it\'s added (off jobs get a gray dashed outline on the board), and the buttons say how many jobs they\'d change, like 🔕 Turn off (11). Results come back as cards, with problems first.',
    '1.6.5': 'New fill-in for 📱 Customer Texts: {when} says "today", "tomorrow", or the date ("on Friday, October 30") from the appointment\'s day on the board and today\'s date. ✅ Confirm Appt uses it, so the same message works the day before, the morning of, or a week ahead. 📥 Check replies is smarter too: a confirm text that names a date only counts for that date. A card without ✅ Add to confirm now says why (already confirmed in ServiceTitan), and every card on the Will confirm list has ↩ Take off.',
    '1.6.4': 'New in 📱 Customer Texts: a ✅ Confirm Appt folder with the "Reply \'C\' to confirm" reminder for tomorrow\'s customers, and 📥 Check replies and confirm. It reads the replies to any text asking for a C (yours, a coworker\'s, or ServiceTitan\'s automatic reminder) and confirms the appointments of everyone who answered C, yes or 👍 when you press Confirm. Everyone else is a card under Needs a look, No reply yet or Not texted, with what they said, their number, copy buttons, and ✅ Add to confirm for the ones you decide are a yes. It never sends anything.',
    '1.6.3': 'Safer with two tabs open: 💬 Tech Messages and 📱 Customer Texts now check your 🛡️ / 🚫 never lists as saved right now, before the list, Start and each person, so someone you block in another tab is never messaged from this one, and saving settings in one tab no longer undoes blocks made in another. A Customer Texts run no longer fills the Back button with every conversation it opened. Tech Messages puts the Toolbox back where it was after moving it aside for the message panel.',
    '1.6.2': 'Faster 🔀 Move Jobs: it now works on up to three jobs at once, so moving jobs from one tech to another takes about a third of the time (Unassigned moves, whole-day swaps and Put back are faster too). A run also ends as soon as the board shows the changes, instead of always waiting 2.5 seconds. Each job is still done the same careful way: checked again right before, the new tech added first and confirmed, then the old one taken off and confirmed. Stop lets the jobs already started finish.',
    '1.6.1': 'New in 📱 Customer Texts: ＋ Everyone on the board (under Jobs I pick) adds every job on the board for the day it shows, the timeline plus the whole Unassigned list, one text per customer. New 📣 OutReach folder with a heater reminder (skips anyone who got it in the last 30 days). Big runs are faster: the next customer is checked while the current text goes out.',
    '1.6': 'New: 🔀 Move Jobs. Move jobs to a tech, add or unassign a tech, or swap two jobs or two techs\' whole day, without dragging. ＋ All Unassigned puts every unassigned job on one tech in one go. Review first: it warns about skills, double-booking and jobs from another branch. ↩ Put back undoes it, even after closing the Toolbox (kept for a day), and the board refreshes itself after a move. Swaps are both jobs or neither and check time off and other jobs too.',
    '1.5.4': 'New: 🔕 Job Notifications can turn notifications back ON (Turn on notifications…), not just off. Fix: 📱 Customer Texts works again for logins that can\'t open job records (it wrongly stopped as if you weren\'t signed in). It now reads phone numbers from the customer instead.',
    '1.5.3': 'Fix: 📝 Notes no longer opens a "This Page Could Not Be Found" page. When you click a job, ServiceTitan shows a blank customer link for about a second while the job loads; Notes now waits for the real customer instead of following the blank one.',
    '1.5.2': 'Steadier runs: Stop works right away, even while jobs are still being read. If ServiceTitan signs you out, a run stops and says so. If ServiceTitan is slow, the Toolbox eases off. Customer Texts skips a hold that has been booked since you loaded the list.',
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
  // A saved setting, read fresh from this browser's storage (so a change made in another tab counts).
  // Not saved yet: d. Storage can't be read, or the saved value is damaged: cur, what this copy
  // already had, so a glitch never empties a safety list.
  const readSaved = (k, d, cur) => {
    let raw;
    try { raw = localStorage.getItem(k); } catch (e) { return cur; }
    if (raw == null) return d;
    try { const v = JSON.parse(raw); return v == null ? d : v; } catch (e) { return cur; }
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const until = async (fn, max, gap) => {
    const end = Date.now() + max;
    while (Date.now() < end) { const v = fn(); if (v) return v; await wait(gap || 250); }
    return fn() || null;
  };
  const visible = el => !!(el && el.getClientRects().length);
  // On the Dispatch board, in Day view? (See board, below.)
  const onBoard = () => board.isDay();
  const isMac = /Mac|iPhone|iPad/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '');
  const ALT = isMac ? 'Option' : 'Alt';
  const el = (tag, css, text) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (text != null) e.textContent = text; return e; };
  const FULL = 'display:block;box-sizing:border-box;width:100%;';
  // A text box or list, in the Toolbox's look.
  const FIELD = 'box-sizing:border-box;padding:5px 8px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;font-size:12px;color:var(--st-ink);background:var(--st-bg);';
  const smallBtn = (label, onClick, extra) => {
    const b = el('button', 'padding:4px 10px;min-height:28px;cursor:pointer;border:1px solid var(--st-ctl);border-radius:6px;background:var(--st-bg);color:var(--st-ink);font:inherit;font-size:12px;font-weight:600;line-height:1.2;' + (extra || ''), label);
    b.type = 'button';
    b.onclick = onClick;
    return b;
  };
  const PRIMARY = 'background:var(--st-blue);color:#fff;border-color:var(--st-blue);font-weight:600;';
  const DANGER = 'background:var(--st-red);color:#fff;border-color:var(--st-red);font-weight:600;';
  const norm = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const same = (a, b) => norm(a).toLowerCase() === norm(b).toLowerCase();
  const plural = (n, word, many) => n + ' ' + (n === 1 ? word : (many || word + 's'));
  const last10 = s => String(s == null ? '' : s).replace(/\D/g, '').slice(-10);
  const errText = e => (e && e.message ? e.message : String(e));
  // Runs read many jobs at the start, then work through them one by one. A job is only left
  // alone ("already done") on a reading this fresh; an older one is read again at its turn,
  // in case someone changed it in the meantime.
  const FRESH_MS = 5000;

  // ===================================================================
  // Reading ServiceTitan's own data
  // The same requests ServiceTitan's pages make to show a job or a conversation. Reading them
  // directly takes a fraction of a second, where opening the page takes a few seconds. Most
  // tools still make their changes on the page, like a person would. Move Jobs is the exception:
  // it sends the same assign/unassign requests the job panel sends, after the same checks the
  // panel makes (skills, already booked, managed tech), and confirms each. Each job's steps go
  // one after another; up to three jobs are worked on at once.
  // ===================================================================
  const st = (() => {
    const HEADERS = { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' };
    // Every failure says what kind it is, so a run can react the right way:
    //   signedOut:    the session has ended. Nothing more will work.
    //   noPermission: still signed in, but this login isn't allowed to see that (ServiceTitan
    //                 answers 401 for both, so a 401 is double-checked with stillSignedIn()).
    //   trouble:      ServiceTitan is slow or failing (no answer in time, 5xx, can't connect).
    //   bad:          that one request didn't work (no such job, an odd answer).
    const SIGNED_OUT = 'ServiceTitan has signed you out. Reload the page, sign back in, then run it again.';
    const NO_PERMISSION = 'your ServiceTitan login doesn\'t have permission to see this';
    const fail = (kind, msg) => Object.assign(new Error(msg), { kind });
    // Ids go to ServiceTitan as numbers, the way its own pages send them (the new board's data
    // keeps some of them as text).
    const idNum = v => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v);
    const isSignedOut = e => !!(e && e.kind === 'signedOut');
    const isNoPermission = e => !!(e && e.kind === 'noPermission');
    // Is the session still alive? Asks for something every signed-in user can read. Reads refused
    // at the same moment share one question. true: signed in. false: signed out (refused, or sent
    // to the sign-in page). null: couldn't tell (no answer in time, can't connect, ServiceTitan
    // failing), which a run treats as ServiceTitan being slow, not as signed out.
    // Asks for the signed-in user (every page loads it), and falls back to the permission settings
    // the Toolbox asked for before Oct 27 2026 (that one started answering 400 that day).
    let asking = null;
    const SIGNED_IN_CHECKS = ['/app/api/data/user', '/api/cp/settings/special/permission-settings'];
    const stillSignedIn = () => asking || (asking = (async () => {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => ctl.abort(), 8000) : null;
      try {
        for (const url of SIGNED_IN_CHECKS) {
          let r;
          try { r = await fetch(url + '?_=' + Date.now(), { credentials: 'include', headers: HEADERS, signal: ctl ? ctl.signal : undefined }); }
          catch (e) { if (e && e.name === 'AbortError') return null; continue; }
          if (r.redirected && /\/(auth|account|login|signin)\b/i.test(r.url)) return false;
          if (r.ok) return true;
          if (r.status === 401 || r.status === 403) return false;
        }
        return null;
      } finally { if (timer) clearTimeout(timer); asking = null; }
    })());
    // post: when given, sends it as JSON with a POST (the way ServiceTitan's own pages do) instead
    // of a plain read. A POST with an empty answer gives null.
    const getJSON = async (url, ms, post) => {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => ctl.abort(), ms || 15000) : null;
      const isPost = post !== undefined;
      let r, text;
      try {
        r = isPost
          ? await fetch(url, { method: 'POST', credentials: 'include', headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, HEADERS), body: JSON.stringify(post), signal: ctl ? ctl.signal : undefined })
          : await fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + '_=' + Date.now(), { credentials: 'include', headers: HEADERS, signal: ctl ? ctl.signal : undefined });
        if (r.status === 401 || r.status === 403) {
          const signedIn = await stillSignedIn();
          throw signedIn === true ? fail('noPermission', NO_PERMISSION) : signedIn === false ? fail('signedOut', SIGNED_OUT) : fail('trouble', 'ServiceTitan refused (' + r.status + ') and didn\'t answer whether you\'re still signed in');
        }
        if (r.redirected && /\/(auth|account|login|signin)\b/i.test(r.url)) throw fail('signedOut', SIGNED_OUT);
        if (r.status >= 500 || r.status === 408 || r.status === 429) throw fail('trouble', 'ServiceTitan answered ' + r.status);
        if (!r.ok) throw fail('bad', 'ServiceTitan answered ' + r.status);
        text = await r.text();
      } catch (e) {
        if (e && e.kind) throw e;
        throw e && e.name === 'AbortError' ? fail('trouble', 'ServiceTitan took too long to answer') : fail('trouble', 'couldn\'t reach ServiceTitan (' + errText(e) + ')');
      } finally { if (timer) clearTimeout(timer); }
      if (isPost && !norm(text)) return null;
      try { return JSON.parse(text); }
      catch (e) {
        // A sign-in page instead of data also means the session has ended.
        if (/<html|<form/i.test(text) && /password|sign ?in|log ?in/i.test(text)) throw fail('signedOut', SIGNED_OUT);
        throw fail('bad', 'ServiceTitan\'s answer wasn\'t readable');
      }
    };
    // Reads several things at once, a few at a time (gentle on ServiceTitan), keeping the order.
    // Only for reading. (Move Jobs works on a few jobs at once with its own careful loop.)
    //   - A failed item gives { error } instead of stopping the rest.
    //   - opts.stop(): once it's true, pool returns right away (reads already on their way are
    //     not waited for). out.stopped is set.
    //   - When an answer is slow or fails, it asks one at a time until one works again. After
    //     TROUBLE_IN_A_ROW of those in a row, or as soon as ServiceTitan signs you out, it stops
    //     asking and returns right away: out.halted is 'trouble' or 'signedOut', out.haltError says why.
    //   - Items it never got to are NOT_RUN. Answers that arrive after it has returned are ignored.
    //   - fn(item, i, alive): an fn that makes several requests should check alive() between
    //     them, and give up once it's false (the pool has already returned).
    const NOT_RUN = Object.freeze({ notRun: true });
    const TROUBLE_IN_A_ROW = 4;
    const pool = (items, limit, fn, progress, opts) => new Promise(resolve => {
      const o = opts || {};
      const out = items.map(() => NOT_RUN);
      let next = 0, done = 0, active = 0, inRow = 0, over = false, watch = null;
      const end = (why, e) => {
        if (over) return;
        over = true;
        if (watch) clearInterval(watch);
        if (why === 'stopped') out.stopped = true;
        else if (why) { out.halted = why; out.haltError = e; }
        resolve(out);
      };
      const pump = () => {
        if (over) return;
        if (o.stop && o.stop()) return end('stopped');
        while (active < (inRow ? 1 : limit) && next < items.length) {
          const i = next++;
          active++;
          Promise.resolve().then(() => fn(items[i], i, () => !over)).then(v => {
            if (over) return;
            out[i] = v; inRow = 0;
          }, e => {
            if (over) return;
            out[i] = { error: e };
            const kind = e && e.kind;
            if (kind === 'signedOut') return end('signedOut', e);
            if (kind !== 'trouble') inRow = 0;
            else if (++inRow >= TROUBLE_IN_A_ROW) return end('trouble', e);
          }).then(() => {
            if (over) return;
            active--; done++;
            if (progress) progress(done, items.length);
            pump();
          });
        }
        if (!active && next >= items.length) end();
      };
      if (o.stop) watch = setInterval(() => { if (o.stop()) end('stopped'); }, 150);
      pump();
    });
    // How a run should say a pool stopped early (or '' if it didn't).
    const haltNote = out => !out.halted ? '' : out.halted === 'signedOut' ? SIGNED_OUT :
      'ServiceTitan is slow or not answering (' + errText(out.haltError) + ').';
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
    // A customer's phone numbers, as the customer page's Contact Methods panel reads them. Works
    // for logins that can't open the job record. [{ num, mobile }] in ServiceTitan's order
    // (primary first). Seen Oct 2026: type 1 = email, 3 = mobile phone.
    const CONTACT_EMAIL = 1, CONTACT_MOBILE = 3;
    const customerPhones = async customerId => {
      const d = await getJSON('/app/api/contact-methods/getContactMethods?ownerId=' + encodeURIComponent(customerId) + '&ownerType=Customer');
      if (!Array.isArray(d)) throw fail('bad', 'the customer\'s contact methods came back in a shape the Toolbox doesn\'t know');
      const isType = (t, n, word) => t === n || (typeof t === 'string' && new RegExp('^' + word + '$', 'i').test(t.replace(/\s/g, '')));
      return d.filter(x => x && !isType(x.type, CONTACT_EMAIL, 'email') && last10(x.value).length === 10)
        .map(x => ({ num: last10(x.value), mobile: isType(x.type, CONTACT_MOBILE, 'mobile(phone)?') }));
    };
    // ---- Assigning techs (Move Jobs). The same requests the job panel on the Dispatch board makes
    // (the ⋮ menu → Assign/Unassign), so they work without permission to open the job record.
    // An appointment as the job panel sees it: { jobId, jobTotal, businessUnitId, appointment:
    // { id, number, start, end, status, techIds } }, or throws.
    // Anything missing or odd is refused (and the run says why), rather than guessed: a missing
    // total read as $0 would skip the managed-tech rule, a missing status would hide a Done job.
    // ms: a shorter time limit, for the quick re-reads that confirm a change.
    const appointment = async (apptId, ms) => {
      const d = await getJSON('/dispatch/job-edit-flyout/GetJobEditFlyoutData?appointmentId=' + encodeURIComponent(apptId), ms);
      const a = d && Array.isArray(d.jobAppointments) ? d.jobAppointments.find(x => x && String(x.id) === String(apptId)) : null;
      const shape = what => fail('bad', 'the appointment came back in a shape the Toolbox doesn\'t know (' + what + ')');
      if (!a || !Array.isArray(a.technicians)) throw shape('no technicians');
      if (a.technicians.some(t => !t || t.id == null)) throw shape('a technician without an id');
      if (d.jobId == null) throw shape('no job number');
      if (typeof d.jobTotal !== 'number' || !isFinite(d.jobTotal)) throw shape('no job total');
      // Seen Oct 2026: a number (0 = Scheduled, 4 = Done). Older pages used words.
      if (typeof a.jobAppointmentStatus !== 'number' && !(typeof a.jobAppointmentStatus === 'string' && norm(a.jobAppointmentStatus))) throw shape('no status');
      if (!a.start || !a.end || isNaN(new Date(a.start)) || isNaN(new Date(a.end))) throw shape('no start or end time');
      return {
        jobId: d.jobId, jobTotal: d.jobTotal, businessUnitId: d.businessUnitId,
        appointment: { id: a.id, number: a.number, start: a.start, end: a.end, status: a.jobAppointmentStatus, techIds: a.technicians.map(t => t.id) }
      };
    };
    // The skills a job needs: [{ id, name }] (active ones only).
    const jobSkills = async jobId => {
      const d = await getJSON('/dispatch/job-edit-flyout/GetJobOverviewData?jobId=' + encodeURIComponent(jobId));
      if (!d || !Array.isArray(d.skills)) throw fail('bad', 'the job overview came back in a shape the Toolbox doesn\'t know');
      return d.skills.filter(s => s && s.active !== false).map(s => ({ id: s.id, name: norm(s.name) }));
    };
    // Every tech: [{ id, name, active, managed, skillIds, home }]. home (🧭 Tech Router): where the
    // tech's profile says they live, { lat, lon, town }, or null when it has no map point. Seen Oct
    // 2026: houseLatitude, houseLongitude, houseAddress ("street, City, MS 39402 USA").
    const technicians = async () => {
      const d = await getJSON('/app/api/data/technicians', 30000);
      if (!Array.isArray(d)) throw fail('bad', 'the technician list came back in a shape the Toolbox doesn\'t know');
      const coord = (v, max) => typeof v === 'number' && isFinite(v) && v !== 0 && Math.abs(v) <= max ? v : null;
      const townOf = a => { const p = String(a || '').split(',').map(norm).filter(Boolean); return p.length >= 3 ? p[p.length - 2] : ''; };
      return d.filter(t => t && t.id != null).map(t => {
        const lat = coord(t.houseLatitude, 90), lon = coord(t.houseLongitude, 180);
        return { id: t.id, name: norm(t.name), active: t.active !== false, managed: !!t.isManagedTechnician, skillIds: Array.isArray(t.skillIds) ? t.skillIds : null,
          home: lat != null && lon != null ? { lat, lon, town: townOf(t.houseAddress) } : null };
      });
    };
    // Is each tech already booked at that time? The same check the job panel makes. Seen Oct 2026:
    // ServiceTitan only lists the techs who ARE booked (a free tech isn't in the answer at all),
    // and leaves out one appointment (by its appointment id, not the job number), for "not counting
    // the job they're leaving". Returns [{ id, job, nonJob, recurring, booked, why }] for the techs
    // listed. Any listed entry it can't read stops the check (a renamed field must not read as free).
    const techsBooked = async (techIds, start, end, skipApptId) => {
      const d = await getJSON('/Job/TechniciansAreBooked', 15000, { technicianIds: techIds.map(idNum), start: new Date(start).toISOString(), end: new Date(end).toISOString(), repeatModel: null, originalAppointmentId: skipApptId == null ? null : idNum(skipApptId), originalAppointmentDefinitionId: null });
      const bad = () => fail('bad', 'the already-booked check came back in a shape the Toolbox doesn\'t know');
      if (!Array.isArray(d)) throw bad();
      const asked = techIds.map(String);
      return d.map(x => {
        if (!x || x.TechnicianId == null || asked.indexOf(String(x.TechnicianId)) < 0) throw bad();
        if (['IsBookedForJob', 'IsBookedForNonJobEvent', 'IsBookedForRecurring'].some(k => typeof x[k] !== 'boolean')) throw bad();
        const r = { id: x.TechnicianId, job: x.IsBookedForJob, nonJob: x.IsBookedForNonJobEvent, recurring: x.IsBookedForRecurring };
        r.booked = r.job || r.nonJob || r.recurring;
        r.why = r.nonJob ? 'has a non-job event then (meeting, time off...)' : r.recurring ? 'has a recurring event then' : 'is already booked on another job then';
        return r;
      });
    };
    // Every job on a day, for every branch and team: the same data the Dispatch board loads
    // (/Dispatch/Data), without the board's filters. Seen Oct 2026: { Technicians: [{ Id,
    // Assignments: [{ Id (appointment id), Start, End, AppointmentStatus }] }] }, about 2 MB and under
    // a second. Returns [{ techId, apptId, start, end, status }].
    const daySchedule = async dayIso => {
      const d = await getJSON('/Dispatch/Data', 30000, { date: dayIso, filter: { businessUnitIds: [], teamIds: [], skillIds: [] } });
      const bad = () => fail('bad', 'the day\'s full schedule came back in a shape the Toolbox doesn\'t know');
      if (!d || !Array.isArray(d.Technicians)) throw bad();
      const out = [];
      d.Technicians.forEach(t => {
        if (!t || t.Id == null || !Array.isArray(t.Assignments)) throw bad();
        t.Assignments.forEach(a => {
          if (!a || a.Id == null || !a.Start || !a.End || isNaN(new Date(a.Start)) || isNaN(new Date(a.End))) throw bad();
          out.push({ techId: t.Id, apptId: a.Id, start: a.Start, end: a.End, status: norm(a.AppointmentStatus) });
        });
      });
      return out;
    };
    // ---- For 🧭 Tech Router (only read, never changed) ----
    // A whole Jobs Tray list, every page: 'Unassigned' for a day, or 'Hold' (every hold: the day
    // doesn't change it), for the given branches. Seen Oct 2026: { Jobs: [...], Count }, each job with
    // Id (appointment), JobId, Customer, CustomerPhone, Type, TypeId, Priority, Duration (seconds),
    // Start, End, CreatedOn, Zip, City, Latitude, Longitude (the job's map point; JobLatitude and
    // JobLongitude are there too but empty, Oct 29 2026), Tags, Technicians. The raw rows.
    const getJobs = async (kind, dayIso, buIds) => {
      const PAGE = 500;
      const page = skip => getJSON('/Dispatch/GetJobs', 30000, { JobType: kind, Date: dayIso, QueryFilter: { Skip: skip, Take: PAGE, Start: {}, Created: {}, BusinessUnitIds: buIds || [] } });
      const first = await page(0);
      if (!first || !Array.isArray(first.Jobs)) throw fail('bad', 'the ' + (kind === 'Hold' ? 'Hold' : 'Unassigned') + ' list came back in a shape the Toolbox doesn\'t know');
      const total = Number(first.Count) || first.Jobs.length, skips = [];
      for (let skip = PAGE; skip < Math.min(total, 5000); skip += PAGE) skips.push(skip);
      const rest = await Promise.all(skips.map(page));
      return rest.reduce((all, pg) => all.concat(pg && Array.isArray(pg.Jobs) ? pg.Jobs : []), first.Jobs.slice());
    };
    // Where a job is, from its job panel: { zip, city, techIds, apptId, customer }, for its first
    // appointment that isn't canceled (status 5). Works without permission to open the job record.
    const jobPlace = async jobId => {
      const appts = await jobAppointments(jobId);
      const a = appts.find(x => x.status !== 5) || appts[0];
      if (!a) throw fail('bad', 'job #' + jobId + ' has no appointments');
      const d = await getJSON('/dispatch/job-edit-flyout/GetJobEditFlyoutData?appointmentId=' + encodeURIComponent(a.id));
      const la = d && d.locationAddress;
      if (!la || typeof la !== 'object') throw fail('bad', 'the job panel came back in a shape the Toolbox doesn\'t know (no address)');
      const ja = Array.isArray(d.jobAppointments) ? d.jobAppointments.find(x => x && String(x.id) === String(a.id)) : null;
      const techIds = ja && Array.isArray(ja.technicians) ? ja.technicians.map(t => t && t.id).filter(x => x != null).map(String) : [];
      const z = /\b(\d{5})/.exec(String(la.zip == null ? '' : la.zip));
      return { zip: z ? z[1] : '', city: norm(la.city), techIds, apptId: a.id, customer: d.customer && typeof d.customer === 'object' ? norm(d.customer.name) : '' };
    };
    const assignTechs = (apptId, techIds) => getJSON('/dispatch/job-edit-flyout/AssignTechnicians', 20000, { appointmentId: idNum(apptId), technicianIds: techIds.map(idNum) });
    const unassignTechs = (apptId, techIds) => getJSON('/dispatch/job-edit-flyout/UnassignTechnicians', 20000, { appointmentId: idNum(apptId), technicianIds: techIds.map(idNum) });
    // ---- Confirming appointments (Customer Texts → 📥 Check replies). The same request the job
    // panel's ⋮ menu sends for Confirm / Remove confirmation (seen Oct 2026).
    // An appointment's confirmed flag and status, read fresh: { confirmed, status }, or throws.
    const apptConfirmed = async (apptId, ms) => {
      const d = await getJSON('/dispatch/job-edit-flyout/GetJobEditFlyoutData?appointmentId=' + encodeURIComponent(apptId), ms);
      const a = d && Array.isArray(d.jobAppointments) ? d.jobAppointments.find(x => x && String(x.id) === String(apptId)) : null;
      if (!a) throw fail('bad', 'the appointment wasn\'t found');
      if (typeof a.isConfirmed !== 'boolean') throw fail('bad', 'the appointment came back in a shape the Toolbox doesn\'t know (no confirmed flag)');
      return { confirmed: a.isConfirmed, status: a.jobAppointmentStatus, start: a.start || null };
    };
    // A job's appointments, as the job panel lists them: [{ id, status, start }] (seen Oct 2026:
    // status 0 = Scheduled, 4 = Done, 5 = Canceled). Works without permission to open the job record.
    const jobAppointments = async jobId => {
      const d = await getJSON('/dispatch/job-edit-flyout/GetJobAppointments?jobId=' + encodeURIComponent(jobId));
      if (!Array.isArray(d) || d.some(a => !a || a.id == null)) throw fail('bad', 'the job\'s appointments came back in a shape the Toolbox doesn\'t know');
      return d.map(a => ({ id: a.id, status: a.status, start: a.start || null }));
    };
    const setConfirmed = (apptId, on) => getJSON('/dispatch/job-edit-flyout/UpdateJobAppointmentIsConfirmed', 20000, { jobAppointmentId: idNum(apptId), isConfirmed: !!on });
    return { getJSON, pool, NOT_RUN, haltNote, SIGNED_OUT, isSignedOut, isNoPermission, job, jobEdit, chatThread, chatMessages, customerPhones, code,
      appointment, jobSkills, technicians, techsBooked, daySchedule, assignTechs, unassignTechs, apptConfirmed, setConfirmed, jobAppointments, getJobs, jobPlace };
  })();

  // ===================================================================
  // The Dispatch board (ServiceTitan's new Dispatch Center, Oct 2026)
  // The new board is built in its own sealed-off part of the page (a shadow root), and it only
  // draws the rows that are on screen. So the Toolbox:
  //   - finds things on the board by the board's own test labels (data-cy), never by position,
  //   - reads the board's data with the same requests the board makes (every tech and job on the
  //     day, with tags and today's history), so jobs scrolled out of view still count,
  //   - reads which branches the board is filtered to from where the board keeps it.
  // Only the Day view is supported: on the Week view the tools say to switch to Day.
  // ===================================================================
  const board = (() => {
    const HOST_RE = /^SERVICETITAN-DISPATCH-CENTER(-|$)/i;
    const PAGE_RE = /^#\/widget-app\/dispatch-center/i;
    const HOME = '#/widget-app/dispatch-center?orientation=horizontal&timeframe=day';
    const onPage = () => PAGE_RE.test(location.hash);
    let hostEl = null, lastMiss = 0;
    const host = () => {
      if (hostEl && hostEl.isConnected) return hostEl;
      hostEl = null;
      if (!onPage() || Date.now() - lastMiss < 400) return null;
      hostEl = Array.from(document.querySelectorAll('*')).find(e => HOST_RE.test(e.tagName)) || null;
      if (!hostEl) lastMiss = Date.now();
      return hostEl;
    };
    const root = () => { const h = host(); return (h && h.shadowRoot) || null; };
    const q = sel => { const r = root(); return r ? r.querySelector(sel) : null; };
    const qa = sel => { const r = root(); return r ? Array.from(r.querySelectorAll(sel)) : []; };

    // 'day', 'week', 'loading' (the board is still drawing) or 'off' (not on the board).
    const view = () => {
      if (!onPage()) return 'off';
      const r = root();
      if (r) {
        if (r.querySelector('[data-cy^="ddb-"]')) return 'day';
        if (r.querySelector('[data-cy^="wdb-technician-header-"], [data-cy="wdb-schedule-row"]')) return 'week';
      }
      const tf = new URLSearchParams(location.hash.split('?')[1] || '').get('timeframe');
      return tf === 'week' ? 'week' : 'loading';
    };
    const isDay = () => view() === 'day';
    // What to say when a tool needs the board and it isn't showing.
    const need = () => {
      const v = view();
      return v === 'week' ? 'Switch the Dispatch board to Day view first.' : v === 'loading' ? 'Wait for the Dispatch board to finish loading.' : 'Open the Dispatch board first.';
    };
    // Where to come back to after a tool opens other pages.
    const homeHash = () => (onPage() ? location.hash : HOME);

    // ---- The day the board shows (its date button, e.g. "Tue, Oct 27, 2026") ----
    const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const DATE_RE = /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), ([A-Z][a-z]{2}) (\d{1,2}), (\d{4})\b/;
    let dateBtn = null;
    const day = () => {
      if (!(dateBtn && dateBtn.isConnected && DATE_RE.test(dateBtn.textContent))) dateBtn = qa('button').find(b => DATE_RE.test(b.textContent)) || null;
      const m = dateBtn && DATE_RE.exec(dateBtn.textContent);
      if (!m) return null;
      const d = new Date(Number(m[3]), MONTHS.indexOf(m[1].toLowerCase()), Number(m[2]));
      return isNaN(d) ? null : d;
    };
    const pad2 = n => String(n).padStart(2, '0');
    const iso = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    const isoT = d => iso(d) + 'T00:00:00';
    const sameDay = (a, b) => !!(a && b) && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const dayText = d => (d || day()) ? (d || day()).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'the day shown';

    // ---- The board's filter (branches, teams, skills), as the board keeps it ----
    // Seen Oct 2026: { selectedBusinessUnitIds: ['621842244'], selectedTeamIds: [], selectedSkillIds: [] }
    // under SHARED_DISPATCH_FILTERS_KEY_<company>_<user>, in this tab's session storage.
    const FILTER_KEY = /^SHARED_DISPATCH_FILTERS_KEY_/;
    const filters = () => {
      let uid = null;
      try { uid = window.App.Notifications.store.userId; } catch (e) {}
      const from = s => {
        try {
          const keys = Object.keys(s).filter(k => FILTER_KEY.test(k));
          const k = keys.find(x => uid != null && x.split('_').pop() === String(uid)) || (keys.length === 1 ? keys[0] : null);
          const v = k ? JSON.parse(s.getItem(k)) : null;
          return v && typeof v === 'object' && Array.isArray(v.selectedBusinessUnitIds) ? v : null;
        } catch (e) { return null; }
      };
      const v = from(sessionStorage) || from(localStorage);
      if (!v) return null;
      const nums = a => (Array.isArray(a) ? a : []).map(Number).filter(n => isFinite(n) && n > 0);
      return { bus: nums(v.selectedBusinessUnitIds), teams: nums(v.selectedTeamIds), skills: nums(v.selectedSkillIds) };
    };
    // The branches the board is filtered to (the Unassigned and Hold lists use the same ones).
    const bus = () => (filters() || {}).bus || [];

    // ---- Tags: { name, color, text } ----
    // Readable text on a tag's color (the day's data doesn't always say which).
    const inkFor = hex => {
      const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
      if (!m) return '#141414';
      const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#141414' : '#ffffff';
    };
    const tagOf = t => {
      const name = norm(t && (t.name != null ? t.name : t.TypeName));
      if (!name) return null;
      const color = norm(t.color || t.Color) || '#e3e5e8';
      return { name, color, text: norm(t.textColor || t.TextColor) || inkFor(color) };
    };

    // ---- Loading the board's day ----
    // A snapshot: { key, day, at, techs: [{ id, name, team, teamId }] in the board's order,
    //   techById, teams (names, board order), appts: Map(apptId -> appt), byJob: Map(jobId -> [appt]),
    //   byTech: Map(techId -> [appt]), history: Map(apptId -> [{ status, at, techId }]),
    //   shifts: Map(techId -> [{ start, end, off }]) (off: time off), events: Map(techId -> [{ start, end }])
    //   (meetings and other non-job events; their names aren't kept) }
    // An appt: { apptId, jobId, number, customer, customerId, start, end, windowStart, windowEnd,
    //   status, jobStatus, confirmed, bu, buName, jobType, jobTypeId, city, zip, tags, techs: [tech ids], techStatus }
    // Statuses are ServiceTitan's words (Scheduled, Dispatched, Working, Hold, Done...).
    const bad = what => Object.assign(new Error('the board\'s ' + what + ' came back in a shape the Toolbox doesn\'t know'), { kind: 'bad' });
    const toDate = v => { if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d; };
    let snap = null, loading = null, gen = 0;
    const listeners = [];
    const changed = () => listeners.forEach(fn => { try { fn(snap); } catch (e) {} });
    const keyFor = (d, f) => iso(d) + '|' + JSON.stringify(f || null);
    const load = async opts => {
      opts = opts || {};
      const d = opts.day || day();
      if (!d) throw Object.assign(new Error(need()), { kind: 'board' });
      const f = filters();
      const key = keyFor(d, f);
      if (!opts.fresh && snap && snap.key === key && Date.now() - snap.at < (opts.maxAge || 20000)) return snap;
      if (loading && loading.key === key && (!opts.fresh || loading.started >= Date.now() - 300)) return loading.p;
      const fl = f || { bus: [], teams: [], skills: [] };
      const start = iso(d), next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1), end = iso(next);
      const my = ++gen;
      const p = (async () => {
        const res = await st.getJSON('/dispatch-center/technicians/resources', 30000, { page: 1, pageSize: 100000, businessUnitIds: fl.bus, skillIds: fl.skills, teamIds: fl.teams,
          workstreamIds: [], shiftTypes: [], technicianIds: [], orderBy: ['Team', 'Technician'], includeSkills: false, applyTeamsManagement: true, includeLicenseTypes: false, startDate: start, endDate: end });
        if (!res || !Array.isArray(res.items)) throw bad('technician list');
        const techs = res.items.filter(t => t && t.id != null).map(t => ({ id: String(t.id), name: norm(t.name), team: norm(t.teamName), teamId: t.teamId }));
        const ids = techs.map(t => Number(t.id));
        const [sch, hist] = await Promise.all([
          ids.length ? st.getJSON('/dispatch-center/daily-assignments', 30000, { technicianIds: ids, startDate: start, endDate: end, page: 1, pageSize: ids.length, fields: 'Tags', showOnHoldJobs: true }) : { items: [] },
          ids.length && opts.history !== false ? st.getJSON('/dispatch-center/technicians/activity-history', 30000, { technicianIds: ids, start, page: 1, pageSize: ids.length })
            .catch(e => { if (st.isSignedOut(e)) throw e; return null; }) : null
        ]);
        if (!sch || !Array.isArray(sch.items)) throw bad('day');
        const appts = new Map(), byJob = new Map(), byTech = new Map(), techById = new Map(), shifts = new Map(), events = new Map();
        techs.forEach(t => { techById.set(t.id, t); byTech.set(t.id, []); shifts.set(t.id, []); events.set(t.id, []); });
        // Seen Oct 2026: shifts [{ type ('Normal', 'TimeOff'), startDate, endDate }], nonJobEvents
        // [{ appointmentStart, appointmentEnd }] for each day.
        const timed = (list, from, to, more) => (Array.isArray(list) ? list : []).map(x => {
          const a = toDate(x && x[from]), b = toDate(x && x[to]);
          return a && b && b > a ? Object.assign({ start: a, end: b }, more ? more(x) : {}) : null;
        }).filter(Boolean);
        sch.items.forEach(it => {
          if (!it || it.technicianId == null || !Array.isArray(it.technicianSchedule)) throw bad('day');
          const tid = String(it.technicianId);
          if (!shifts.has(tid)) { shifts.set(tid, []); events.set(tid, []); }
          it.technicianSchedule.forEach(dd => {
            if (!dd) return;
            timed(dd.shifts, 'startDate', 'endDate', x => ({ off: /^time\s*off$/i.test(norm(x.type)) })).forEach(x => shifts.get(tid).push(x));
            timed(dd.nonJobEvents, 'appointmentStart', 'appointmentEnd').forEach(x => events.get(tid).push(x));
          });
          it.technicianSchedule.forEach(dd => (dd && Array.isArray(dd.assignments) ? dd.assignments : []).forEach(a => {
            if (!a || a.appointmentId == null || a.jobId == null) return;
            const k = String(a.appointmentId);
            let x = appts.get(k);
            if (!x) {
              const num = norm(a.appointmentNumber);
              x = { apptId: k, jobId: String(a.jobId), number: num.indexOf('-') > -1 ? num.split('-').pop() : num, customer: norm(a.customerName), customerId: a.customerId || null,
                start: toDate(a.appointmentStart), end: toDate(a.appointmentEnd), windowStart: toDate(a.arrivalWindowStart), windowEnd: toDate(a.arrivalWindowEnd),
                status: norm(a.appointmentStatus), jobStatus: norm(a.jobStatus), confirmed: a.isConfirmed === true, bu: a.businessUnitId, buName: norm(a.businessUnitName),
                jobType: norm(a.jobTypeName), jobTypeId: a.jobTypeId != null ? String(a.jobTypeId) : '', city: norm(a.city), zip: norm(a.zip), tags: (Array.isArray(a.tags) ? a.tags : []).map(tagOf).filter(Boolean), techs: [], techStatus: {} };
              appts.set(k, x);
              if (!byJob.has(x.jobId)) byJob.set(x.jobId, []);
              byJob.get(x.jobId).push(x);
            }
            if (x.techs.indexOf(tid) < 0) x.techs.push(tid);
            x.techStatus[tid] = norm(a.assignmentStatus);
            if (!byTech.has(tid)) byTech.set(tid, []);
            if (byTech.get(tid).indexOf(x) < 0) byTech.get(tid).push(x);
          }));
        });
        // Today's history for each appointment: Dispatched, Arrived, Done... with the time.
        const history = new Map();
        ((hist && Array.isArray(hist.items)) ? hist.items : []).forEach(t => (t && Array.isArray(t.technicianActivityHistory) ? t.technicianActivityHistory : []).forEach(e => {
          if (!e || e.jobAppointmentId == null) return;
          const at = toDate(e.activityTimestamp);
          if (!at) return;
          const k = String(e.jobAppointmentId);
          if (!history.has(k)) history.set(k, []);
          history.get(k).push({ status: norm(e.status), at, techId: String(t.technicianId) });
        }));
        history.forEach(list => list.sort((a, b) => a.at - b.at));
        const teams = [];
        techs.forEach(t => { if (t.team && teams.indexOf(t.team) < 0) teams.push(t.team); });
        return { key, day: d, at: Date.now(), filtersKnown: !!f, techs, techById, teams, appts, byJob, byTech, history, hasHistory: !!hist, shifts, events };
      })();
      loading = { key, p, started: Date.now() };
      try {
        const s = await p;
        // A newer load for another day may have finished first: keep the newest.
        if (my === gen || !snap || snap.key !== key) { snap = s; changed(); }
        return s;
      } finally { if (loading && loading.p === p) loading = null; }
    };
    const latest = () => (snap && day() && snap.key === keyFor(day(), filters()) ? snap : null);
    // Keeps the snapshot in step with the board: a new day or filter is loaded right away.
    let watchKey = '';
    const watch = () => {
      if (!isDay()) return;
      const d = day();
      if (!d) return;
      const k = keyFor(d, filters());
      if (k === watchKey && snap && snap.key === k) return;
      watchKey = k;
      load().catch(() => {});
    };

    // ---- Canceled appointments ----
    const isCanceled = s => /^cancell?ed$/i.test(norm(s));
    const live = x => !isCanceled(x.status);

    // ---- What the board's data says about a job or a tech ----
    const apptsOf = j => (snap && snap.byJob.get(String(j))) || [];
    const jobOfAppt = a => { const x = snap && snap.appts.get(String(a)); return x ? x.jobId : null; };
    const techName = id => { const t = snap && snap.techById.get(String(id)); return t ? t.name : ''; };
    const firstName = name => { const w = norm(name).split(' ')[0] || ''; return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''; };
    // A job on the board's day: { jobId, customer, customerId, tech (first name), tags, appts } or null.
    const job = j => {
      const list = apptsOf(j).filter(live);
      if (!list.length) return null;
      const x = list[0];
      const tags = [];
      list.forEach(a => a.tags.forEach(t => { if (!tags.some(y => y.name === t.name)) tags.push(t); }));
      return { jobId: String(j), customer: x.customer, customerId: x.customerId, tech: firstName(techName(x.techs[0])), tags, appts: list };
    };
    // A tech's jobs on the board's day (job numbers, canceled left out).
    const techJobs = id => {
      const out = [];
      ((snap && snap.byTech.get(String(id))) || []).forEach(a => { if (live(a) && out.indexOf(a.jobId) < 0) out.push(a.jobId); });
      return out;
    };
    // Today's history of a job's appointments, oldest first: [{ status, at, techId }].
    const historyOf = j => {
      const out = [];
      apptsOf(j).forEach(a => ((snap && snap.history.get(a.apptId)) || []).forEach(e => out.push(e)));
      return out.sort((a, b) => a.at - b.at);
    };

    // ---- Things clicked on the board ----
    // Works from the click itself (its path goes into the board's sealed-off part) or an element.
    const findUp = (from, test) => {
      if (from && typeof from.composedPath === 'function') return from.composedPath().find(n => n && n.nodeType === 1 && test(n)) || null;
      for (let n = from; n; n = n.parentNode || n.host) if (n.nodeType === 1 && test(n)) return n;
      return null;
    };
    const isCard = n => n.getAttribute('data-cy') === 'wdb-job-appt-card' && /^\d+$/.test(n.getAttribute('data-job-appointment-id') || '');
    const isTrayRow = n => n.tagName === 'TR' && n.hasAttribute('data-grid-row-index') && !!n.querySelector('[data-cy="dc-jt-job-appointment-cell"]');
    const isTechHeader = n => /^ddb-technician-header-/.test(n.getAttribute('data-cy') || '') && /^\d+$/.test(n.getAttribute('data-technician-id') || '');
    const rowJob = tr => { const c = tr && tr.querySelector('[data-cy="dc-jt-job-appointment-cell"]'); const m = c && /^(\d+)(?:-\d+)?$/.exec(norm(c.textContent)); return m ? m[1] : null; };
    // What the Jobs Tray row knows about its job (the row's own data, when the page shares it).
    const rowItem = tr => {
      try {
        const k = Object.keys(tr).find(x => x.indexOf('__reactFiber') === 0);
        for (let f = k ? tr[k] : null, i = 0; f && i < 6; f = f.return, i++) {
          const d = f.memoizedProps && f.memoizedProps.dataItem;
          if (d && d.job) return d;
        }
      } catch (e) {}
      return null;
    };
    const rowInfo = tr => {
      const j = rowJob(tr);
      if (!j) return null;
      const d = rowItem(tr);
      const cell = tr.querySelector('[data-cy="dc-jt-customer-name-cell"]');
      const customer = norm((d && d.customer && d.customer.name) || (cell && cell.textContent));
      const tags = d && Array.isArray(d.tags) ? d.tags.map(tagOf).filter(Boolean) : [];
      return { jobId: j, customer, customerId: (d && d.customer && d.customer.id) || null, apptId: d && d.jobAppointment ? String(d.jobAppointment.id) : null, tags };
    };
    // A job clicked on the board (a job card, or a row in the Jobs Tray): { jobId, apptId, row } or null.
    // A card whose job the Toolbox hasn't loaded yet comes back with jobId null.
    const clickedJob = from => {
      const c = findUp(from, isCard);
      if (c) { const a = c.getAttribute('data-job-appointment-id'); return { jobId: jobOfAppt(a), apptId: a, row: null }; }
      const tr = findUp(from, isTrayRow);
      if (tr) { const j = rowJob(tr); return j ? { jobId: j, apptId: null, row: tr } : null; }
      return null;
    };
    const clickedTech = from => { const h = findUp(from, isTechHeader); return h ? h.getAttribute('data-technician-id') : null; };
    const trayRows = () => qa('tr[data-grid-row-index]').filter(tr => visible(tr) && rowJob(tr));
    const trayTab = () => {
      const t = qa('button[data-cy^="custom-tab-item-"]').find(b => b.getAttribute('aria-selected') === 'true');
      return t ? norm(t.textContent).replace(/\s*\d+$/, '') : '';
    };

    // ---- Highlights inside the board ----
    // A tool's <style> is put inside the board's sealed-off part (styles outside it can't reach
    // the board), and put back if the board is redrawn. Jobs Tray rows get the job number as
    // data-st-job so they can be highlighted too.
    const styles = new Set();
    const mount = s => { styles.add(s); const r = root(); if (r && s.parentNode !== r) r.appendChild(s); };
    const unmount = s => { styles.delete(s); if (s.parentNode) s.parentNode.removeChild(s); };
    const tagTray = () => {
      qa('tr[data-grid-row-index]').forEach(tr => {
        const j = rowJob(tr) || '';
        if ((tr.getAttribute('data-st-job') || '') !== j) { if (j) tr.setAttribute('data-st-job', j); else tr.removeAttribute('data-st-job'); }
      });
    };
    const cardSel = apptId => '[data-cy="wdb-job-appt-card"][data-job-appointment-id="' + apptId + '"]';
    // The highlight for picked jobs: an outline on their cards and a tint on their Jobs Tray rows.
    // Job and appointment numbers only (anything else is left out of the CSS).
    const jobsCss = (jobIds, color, soft, dashed) => {
      const ids = (jobIds || []).map(String).filter(j => /^\d+$/.test(j));
      if (!ids.length) return '';
      const cards = [];
      ids.forEach(j => apptsOf(j).forEach(a => { if (/^\d+$/.test(a.apptId)) cards.push(cardSel(a.apptId)); }));
      return (cards.length ? cards.join(',') + '{outline:3px ' + (dashed ? 'dashed' : 'solid') + ' ' + color + ' !important;outline-offset:-2px !important;box-shadow:0 0 0 3px ' + soft + ' !important}' : '') +
        ids.map(j => 'tr[data-st-job="' + j + '"] > td').join(',') + '{background:' + soft + ' !important;box-shadow:inset 0 2px 0 ' + color + ',inset 0 -2px 0 ' + color + ' !important}';
    };
    const techsCss = (techIds, color, soft) => {
      const ids = (techIds || []).map(String).filter(t => /^\d+$/.test(t));
      return ids.length ? ids.map(t => '[data-cy^="ddb-technician-header-"][data-technician-id="' + t + '"]').join(',') + '{outline:3px solid ' + color + ' !important;outline-offset:-3px !important;background:' + soft + ' !important;border-radius:6px}' : '';
    };

    // ---- The board's own Refresh (reloads its data: same day and filters, no page reload) ----
    const refresh = async () => {
      const b = q('button[aria-label="Refresh"]');
      if (!b || b.disabled) return false;
      // Not while one of the board's menus is open (the click would only close it).
      if (qa('[role="menu"]').some(visible)) return false;
      b.click();
      await wait(1200);
      try { await load({ fresh: true }); } catch (e) {}
      return true;
    };

    // ---- A tech's row, brought into view (the board only draws the rows on screen) ----
    // A tech's name on the board. (On Oct 27 2026 the one with the menu was marked
    // data-hover-popover-trigger; by Oct 29 that mark was gone, so the one showing is used.)
    const headerOf = id => {
      const all = qa('[data-cy^="ddb-technician-header-"][data-technician-id="' + id + '"]');
      return all.find(h => h.hasAttribute('data-hover-popover-trigger')) || all.find(visible) || all[0] || null;
    };
    const scrollerOf = el => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 4) return e; } return null; };
    const showTech = async id => {
      let h = headerOf(id);
      if (h && visible(h)) { h.scrollIntoView({ block: 'center' }); await wait(250); return headerOf(id); }
      const any = qa('[data-cy^="ddb-technician-header-"]')[0];
      const sc = any && scrollerOf(any);
      if (!sc) return null;
      const order = snap ? snap.techs.map(t => t.id) : [];
      const i = order.indexOf(String(id));
      // Jump near where the row should be, then step through the list until it's drawn.
      if (i > -1 && order.length) { sc.scrollTop = Math.max(0, (sc.scrollHeight * i / order.length) - sc.clientHeight / 2); await wait(300); }
      if ((h = headerOf(id))) { h.scrollIntoView({ block: 'center' }); await wait(250); return headerOf(id); }
      sc.scrollTop = 0; await wait(250);
      for (let n = 0; n < 60; n++) {
        if ((h = headerOf(id))) { h.scrollIntoView({ block: 'center' }); await wait(250); return headerOf(id); }
        const before = sc.scrollTop;
        sc.scrollTop += Math.max(200, sc.clientHeight * 0.8);
        await wait(180);
        if (sc.scrollTop === before) break;
      }
      return headerOf(id);
    };

    // ---- The whole Unassigned list for the board's day ----
    // All pages, for the board's branches, from the same request the board's Jobs Tray answers from.
    // { key, day, rows: [{ jobId, apptId, number, customer, customerId, tags, start, end, status,
    //   confirmed, bu, raw }], canceled (how many were left out) }. Kept for 30 seconds.
    let unCache = null;
    const unassigned = async (tool, opts) => {
      opts = opts || {};
      const d = day();
      if (!d) throw Object.assign(new Error(need()), { kind: 'board' });
      const key = keyFor(d, filters());
      if (!opts.fresh && unCache && unCache.key === key && Date.now() - unCache.at < 30000) return unCache;
      const PAGE = 500, ids = bus();
      const page = skip => st.getJSON('/Dispatch/GetJobs', 30000, { JobType: 'Unassigned', Date: isoT(d), QueryFilter: { Skip: skip, Take: PAGE, Start: {}, Created: {}, BusinessUnitIds: ids } });
      const first = await page(0);
      if (!first || !Array.isArray(first.Jobs)) {
        health.flag(tool || 'Toolbox', 'the Unassigned list came back in a shape the Toolbox doesn\'t know', '/Dispatch/GetJobs');
        throw Object.assign(new Error('the Unassigned list came back in a shape the Toolbox doesn\'t know'), { kind: 'bad' });
      }
      let raw = first.Jobs.slice();
      const total = Number(first.Count) || raw.length;
      for (let skip = PAGE; skip < Math.min(total, 5000); skip += PAGE) { const pg = await page(skip); if (pg && Array.isArray(pg.Jobs)) raw = raw.concat(pg.Jobs); }
      const rows = [];
      let canceled = 0;
      raw.forEach(x => {
        const j = String(x && x.JobId);
        if (!/^\d+$/.test(j)) return;
        // Appointment status 5 (or the word) is Canceled.
        if (x.AppointmentStatus === 5 || isCanceled(x.AppointmentStatus) || isCanceled(x.Status) || isCanceled(x.JobStatus)) { canceled++; return; }
        rows.push({ jobId: j, apptId: x.Id != null ? String(x.Id) : null, number: norm(x.AppointmentNumber), customer: norm(x.Customer), customerId: x.CustomerId || null,
          tags: (Array.isArray(x.Tags) ? x.Tags : []).map(tagOf).filter(Boolean), start: toDate(x.Start), end: toDate(x.End),
          status: norm(x.AppointmentStatus), confirmed: x.IsConfirmed === true, bu: x.BusinessUnitId, raw: x });
      });
      if (tool) health.clear(tool);
      unCache = { key, day: d, at: Date.now(), rows, canceled };
      return unCache;
    };

    const timer = setInterval(() => {
      watch();
      const r = root();
      if (!r) return;
      let any = false;
      styles.forEach(s => { if (s.textContent) any = true; if (s.parentNode !== r) r.appendChild(s); });
      if (any) tagTray();
    }, 700);

    return { host, root, q, qa, view, isDay, need, onPage, homeHash, HOME, day, dayText, iso, isoT, sameDay, filters, bus, load, latest, snap: () => snap, unassigned,
      onChange: fn => listeners.push(fn), apptsOf, jobOfAppt, job, techJobs, techName, firstName, historyOf, live, isCanceled, tagOf,
      clickedJob, clickedTech, rowInfo, trayRows, trayTab, mount, unmount, jobsCss, techsCss, refresh, showTech, headerOf, findUp,
      stop: () => { clearInterval(timer); Array.from(styles).forEach(unmount); } };
  })();

  // Customer cards: customers in sections (Needs a look, Confirmed, No reply…), one card each with
  // their name, job numbers, full phone number, a status line and anything they replied, plus
  // buttons to copy their name or number and to open their conversation in a new tab. A section
  // folds open or shut by its header (and stays that way while the panel is open). Used by
  // 📱 Customer Texts → 📥 Check replies, and meant to be reused by other tools.
  //   render(sections, notes): sections = [{ key, title, tone, open, items }], each item
  //     { customer, phone (10 digits or ''), jobs: [job numbers], status, said: [replies] or null }.
  //     A status starting with "replied" is shown as the label over the replies. tone: one of TONES.
  //     An item can carry actions: [{ label, title, style, onClick }], shown as its first buttons,
  //     and a note: a short line shown under the status (in blue). noPhone: true leaves out the
  //     phone line (for tools about jobs, not texting).
  //     notes: lines shown above the sections (or nothing).
  //   text(): the same, as plain text (for Copy results).
  const fmtPhone = n => { n = last10(n); return n.length === 10 ? '(' + n.slice(0, 3) + ') ' + n.slice(3, 6) + '-' + n.slice(6) : ''; };
  const customerCards = () => {
    // border, background, status text
    const TONES = { warn: ['var(--st-amber-l)', '#fffbf3', 'var(--st-amber)'], good: ['var(--st-green-l)', '#f5fbf7', 'var(--st-green-d)'], done: ['#b3cdea', '#f6f9fe', 'var(--st-blue-d)'],
      quiet: ['var(--st-line)', 'var(--st-soft)', 'var(--st-ink-2)'], faint: ['var(--st-line)', 'var(--st-bg)', 'var(--st-ink-3)'] };
    const box = el('div', 'max-height:calc(100vh - 290px);overflow:auto;margin:0 -4px 8px;padding:0 4px');
    const openState = {};
    let shown = [], shownNotes = [];
    const cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
    const pill = (label, onClick, title, style) => {
      const b = smallBtn(label, onClick, 'padding:3px 7px;' + (style || ''));
      if (title) b.title = title;
      b.addEventListener('mousedown', e => e.preventDefault());
      return b;
    };
    const copyPill = (label, text) => {
      const b = pill(label, async () => {
        const ok = await copy(text);
        b.textContent = ok ? '✓ Copied' : label;
        setTimeout(() => { b.textContent = label; }, 1500);
      }, text);
      return b;
    };
    const card = (x, tone) => {
      const [line, bg, ink] = TONES[tone] || TONES.quiet;
      const c = el('div', 'border:1px solid ' + line + ';background:' + bg + ';border-radius:10px;padding:8px 10px;margin-bottom:6px;font-size:12px;color:var(--st-ink)');
      c.className = 'st-cust-card';
      const top = el('div', 'display:flex;gap:6px;align-items:baseline');
      top.append(el('div', 'flex:1;font-weight:700;font-size:13px;user-select:text;word-break:break-word', x.customer || 'Job #' + (x.jobs[0] || '?')),
        el('div', 'color:var(--st-ink-3);white-space:nowrap;user-select:text', x.jobs.length ? '#' + x.jobs.join(', #') : ''));
      c.appendChild(top);
      if (!x.noPhone) c.appendChild(el('div', 'font-size:13px;margin-top:1px;user-select:text;color:' + (x.phone ? 'var(--st-ink)' : 'var(--st-ink-3)'), x.phone ? fmtPhone(x.phone) : 'no number found'));
      // The job's tags, and where it stands today (from the board's data, when it's on the board's day).
      const tags = [];
      (x.tags || [].concat.apply([], (x.jobs || []).map(j => { const b = board.job(j); return b ? b.tags : []; }))).forEach(t => { if (!tags.some(y => y.name === t.name)) tags.push(t); });
      const now = x.jobs && x.jobs.length === 1 ? jobNow(x.jobs[0]) : null;
      if (tags.length || now) {
        const meta = el('div', 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px');
        if (now) { const n = el('span', 'font-size:11px;color:var(--st-ink-2)', now.text); if (now.title) n.title = now.title; meta.appendChild(n); }
        if (tags.length) meta.appendChild(tagChips(tags, 3));
        c.appendChild(meta);
      }
      const said = x.said && x.said.length ? x.said : null;
      const replied = said && /^replied/i.test(x.status);
      if (x.status) c.appendChild(el('div', 'margin-top:4px;color:' + ink + ';font-weight:600', replied ? (/^replied$/i.test(x.status) ? '💬 They replied:' : '🛑 ' + cap(x.status) + ':') : cap(x.status)));
      if (x.note) c.appendChild(el('div', 'margin-top:3px;color:var(--st-blue-d);font-weight:600', x.note));
      if (said && !replied) c.appendChild(el('div', 'margin-top:3px;color:var(--st-ink-2)', 'They replied:'));
      (said || []).forEach(t => c.appendChild(el('div', 'margin-top:3px;padding:5px 7px;background:var(--st-bg);border-left:3px solid ' + line + ';border-radius:4px;font-size:13px;line-height:1.35;white-space:pre-wrap;word-break:break-word;user-select:text', t)));
      const btns = el('div', 'display:flex;gap:5px;flex-wrap:wrap;margin-top:6px');
      (x.actions || []).forEach(a => btns.appendChild(pill(a.label, a.onClick, a.title, a.style)));
      if (x.customer) btns.appendChild(copyPill('📋 Name', x.customer));
      if (x.phone) {
        btns.appendChild(copyPill('📋 Phone', fmtPhone(x.phone)));
        btns.appendChild(pill('💬 Open chat', () => { try { window.open(location.href.split('#')[0] + '#/ChatCenter/' + last10(x.phone), '_blank'); } catch (e) {} }, 'Opens their conversation in a new tab'));
      }
      if (btns.childNodes.length) c.appendChild(btns);
      return c;
    };
    const render = (sections, notes) => {
      shown = (sections || []).filter(s => s.items.length);
      shownNotes = (notes || []).filter(Boolean);
      const keep = box.scrollTop;
      box.textContent = '';
      shownNotes.forEach(t => box.appendChild(el('div', 'font-size:12px;color:var(--st-ink-2);background:var(--st-soft);border-radius:6px;padding:5px 7px;margin-bottom:6px;white-space:pre-wrap', t)));
      shown.forEach(s => {
        const sec = el('div', 'margin-bottom:4px');
        sec.className = 'st-cust-section';
        sec.setAttribute('data-title', s.title + ' (' + s.items.length + ')');
        const isOpen = () => openState[s.key] != null ? openState[s.key] : !!s.open;
        const body = el('div', 'display:' + (isOpen() ? 'block' : 'none'));
        const hd = el('button', FULL + 'text-align:left;padding:5px 2px;border:none;background:transparent;cursor:pointer;font:inherit;font-weight:700;color:var(--st-ink)');
        hd.type = 'button';
        const label = () => { hd.textContent = (isOpen() ? '▾ ' : '▸ ') + s.title + ' (' + s.items.length + ')'; };
        hd.onclick = () => { openState[s.key] = !isOpen(); body.style.display = isOpen() ? 'block' : 'none'; label(); };
        hd.addEventListener('mousedown', e => e.preventDefault());
        label();
        s.items.forEach(x => body.appendChild(card(x, s.tone)));
        sec.append(hd, body);
        box.appendChild(sec);
      });
      box.style.display = shown.length || shownNotes.length ? 'block' : 'none';
      box.scrollTop = keep;
    };
    const line = x => '• ' + (x.customer || 'job #' + (x.jobs[0] || '?')) + (x.phone ? '  ' + fmtPhone(x.phone) : '') + (x.jobs.length ? '  (#' + x.jobs.join(', #') + ')' : '') +
      (x.status ? ': ' + x.status : '') + (x.note ? ' (' + x.note + ')' : '') + (x.said && x.said.length ? ' ' + x.said.map(t => '"' + t + '"').join(' then ') : '');
    const text = () => shownNotes.concat(shown.map(s => s.title + ' (' + s.items.length + ')\n' + s.items.map(line).join('\n'))).join('\n\n');
    // Cards for the same customer with the same status become one (their job numbers together).
    const merge = items => {
      const out = [], by = new Map();
      items.forEach(x => {
        const k = [x.customer, x.phone, x.status].join('|');
        const had = by.get(k);
        if (had) { x.jobs.forEach(j => { if (had.jobs.indexOf(j) < 0) had.jobs.push(j); }); return; }
        const y = Object.assign({}, x, { jobs: x.jobs.slice() });
        by.set(k, y); out.push(y);
      });
      return out;
    };
    return { box, render, text, merge };
  };

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
        const row = el('div', 'border:1px solid var(--st-line);border-radius:8px;padding:7px;margin-bottom:8px;background:var(--st-soft)');
        const name = el('input', FULL + 'padding:5px 6px;border:1px solid var(--st-ctl);border-radius:5px;font:inherit;font-weight:600;color:var(--st-ink);background:var(--st-bg)');
        name.type = 'text'; name.value = n[0]; name.placeholder = namePlaceholder;
        name.oninput = () => { n[0] = name.value; };
        const text = el('textarea', FULL + 'margin-top:5px;padding:5px 6px;border:1px solid var(--st-ctl);border-radius:5px;font:inherit;font-size:12px;color:var(--st-ink);background:var(--st-bg);resize:vertical');
        text.rows = 3; text.value = n[1]; text.placeholder = textPlaceholder;
        text.oninput = () => { n[1] = text.value; };
        const tools = el('div', 'display:flex;gap:4px;margin-top:5px');
        const moveBy = d => () => { const j = i + d; if (j < 0 || j >= draft.length) return; const t = draft[i]; draft[i] = draft[j]; draft[j] = t; render(); };
        tools.append(
          smallBtn('↑', moveBy(-1), i === 0 ? 'opacity:.4' : ''),
          smallBtn('↓', moveBy(1), i === draft.length - 1 ? 'opacity:.4' : ''),
          smallBtn('Delete', () => { draft.splice(i, 1); render(); }, 'margin-left:auto;color:var(--st-red);border-color:var(--st-red-l)')
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
  // The Toolbox's look (2.0): matches the new Dispatch board. Colors are tokens (var(--st-…)) so
  // every tool shares one set; anything that goes inside the board uses plain colors instead.
  const sheet = el('style');
  sheet.id = ID + '-style';
  sheet.textContent = [
    '#' + ID + '{--st-ink:#141414;--st-ink-2:#4b4f55;--st-ink-3:#7b8087;--st-line:#e2e5e9;--st-ctl:#a6abb1;--st-bg:#ffffff;--st-soft:#f6f7f9;--st-soft-2:#eceff3;' +
      '--st-blue:#0265dc;--st-blue-d:#004491;--st-blue-s:#e8f2fe;--st-green:#1f7a3d;--st-green-d:#145c2c;--st-green-s:#e9f6ee;--st-green-l:#a6d8b6;' +
      '--st-red:#c4200d;--st-red-d:#8e1608;--st-red-s:#fdeceb;--st-red-l:#f2aaa2;--st-amber:#8f5300;--st-amber-s:#fff5e5;--st-amber-l:#f0cd8f;' +
      '--st-purple-s:#f4eefa;--st-purple-l:#cdb6e2;--st-head:#16202e;' +
      'font-family:"Nunito Sans",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}',
    '#' + ID + ' *{box-sizing:border-box}',
    '#' + ID + ' button{font-family:inherit;transition:background-color .12s,border-color .12s,box-shadow .12s,filter .12s}',
    '#' + ID + ' button:not(:disabled):hover{filter:brightness(.96)}',
    '#' + ID + ' button:focus-visible,#' + ID + ' input:focus-visible,#' + ID + ' select:focus-visible,#' + ID + ' textarea:focus-visible{outline:none;box-shadow:0 0 0 3px #a9d1ff !important;border-color:var(--st-blue) !important}',
    '#' + ID + ' input[type=checkbox],#' + ID + ' input[type=radio]{accent-color:var(--st-blue);margin:0;flex:none}',
    '#' + ID + ' select{cursor:pointer}',
    '#' + ID + ' ::-webkit-scrollbar{width:8px;height:8px}#' + ID + ' ::-webkit-scrollbar-thumb{background:#c9ced4;border-radius:8px}#' + ID + ' ::-webkit-scrollbar-track{background:transparent}',
    '#' + ID + ' .st-tile:hover{border-color:var(--st-blue) !important;background:var(--st-blue-s) !important;filter:none !important}',
    '#' + ID + ' .st-hbtn:hover{background:rgba(255,255,255,.16) !important;filter:none !important}',
    '#' + ID + '.st-min > :not(.st-head){display:none !important}',
    // Nothing inside is ever wider than the window (no sideways scrolling): one-column lists take
    // the window's width instead of the widest thing in them (a long tag name in a list, say),
    // lists and boxes shrink to fit, and a long word wraps.
    '#' + ID + '{overflow-wrap:break-word}',
    '#' + ID + ' [style*="display: grid"]{grid-template-columns:minmax(0,1fr)}',
    '#' + ID + ' select,#' + ID + ' input,#' + ID + ' textarea,#' + ID + ' pre{max-width:100%}',
    // The grips for making the Toolbox wider or narrower (its left edge and bottom-right corner).
    '#' + ID + ' .st-grip{position:absolute;cursor:ew-resize;z-index:3}',
    '#' + ID + ' .st-grip-l:hover,#' + ID + ' .st-grip.st-on{background-color:rgba(2,101,220,.18)}',
    '#' + ID + '.st-min .st-grip{display:none}',
    // Animations (2.0.1): short and quiet, and only in the Toolbox (never on the board). Skipped
    // when the computer is set to reduce motion.
    '@media (prefers-reduced-motion: no-preference){' +
      '@keyframes st-tb-open{from{opacity:0;transform:translateY(10px)}}' +
      '@keyframes st-tb-right{from{opacity:0;transform:translateX(14px)}}' +
      '@keyframes st-tb-left{from{opacity:0;transform:translateX(-14px)}}' +
      '@keyframes st-tb-drop{from{opacity:0;transform:translateY(-6px)}}' +
      '@keyframes st-tb-spin{to{transform:rotate(360deg)}}' +
      // Opening the Toolbox; a tool sliding in from the right, the menu from the left.
      '#' + ID + '{animation:st-tb-open .2s cubic-bezier(.2,.8,.2,1)}' +
      '#' + ID + ' > .st-view{animation:st-tb-right .18s cubic-bezier(.2,.8,.2,1)}' +
      '#' + ID + ' > .st-view-menu{animation-name:st-tb-left}' +
      // The green, yellow and red bars under the title bar.
      '#' + ID + ' > .st-bar{animation:st-tb-drop .18s ease-out}' +
      // Tiles lift a little on hover; buttons dip when pressed.
      '#' + ID + ' button{transition:background-color .12s,border-color .12s,box-shadow .12s,filter .12s,transform .08s}' +
      '#' + ID + ' button:not(:disabled):active{transform:scale(.97)}' +
      '#' + ID + ' .st-tile{transition:background-color .12s,border-color .12s,box-shadow .15s,transform .15s}' +
      '#' + ID + ' .st-tile:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(16,24,40,.10)}' +
      '#' + ID + ' .st-tile:active{transform:translateY(0) scale(.99)}' +
      // A small spinner on a button while it loads.
      '#' + ID + ' .st-busy::before{content:"";display:inline-block;width:9px;height:9px;margin-right:6px;vertical-align:-1px;' +
        'border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:st-tb-spin .7s linear infinite}' +
    '}'
  ].join('\n');
  const motionOK = () => { try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; } };
  (document.head || document.documentElement).appendChild(sheet);
  const DEFAULT_WIDTH = 340, MIN_WIDTH = 300;
  const maxWidth = () => Math.max(MIN_WIDTH, Math.min(900, innerWidth - 16));
  const resized = [];   // the tools' own fitting to the window, called after the Toolbox is resized
  const afterResize = () => resized.forEach(fn => { try { fn(); } catch (e) {} });
  const panel = el('div', 'position:fixed;right:16px;bottom:16px;z-index:2147483647;box-sizing:border-box;width:' + DEFAULT_WIDTH + 'px;max-width:calc(100vw - 16px);' +
    'background:var(--st-bg);color:var(--st-ink);border:1px solid rgba(16,24,40,.14);border-radius:12px;box-shadow:0 14px 36px rgba(16,24,40,.24),0 2px 6px rgba(16,24,40,.12);' +
    'font-size:13px;line-height:1.4;overflow:hidden;text-align:left');
  panel.id = ID;

  // While a tool is picking jobs, pressing on a job must not start a drag or move the page.
  // (The Jobs Tray under the board takes focus when pressed, and the browser can jump back to
  // its top; the board opens the job panel.) So the press is swallowed, the tool handles the click, and if anything still
  // scrolled, the scroll is put back.
  const pickers = [];   // one per tool: { active: is it picking right now?, hit: is this target something it picks? }
  let pressSnap = null;
  // Every scrolling box from the pressed spot outward (through the board's sealed-off part too).
  const scrollersOf = node => {
    const out = [];
    for (let e = node; e && e !== document.documentElement; e = e.parentElement || (e.parentNode && e.parentNode.host) || null) {
      if (e.nodeType === 1 && (e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1)) out.push(e);
    }
    const root = document.scrollingElement || document.documentElement;
    if (out.indexOf(root) < 0) out.push(root);
    return out.map(e => [e, e.scrollTop, e.scrollLeft]);
  };
  const putBack = snap => snap && snap.forEach(([e, top, left]) => { if (e.scrollTop !== top) e.scrollTop = top; if (e.scrollLeft !== left) e.scrollLeft = left; });
  const pressGuard = e => {
    if (!onBoard() || panel.contains(e.target) || !pickers.some(p => p.active() && p.hit(e))) return;
    if (e.type === 'click') {
      // Let the tool handle the click; undo any jump after the page has had its turn.
      const snap = pressSnap; pressSnap = null;
      requestAnimationFrame(() => putBack(snap));
      setTimeout(() => putBack(snap), 150);
      return;
    }
    if (e.type === 'pointerdown') pressSnap = scrollersOf((e.composedPath && e.composedPath()[0]) || e.target);
    // No drag, no focus change, no text selection, and the board doesn't open the job panel.
    if (e.type === 'pointerdown' || e.type === 'mousedown') e.preventDefault();
    e.stopPropagation(); e.stopImmediatePropagation();
  };
  const PRESS_EVENTS = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
  PRESS_EVENTS.forEach(t => window.addEventListener(t, pressGuard, true));

  // ---- Small pieces shared by the job lists and result cards ----
  // A tag as ServiceTitan colors it.
  const tagChip = t => {
    const c = el('span', 'display:inline-block;max-width:118px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle;' +
      'padding:0 5px;border-radius:4px;font-size:10.5px;line-height:16px;font-weight:600;background:' + t.color + ';color:' + t.text, t.name);
    c.title = t.name;
    return c;
  };
  // Up to `max` tags, then "+n".
  const tagChips = (tags, max) => {
    const box = el('span', 'display:inline-flex;gap:3px;flex-wrap:wrap;align-items:center');
    (tags || []).slice(0, max || 3).forEach(t => box.appendChild(tagChip(t)));
    if ((tags || []).length > (max || 3)) {
      const more = el('span', 'font-size:10.5px;color:var(--st-ink-3);font-weight:600', '+' + (tags.length - (max || 3)));
      more.title = tags.slice(max || 3).map(t => t.name).join(', ');
      box.appendChild(more);
    }
    return box;
  };
  const hm = d => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const STATUS_ICON = { Scheduled: '🗓️', Dispatched: '🚚', Working: '🔧', Hold: '⏸️', Done: '✅', Canceled: '✖️', Arrived: '📍' };
  // Where a job on the board's day stands, from the board's data and today's history:
  // { text: '🔧 Working · arrived 10:42 AM', title: the whole history } or null (not on the board's day).
  const jobNow = j => {
    const b = board.job(j);
    if (!b) return null;
    const a = b.appts.find(x => x.status && !/^scheduled$/i.test(x.status)) || b.appts[0];
    const hist = board.historyOf(j);
    const last = hist[hist.length - 1];
    let text = '';
    if (/^scheduled$/i.test(a.status) || !a.status) {
      text = '🗓️ ' + (a.windowStart && a.windowEnd ? hm(a.windowStart) + '–' + hm(a.windowEnd) : a.start ? hm(a.start) : 'Scheduled');
    } else {
      // 🚚 Dispatched 10:20 AM when the last event is the status itself; 🔧 Working · arrived 10:42 AM when not.
      const same = last && String(last.status).toLowerCase() === String(a.status).toLowerCase();
      text = (STATUS_ICON[a.status] || '•') + ' ' + a.status + (last ? (same ? ' ' : ' · ' + String(last.status).toLowerCase() + ' ') + hm(last.at) : '');
    }
    const title = hist.length ? 'Today: ' + hist.map(e => e.status + ' ' + hm(e.at)).join(' → ') : '';
    return { text, title };
  };

  // ===================================================================
  // Picking jobs: shared by Job Notifications, Business Unit, Customer Texts and Move Jobs.
  // With 🖱️ Pick on board on, clicking a job on the board, or a row in the Jobs Tray below it,
  // adds it (click again to take it off). Jobs can also be typed in, a whole Jobs Tray page added
  // at once, or every job with a tag. Each job shows its customer, its tags and where it stands
  // today. Picked jobs are highlighted only while their tool is open.
  //   opts: { color, soft, max (a number, or a function for a limit that changes),
  //           fullText(max) (optional: what to say when the list is full), shown() (tool open
  //           and using picked jobs), busy() (a run is going), say(text), changed() (the list changed),
  //           tool (its name, for the yellow bar) }
  //   Optional:
  //     onTech(techId): clicking a tech's name on the board while picking calls this (and the click
  //       goes no further), for tools that add a tech's whole day.
  //     badge(job): a short mark shown before the job number in the list (🔔 / 🔕).
  //     css(ids): more highlight styling, added after the usual outline (only while shown()).
  //     hint: what to say when picking turns on, and in the empty list.
  //     byTag: false to leave out ＋ Jobs with a tag.
  // ===================================================================
  const jobPicker = opts => {
    const picked = new Map();   // job number -> { label (usually the customer's name), tags }
    let picking = false, enabled = true;
    const style = el('style');   // goes inside the board (board.mount)
    const infoOf = j => {
      const b = board.job(j);
      if (b) return { label: b.customer, tags: b.tags, customerId: b.customerId };
      const tr = board.trayRows().find(r => board.rowInfo(r) && board.rowInfo(r).jobId === String(j));
      const t = tr && board.rowInfo(tr);
      return t ? { label: t.customer, tags: t.tags, customerId: t.customerId } : { label: '', tags: [] };
    };
    const say = t => opts.say && opts.say(t);
    const box = el('div', 'display:grid;gap:6px');
    const head = el('div', 'display:flex;gap:6px;align-items:center');
    const count = el('span', 'font-size:12px;font-weight:800;margin-right:auto;color:var(--st-ink)');
    const pickBtn = smallBtn('🖱️ Pick on board', () => setPicking(!picking), 'flex:1');
    const allBtn = smallBtn('+ Tray page', () => addListTab(), 'flex:1');
    allBtn.title = 'Adds every job showing in the Jobs Tray under the board (the tab and page that are open)';
    const clearBtn = smallBtn('Clear', () => { if (opts.busy()) return; picked.clear(); changed(); say('List cleared.'); }, 'border-color:transparent;background:transparent;color:var(--st-blue);padding:2px 6px;min-height:22px');
    head.append(count, clearBtn);
    const pickRow = el('div', 'display:flex;gap:6px');
    pickRow.append(pickBtn, allBtn);
    box.appendChild(pickRow);
    const list = el('div', 'max-height:180px;overflow:auto;border:1px solid var(--st-line);border-radius:8px;background:var(--st-bg)');
    const typedRow = el('div', 'display:flex;gap:6px');
    const typed = el('input', 'flex:1;min-width:0;' + FIELD);
    typed.type = 'text'; typed.placeholder = 'Or type job #s (any day)';
    const typedAdd = smallBtn('Add', () => addTyped());
    typed.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addTyped(); } };
    typedRow.append(typed, typedAdd);
    // ＋ Jobs with a tag…: every job on the board's day (timeline and Unassigned list) with that tag.
    const tagSel = el('select', 'flex:1;min-width:0;' + FIELD + 'cursor:pointer');
    tagSel.title = 'Adds every job on the board\'s day with the tag you pick: the timeline and the whole Unassigned list (your board\'s branches). Take any off with ✕.';
    const tagRow = el('div', 'display:flex;gap:6px');
    tagRow.appendChild(tagSel);
    box.insertBefore(head, pickRow);
    box.append(list, typedRow);
    if (opts.byTag !== false) box.appendChild(tagRow);

    const paint = () => {
      const ids = Array.from(picked.keys());
      style.textContent = opts.shown() ? board.jobsCss(ids, opts.color, opts.soft) + (opts.css && ids.length ? opts.css(ids) : '') : '';
      if (style.textContent) board.mount(style);
    };
    const HINT = opts.hint || 'Click jobs on the board, or rows in the Jobs Tray below it, to add them. Click again to take one off.';
    const row = j => {
      const info = picked.get(j) || {};
      const live = board.job(j);
      const tags = live ? live.tags : info.tags || [];
      const now = jobNow(j);
      const r = el('div', 'display:flex;gap:6px;align-items:flex-start;padding:5px 8px;border-bottom:1px solid var(--st-line);font-size:12px');
      const body = el('div', 'flex:1;min-width:0');
      const top = el('div', 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap');
      const mark = opts.badge ? opts.badge(j) : '';
      if (mark) top.appendChild(el('span', 'margin-right:4px', mark));
      const lab = (live && live.customer) || info.label || '';
      top.append(el('b', 'color:var(--st-ink)', '#' + j), document.createTextNode(lab ? '  ' + lab : ''));
      top.title = lab;
      body.appendChild(top);
      if (now || tags.length) {
        const sub = el('div', 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:2px');
        if (now) { const n = el('span', 'font-size:11px;color:var(--st-ink-2);white-space:nowrap', now.text); if (now.title) n.title = now.title; sub.appendChild(n); }
        if (tags.length) sub.appendChild(tagChips(tags, 2));
        body.appendChild(sub);
      }
      const x = smallBtn('✕', () => { if (opts.busy()) return; picked.delete(j); changed(); }, 'padding:0 7px;min-height:22px');
      x.title = 'Take this job off the list';
      r.append(body, x);
      return r;
    };
    const render = () => {
      count.textContent = plural(picked.size, 'job') + ' picked';
      pickBtn.textContent = picking ? '🖱️ Picking: ON' : '🖱️ Pick on board';
      pickBtn.style.background = picking ? opts.color : '';
      pickBtn.style.color = picking ? '#fff' : '';
      pickBtn.style.borderColor = picking ? opts.color : '';
      list.textContent = '';
      if (!picked.size) list.appendChild(el('div', 'padding:8px 10px;font-size:12px;color:var(--st-ink-3)', picking ? HINT : 'Press 🖱️ Pick on board, add a Jobs Tray page, a tag, or type job numbers.'));
      picked.forEach((info, j) => list.appendChild(row(j)));
      [pickBtn, allBtn, clearBtn, typed, typedAdd, tagSel].forEach(x => { x.disabled = !enabled; x.style.opacity = enabled ? '1' : '.5'; });
      fillTags();
      paint();
    };
    const changed = () => { render(); if (opts.changed) opts.changed(); };
    const add = (j, info) => {
      if (picked.has(j)) return false;
      const max = typeof opts.max === 'function' ? opts.max() : opts.max;
      if (max && picked.size >= max) { say(opts.fullText ? opts.fullText(max) : '⚠️ The list is full (' + max + ' jobs per run).'); return false; }
      const known = infoOf(j);
      const given = typeof info === 'string' ? { label: info } : (info || {});
      picked.set(j, { label: given.label || known.label || '', tags: (given.tags && given.tags.length ? given.tags : known.tags) || [], customerId: given.customerId || known.customerId || null });
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
    // Every job showing in the Jobs Tray (the open tab and page).
    const addListTab = () => {
      if (opts.busy()) return;
      if (!onBoard()) { say(board.need()); return; }
      const rows = board.trayRows().map(board.rowInfo).filter(Boolean);
      if (!rows.length) { say('The Jobs Tray under the board is empty. Open a tab there (Unassigned, On Hold, …) first.'); return; }
      const caption = board.trayTab();
      let n = 0;
      rows.forEach(x => { if (add(x.jobId, { label: x.customer, tags: x.tags, customerId: x.customerId })) n++; });
      changed();
      say('Added ' + plural(n, 'job') + (caption ? ' from the ' + caption + ' tab' : ' from the Jobs Tray') + ' (the page showing).');
    };
    // ＋ Jobs with a tag…: the tags on the board's day, most used first.
    let tagKey = null, unassignedSeen = null;
    const fillTags = force => {
      if (opts.byTag === false) return;
      const s = board.latest();
      const counts = new Map();
      const addTag = (name, j) => { if (!counts.has(name)) counts.set(name, new Set()); counts.get(name).add(j); };
      if (s) s.appts.forEach(a => { if (board.live(a)) a.tags.forEach(t => addTag(t.name, a.jobId)); });
      if (unassignedSeen && s && unassignedSeen.key === s.key) unassignedSeen.rows.forEach(r => r.tags.forEach(t => addTag(t.name, r.jobId)));
      const rows = Array.from(counts.entries()).map(([name, set]) => ({ name, n: set.size })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
      const key = (s ? s.key : 'none') + '|' + rows.map(r => r.name + ':' + r.n).join(',');
      if (!force && key === tagKey) return;
      tagKey = key;
      tagSel.textContent = '';
      const top = el('option', '', onBoard() ? (rows.length ? '＋ Jobs with a tag…' : '＋ Jobs with a tag (none on the board yet)') : '＋ Jobs with a tag (open the board)');
      top.value = '';
      tagSel.appendChild(top);
      rows.forEach(r => { const o = el('option', '', r.name + '  (' + plural(r.n, 'job') + (unassignedSeen ? '' : ' on the timeline') + ')'); o.value = r.name; tagSel.appendChild(o); });
      tagSel.value = '';
    };
    tagSel.addEventListener('mouseenter', () => fillTags());
    tagSel.addEventListener('focus', () => fillTags());
    tagSel.onchange = async () => {
      const name = tagSel.value;
      tagSel.value = '';
      if (!name || opts.busy()) return;
      if (!onBoard()) { say(board.need()); return; }
      say('Finding the jobs tagged ' + name + '…');
      try {
        const s = await board.load();
        const un = await board.unassigned(opts.tool || 'Toolbox');
        unassignedSeen = { key: s.key, rows: un.rows };
        const onLine = [], unas = [], seen = new Set();
        s.appts.forEach(a => { if (board.live(a) && a.tags.some(t => t.name === name) && !seen.has(a.jobId)) { seen.add(a.jobId); onLine.push(a.jobId); } });
        un.rows.forEach(r => { if (r.tags.some(t => t.name === name) && !seen.has(r.jobId)) { seen.add(r.jobId); unas.push(r); } });
        let n = 0;
        onLine.forEach(j => { if (add(j)) n++; });
        unas.forEach(r => { if (add(r.jobId, { label: r.customer, tags: r.tags, customerId: r.customerId })) n++; });
        changed();
        const all = onLine.length + unas.length;
        say(all ? 'Added ' + plural(n, 'job') + ' tagged ' + name + ' (' + onLine.length + ' on the timeline, ' + unas.length + ' unassigned)' + (n < all ? '. ' + plural(all - n, 'other was', 'others were') + ' already picked or didn\'t fit' : '') + '.' : 'No jobs tagged ' + name + ' on ' + board.dayText() + '.');
      } catch (e) { say('⚠️ ' + (st.isSignedOut(e) ? e.message : 'Couldn\'t load the board: ' + errText(e))); }
    };
    const setPicking = on => {
      picking = !!on && enabled && !opts.busy();
      if (picking && !onBoard()) say(board.need());
      else if (picking) say(HINT);
      if (picking) board.load().catch(() => {});
      render();
    };
    const toggle = (j, info) => {
      if (picked.has(j)) { picked.delete(j); say('Took #' + j + ' off. ' + plural(picked.size, 'job') + ' picked.'); }
      else if (add(j, info)) say('Added #' + j + '. ' + plural(picked.size, 'job') + ' picked.');
      changed();
    };
    const onClick = async e => {
      if (!picking || opts.busy() || !onBoard() || !opts.shown() || panel.contains(e.target)) return;
      const hit = board.clickedJob(e);
      const tech = !hit && opts.onTech ? board.clickedTech(e) : null;
      if (!hit && !tech) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (tech) { opts.onTech(tech); return; }
      if (hit.row) { const info = board.rowInfo(hit.row); if (info) toggle(info.jobId, { label: info.customer, tags: info.tags, customerId: info.customerId }); return; }
      let j = hit.jobId;
      if (!j) {
        // A card the Toolbox hasn't read yet (the board just changed): read the board, then add it.
        try { await board.load({ fresh: true }); } catch (err) {}
        j = board.jobOfAppt(hit.apptId);
        if (!j) { say('⚠️ Couldn\'t tell which job that is. Click it again in a moment.'); return; }
      }
      toggle(j);
    };
    window.addEventListener('click', onClick, true);
    pickers.push({ active: () => picking && !opts.busy() && opts.shown(), hit: e => !!board.clickedJob(e) || !!(opts.onTech && board.clickedTech(e)) });
    // The board's data arrived or changed: names, tags, history and highlights follow.
    board.onChange(() => { if (opts.shown()) render(); });
    render();
    return {
      box,
      size: () => picked.size,
      ids: () => Array.from(picked.keys()),
      has: j => picked.has(j),
      label: j => (picked.get(j) || {}).label || '',
      info: j => picked.get(String(j)) || null,
      tags: j => { const b = board.job(j); return b ? b.tags : ((picked.get(j) || {}).tags || []); },
      remove: j => { picked.delete(j); render(); },
      // Adds several jobs at once (another tool handing over its list, or a whole list loaded from
      // ServiceTitan). labels: optional { job: label or { label, tags } }. Returns how many were added.
      addMany: (ids, labels) => { if (opts.busy()) return 0; let n = 0; (ids || []).forEach(j => { j = String(j); if (/^\d+$/.test(j) && add(j, labels && labels[j])) n++; }); changed(); return n; },
      // Takes several jobs off at once. Returns how many were on the list.
      removeMany: ids => { if (opts.busy()) return 0; let n = 0; (ids || []).forEach(j => { if (picked.delete(String(j))) n++; }); changed(); return n; },
      render,
      setPicking,
      isPicking: () => picking,
      setEnabled: on => { enabled = !!on; if (!enabled) picking = false; render(); },
      cleanup: () => { window.removeEventListener('click', onClick, true); board.unmount(style); }
    };
  };
  // The width you last gave it (in this browser).
  const savedWidth = parseInt(get('stWidth') || '', 10);
  if (savedWidth >= MIN_WIDTH) panel.style.width = Math.min(savedWidth, maxWidth()) + 'px';
  const pos = (get('stPos') || get('qnPos') || '').split(',').map(Number);
  if (pos.length === 2 && pos.every(n => isFinite(n))) {
    panel.style.left = Math.min(Math.max(0, pos[0]), innerWidth - 120) + 'px';
    panel.style.top = Math.min(Math.max(0, pos[1]), innerHeight - 60) + 'px';
    panel.style.right = panel.style.bottom = 'auto';
  }

  // The title bar: drag it to move the Toolbox. – folds it down to just this bar.
  const header = el('div', 'padding:8px 8px 8px 12px;font-weight:800;background:var(--st-head);color:#fff;display:flex;gap:8px;align-items:center;cursor:move;user-select:none');
  header.className = 'st-head';
  const titleWrap = el('span', 'display:flex;align-items:center;gap:8px;flex:1;min-width:0');
  const titleText = el('span', 'font-size:14px;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', '🧰 Toolbox');
  titleWrap.append(titleText, el('span', 'flex:none;font-weight:700;font-size:10.5px;padding:1px 7px;border-radius:10px;background:rgba(255,255,255,.14);color:rgba(255,255,255,.85)', 'v' + VERSION));
  const headBtn = (label, title) => {
    const b = el('button', 'flex:none;width:28px;height:28px;display:grid;place-items:center;border:none;border-radius:6px;background:transparent;color:#fff;cursor:pointer;font-size:14px;line-height:1;padding:0', label);
    b.type = 'button'; b.title = title; b.className = 'st-hbtn';
    b.addEventListener('mousedown', e => e.stopPropagation());
    return b;
  };
  const minBtn = headBtn('–', 'Fold the Toolbox down to its title bar');
  const closeX = headBtn('✕', 'Close');
  header.append(titleWrap, minBtn, closeX);
  // Folded down (remembered in this browser): only the title bar shows, so the board is free.
  const setMin = (on, animate) => {
    const from = animate && motionOK() && panel.isConnected ? panel.getBoundingClientRect().height : null;
    panel.classList.toggle('st-min', !!on);
    minBtn.textContent = on ? '▢' : '–';
    minBtn.title = on ? 'Open the Toolbox back up' : 'Fold the Toolbox down to its title bar';
    set('stMin', on ? '1' : '0');
    if (from != null && typeof panel.animate === 'function') {
      const to = panel.getBoundingClientRect().height;
      if (Math.abs(to - from) > 2) panel.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  };
  minBtn.onclick = () => setMin(!panel.classList.contains('st-min'), true);

  // "What's new", shown once after an update: a title line with ✕, then the text. It goes away
  // by itself after 40 seconds (not while the mouse is on it), or with ✕.
  const news = el('div', 'display:none;padding:8px 12px 10px;background:var(--st-green-s);color:var(--st-green-d);font-size:12px;line-height:1.45;border-bottom:1px solid var(--st-green-l)');
  const lastSeen = get('stSeenVersion');
  if (lastSeen !== VERSION) {
    const newsHead = el('div', 'display:flex;align-items:center;gap:6px;font-weight:800;font-size:12.5px;margin-bottom:2px');
    newsHead.appendChild(el('span', 'flex:1', (lastSeen ? '✨ Updated to v' : '✨ New in v') + VERSION));
    const newsX = el('button', 'border:0;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer;padding:0 2px;line-height:1;opacity:.75', '✕');
    newsX.type = 'button'; newsX.title = 'Hide what\'s new';
    newsHead.appendChild(newsX);
    news.append(newsHead, el('div', '', WHATS_NEW[VERSION] || 'New version.'));
    news.style.display = 'block';
    set('stSeenVersion', VERSION);
    let over = false;
    news.addEventListener('mouseenter', () => { over = true; });
    news.addEventListener('mouseleave', () => { over = false; });
    newsX.onclick = () => { news.style.display = 'none'; };
    const hideLater = () => setTimeout(() => { if (over) hideLater(); else news.style.display = 'none'; }, 40000);
    hideLater();
  }

  // ===================================================================
  // Health check: notices when ServiceTitan has changed something a tool relies on,
  // and says so in a yellow bar instead of failing quietly.
  // ===================================================================
  const health = (() => {
    const issues = new Map();   // key -> { tool, what, detail }
    const bar = el('div', 'display:none;padding:7px 12px;background:var(--st-amber-s);color:var(--st-amber);font-size:12px;border-bottom:1px solid var(--st-amber-l)');
    const barText = el('div', 'white-space:pre-wrap');
    const barBtns = el('div', 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px');
    bar.append(barText, barBtns);
    const report = () => {
      const lines = ['ServiceTitan Toolbox v' + VERSION + ' health report', 'When: ' + new Date().toLocaleString(), 'Page: ' + location.hash.split('?')[0], ''];
      issues.forEach(i => lines.push('- ' + i.tool + ': ' + i.what + (i.detail ? ' [' + i.detail + ']' : '')));
      return lines.join('\n');
    };
    // Amber for problems; green for "all good"; blue for a hint.
    const tone = k => {
      const c = { warn: ['--st-amber-s', '--st-amber', '--st-amber-l'], ok: ['--st-green-s', '--st-green-d', '--st-green-l'], info: ['--st-blue-s', '--st-blue', '--st-line'] }[k];
      bar.style.background = 'var(' + c[0] + ')'; bar.style.color = 'var(' + c[1] + ')'; bar.style.borderBottomColor = 'var(' + c[2] + ')';
    };
    const render = () => {
      tone('warn');
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

    // Board checks run without clicking anything. They look at the Dispatch board (Day view) and
    // read its data once, and wait for it to finish loading before deciding anything is missing.
    let checking = false, manualWaiting = false;
    const checkBoard = async manual => {
      // If a check is already running, show its result when it finishes.
      if (checking) { if (manual) manualWaiting = true; return; }
      if (!board.onPage()) { if (manual) { issues.size ? render() : flashOk('Open the Dispatch board to check it.'); } return; }
      checking = true;
      try {
        const v = await until(() => { const x = board.view(); return x === 'loading' ? null : x; }, 15000, 500);
        if (v === 'week') { if (manual || manualWaiting) flashOk('The Toolbox works on the Day view. Switch the board to Day, then check again.'); return; }
        Array.from(issues.keys()).forEach(k => { if (k.indexOf('board|') === 0) issues.delete(k); });
        const ALL = 'Every tool';
        if (!board.root()) flag(ALL, 'can\'t find the Dispatch board on the page', 'SERVICETITAN-DISPATCH-CENTER-*', 'board');
        else if (!v) flag(ALL, 'the Dispatch board didn\'t finish loading, or its Day view has changed', '[data-cy^="ddb-"]', 'board');
        else {
          if (!board.day()) flag(ALL, 'can\'t read the day the board shows', 'date button "Tue, Oct 27, 2026"', 'board');
          if (!board.filters()) flag(ALL, 'can\'t tell which branches the board is filtered to (it uses every branch instead)', 'SHARED_DISPATCH_FILTERS_KEY_*', 'board');
          // Techs on the board: only a problem if rows are drawn without their tech labels.
          const heads = board.qa('[data-cy^="ddb-technician-header-"]');
          if (!heads.length && board.qa('[data-cy^="ddb-team-group-"]').length) flag('Job Notifications & Tech Messages', 'can\'t find the techs\' names on the board', '[data-cy^="ddb-technician-header-"]', 'board');
          else if (heads.length && !heads.some(h => /^\d+$/.test(h.getAttribute('data-technician-id') || ''))) flag('Job Notifications & Tech Messages', 'the techs\' names are missing their tech labels', '[data-technician-id]', 'board');
          // Job cards: only a problem if cards exist but are missing their appointment labels.
          const cards = board.qa('[data-cy="wdb-job-appt-card"]');
          if (cards.length && !cards.some(c => /^\d+$/.test(c.getAttribute('data-job-appointment-id') || ''))) flag('Every job-picking tool', 'job cards are missing their appointment labels', '[data-job-appointment-id]', 'board');
          if (!board.q('button[aria-label="Refresh"]')) flag('Move Jobs', 'can\'t find the board\'s Refresh button (refresh the page after moves instead)', 'button[aria-label="Refresh"]', 'board');
          try { await board.load({ fresh: true }); }
          catch (e) { if (!st.isSignedOut(e)) flag(ALL, 'can\'t read the board\'s data (' + errText(e) + ')', '/dispatch-center/daily-assignments', 'board'); }
        }
        render();
        if ((manual || manualWaiting) && !issues.size) flashOk('✅ Everything the Toolbox needs is where it should be.');
      } finally { checking = false; manualWaiting = false; }
    };
    let okTimer = null;
    const flashOk = text => {
      tone(/^✅/.test(text) ? 'ok' : 'info');
      barText.textContent = text; barBtns.textContent = '';
      bar.style.display = 'block';
      clearTimeout(okTimer);
      okTimer = setTimeout(() => render(), 5000);
    };
    return { bar, flag, clear, checkBoard };
  })();
  const CHANGED = ' ServiceTitan may have changed (see the yellow bar).';

  // ===================================================================
  // The whole board: every job on the day the Dispatch board shows, read from the board's own
  // data. Shared by 📱 Customer Texts (＋ Everyone on the board) and 🔕 Job Notifications
  // (＋ Whole board, and a tech's jobs).
  // ===================================================================
  const boardData = (() => {
    // Teams (departments, like Level 1 Service or Installers) come with each tech in the board's
    // data, so a board filter no longer hides them. A job with no tech on the board's list is in NO_TEAM.
    const NO_TEAM = 'Other (no team)';
    const teamsOf = (s, a) => {
      const ts = Array.from(new Set(a.techs.map(id => { const t = s.techById.get(id); return t && t.team; }).filter(Boolean)));
      return ts.length ? ts : [NO_TEAM];
    };
    // The teams with jobs on the day the board shows, in the board's order, with their job count
    // (canceled appointments left out): [{ name, n }]. From the board's data as last read.
    const teams = () => {
      const s = board.latest();
      if (!s) return [];
      const byJob = new Map();
      s.appts.forEach(a => {
        if (!board.live(a)) return;
        if (!byJob.has(a.jobId)) byJob.set(a.jobId, new Set());
        teamsOf(s, a).forEach(t => byJob.get(a.jobId).add(t));   // a two-tech job: both techs' teams
      });
      const count = new Map();
      byJob.forEach(ts => { if (ts.size > 1) ts.delete(NO_TEAM); ts.forEach(t => count.set(t, (count.get(t) || 0) + 1)); });
      const rank = t => t === NO_TEAM ? 1e6 : (s.teams.indexOf(t) < 0 ? 1e5 : s.teams.indexOf(t));
      return Array.from(count.entries()).map(([name, n]) => ({ name, n })).sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));
    };

    // Every job on the day the board shows: the timeline (your board's filters) plus the whole
    // Unassigned list (all pages, your board's branches). Holds aren't included. Canceled
    // appointments are left out. tool: the tool's name, for the yellow bar if something comes back
    // in a shape the Toolbox doesn't know. One fresh read of the board each time.
    // Returns { jobs: [{ jobId, customer, customerId, tech, day, teams, tags, unassigned }], onTimeline,
    // unassigned, canceled }. teams: the job's teams (timeline jobs only).
    const whole = async tool => {
      if (!onBoard()) throw new Error(board.need().replace(/\.$/, '').toLowerCase());
      const s = await board.load({ fresh: true });
      const jobs = [], byJob = new Map(), canceledJobs = new Set();
      let onTimeline = 0, unassignedN = 0;
      s.appts.forEach(a => { if (!board.live(a)) canceledJobs.add(a.jobId); });
      s.appts.forEach(a => {
        if (!board.live(a)) return;
        canceledJobs.delete(a.jobId);   // another visit of it isn't canceled
        const had = byJob.get(a.jobId);
        // A two-tech job, or a job with two visits: one entry, with every team and tag.
        if (had) { teamsOf(s, a).forEach(t => { if (had.teams.indexOf(t) < 0) had.teams.push(t); }); a.tags.forEach(t => { if (!had.tags.some(y => y.name === t.name)) had.tags.push(t); }); return; }
        onTimeline++;
        const x = { jobId: a.jobId, customer: a.customer, customerId: a.customerId, tech: board.firstName(board.techName(a.techs[0])), day: s.day, teams: teamsOf(s, a), tags: a.tags.slice(), unassigned: false };
        byJob.set(a.jobId, x);
        jobs.push(x);
      });
      jobs.forEach(x => { if (x.teams.length > 1) x.teams = x.teams.filter(t => t !== NO_TEAM); });
      const un = await board.unassigned(tool, { fresh: true });
      un.rows.forEach(r => {
        if (byJob.has(r.jobId) || canceledJobs.has(r.jobId)) return;
        unassignedN++;
        const x = { jobId: r.jobId, customer: r.customer, customerId: r.customerId, tech: '', day: s.day, teams: [], tags: r.tags, unassigned: true };
        byJob.set(r.jobId, x);
        jobs.push(x);
      });
      health.clear(tool);
      return { jobs, onTimeline, unassigned: unassignedN, canceled: un.canceled + canceledJobs.size };
    };
    // A tech's jobs on the day the board shows, from the board's data (every job, even ones
    // scrolled out of view). Canceled appointments are left out. [job numbers]
    const techJobs = techId => board.techJobs(techId);
    return { whole, techJobs, day: () => board.day(), teams, NO_TEAM };
  })();

  const menuPane = el('div', 'display:none;padding:10px 12px 12px');
  const menuMsg = el('div', 'font-size:12px;color:var(--st-ink-2);margin-bottom:8px;min-height:16px;display:flex;gap:6px;align-items:center;flex-wrap:wrap', 'Pick a tool.');
  const notesPane = el('div', 'display:none');
  const jobsPane = el('div', 'display:none');
  const msgsPane = el('div', 'display:none');
  const bizPane = el('div', 'display:none');
  const textsPane = el('div', 'display:none');
  const movesPane = el('div', 'display:none;overflow-y:auto');
  const routerPane = el('div', 'display:none;overflow-y:auto');
  const views = { menu: menuPane, notes: notesPane, jobs: jobsPane, msgs: msgsPane, biz: bizPane, texts: textsPane, moves: movesPane, router: routerPane };
  Object.keys(views).forEach(k => { views[k].classList.add('st-view'); if (k === 'menu') views[k].classList.add('st-view-menu'); });
  news.classList.add('st-bar');
  health.bar.classList.add('st-bar');
  const TITLES = { menu: '🧰 Toolbox', notes: '📝 Notes', jobs: '🔕 Job Notifications', msgs: '💬 Tech Messages', biz: '🏢 Business Unit', texts: '📱 Customer Texts', moves: '🔀 Move Jobs', router: '🧭 Tech Router (Beta)' };
  const showView = name => {
    Object.keys(views).forEach(k => { views[k].style.display = k === name ? 'block' : 'none'; });
    titleText.textContent = TITLES[name];
    if (name === 'menu' && typeof renderMenuMsg === 'function') renderMenuMsg();
    set('stView', name);
    if (name !== 'notes' && typeof notes !== 'undefined') notes.leave();
    if (name !== 'jobs' && typeof notify !== 'undefined') notify.leave();
    if (name === 'jobs' && typeof notify !== 'undefined') notify.refresh();
    if (name !== 'msgs' && typeof msgs !== 'undefined') msgs.leave();
    if (name === 'msgs' && typeof msgs !== 'undefined') msgs.refresh();
    if (name !== 'biz' && typeof biz !== 'undefined') biz.leave();
    if (name === 'biz' && typeof biz !== 'undefined') biz.refresh();
    if (name !== 'texts' && typeof texts !== 'undefined') texts.leave();
    if (name === 'texts' && typeof texts !== 'undefined') texts.refresh();
    if (name !== 'moves' && typeof moves !== 'undefined') moves.leave();
    if (name === 'moves' && typeof moves !== 'undefined') moves.refresh();
    if (name !== 'router' && typeof router !== 'undefined') router.leave();
    if (name === 'router' && typeof router !== 'undefined') router.refresh();
  };

  // The menu: one tile per tool.
  const TOOLS = [
    ['notes', '📝', 'Notes', 'Saved notes on a job\'s customer', '#fff4d6'],
    ['jobs', '🔕', 'Job Notifications', 'Turn customers\' job notifications off or on', '#ffebdd'],
    ['msgs', '💬', 'Tech Messages', 'Message the techs you pick', '#efe7fb'],
    ['biz', '🏢', 'Business Unit', 'Switch jobs to a branch', '#e3effd'],
    ['texts', '📱', 'Customer Texts', 'Text customers, confirm appointments', '#e3f5e9'],
    ['moves', '🔀', 'Move Jobs', 'Move, add, unassign or swap techs', '#f3e9fb'],
    ['router', '🧭', 'Tech Router', 'Fill a tech\'s open time, closest techs', '#ddf3f0', 'Beta']
  ];
  const tiles = el('div', 'display:grid;gap:6px');
  TOOLS.forEach(([key, icon, name, desc, tint, badge]) => {
    const b = el('button', 'display:flex;gap:10px;align-items:center;width:100%;text-align:left;padding:8px 10px;border:1px solid var(--st-line);border-radius:10px;background:var(--st-bg);cursor:pointer;color:var(--st-ink);font:inherit');
    b.type = 'button'; b.className = 'st-tile';
    const ic = el('span', 'flex:none;width:34px;height:34px;border-radius:9px;display:grid;place-items:center;font-size:17px;background:' + tint, icon);
    const tx = el('span', 'display:grid;gap:1px;min-width:0');
    const nameLine = el('span', 'font-weight:800;font-size:13px;display:flex;gap:6px;align-items:center', name);
    // A tool that's still being built says so in its name: Tech Router (Beta).
    if (badge) nameLine.appendChild(el('span', 'flex:none;font-size:10px;font-weight:800;letter-spacing:.03em;padding:0 6px;border-radius:9px;line-height:16px;background:var(--st-amber-s);color:var(--st-amber);border:1px solid var(--st-amber-l)', badge.toUpperCase()));
    tx.append(nameLine, el('span', 'font-size:11.5px;color:var(--st-ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis', desc));
    b.append(ic, tx, el('span', 'margin-left:auto;color:var(--st-ink-3);font-size:16px', '›'));
    b.addEventListener('mousedown', e => e.preventDefault());
    b.onclick = () => showView(key);
    tiles.appendChild(b);
  });
  const checkRow = el('div', 'display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px');
  checkRow.append(el('span', 'font-size:11px;color:var(--st-ink-3)', 'Works on the Dispatch board\'s Day view.'), smallBtn('🩺 Check', () => health.checkBoard(true)));
  menuPane.append(menuMsg, tiles, checkRow);
  // Above the tiles: which day and branches the board shows (or what to do to use the tools).
  const renderMenuMsg = () => {
    menuMsg.textContent = '';
    if (!onBoard()) { menuMsg.textContent = board.need(); return; }
    const all = (window.App && window.App.Data && window.App.Data.BusinessUnits) || [];
    const names = board.bus().map(id => (all.find(b => Number(b.Id) === Number(id)) || {}).Name).filter(Boolean);
    const pill = (t, bg, ink) => el('span', 'padding:2px 8px;border-radius:10px;font-weight:700;font-size:11.5px;background:' + bg + ';color:' + ink, t);
    menuMsg.append(pill('📅 ' + board.dayText(), 'var(--st-blue-s)', 'var(--st-blue-d)'));
    if (names.length) menuMsg.append(pill(names.length > 2 ? names.length + ' branches' : names.join(', '), 'var(--st-soft-2)', 'var(--st-ink-2)'));
  };
  board.onChange(() => { if (menuPane.style.display !== 'none') renderMenuMsg(); });
  panel.append(header, news, health.bar, menuPane, notesPane, jobsPane, msgsPane, bizPane, textsPane, movesPane, routerPane);

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
    const customerLinks = () => openDrawers().flatMap(d => Array.from(d.querySelectorAll('a[href^="#/Customer/"], a[href^="#/customer/"]')));
    const linkCustId = a => parseInt(((a.getAttribute('href') || '').match(/^#\/customer\/(\d+)/i) || [])[1], 10) || 0;
    // While a job panel is still loading, ServiceTitan shows a blank placeholder link to
    // customer #0 for about a second. Only a link to a real customer counts.
    const jobCustomerLink = () => customerLinks().find(a => linkCustId(a) > 0) || null;
    const jobLoading = () => !jobCustomerLink() && customerLinks().length > 0;
    // ServiceTitan's "This Page Could Not Be Found" page (shown for a merged or deleted record).
    // Reads the page only, not the Toolbox panel.
    const notFoundPage = () => Array.from(document.body.children).some(c => c.id !== ID && /This Page Could Not Be Found/i.test(c.innerText || ''));
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
    const msg = el('div', 'font-size:12px;color:var(--st-ink-2);margin-bottom:4px;min-height:16px');
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

    let busy = false, boardHash = null, armed = null, noLinkTicks = 0;

    // A list button in the same style everywhere in Notes.
    const listBtn = (label, title, onClick, highlight) => {
      const bg = highlight ? 'var(--st-blue-s)' : 'var(--st-bg)';
      const b = el('button', FULL + 'margin:5px 0;padding:8px 10px;cursor:pointer;border:1px solid ' + (highlight ? 'var(--st-blue)' : 'var(--st-line)') + ';' +
        'border-radius:8px;background:' + bg + ';color:var(--st-ink);text-align:left;font:inherit;font-weight:600' + (highlight ? ';box-shadow:inset 3px 0 0 var(--st-blue)' : ''), label);
      b.type = 'button';
      b.title = title;
      b.addEventListener('mousedown', e => e.preventDefault());
      b.onmouseenter = () => { b.style.background = 'var(--st-soft-2)'; };
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
      if (!list.length) btnList.appendChild(el('div', 'font-size:12px;color:var(--st-ink-3);padding:6px 0', 'No notes in this folder yet. Click ✏️ Edit notes to add some.'));
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
    // Stops early if ServiceTitan shows its "This Page Could Not Be Found" page instead.
    const steadyAddNoteBtn = async max => {
      const end = Date.now() + max;
      let last = null, since = 0, n = 0;
      while (Date.now() < end) {
        const b = addNoteBtn();
        if (b && b === last) { if (Date.now() - since >= 500) return b; }
        else { last = b; since = Date.now(); }
        if (!b && ++n % 10 === 0 && notFoundPage()) return null;
        await wait(100);
      }
      return addNoteBtn();
    };

    // Clicks Add Note, and clicks again if the box doesn't open (up to 4 tries).
    // Returns true, false, or 'notfound' (ServiceTitan couldn't open the customer).
    const openNoteBox = async () => {
      for (let attempt = 1; attempt <= 4; attempt++) {
        if (noteBox()) return true;
        const b = await steadyAddNoteBtn(attempt === 1 ? 20000 : 5000);
        if (!b) {
          if (noteBox()) return true;
          if (notFoundPage()) return 'notfound';
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
          let link = jobCustomerLink();
          if (!link && jobLoading()) {
            say('Waiting for the job to finish loading...');
            link = await until(jobCustomerLink, 10000, 100);
            if (!link) return say('⚠️ The job is still loading. Pick the note again in a moment.');
          }
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
        const opened = await openNoteBox();
        if (opened === 'notfound') return say('⚠️ ServiceTitan couldn\'t open this customer (it shows "This Page Could Not Be Found"). Go back to the board, click the job again, then pick the note.');
        if (!opened) return say('⚠️ Couldn\'t open the Add Note box. Click Add Note on the page, then pick the note again.' + CHANGED);
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
      // Only after a few checks in a row, so a job panel that's still loading doesn't count.
      const noLink = !jobCustomerLink() && !jobLoading() && openDrawers().some(d => /Job #\d+/.test(d.textContent || ''));
      noLinkTicks = noLink ? noLinkTicks + 1 : 0;
      if (noLinkTicks >= 3) health.flag('Notes', 'the job panel doesn\'t show the customer link where expected', '.Drawer--open a[href^="#/Customer/"]');
      const pick = open < 0 ? 'Pick a folder, then a note.' : 'Pick a note.';
      if (noteBox()) say('Add Note box is open. ' + pick);
      else if (onCustomerPage()) say(pick + ' It goes on this customer.');
      else if (jobCustomerLink()) say('Job selected. ' + pick);
      else if (jobLoading()) say('Job loading... ' + pick);
      else if (!/^(✅|⚠️)/.test(msg.textContent)) say(open < 0 ? 'Pick a folder. Then click a job and a note (either order).' : 'Click a job, then pick a note (or the other way round).');
    };

    let editing = false;
    const showOnly = x => { [main, editor, folderEditor].forEach(v => { v.style.display = v === x ? 'block' : 'none'; }); };
    const closeEditors = () => { editing = false; showOnly(main); renderList(); };

    // ---- Edit notes (the notes in the open folder) ----
    const editor = el('div', 'display:none;padding:8px 10px 10px');
    const editHead = el('div', 'font-weight:700;margin-bottom:4px', '✏️ Edit notes');
    const NOTES_HINT = 'Change the button name and the note text. "Move to" puts a note in another folder. Saved in this browser.';
    const editMsg = el('div', 'font-size:12px;color:var(--st-ink-2);margin-bottom:6px', NOTES_HINT);
    // "Move to" picker on each note.
    const moveTo = n => {
      const sel = el('select', 'max-width:130px;padding:3px 4px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;font-size:12px;color:var(--st-ink);background:var(--st-bg)');
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
    const fMsg = el('div', 'font-size:12px;color:var(--st-ink-2);margin-bottom:6px', FOLDERS_HINT);
    const fList = el('div', 'max-height:calc(100vh - 300px);overflow:auto;margin:0 -4px;padding:0 4px');
    // Draft rows: { name, notes, src } where src is the folder it came from (null for new ones).
    let fDraft = [];
    const renderFolders = () => {
      fList.textContent = '';
      fDraft.forEach((f, i) => {
        const row = el('div', 'border:1px solid var(--st-line);border-radius:8px;padding:7px;margin-bottom:8px;background:var(--st-soft)');
        const name = el('input', FULL + 'padding:5px 6px;border:1px solid var(--st-ctl);border-radius:5px;font:inherit;font-weight:600;color:var(--st-ink);background:var(--st-bg)');
        name.type = 'text'; name.value = f.name; name.placeholder = 'Folder name (e.g. 🧾 Billing)';
        name.oninput = () => { f.name = name.value; };
        const tools = el('div', 'display:flex;gap:4px;margin-top:5px;align-items:center');
        const moveBy = d => () => { const j = i + d; if (j < 0 || j >= fDraft.length) return; const t = fDraft[i]; fDraft[i] = fDraft[j]; fDraft[j] = t; renderFolders(); };
        const n = f.notes.length;
        // Deleting a folder with notes in it takes a second click.
        const del = smallBtn('Delete', () => {
          if (n && !del.dataset.sure) { del.dataset.sure = '1'; del.textContent = 'Delete it and its ' + n + ' note' + (n === 1 ? '' : 's') + '?'; return; }
          fDraft.splice(i, 1); renderFolders();
        }, 'margin-left:auto;color:var(--st-red);border-color:var(--st-red-l)');
        tools.append(
          smallBtn('↑', moveBy(-1), i === 0 ? 'opacity:.4' : ''),
          smallBtn('↓', moveBy(1), i === fDraft.length - 1 ? 'opacity:.4' : ''),
          el('span', 'font-size:12px;color:var(--st-ink-3)', n + ' note' + (n === 1 ? '' : 's')),
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
  // One list of jobs, filled any way you like: click jobs on the board (or a tech's name, for
  // their whole day), ＋ Whole board, a tech from the list, + Tray page, a tag, or job numbers.
  // Each job's setting is read as soon as it's added (🔔 on / 🔕 off, in the list and on the
  // board), so the buttons say how many jobs each one would change. Turning notifications off or
  // on works the same way it always has: every job is read fresh, and only the ones that need it
  // are opened, one at a time, to flip the switch, then checked that it stuck. Results come back
  // as cards.
  // ===================================================================
  const notify = (() => {
    const TOOL = 'Job Notifications';
    const IN = ['.qa-job-notification-toggle input.ToggleSwitch__input', '.qa-job-notification-toggle input[type=checkbox]'];
    const LB = ['.qa-job-notification-toggle label.ToggleSwitch__html-label', '.qa-job-notification-toggle label'];
    const first = sels => { for (const s of sels) { const x = document.querySelector(s); if (x) return x; } return null; };
    // The day the board shows (e.g. "Tue, Oct 27, 2026").
    const boardDate = () => { const d = board.day(); return d ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'the day shown'; };
    // The techs on the board, in the board's order: Map(id -> name).
    const techsOnBoard = () => {
      const seen = new Map(), s = board.latest();
      if (s) s.techs.forEach(t => { if (t.name) seen.set(t.id, t.name); });
      return seen;
    };
    // A tech's jobs on the board's day, from the board's data (every job, even ones scrolled out of view).
    const techJobs = techId => boardData.techJobs(techId);
    // The board's data read fresh enough first (it's read again if it's more than a few seconds old).
    const techJobsWait = async techId => {
      try { await board.load({ maxAge: 5000 }); } catch (e) {}
      return techJobs(techId);
    };
    const techName = id => techsOnBoard().get(String(id)) || board.techName(id) || 'This tech';
    // A job's notification setting from ServiceTitan's job data (no page to open): true, false,
    // or null if it couldn't be read.
    const apiState = async j => {
      try { const d = await st.job(j); return typeof d.NotificationsEnabled === 'boolean' ? d.NotificationsEnabled : null; }
      catch (e) { return null; }
    };
    const readState = async j => { const d = await st.job(j); return typeof d.NotificationsEnabled === 'boolean' ? d.NotificationsEnabled : null; };

    // What each job's switch is set to, as last read: job -> { on: true | false | null, at }.
    // null: couldn't be read. Shown in the list (🔔 / 🔕 / ❔) and on the board (solid / dashed).
    const states = new Map();
    let reading = null;          // { done, total } while the list is being read
    let readGen = 0, readTimer = null;
    let noAccess = false;        // every read said this login can't open job records
    // A reading older than this is read again when the list changes or the tool opens (a run
    // always reads every job fresh anyway).
    const STALE_MS = 10 * 60 * 1000;
    const needsRead = j => { const s = states.get(j); return !s || Date.now() - s.at > STALE_MS; };
    let running = false, stop = false, wholeLoading = false;

    // ---------- Layout ----------
    const wrap = el('div', 'padding:8px 10px 10px;display:grid;gap:8px');
    const msg = el('div', 'font-size:12px;color:var(--st-ink-2);min-height:16px;white-space:pre-wrap');
    const say = s => { msg.textContent = s; };
    // Add more: the whole board, or a tech's whole day.
    const addRow = el('div', 'display:flex;gap:6px;align-items:center');
    const wholeBtn = smallBtn('＋ Whole board', () => addWhole());
    wholeBtn.title = 'Adds every job on the board for the day it shows: the timeline and the whole Unassigned list (all pages, your board\'s branches). Holds and canceled appointments aren\'t included. Take any off with ✕.';
    const techSel = el('select', 'flex:1;min-width:0;padding:5px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;font-size:12px;color:var(--st-ink);background:var(--st-bg)');
    techSel.id = 'st-notify-tech';
    techSel.title = 'Adds all of a tech\'s jobs on the day the board shows. (Or click the tech\'s name on the board while 🖱️ Picking is on.)';
    addRow.append(wholeBtn, techSel);
    // Where the list stands: how many are on / off, and the buttons.
    const statusBox = el('div', 'display:none;padding:7px 8px;border:1px solid var(--st-line);border-radius:8px;background:var(--st-soft);gap:6px');
    const statusTop = el('div', 'display:flex;gap:6px;align-items:center');
    const statusText = el('div', 'flex:1;font-size:12px;font-weight:600;white-space:pre-wrap');
    const checkBtn = smallBtn('↻ Check', () => start('check'), 'padding:2px 7px');
    checkBtn.title = 'Reads every job on the list again and lists them as cards (changes nothing).';
    statusTop.append(statusText, checkBtn);
    const legend = el('div', 'font-size:11px;color:var(--st-ink-3)', 'On the board: orange outline = on, gray dashed = off.');
    const actions = el('div', 'display:flex;gap:6px');
    const offBtn = smallBtn('🔕 Turn off', () => askConfirm('off'), 'flex:1;padding:7px 6px;color:var(--st-red);border-color:var(--st-red-l);font-weight:600');
    const onBtn = smallBtn('🔔 Turn on', () => askConfirm('on'), 'flex:1;padding:7px 6px;color:var(--st-green);border-color:var(--st-green-l);font-weight:600');
    actions.append(offBtn, onBtn);
    statusBox.append(statusTop, legend, actions);
    const confirmBox = el('div', 'display:none;padding:8px;border:1px solid var(--st-red-l);background:var(--st-red-s);border-radius:6px;font-size:12px;gap:6px;flex-wrap:wrap;align-items:center');
    const confirmText = el('span', 'flex-basis:100%;white-space:pre-line');
    let confirmMode = 'off';
    const confirmYes = smallBtn('Yes, turn them off', () => { confirmBox.style.display = 'none'; start(confirmMode); }, DANGER);
    confirmBox.append(confirmText, confirmYes, smallBtn('Cancel', () => { confirmBox.style.display = 'none'; }));
    // A run: progress bar, buttons, and the results as cards (the step-by-step log folds away).
    const progress = el('div', 'display:none;gap:6px');
    const bar = el('div', 'height:6px;background:var(--st-line);border-radius:3px;overflow:hidden');
    const fill = el('div', 'height:100%;width:0;background:#ef6c00;transition:width .2s');
    bar.appendChild(fill);
    const setBar = (done, total) => { fill.style.width = (total ? Math.round(100 * done / total) : 0) + '%'; };
    const log = el('pre', 'display:none;max-height:200px;overflow:auto;margin:0;padding:6px;background:var(--st-soft);border:1px solid var(--st-line);border-radius:6px;white-space:pre-wrap;font:12px/1.35 ui-monospace,Consolas,monospace');
    const progRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    const requestStop = () => { stop = true; stopBtn.disabled = true; stopBtn.textContent = 'Stopping after this job...'; };
    const stopBtn = smallBtn('Stop', () => requestStop());
    let header = '';
    const copyBtn = smallBtn('Copy results', async () => { if (await copy(header + '\n\n' + cards.text() + '\n\nDetails:\n' + log.textContent)) copyBtn.textContent = 'Copied'; });
    let lastMode = null;
    const againBtn = smallBtn('↻ Try the problem jobs again', () => { if (lastMode) start(lastMode); }, 'color:var(--st-amber);border-color:var(--st-amber-l)');
    againBtn.title = 'Runs the list again: jobs already done are only read (nothing opened); the problem jobs are opened and tried again.';
    const detailsBtn = smallBtn('📜 Details', () => {
      const show = log.style.display === 'none';
      log.style.display = show ? 'block' : 'none';
      detailsBtn.textContent = show ? '📜 Hide details' : '📜 Details';
      if (show) log.scrollTop = log.scrollHeight;
    });
    progRow.append(stopBtn, againBtn, copyBtn, detailsBtn);
    const cards = customerCards();
    cards.box.style.maxHeight = '260px';
    progress.append(bar, progRow, log, cards.box);
    const navRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    navRow.append(smallBtn('← Menu', () => { if (!running) showView('menu'); }));
    const add = s => { log.textContent += s + '\n'; log.scrollTop = log.scrollHeight; };

    // ---------- The list of jobs (orange outline on the board while this tool is open) ----------
    const OFF_CSS = ids => board.jobsCss(ids.filter(j => { const s = states.get(j); return s && s.on === false; }), '#616161', 'rgba(97,97,97,.2)', true);
    const picker = jobPicker({
      color: '#ef6c00', soft: 'rgba(239,108,0,.22)',
      shown: () => jobsPane.style.display !== 'none',
      busy: () => running,
      say: t => say(t),
      changed: () => listChanged(),
      onTech: id => toggleTech(id),
      tool: TOOL,
      hint: 'Click jobs on the board, or rows in the Jobs Tray below it, to add them (click again to take one off). Click a tech\'s name to add their whole day.',
      badge: j => {
        const s = states.get(j);
        if (!s) return noAccess ? '' : '⏳';
        return s.on === true ? '🔔' : s.on === false ? '🔕' : '❔';
      },
      css: OFF_CSS
    });
    wrap.append(msg, picker.box, addRow, statusBox, confirmBox, progress, navRow);
    jobsPane.appendChild(wrap);
    // A long list and a run's cards can be taller than the window: the tool scrolls instead, so
    // the Toolbox's title bar (to move or close it) always stays on screen. (Same as Move Jobs.)
    jobsPane.style.overflowY = 'auto';
    const fit = () => {
      if (jobsPane.style.display === 'none') return;
      const pr = panel.getBoundingClientRect(), others = pr.height - jobsPane.getBoundingClientRect().height;
      const top = panel.style.top && panel.style.top !== 'auto' ? Math.max(0, pr.top) : 16;
      jobsPane.style.maxHeight = Math.max(220, innerHeight - top - others - 16) + 'px';
    };
    window.addEventListener('resize', fit);
    resized.push(fit);

    // ---------- How the list stands ----------
    const tally = () => {
      const t = { on: 0, off: 0, unknown: 0, waiting: 0, all: 0 };
      picker.ids().forEach(j => {
        t.all++;
        const s = states.get(j);
        if (!s) t.waiting++;
        else if (s.on === true) t.on++;
        else if (s.on === false) t.off++;
        else t.unknown++;
      });
      return t;
    };
    const dim = (b, off) => { b.disabled = !!off; b.style.opacity = off ? '.5' : '1'; };
    const renderStatus = () => {
      const t = tally();
      statusBox.style.display = t.all ? 'grid' : 'none';
      if (!t.all) { fit(); return; }
      const busyReading = !!reading || (t.waiting > 0 && !noAccess);
      if (noAccess) {
        statusText.textContent = '⚠️ Your ServiceTitan login doesn\'t have permission to open job records, so it can\'t see or change job notifications.';
        statusText.style.color = 'var(--st-amber)';
      } else {
        const parts = ['🔔 ' + t.on + ' on', '🔕 ' + t.off + ' off'];
        if (t.unknown) parts.push('❔ ' + t.unknown + ' not read');
        if (reading) parts.push('reading ' + reading.done + ' of ' + reading.total + '…');
        else if (t.waiting) parts.push('⏳ ' + t.waiting + ' to read');
        statusText.textContent = parts.join(' · ');
        statusText.style.color = 'var(--st-ink)';
      }
      legend.style.display = t.off && !noAccess ? 'block' : 'none';
      // Each button counts the jobs it would change (those set the other way, and any not read).
      const offN = t.on + t.unknown, onN = t.off + t.unknown;
      offBtn.textContent = busyReading ? '🔕 Turn off…' : '🔕 Turn off (' + offN + ')';
      onBtn.textContent = busyReading ? '🔔 Turn on…' : '🔔 Turn on (' + onN + ')';
      dim(offBtn, running || noAccess || (!busyReading && !offN));
      dim(onBtn, running || noAccess || (!busyReading && !onN));
      dim(checkBtn, running);
      fit();
    };
    const renderAll = () => { picker.render(); renderStatus(); };

    // ---------- Reading each job's setting as it's added ----------
    // Only while this tool is open, a few at a time, and only jobs not read yet. A run cancels it
    // (the run reads every job fresh anyway).
    const cancelRead = () => { clearTimeout(readTimer); readTimer = null; readGen++; reading = null; };
    const scheduleRead = () => {
      clearTimeout(readTimer);
      if (running) return;
      readTimer = setTimeout(readNew, 250);
    };
    const readNew = async () => {
      readTimer = null;
      if (running || jobsPane.style.display === 'none') return;
      const ids = picker.ids().filter(needsRead);
      if (!ids.length) return;
      ids.forEach(j => { const s = states.get(j); if (s) states.delete(j); });   // too old to show
      const gen = ++readGen;
      reading = { done: 0, total: ids.length };
      renderStatus();
      // Until one read has worked, the first "no permission" ends it (a login without job-record
      // access would get that for every job, so there's no point asking about the rest).
      let worked = false, refused = false;
      const one = async j => {
        try { const v = await readState(j); worked = true; return v; }
        catch (e) { if (st.isNoPermission(e)) refused = true; throw e; }
      };
      const out = await st.pool(ids, 4, one, (d, t) => { if (gen === readGen) { reading = { done: d, total: t }; renderStatus(); } },
        { stop: () => gen !== readGen || running || (refused && !worked) });
      if (gen !== readGen) return;
      reading = null;
      const now = Date.now();
      let got = 0;
      out.forEach((v, i) => {
        const j = ids[i];
        if (v === st.NOT_RUN) { if (out.halted) states.set(j, { on: null, at: now }); return; }
        if (v && v.error) { if (!st.isNoPermission(v.error)) states.set(j, { on: null, at: now }); return; }
        got++;
        states.set(j, { on: v === true ? true : v === false ? false : null, at: now });
      });
      noAccess = !got && refused;
      if (out.halted === 'signedOut') say('⚠️ ' + st.SIGNED_OUT);
      else if (out.halted) say('⚠️ ' + st.haltNote(out) + ' Jobs that couldn\'t be read show ❔. The buttons still work: those jobs are checked on their own pages.');
      renderAll();
      // Jobs added while this read was going get their turn now.
      if (!out.halted && !noAccess && picker.ids().some(needsRead)) scheduleRead();
    };
    const listChanged = () => {
      if (running) return;
      // A job taken off the list forgets its reading, so adding it back reads it fresh (someone
      // may have changed it in the meantime).
      const keep = new Set(picker.ids());
      Array.from(states.keys()).forEach(j => { if (!keep.has(j)) states.delete(j); });
      confirmBox.style.display = 'none';
      renderStatus();
      scheduleRead();
    };

    // ---------- Adding jobs ----------
    const techKey = () => {
      const techs = techsOnBoard(), rows = [];
      techs.forEach((name, id) => { const n = techJobs(id).length; if (n) rows.push({ id, name, n }); });
      return { rows, key: boardDate() + '|' + rows.map(r => r.id + ':' + r.n).join(',') };
    };
    let shownKey = null;
    const fillTechs = force => {
      if (running) return;
      // The list stays clickable even when it's empty, so pointing at it can fill it once the
      // board has loaded (a disabled list wouldn't notice).
      if (!onBoard()) {
        shownKey = null;
        techSel.textContent = '';
        const o = el('option', '', board.view() === 'week' ? '＋ A tech\'s jobs (switch the board to Day)' : '＋ A tech\'s jobs (open the board)'); o.value = '';
        techSel.appendChild(o);
        return;
      }
      const { rows, key } = techKey();
      if (!force && key === shownKey) return;   // nothing changed: leave the list alone (it may be open)
      shownKey = key;
      techSel.textContent = '';
      const head = el('option', '', rows.length ? '＋ A tech\'s jobs…' : 'No techs with jobs on ' + boardDate());
      head.value = '';
      techSel.appendChild(head);
      rows.forEach(r => {
        const o = el('option', '', r.name + '  (' + plural(r.n, 'job') + ')');
        o.value = r.id;
        techSel.appendChild(o);
      });
      techSel.value = '';
    };
    // The list is read again when you point at it or tab to it, so it matches the board.
    techSel.addEventListener('mouseenter', () => fillTechs());
    techSel.addEventListener('focus', () => fillTechs());
    techSel.onchange = async () => {
      const id = techSel.value;
      techSel.value = '';
      if (!id || running) return;
      const name = techName(id);
      say('Finding ' + name + '\'s jobs...');
      const ids = await techJobsWait(id);
      if (!ids.length) { say('No jobs found for ' + name + ' on ' + boardDate() + '.'); return; }
      const n = picker.addMany(ids);
      say('Added ' + name + '\'s ' + plural(ids.length, 'job') + (n < ids.length ? ' (' + (ids.length - n) + ' already picked)' : '') + '.');
    };
    // Clicking a tech's name on the board while picking: adds their whole day, or takes it off
    // if every one of their jobs is already on the list.
    const toggleTech = async id => {
      if (running) return;
      const name = techName(id);
      const ids = await techJobsWait(id);
      if (!ids.length) { say('No jobs for ' + name + ' on ' + boardDate() + '.'); return; }
      if (ids.every(j => picker.has(j))) {
        picker.removeMany(ids);
        say('Took ' + name + '\'s ' + plural(ids.length, 'job') + ' off. ' + plural(picker.size(), 'job') + ' picked.');
      } else {
        const n = picker.addMany(ids);
        say('Added ' + name + '\'s ' + plural(ids.length, 'job') + (n < ids.length ? ' (' + (ids.length - n) + ' already picked)' : '') + '. Click the name again to take them off.');
      }
    };
    const addWhole = async () => {
      if (wholeLoading || running) return;
      if (!onBoard()) { say(board.need()); return; }
      wholeLoading = true; wholeBtn.textContent = 'Loading…'; wholeBtn.classList.add('st-busy'); dim(wholeBtn, true);
      say('Loading the whole board…');
      try {
        const r = await boardData.whole(TOOL);
        const labels = {};
        r.jobs.forEach(x => { labels[x.jobId] = { label: x.customer, tags: x.tags }; });
        const n = picker.addMany(r.jobs.map(x => x.jobId), labels);
        say('Added ' + plural(n, 'job') + ' from ' + boardDate() + ' (' + r.onTimeline + ' on the timeline, ' + r.unassigned + ' unassigned' +
          (r.canceled ? ', ' + r.canceled + ' canceled left out' : '') + ')' + (n < r.jobs.length ? '. ' + (r.jobs.length - n) + ' were already picked' : '') + '. Take any off with ✕.');
      } catch (e) { say('⚠️ ' + (st.isSignedOut(e) ? e.message : 'Couldn\'t load the whole board: ' + errText(e))); }
      finally { wholeLoading = false; wholeBtn.textContent = '＋ Whole board'; wholeBtn.classList.remove('st-busy'); dim(wholeBtn, running); fillTechs(true); }
    };

    const setEnabled = on => {
      picker.setEnabled(on);
      dim(wholeBtn, !on || wholeLoading);
      dim(techSel, !on);
      renderStatus();
    };
    // holdReads: don't start reading the list by itself (right after you pressed Stop, or when
    // this login can't read job records); adding jobs or opening the tool again reads as usual.
    const refresh = (keepMsg, holdReads) => {
      if (running) return;
      setEnabled(true);
      fillTechs(true);
      if (!keepMsg && !msg.textContent) say(onBoard() ? 'Add jobs: 🖱️ Pick on board (click jobs, or a tech\'s name for their whole day), ＋ Whole board, a tag, or a tech from the list.' : board.need() + ' Or type job numbers.');
      if (onBoard()) board.load().then(() => { if (!running) fillTechs(true); }, () => {});
      if (!holdReads) scheduleRead();
    };

    // ---------- Turning off / on ----------
    const est = n => { const s = n * 4; return s < 60 ? 'under a minute' : 'about ' + Math.round(s / 60) + ' min'; };
    const askConfirm = mode => {
      if (running || !picker.size()) return;
      const on = mode === 'on';
      const t = tally();
      const need = on ? t.off : t.on, already = on ? t.on : t.off, unread = t.unknown + t.waiting;
      const WORD = on ? 'ON' : 'OFF', word = on ? 'on' : 'off';
      if (!need && !unread) { say('All ' + plural(t.all, 'job') + ' are already ' + word + '.'); return; }
      const lines = ['Turn ' + WORD + ' notifications on ' + plural(need + unread, 'job') + '?'];
      if (already) lines.push(plural(already, 'job') + (already === 1 ? ' is' : ' are') + ' already ' + word + ' and will be left alone.');
      if (unread) lines.push(plural(unread, 'job') + (unread === 1 ? ' hasn\'t' : ' haven\'t') + ' been read yet: ' + (unread === 1 ? 'it\'s' : 'they\'re') + ' checked first.');
      lines.push('Takes ' + est(need + unread) + ' (each job\'s page opens one at a time).');
      if (on) lines.push('Those customers will get ServiceTitan\'s automatic job notifications again.');
      confirmMode = on ? 'on' : 'off';
      confirmText.textContent = lines.join('\n');
      confirmYes.textContent = on ? 'Yes, turn them on' : 'Yes, turn them off';
      const c = on ? 'var(--st-green)' : 'var(--st-red)';
      confirmYes.style.background = c; confirmYes.style.borderColor = c;
      confirmBox.style.borderColor = on ? 'var(--st-green-l)' : 'var(--st-red-l)';
      confirmBox.style.background = on ? 'var(--st-green-s)' : 'var(--st-red-s)';
      confirmBox.style.display = 'flex';
    };

    // Results as cards: problems first (open), then what changed, then what was already that way.
    const showCards = (list, results, mode, stopped) => {
      const real = mode !== 'check', OFF_ON = mode === 'on' ? 'on' : 'off';
      const item = (j, r) => ({ customer: picker.label(j), jobs: [j], noPhone: true, status: r ? r.status : '' });
      const by = {};
      list.forEach(j => {
        const r = results.get(j);
        const k = !r ? 'notdone' : r.kind;
        (by[k] = by[k] || []).push({ j, r });
      });
      const sec = (key, title, tone, open, rows, opts) => {
        if (!rows || !rows.length) return null;
        let items = rows.map(x => {
          const it = item(x.j, null);
          if (opts && opts.status) it.status = opts.status(x);
          if (x.r && x.r.retried && x.r.kind !== 'problem') it.note = 'Worked on the second try.';
          if (opts && opts.actions) it.actions = opts.actions(x);
          return it;
        });
        if (!(opts && opts.keep)) items = cards.merge(items);
        return { key, title, tone, open: open || items.length <= 6, items };
      };
      const openJob = j => () => { try { window.open(location.href.split('#')[0] + '#/Job/Index/' + j, '_blank'); } catch (e) {} };
      const sections = [
        sec('problem', '⚠️ Problems', 'warn', true, by.problem, { keep: true, status: x => x.r.text, actions: x => [{ label: '🔗 Open job', title: 'Opens the job in a new tab, to look at its Job Notifications switch yourself', onClick: openJob(x.j) }] }),
        real ? sec('turned', (OFF_ON === 'off' ? '🔕 Turned off' : '🔔 Turned on'), 'good', false, by['turned ' + OFF_ON]) : null,
        real ? sec('already', (OFF_ON === 'off' ? '🔕 Already off' : '🔔 Already on'), 'quiet', false, by['already ' + OFF_ON]) : null,
        !real ? sec('on', '🔔 On', 'done', false, by.on) : null,
        !real ? sec('off', '🔕 Off', 'quiet', false, by['already off']) : null,
        results.size || stopped ? sec('notdone', stopped ? 'Not done (stopped)' : 'Not done', 'faint', false, by.notdone) : null
      ].filter(Boolean);
      cards.render(sections);
      fit();
    };

    const start = async mode => {
      // real: something gets changed. want: the setting each job should end up with.
      const real = mode === 'off' || mode === 'on';
      const want = mode === 'on';
      const OFF_ON = want ? 'on' : 'off';
      if (running || !picker.size()) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      picker.setPicking(false);
      cancelRead();
      running = true; stop = false; lock = TOOL; lastMode = mode;
      setEnabled(false);
      confirmBox.style.display = 'none';
      log.textContent = '';
      cards.render([]);
      setBar(0, 1);
      progress.style.display = 'grid';
      // Bring the counts, the progress and the results into view (inside the tool, not the page).
      fit();
      const pr = jobsPane.getBoundingClientRect(), sr = statusBox.getBoundingClientRect();
      if (sr.top < pr.top || sr.top > pr.top + 40) jobsPane.scrollTop += sr.top - pr.top - 6;
      stopBtn.disabled = false; stopBtn.textContent = 'Stop'; stopBtn.style.display = 'inline-block';
      againBtn.style.display = 'none';
      copyBtn.textContent = 'Copy results';
      const list = picker.ids();
      const date = boardDate();
      const home = board.homeHash();
      const NO_SWITCH = 'COULD NOT FIND SWITCH';
      const results = new Map();   // job -> { text, kind, status, retried }; a retry replaces the first result
      let liveTimer = null;
      const KEEP = { 'turned off': false, 'already off': false, 'turned on': true, 'already on': true, on: true };
      const record = (j, r, retry) => {
        r.retried = !!retry;
        r.status = r.kind === 'problem' ? r.text : '';
        results.set(j, r);
        add(j + ': ' + (retry ? 'retry: ' : '') + r.text);
        // The list and the board show what the job is now. A problem gets read again afterwards.
        if (r.kind in KEEP) states.set(j, { on: KEEP[r.kind], at: Date.now() }); else states.delete(j);
        // Redrawn a few times a second at most (a long list of "already off" jobs comes in all at once).
        if (!liveTimer) liveTimer = setTimeout(() => { liveTimer = null; picker.render(); renderStatus(); showCards(list, results, mode, stop); }, 120);
      };
      // Opens one job and checks (or turns off / on) its switch. Returns { text, kind }.
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
          if (!real) return inp.checked ? res('ON (left alone)', 'on') : res('already off', 'already off');
          if (inp.checked === want) return res('already ' + OFF_ON, 'already ' + OFF_ON);
          (first(LB) || inp).click();
          const moved = await until(() => { const x = first(IN); return x && x.checked === want; }, 4000, 250);
          if (!moved) return res('FAILED, still ' + (want ? 'off' : 'on'), 'problem');
          // Saved? The job data says so as soon as ServiceTitan has it. Until then, keep an eye on
          // the switch for a moment in case it flips back.
          const t0 = Date.now();
          while (Date.now() - t0 < 1500) {
            await wait(300);
            if (await apiState(j) === want) { const y = first(IN); if (!y || y.checked === want) return res('turned ' + OFF_ON, 'turned ' + OFF_ON); }
          }
          const x = first(IN);
          if (x && x.checked !== want) return res('FLIPPED BACK ' + (want ? 'OFF' : 'ON') + ' (save may have failed)', 'problem');
          return res('turned ' + OFF_ON, 'turned ' + OFF_ON);
        } catch (e) {
          return res('ERROR: ' + errText(e), 'problem');
        }
      };
      try {
        const what = real ? ' (turning notifications ' + OFF_ON.toUpperCase() + ')' : ' (checking only, nothing changed)';
        header = '🔕 Job Notifications · ' + date + ' · ' + plural(list.length, 'job') + what;
        add(date + ' - ' + plural(list.length, 'job') + what);
        // Read every job's setting first, a few at a time. Jobs that are already the way you want
        // them (and, when only checking, every job) need no page at all. The rest are opened one at
        // a time. A job whose setting couldn't be read is opened and checked on its page instead.
        say('Reading ' + plural(list.length, 'job') + '...');
        const preAt = Date.now();
        const pre = await st.pool(list, 4, readState, (d, t) => say('Reading jobs... ' + d + ' of ' + t), { stop: () => stop });
        if (pre.halted === 'signedOut') throw pre.haltError;
        // This login can't open job records at all: the job pages won't open either, so say so
        // instead of opening every one and blaming a ServiceTitan change.
        if (list.length && pre.filter(x => x && x.error && st.isNoPermission(x.error)).length === list.length) {
          noAccess = true;
          const why = 'Your ServiceTitan login doesn\'t have permission to open job records, so it can\'t ' + (real ? 'change' : 'check') + ' job notifications. Nothing was changed.';
          add('⚠️ ' + why); say('⚠️ ' + why);
          return;
        }
        // Fresh readings go straight onto the list and the board.
        pre.forEach((v, i) => { if (v === true || v === false) states.set(list[i], { on: v, at: preAt }); });
        if (pre.some(v => v === true || v === false)) noAccess = false;
        picker.render(); renderStatus();
        if (pre.halted) add('⚠️ ' + st.haltNote(pre) + ' Opening the rest one at a time instead.');
        const toOpen = list.filter((j, n) => real ? pre[n] !== want : pre[n] !== true && pre[n] !== false).length;
        for (let n = 0; n < list.length; n++) {
          if (stop) { add('Stopped. ' + (list.length - n) + ' job(s) not checked.'); break; }
          const j = list[n];
          setBar(n, list.length);
          let on = pre[n] === true || pre[n] === false ? pre[n] : null;
          if (!real) {
            if (on === false) { record(j, { text: 'already off', kind: 'already off' }); continue; }
            if (on === true) { record(j, { text: 'ON (left alone)', kind: 'on' }); continue; }
          } else {
            // About to leave it alone as "already off" (or "already on")? Only on a fresh reading.
            if (on === want && Date.now() - preAt > FRESH_MS) {
              try { on = await readState(j); } catch (e) { if (st.isSignedOut(e)) throw e; on = null; }
            }
            if (on === want) { record(j, { text: 'already ' + OFF_ON, kind: 'already ' + OFF_ON }); continue; }
          }
          const opened = Array.from(results.values()).filter(r => r.opened).length;
          say((real ? 'Turning ' + OFF_ON + ' ' : 'Checking ') + (opened + 1) + ' of ' + Math.max(toOpen, opened + 1) + ' (job ' + j + (picker.label(j) ? ', ' + picker.label(j) : '') + ')');
          const r = await doJob(j);
          r.opened = true;
          record(j, r);
        }
        setBar(1, 1);
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
            const r = await doJob(j);
            r.opened = true;
            record(j, r, true);
          }
          const still = failed.filter(j => results.get(j).kind === 'problem');
          add(still.length ? 'Still a problem after retry: ' + still.join(', ') : 'All retried jobs worked.');
        }
        const kinds = {};
        let noSwitch = 0, problems = 0;
        results.forEach(r => { kinds[r.kind] = (kinds[r.kind] || 0) + 1; if (r.text === NO_SWITCH) noSwitch++; if (r.kind === 'problem') problems++; });
        const summary = Object.keys(kinds).map(k => kinds[k] + ' ' + k).join(', ') || 'nothing done';
        const checked = results.size;
        againBtn.style.display = real && problems ? 'inline-block' : 'none';
        if (checked && noSwitch === checked) {
          health.flag(TOOL, 'can\'t find the Job Notifications switch on job pages', '.qa-job-notification-toggle input');
          say('Done: ' + summary + '.' + CHANGED);
        } else {
          if (checked) health.clear(TOOL);
          say('Done: ' + summary + '.' + (problems ? ' The ⚠️ cards need a look.' : ''));
        }
      } catch (e) {
        if (st.isSignedOut(e)) { add('⚠️ ' + e.message); say('⚠️ ' + e.message); }
        else say('⚠️ Stopped by an error: ' + errText(e));
      } finally {
        if (location.hash !== home) { location.hash = home; await wait(800); }
        clearTimeout(liveTimer); liveTimer = null;
        showCards(list, results, mode, stop);
        running = false; lock = null;
        stopBtn.style.display = 'none';
        refresh(true, stop || noAccess);
      }
    };
    // Another tool (Move Jobs) hands over jobs: add them to the list.
    const takeJobs = ids => {
      if (running) return 0;
      confirmBox.style.display = 'none';
      const n = picker.addMany(ids);
      say('Added ' + plural(n, 'job') + ' from Move Jobs. Their settings show in the list as they\'re read; then turn their notifications off or on.');
      return n;
    };
    return {
      refresh,
      takeJobs,
      leave: () => { picker.setPicking(false); if (!running) cancelRead(); },
      isRunning: () => running,
      stop: requestStop,
      cleanup: () => { cancelRead(); picker.cleanup(); window.removeEventListener('resize', fit); }
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
    // The 🛡️ settings are read again before they're used (the list, picking, Start, and right
    // before each person), so blocking someone or unticking a team in another tab counts here too.
    // Damaged team rules block everyone; a damaged never-list keeps the one this copy already had.
    const isMap = v => !!v && typeof v === 'object' && !Array.isArray(v);
    const syncSafety = () => {
      const r = readSaved(K.teams, null, teamRules);
      teamRules = isMap(r) ? r : null;
      const n = readSaved(K.never, {}, never);
      if (isMap(n)) never = n;
    };
    let selected = new Set(loadJSON(K.sel, []));
    let pickIdx = Math.max(0, Math.min(parseInt(get(K.pick) || '0', 10) || 0, list.length - 1));

    // ---- Reading the board ----
    // The techs on the board come from the board's data, each with their team (it comes with the
    // tech now, so a board filter can't hide it), their job count on the day, and their status when
    // it's Dispatched or Working (the statuses that can be trusted; Idle can mean many things, so
    // it's never used).
    const liveStatus = new Map();   // tech id -> 'Dispatched' | 'Working'
    let statusKey = '', statusAt = 0, statusLoading = null;
    const loadStatus = async () => {
      const s = board.latest();
      if (!s || !s.techs.length) return;
      const key = s.key;
      if (key === statusKey && Date.now() - statusAt < 60000) return;
      if (statusLoading) return statusLoading;
      statusLoading = (async () => {
        const d = s.day, next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        const r = await st.getJSON('/dispatch-center/technicians', 30000, { page: 1, pageSize: s.techs.length, businessUnitIds: [], skillIds: [], teamIds: [], workstreamIds: [], shiftTypes: [],
          technicianIds: s.techs.map(t => Number(t.id)), orderBy: [], includeSkills: false, applyTeamsManagement: false, includeLicenseTypes: true, startDate: board.iso(d), endDate: board.iso(next) });
        liveStatus.clear();
        ((r && Array.isArray(r.items)) ? r.items : []).forEach(t => {
          const w = norm(t && (t.status || t.statusKey || t.currentActivityDisplayedStatus));
          const v = /dispatch/i.test(w) ? 'Dispatched' : /work/i.test(w) ? 'Working' : '';
          if (t && t.id != null && v) liveStatus.set(String(t.id), v);
        });
        statusKey = key; statusAt = Date.now();
      })().catch(() => {}).then(() => { statusLoading = null; });
      return statusLoading;
    };
    const boardTechs = () => {
      const out = new Map(), s = board.latest();
      if (!s) return out;
      s.techs.forEach(t => { if (t.name) out.set(t.id, { id: t.id, name: t.name, team: t.team || null, jobs: board.techJobs(t.id).length, status: liveStatus.get(t.id) || '' }); });
      return out;
    };
    const teamsOnBoard = () => { const s = board.latest(); return s ? s.teams.slice().concat(s.techs.some(t => !t.team) ? ['(no team)'] : []) : []; };
    const teamAllowed = team => !!(teamRules && team && teamRules[team] === true);
    const canMessage = t => !!t && teamAllowed(t.team) && !never[t.id];
    const firstName = name => norm(name).split(' ')[0] || '';
    const STATUS_MARK = { Dispatched: '🚚 Dispatched', Working: '🔧 Working' };

    // ---- The Send Message panel (ServiceTitan's Activity Center, inside the board) ----
    // Finding it means looking through the board, so remember it once found, and while it's
    // missing, look again at most twice a second.
    let acCache = null, acLastMiss = 0;
    const acHost = fresh => {
      if (acCache && acCache.isConnected) return acCache;
      acCache = null;
      if (!fresh && Date.now() - acLastMiss < 500) return null;
      const find = r => r ? Array.from(r.querySelectorAll('*')).find(e => /^SERVICETITAN-ACTIVITY-CENTER/i.test(e.tagName)) || null : null;
      acCache = find(board.root()) || find(document);
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
    // The element actually showing at a spot, looking inside the board's sealed-off parts
    // (the message panel sits inside the board, inside its own sealed-off part).
    const deepAt = (x, y) => {
      let e = document.elementsFromPoint(x, y).find(n => !panel.contains(n));
      for (let i = 0; e && e.shadowRoot && i < 6; i++) {
        const inner = e.shadowRoot.elementsFromPoint(x, y).find(n => !panel.contains(n));
        if (!inner || inner === e) break;
        e = inner;
      }
      return e || null;
    };
    // What's showing on top of the message box: '' if the box itself is (at any of a few spots in
    // the part of it that's on screen), or else a short description of what covers it, for the log.
    const describe = e => e.tagName.toLowerCase() + (e.getAttribute('data-cy') ? '[' + e.getAttribute('data-cy') + ']' : '') +
      (e.getAttribute('role') ? ' role=' + e.getAttribute('role') : '') + (e.getAttribute('aria-label') ? ' "' + e.getAttribute('aria-label').slice(0, 30) + '"' : '');
    const coverOf = () => {
      const box = chatBox();
      if (!box) return 'no message box';
      const r = box.getBoundingClientRect();
      const top = Math.max(r.top, 0), bottom = Math.min(r.bottom, innerHeight), left = Math.max(r.left, 0), right = Math.min(r.right, innerWidth);
      if (right - left < 20 || bottom - top < 8) return 'the message box is off the screen';
      let first = null;
      for (const [fx, fy] of [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5], [0.5, 0.2], [0.5, 0.8]]) {
        const e = deepAt(left + (right - left) * fx, top + (bottom - top) * fy);
        if (e && (e === box || box.contains(e))) return '';
        if (!first && e) first = e;
      }
      return first ? describe(first) : 'nothing showing there';
    };
    const boxOnTop = () => !coverOf();
    // Moves the Toolbox panel to the left of the message panel so it doesn't cover it.
    // The run puts it back where it was afterward (see go()).
    let dodged = false;
    const acRect = () => {
      const box = chatBox();
      if (!box) return null;
      // From the message box outward: the widest part that's still a side panel, not the whole page.
      let best = box.getBoundingClientRect();
      for (let e = box.parentElement || (box.parentNode && box.parentNode.host); e; e = e.parentElement || (e.parentNode && e.parentNode.host)) {
        const q = e.getBoundingClientRect();
        if (q.width > Math.max(640, innerWidth * 0.5)) break;
        if (q.width && q.height) best = q;
      }
      return best;
    };
    const dodge = () => {
      const hr = acRect();
      if (!hr) return;
      const pr = panel.getBoundingClientRect();
      if (hr.width && pr.right > hr.left && pr.left < hr.right) {
        panel.style.left = Math.max(0, hr.left - pr.width - 16) + 'px';
        panel.style.right = 'auto';
        dodged = true;
      }
    };
    // A missing ServiceTitan piece (not a one-off glitch): flag it and stop the whole run.
    const changed = (what, detail) => { health.flag('Tech Messages', what, detail); return { changed: true, what }; };
    // "Send Message" in the tech menu: in that tech's own menu first (the board draws it inside
    // their name, so a menu left open for someone else is never used), then by its label anywhere
    // on the board, or else by its words (in the board or on the page, never in the Toolbox), in
    // case ServiceTitan renames the label.
    const menuItem = scope => {
      const own = scope && scope.isConnected ? Array.from(scope.querySelectorAll('[data-cy="tmi-send-message"]')).find(visible) : null;
      if (own) return own;
      const byLabel = board.qa('[data-cy="tmi-send-message"]').find(visible);
      if (byLabel) return byLabel;
      const SEL = '[role="menuitem"], [role="menu"] *, li, button';
      const said = board.qa(SEL).concat(Array.from(document.querySelectorAll(SEL)))
        .filter(e => !panel.contains(e) && visible(e) && norm(e.textContent) === 'Send Message');
      const inner = said.find(e => !said.some(o => o !== e && e.contains(o)));
      return inner ? (inner.closest('[role="menuitem"], li, button') || inner) : null;
    };
    // How the tech menu opened last ('right' or 'left' click), so the next tech is quicker.
    let menuHow = null;
    // Every tech menu that's open, closed with an Escape on the menu itself (seen Oct 29 2026: an
    // Escape on the page doesn't reach it, and the menu stays open after Send Message).
    const openItems = () => board.qa('[data-cy="tmi-send-message"]').filter(visible).concat([menuItem()]).filter((x, i, a) => x && a.indexOf(x) === i);
    const closeMenus = async () => {
      const items = openItems();
      items.forEach(it => (it.closest('[role="menu"]') || it).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, composed: true, cancelable: true })));
      if (items.length) await until(() => !openItems().length, 1000, 100);
    };
    const openChatFor = async t => {
      if (!board.root()) return changed('can\'t find the Dispatch board on the page', 'SERVICETITAN-DISPATCH-CENTER-*');
      // The board only draws the rows on screen: bring the tech's row into view first.
      let h = await board.showTech(t.id);
      if (!h) return 'not showing on the board right now (a board filter may hide them)';
      // A row the board has just drawn starts as a plain name with no menu, and gets its menu
      // about 1.5 seconds later (seen Oct 29 2026). Wait for it: the name gets a menu button
      // (or, on the Oct 27 board, a data-hover-popover-trigger mark). The row can be drawn again
      // meanwhile, so it's looked up each time.
      const hasMenuButton = x => !!x && (!!x.querySelector('button[aria-haspopup]') || x.hasAttribute('data-hover-popover-trigger'));
      if (!hasMenuButton(h)) h = (await until(() => { const x = board.headerOf(t.id); return hasMenuButton(x) ? x : null; }, 6000, 100)) || board.headerOf(t.id) || h;
      // The tech menu opens from their name: a right-click (Oct 27 2026) or a left click (it does
      // both since Oct 29). Whichever worked last is tried first. The press goes to the innermost
      // part of the name at that spot, so it reaches the menu whichever part listens for it.
      const press = how => {
        const btn = h.querySelector('button[aria-haspopup]');
        const r = (btn || h).getBoundingClientRect(), x = r.left + Math.min(40, r.width / 2), y = r.top + r.height / 2;
        let el = btn || h;
        for (let c; (c = Array.from(el.children).find(k => { const q = k.getBoundingClientRect(); return q.width && x >= q.left && x <= q.right && y >= q.top && y <= q.bottom; })); ) el = c;
        const o = { bubbles: true, composed: true, cancelable: true, view: window, clientX: x, clientY: y };
        if (how === 'right') { el.dispatchEvent(new MouseEvent('contextmenu', Object.assign({ button: 2, buttons: 2 }, o))); return; }
        const pt = Object.assign({ pointerId: 1, pointerType: 'mouse', isPrimary: true }, o);
        el.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ button: 0, buttons: 1 }, pt)));
        el.dispatchEvent(new MouseEvent('mousedown', Object.assign({ button: 0, buttons: 1 }, o)));
        el.dispatchEvent(new PointerEvent('pointerup', Object.assign({ button: 0, buttons: 0 }, pt)));
        el.dispatchEvent(new MouseEvent('mouseup', Object.assign({ button: 0, buttons: 0 }, o)));
        el.dispatchEvent(new MouseEvent('click', Object.assign({ button: 0, buttons: 0 }, o)));
      };
      const openMenu = async how => {
        await closeMenus();
        press(how);
        const found = await until(() => menuItem(h), 1500);
        if (found) menuHow = how;
        return found;
      };
      const ways = menuHow === 'left' ? ['left', 'right'] : ['right', 'left'];
      let item = null;
      for (let round = 0; round < 3 && !item; round++) {   // more rounds for a slow board
        if (round) await wait(500);
        for (const how of ways) { if ((item = await openMenu(how))) break; }
      }
      if (!item) {
        // The menu has opened for others in this run: it's this tech (ServiceTitan may not offer
        // messages for them). It never opened: something changed, so stop rather than skip everyone.
        if (menuHow) return 'their menu didn\'t open from their name (ServiceTitan may not offer messages for them)';
        return changed('the tech menu didn\'t open from a tech\'s name (right-click or left click)', '[data-cy="tmi-send-message"] / "Send Message"');
      }
      // Only ever the item that says exactly "Send Message" (never the memo or call items).
      if (norm(item.textContent) !== 'Send Message') return changed('the tech menu has no "Send Message" option', '[data-cy="tmi-send-message"]: Send Message');
      item.click();
      const ok = await until(() => chatBox() && panelName().toLowerCase() === t.name.toLowerCase(), 8000);
      await closeMenus();   // the menu stays open after Send Message
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
    const msgLine = () => el('div', 'font-size:12px;color:var(--st-ink-2);margin-bottom:6px;min-height:16px;white-space:pre-wrap');
    const head = text => el('div', 'font-weight:700;margin-bottom:4px', text);
    const row = () => el('div', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px');
    const scrollBox = css => el('div', 'max-height:calc(100vh - 300px);overflow:auto;border:1px solid var(--st-line);border-radius:6px;padding:4px 6px;background:var(--st-soft);' + (css || ''));
    const check = (label, checked, onChange, disabled) => {
      const l = el('label', 'display:flex;gap:6px;align-items:center;padding:3px 0;cursor:' + (disabled ? 'not-allowed' : 'pointer') + ';font-size:12px;' + (disabled ? 'color:var(--st-ink-3)' : ''));
      const c = el('input'); c.type = 'checkbox'; c.checked = !!checked; c.disabled = !!disabled;
      c.onchange = () => onChange(c.checked);
      l.append(c, document.createTextNode(label));
      return l;
    };

    // ===== Main view =====
    const vMain = mkView('main');
    const mainMsg = msgLine();
    const msgList = el('div', '');
    const toLine = el('div', 'font-size:12px;margin-top:8px;padding:6px 8px;border:1px solid var(--st-line);border-radius:6px;background:var(--st-soft)');
    const toTools = el('div', 'display:flex;gap:6px;align-items:center;margin-top:6px;flex-wrap:wrap');
    const pickTechBtn = smallBtn('🖱️ Pick on board', () => setPicking(!picking));
    pickTechBtn.title = 'Click techs\' names on the board to add them (click again to take one off)';
    const clearSelBtn = smallBtn('Clear', () => { if (running) return; selected.clear(); saveSel(); renderMain(); });
    toTools.append(pickTechBtn, clearSelBtn);
    const toList = el('div', 'display:none;max-height:130px;overflow:auto;border:1px solid var(--st-line);border-radius:6px;background:var(--st-soft);margin-top:4px');
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
    const mainNav = row();
    mainNav.append(
      smallBtn('← Menu', () => showView('menu')),
      smallBtn('👥 Choose techs', () => openPicker()),
      smallBtn('✏️ Edit messages', () => openEditor()),
      smallBtn('🛡️ Who can be messaged', () => openSafety())
    );
    vMain.append(mainMsg, msgList, toLine, toTools, toList, modeRow, startBtn, mainNav);

    const recipients = () => {
      const techs = boardTechs();
      return Array.from(selected).map(id => techs.get(id)).filter(t => canMessage(t));
    };
    const renderMain = () => {
      syncSafety();
      msgList.textContent = '';
      list.forEach(([name, text], i) => {
        const on = i === pickIdx;
        const b = el('button', FULL + 'margin:5px 0;padding:8px 10px;cursor:pointer;border:1px solid ' + (on ? 'var(--st-blue)' : 'var(--st-line)') + ';border-radius:8px;font-weight:600;background:' + (on ? 'var(--st-blue-s)' : 'var(--st-bg)') + ';color:var(--st-ink);text-align:left;font:inherit' + (on ? ';box-shadow:inset 3px 0 0 var(--st-blue)' : ''), (on ? '✔ ' : '') + (name || '(no name)'));
        b.type = 'button';
        b.title = text;
        b.addEventListener('mousedown', e => e.preventDefault());
        b.onclick = () => { pickIdx = i; set(K.pick, String(i)); renderMain(); };
        msgList.appendChild(b);
      });
      if (!onBoard()) { say(board.need()); startBtn.disabled = true; startBtn.style.opacity = '.5'; toLine.textContent = ''; toList.style.display = 'none'; return; }
      if (!teamRules) { say('First, set up who can be messaged (🛡️ below). Nothing can be sent until you do.'); startBtn.disabled = true; startBtn.style.opacity = '.5'; toLine.textContent = 'To: nobody yet'; toList.style.display = 'none'; return; }
      const r = recipients();
      // The picked techs, each with ✕ to take them off.
      toList.textContent = '';
      toList.style.display = r.length ? 'block' : 'none';
      r.forEach(t => {
        const line = el('div', 'display:flex;gap:6px;align-items:center;padding:3px 6px;border-bottom:1px solid var(--st-line);font-size:12px');
        const nm = el('span', 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap');
        nm.append(el('b', '', t.name), document.createTextNode('  · ' + (t.team || 'no team') + (t.status ? ' · ' + STATUS_MARK[t.status] : '')));
        line.append(nm, smallBtn('✕', () => { if (running) return; selected.delete(t.id); saveSel(); renderMain(); }, 'padding:1px 6px'));
        toList.appendChild(line);
      });
      toLine.textContent = 'To: ' + (r.length ? r.length + ' tech' + (r.length === 1 ? '' : 's') + ' (' + r.slice(0, 4).map(t => t.name).join(', ') + (r.length > 4 ? ', …' : '') + ')' :
        selected.size && !board.latest() ? 'reading the board…' : 'nobody picked yet. Click 👥 Choose techs.');
      const techsNow = boardTechs();
      const offBoard = Array.from(selected).filter(id => !techsNow.has(id)).length;
      if (offBoard && board.latest()) toLine.textContent += ' · ' + offBoard + ' picked before aren\'t on the board now (left out)';
      startBtn.disabled = !r.length; startBtn.style.opacity = r.length ? '1' : '.5';
      startBtn.textContent = mode === 'auto' ? 'Review and send…' : 'Start (type only)';
      if (!mainMsg.textContent || /^(Open the Dispatch|Switch the Dispatch|Wait for the Dispatch|First, set up)/.test(mainMsg.textContent)) say('Pick a message, choose techs (👥 or 🖱️ Pick on board), then Start.');
      paintTechs();
    };
    const say = s => { mainMsg.textContent = s; };

    // ---- Picking techs on the board ----
    // While it's on, clicking a tech's name on the board adds them (or takes them off) instead
    // of opening their menu. Only techs your 🛡️ settings allow can be added.
    let picking = false;
    const techStyle = el('style');   // goes inside the board (board.mount)
    const paintTechs = () => {
      const ids = msgsPane.style.display !== 'none' ? Array.from(selected).filter(id => /^\d+$/.test(id)) : [];
      techStyle.textContent = board.techsCss(ids, '#6a1b9a', 'rgba(106,27,154,.14)');
      if (techStyle.textContent) board.mount(techStyle);
    };
    // A tech's name clicked on the board (tech IDs are numbers; anything else is ignored).
    const clickedTech = e => board.clickedTech(e);
    const setPicking = on => {
      if (on && !teamRules) { openSafety(); return; }
      picking = !!on && !running;
      pickTechBtn.textContent = picking ? '🖱️ Picking: ON' : '🖱️ Pick on board';
      pickTechBtn.style.background = picking ? '#6a1b9a' : '';
      pickTechBtn.style.color = picking ? '#fff' : '';
      pickTechBtn.style.borderColor = picking ? '#6a1b9a' : '';
      if (picking) { say(onBoard() ? 'Click techs\' names on the board to add them. Click again to take one off.' : board.need()); board.load().catch(() => {}); }
    };
    const onTechClick = e => {
      if (!picking || running || !onBoard() || panel.contains(e.target) || views.main.style.display === 'none') return;
      const id = clickedTech(e);
      if (!id) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      const t = boardTechs().get(id);
      if (!t) { say('That tech isn\'t in the board\'s data yet. Try again in a moment.'); board.load({ fresh: true }).catch(() => {}); return; }
      syncSafety();
      if (selected.has(id)) { selected.delete(id); say('Took ' + t.name + ' off.'); }
      else if (!canMessage(t)) { say('🛡️ ' + t.name + ' can\'t be messaged: ' + (never[id] ? 'they\'re on the never-message list.' : !t.team ? 'they aren\'t on a team.' : 'their team (' + t.team + ') is blocked.')); return; }
      else { selected.add(id); say('Added ' + t.name + '.'); }
      saveSel(); renderMain();
    };
    window.addEventListener('click', onTechClick, true);
    pickers.push({ active: () => picking && !running && views.main.style.display !== 'none', hit: e => !!clickedTech(e) });

    // ===== Choose techs =====
    const vPick = mkView('pick');
    const pickMsg = msgLine();
    const search = el('input', FULL + 'padding:6px 7px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;color:var(--st-ink);background:var(--st-bg);margin-bottom:6px');
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
    // Quick picks by status: the techs ServiceTitan shows as Dispatched (on the way) or Working.
    const statusRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 6px');
    const statusBtn = (st2, label) => {
      const b = smallBtn(label, () => { shown.filter(t => t.status === st2).forEach(t => selected.add(t.id)); saveSel(); renderPicker(); });
      b.title = 'Adds every tech showing below whose status in ServiceTitan is ' + st2 + '.';
      return b;
    };
    const workingBtn = statusBtn('Working', '＋ 🔧 Working'), dispatchedBtn = statusBtn('Dispatched', '＋ 🚚 Dispatched');
    statusRow.append(workingBtn, dispatchedBtn);
    vPick.append(head('👥 Choose techs'), pickMsg, search, jobsOnlyRow, statusRow, pickList, pickNav);
    search.oninput = () => renderPicker();
    let shown = [];
    const saveSel = () => { set(K.sel, JSON.stringify(Array.from(selected))); paintTechs(); };
    const openPicker = () => {
      if (!teamRules) return openSafety();
      sub('pick'); renderPicker();
      board.load().then(() => loadStatus()).then(() => { if (views.pick.style.display !== 'none') renderPicker(); }, () => {});
    };
    const renderPicker = () => {
      syncSafety();
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
          const c = check(t.name + (t.jobs ? '  · ' + t.jobs + ' job' + (t.jobs === 1 ? '' : 's') : '') + (t.status ? '  · ' + STATUS_MARK[t.status] : ''), selected.has(t.id), v => { v ? selected.add(t.id) : selected.delete(t.id); saveSel(); renderPicker(); });
          c.style.paddingLeft = '16px';
          pickList.appendChild(c);
        });
      });
      if (!shown.length) pickList.appendChild(el('div', 'font-size:12px;color:var(--st-ink-3);padding:6px 0', jobsOnly ? 'No allowed techs with jobs on the board. Untick "Only show techs with jobs" or check 🛡️ Who can be messaged.' : 'No allowed techs found. Check 🛡️ Who can be messaged.'));
      const blockedCount = techs.filter(t => !canMessage(t)).length;
      pickMsg.textContent = !board.latest() ? (onBoard() ? 'Reading the board…' : board.need()) :
        selected.size + ' picked. ' + blockedCount + ' people are hidden because their team is blocked or they\'re on the never-message list.';
      pickMsg.style.whiteSpace = 'pre-wrap';
      const nW = shown.filter(t => t.status === 'Working').length, nD = shown.filter(t => t.status === 'Dispatched').length;
      workingBtn.textContent = '＋ 🔧 Working (' + nW + ')'; dispatchedBtn.textContent = '＋ 🚚 Dispatched (' + nD + ')';
      [[workingBtn, nW], [dispatchedBtn, nD]].forEach(([b, n]) => { b.disabled = !n; b.style.opacity = n ? '1' : '.5'; });
    };

    // ===== Who can be messaged (safety settings) =====
    const vSafe = mkView('safe');
    const safeMsg = msgLine();
    const teamList = scrollBox('max-height:calc(50vh - 120px)');
    const neverHead = el('div', 'font-weight:700;margin-top:10px', '🚫 Never message these people');
    const neverList = el('div', 'font-size:12px;margin:4px 0');
    const neverAdd = el('input', FULL + 'padding:6px 7px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;color:var(--st-ink);background:var(--st-bg)');
    neverAdd.type = 'text'; neverAdd.placeholder = 'Type a name to block (e.g. the owner)'; neverAdd.id = 'st-msg-never';
    const neverResults = el('div', 'font-size:12px');
    let draftRules = {}, draftNever = {};
    const safeNav = row();
    safeNav.append(
      smallBtn('Save', () => saveSafety(), PRIMARY),
      smallBtn('Cancel', () => { sub('main'); renderMain(); })
    );
    vSafe.append(head('🛡️ Who can be messaged'), safeMsg, teamList, neverHead, neverList, neverAdd, neverResults, safeNav);
    const openSafety = async () => {
      if (!onBoard()) { sub('main'); say(board.need().replace(/\.$/, ', so the Toolbox can see the teams.')); return; }
      if (!board.latest()) {
        sub('main'); say('Reading the board…');
        try { await board.load(); } catch (e) { say('⚠️ Couldn\'t read the board: ' + errText(e)); return; }
      }
      // Start from what's saved right now, so saving here doesn't undo a change made in another tab.
      syncSafety();
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
      if (!ids.length) neverList.appendChild(el('div', 'color:var(--st-ink-3)', 'Nobody yet.'));
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
        r.append(el('span', 'flex:1', t.name + ' · ' + (t.team || 'no team')), smallBtn('Block', () => { draftNever[t.id] = t.name; neverAdd.value = ''; renderSafety(); }, 'padding:2px 6px;color:var(--st-red)'));
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
    const ed = listEditor('message', 'Button name (e.g. ☀️ Good Morning)', 'Message text', 'calc(100vh - 300px)');
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
    const confText = el('div', 'font-size:12px;white-space:pre-wrap;max-height:calc(100vh - 330px);overflow:auto;border:1px solid var(--st-line);border-radius:6px;padding:6px;background:var(--st-soft)');
    const confAsk = el('div', 'font-size:12px;margin-top:8px');
    const confInput = el('input', 'width:70px;padding:5px 6px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;color:var(--st-ink);background:var(--st-bg);margin-left:6px');
    confInput.type = 'text'; confInput.id = 'st-msg-confirm-count'; confInput.inputMode = 'numeric';
    const confGo = smallBtn('Send', () => go(), DANGER);
    const confNav = row();
    confNav.append(confGo, smallBtn('Cancel', () => { sub('main'); renderMain(); }));
    vConfirm.append(head('Check before sending'), confText, confAsk, confNav);
    let pending = [];
    const openConfirm = () => {
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      setPicking(false);
      syncSafety();
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
    const runMsg = el('div', 'font-size:12px;color:var(--st-ink-2);margin-bottom:6px;min-height:16px');
    const runLog = el('pre', 'max-height:220px;overflow:auto;margin:0;padding:6px;background:var(--st-soft);border:1px solid var(--st-line);border-radius:6px;white-space:pre-wrap;font:12px/1.35 ui-monospace,Consolas,monospace');
    const runStep = el('div', 'display:none;margin-top:8px;padding:8px;border:1px solid var(--st-blue);background:var(--st-blue-s);border-radius:6px;font-size:12px');
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
      menuHow = null;   // each run finds out again how the tech menu opens
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
      // Where the panel sits now. dodge() may slide it aside during the run; it goes back here
      // afterward, unless you dragged it somewhere yourself during the run (that saves a new spot).
      const homePos = { left: panel.style.left, right: panel.style.right, saved: get('stPos') };
      dodged = false;
      try {
        for (let n = 0; n < people.length; n++) {
          if (stopRun) { add('Stopped. ' + (people.length - n) + ' not messaged.'); break; }
          const planned = people[n];
          runMsg.textContent = (auto ? 'Sending ' : 'Typing ') + (n + 1) + ' of ' + people.length + ': ' + planned.name;
          if (!onBoard()) { out(planned, 'stopped: not on the Dispatch board (Day view)', 'problem'); break; }
          // Re-check the board and the saved 🛡️ settings right before each person.
          try { await board.load({ maxAge: 30000 }); } catch (e) { if (st.isSignedOut(e)) { out(planned, 'stopped: ' + e.message, 'problem'); break; } }
          const t = boardTechs().get(planned.id);
          if (!t) { out(planned, 'skipped: not on the board any more', 'skipped'); continue; }
          syncSafety();
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
          let cover = coverOf();
          if (cover) {
            await closeMenus(); await closeJobDrawer(); dodge();
            // The panel may still be sliding in: give it up to 2.5 seconds.
            cover = (await until(() => !coverOf(), 2500, 150)) ? '' : coverOf();
          }
          if (cover) { out(t, 'skipped: something is covering the message box (' + cover + ')', 'problem'); continue; }
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
        if (dodged && get('stPos') === homePos.saved) { panel.style.left = homePos.left; panel.style.right = homePos.right; }
        dodged = false;
        running = false; lock = null;
        stopBtn.style.display = 'none'; doneBtn.style.display = 'inline-block';
        if (stepResolve) stepResolve('stop');
      }
    };

    msgsPane.appendChild(pane);
    sub('main');
    return {
      refresh: () => {
        if (!running) { sub('main'); renderMain(); }
        paintTechs();
        // The board's techs and statuses, read in the background; the list follows.
        if (onBoard()) board.load().then(() => loadStatus()).then(() => { if (!running && msgsPane.style.display !== 'none' && views.main.style.display !== 'none') renderMain(); }, () => {});
      },
      leave: () => { if (picking) setPicking(false); techStyle.textContent = ''; },
      isRunning: () => running,
      stop: requestStop,
      cleanup: () => { window.removeEventListener('click', onTechClick, true); board.unmount(techStyle); }
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
    const msg = el('div', 'font-size:12px;color:var(--st-ink-2);min-height:16px');
    const say = s => { msg.textContent = s; };
    const toRow = el('div', 'display:flex;gap:6px;align-items:center');
    const toLabel = el('span', 'font-size:12px;font-weight:600', 'Change to');
    const branchPick = el('select', 'flex:1;min-width:0;padding:6px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;color:var(--st-ink);background:var(--st-bg)');
    branchPick.id = 'st-biz-branch';
    toRow.append(toLabel, branchPick);

    // The jobs to change: picked on the board or typed in. Blue outline while this tool is open.
    const picker = jobPicker({
      color: '#0265dc', soft: 'rgba(2,101,220,.22)', max: MAX_PER_RUN,
      shown: () => bizPane.style.display !== 'none',
      busy: () => running,
      say: t => say(t),
      changed: () => updateButtons(),
      tool: TOOL
    });

    const actions = el('div', 'display:flex;flex-wrap:wrap;gap:6px');
    const checkBtn = smallBtn('Check jobs (changes nothing)', () => startRun('check'), PRIMARY);
    const changeBtn = smallBtn('Change…', () => askConfirm('change'), 'color:var(--st-red);border-color:var(--st-red-l)');
    actions.append(checkBtn, changeBtn);
    const confirmBox = el('div', 'display:none;padding:8px;border:1px solid var(--st-red-l);background:var(--st-red-s);border-radius:6px;font-size:12px;gap:6px;flex-wrap:wrap;align-items:center');
    const confirmText = el('span', 'flex-basis:100%');
    const confirmYes = smallBtn('Yes', () => {}, DANGER);
    confirmBox.append(confirmText, confirmYes, smallBtn('Cancel', () => { confirmBox.style.display = 'none'; }));

    const progress = el('div', 'display:none;gap:6px');
    const log = el('pre', 'max-height:200px;overflow:auto;margin:0;padding:6px;background:var(--st-soft);border:1px solid var(--st-line);border-radius:6px;white-space:pre-wrap;font:12px/1.35 ui-monospace,Consolas,monospace');
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
    const navRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    navRow.append(smallBtn('← Menu', () => { if (!running) showView('menu'); }));
    wrap.append(msg, toRow, picker.box, actions, confirmBox, progress, navRow);
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
    // Waits (up to a few seconds of clock time, however slow the reads are) for the job data to
    // show the new branch. True once it does.
    const confirmedByData = async (j, to) => {
      const end = Date.now() + 5000;
      while (Date.now() < end) {
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
    // A job is only left alone on a fresh reading (see FRESH_MS); an older one is read again.
    const handle = async (it, real, pre, preAt) => {
      let known = pre && !pre.error && !pre.notRun ? pre : null;
      if (known && real && (same(known.from, it.to) || known.locked) && Date.now() - preAt > FRESH_MS) {
        try { known = await readJob(it.job); } catch (e) { if (st.isSignedOut(e)) throw e; known = null; }
      }
      if (known) {
        if (same(known.from, it.to)) return res('already ' + it.to, 'already');
        if (known.locked) return res('locked in ServiceTitan (shows ' + known.from + ')', 'locked');
        if (!real) return res(known.from + ' → would change to ' + it.to, 'would change', { from: known.from });
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
      const home = board.homeHash();
      const results = new Map();
      const record = (it, r, retry) => { results.set(it.job, r); add('#' + it.job + ': ' + (retry ? 'retry: ' : '') + r.text); };
      const verb = mode === 'check' ? 'Checking' : mode === 'putback' ? 'Putting back' : 'Changing';
      try {
        add(mode === 'check' ? 'Check for ' + to + ' (nothing is changed)' : mode === 'putback' ? 'Put back to how they were' : 'Change to ' + to);
        // Read every job's Business Unit first, a few at a time. No pages to open for that.
        say('Reading ' + plural(items.length, 'job') + '...');
        // A job that couldn't be read is opened and checked on its page instead.
        const preAt = Date.now();
        const pre = await st.pool(items, 4, it => readJob(it.job), (d, t) => say('Reading jobs... ' + d + ' of ' + t), { stop: () => stop });
        if (pre.halted === 'signedOut') throw pre.haltError;
        if (pre.halted) add('⚠️ ' + st.haltNote(pre) + ' Opening the rest one at a time instead.');
        let halted = false;
        for (let n = 0; n < items.length; n++) {
          if (stop) { add('Stopped. ' + plural(items.length - n, 'job') + ' not done.'); break; }
          const it = items[n];
          say(verb + ' ' + (n + 1) + ' of ' + items.length + ' (job ' + it.job + ')');
          const r = await handle(it, real, pre[n], preAt);
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
        if (st.isSignedOut(e)) { add('⚠️ ' + e.message); say('⚠️ ' + e.message); }
        else say('⚠️ Stopped by an error: ' + errText(e));
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

    const refresh = () => { if (running) return; renderBranches(); picker.render(); if (!onBoard() && !msg.textContent) say(board.need() + ' Or type job numbers.'); };
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
    const K = { folders: 'stCtFolders', folder: 'stCtFolder', pick: 'stCtPick', mode: 'stCtMode', name: 'stCtName', all: 'stCtAllMobiles', never: 'stCtNever', types: 'stCtTypes', source: 'stCtSource', added: 'stCtAddedFolders', confirm: 'stCtConfirmFolders' };
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
      ] },
      // Sent to ＋ Everyone on the board for the day of their appointments. {when} says today,
      // tomorrow or the date. Customers who answer C get their appointment confirmed by
      // 📥 Check replies.
      { name: '✅ Confirm Appt', days: 1, same: true, msgs: [
        ['📅 Confirm appointment', 'Hey, this is {dispatcher} with AirSouth Cooling, Heating, Plumbing, and Electrical. I\'m reaching out to remind you of your appointment you have with us {when}. If you have any questions, please call (601) 847-9941. Reply \'C\' to confirm. Thank you!']
      ] },
      // Reminders to customers on the board (＋ Everyone on the board). The starter message is a
      // plain reminder: no phone number, offer or "call us", which is what makes a reminder read
      // as a sales text.
      { name: '📣 OutReach', days: 30, same: true, msgs: [
        ['🔥 Heater reminder', 'Hey, this is {dispatcher} with AirSouth Cooling, Heating, Plumbing and Electrical. Cooler weather is on the way, so here is a friendly reminder to switch your thermostat to heat and let it run for a few minutes before the first cold night. Reply STOP to opt out.']
      ] }
    ];
    const cloneDefaults = () => DEFAULT_FOLDERS.map(f => ({ name: f.name, days: f.days, same: f.same, msgs: f.msgs.map(m => m.slice()) }));
    const validFolders = v => Array.isArray(v) && v.length > 0 && v.every(f => f && typeof f.name === 'string' && Array.isArray(f.msgs) &&
      f.msgs.every(n => Array.isArray(n) && n.length === 2 && typeof n[0] === 'string' && typeof n[1] === 'string'));
    const tidy = f => { f.days = Math.max(0, Math.min(365, parseInt(f.days, 10) || 0)); f.same = !!f.same; return f; };
    let folders = (() => { const v = loadJSON(K.folders, null); return validFolders(v) ? v : cloneDefaults(); })().map(tidy);
    const saveFolders = () => set(K.folders, JSON.stringify(folders));
    // Folders added to the defaults in an update. Someone who already saved their own folders gets
    // each one once, at the end of their list (unless they already have one by that name), and
    // never again after deleting it. Someone still on the defaults already has them.
    const ADDED_LATER = ['📣 OutReach', '✅ Confirm Appt'];
    const folderKey = n => norm(n).replace(/[^a-z0-9]/gi, '').toLowerCase();
    (() => {
      let seen = loadJSON(K.added, []);
      if (!Array.isArray(seen)) seen = [];
      const usingDefaults = !validFolders(loadJSON(K.folders, null));
      let changed = false;
      ADDED_LATER.forEach(name => {
        if (seen.indexOf(name) > -1) return;
        seen.push(name);
        if (usingDefaults || folders.some(f => folderKey(f.name) === folderKey(name))) return;
        const d = DEFAULT_FOLDERS.find(f => f.name === name);
        if (d) { folders.push(tidy({ name: d.name, days: d.days, same: d.same, msgs: d.msgs.map(m => m.slice()) })); changed = true; }
      });
      set(K.added, JSON.stringify(seen));
      if (changed) saveFolders();
    })();
    // Folders whose messages ask customers to reply C (📁 Edit folders → "Customers confirm by
    // replying C"). 📥 Check replies only looks at replies to these, so a reply to any other text
    // (OutReach, Holds...) never confirms or flags anything. Kept apart from the folders
    // themselves, so an older copy of the Toolbox reading the same folders isn't confused by it.
    const CONFIRM_DEFAULT = ['✅ Confirm Appt'];
    let confirmKeys = (() => { const v = loadJSON(K.confirm, null); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : CONFIRM_DEFAULT.map(folderKey); })();
    const isConfirmFolder = f => !!f && confirmKeys.indexOf(folderKey(f.name)) > -1;
    const saveConfirm = () => set(K.confirm, JSON.stringify(confirmKeys));
    // 1.6.5: the Confirm Appt message as it shipped in 1.6.4 ("…with us tomorrow.") becomes the
    // {when} one, once, and only where nobody changed it.
    (() => {
      if (get('stCtWhenUpdated') === '1') return;
      const was = 'Hey, this is {dispatcher} with AirSouth Cooling, Heating, Plumbing, and Electrical. I\'m reaching out to remind you of your appointment you have with us tomorrow. If you have any questions, please call (601) 847-9941. Reply \'C\' to confirm. Thank you!', now = 'Hey, this is {dispatcher} with AirSouth Cooling, Heating, Plumbing, and Electrical. I\'m reaching out to remind you of your appointment you have with us {when}. If you have any questions, please call (601) 847-9941. Reply \'C\' to confirm. Thank you!';
      let changed = false;
      folders.forEach(f => f.msgs.forEach(m => { if (m[1] === was) { m[1] = now; if (m[0] === '📅 Confirm tomorrow') m[0] = '📅 Confirm appointment'; changed = true; } }));
      if (changed) saveFolders();
      set('stCtWhenUpdated', '1');
    })();
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
    const fill = (tmpl, r) => tmpl.replace(/\{dispatcher\}/gi, myName()).replace(/\{first\}/gi, r.first || '').replace(/\{tech\}/gi, r.tech || '').replace(/\{when\}/gi, r.when || '');
    // {when}: the appointment's day compared with today's date when the text goes out: "today",
    // "tomorrow", or "on Friday, October 30" for anything later. null once the day has passed.
    const whenText = day => {
      const t = new Date(); t.setHours(0, 0, 0, 0);
      const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
      if (diff < 0) return null;
      if (diff === 0) return 'today';
      if (diff === 1) return 'tomorrow';
      return 'on ' + d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };
    // A job's next appointment day (today or later, not Done or Canceled), read from the job panel's
    // list of its appointments. For a job not on the board's day (another tab of the Jobs Tray at
    // the bottom, or typed in). null if it has none.
    const nextApptDay = async jobId => {
      const t = new Date(); t.setHours(0, 0, 0, 0);
      const days = (await st.jobAppointments(jobId))
        .filter(a => !(a.status === 4 || a.status === 5 || (typeof a.status === 'string' && /^(done|completed|cancell?ed)$/i.test(norm(a.status)))))
        .map(a => a.start ? new Date(a.start) : null).filter(d => d && !isNaN(d))
        .map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate())).filter(d => d.getTime() >= t.getTime())
        .sort((a, b) => a - b);
      return days[0] || null;
    };
    // A picked job's appointment day: the board's day, for a job on the board's timeline that day
    // or added by ＋ Everyone on the board (that day's timeline and Unassigned list). null otherwise
    // (another tab of the Jobs Tray, a typed job): its next appointment is then read (nextApptDay).
    const jobDay = j => {
      const day = boardDay();
      if (!day) return null;
      // Added by ＋ Everyone on the board for the day the board shows now. (Loaded for another day,
      // it's read fresh below instead.)
      const b = boardInfo.get(String(j));
      if (b && b.day instanceof Date && sameDay(b.day, day)) return day;
      // On the board's timeline that day (the board's data, as last read for this day).
      return board.latest() && board.job(j) ? day : null;
    };

    // ---------- Settings ----------
    let allMobiles = get(K.all) === '1';
    let never = (loadJSON(K.never, []) || []).map(last10).filter(n => n.length === 10);
    // The 🚫 never-text list, read again before it's used (Settings, the check before texting, and
    // right before each text), so a number blocked in another tab is never texted from this one.
    // A damaged list keeps the one this copy already had.
    const syncNever = () => {
      const v = readSaved(K.never, [], never);
      if (Array.isArray(v)) never = v.map(last10).filter(n => n.length === 10);
    };

    // ---------- Reading the board ----------
    // The day the board shows (for the Hold list: today if the board isn't showing).
    const boardDateISO = () => { const d = board.day(); if (d) return board.isoT(d); const t = new Date(); t.setHours(0, 0, 0, 0); return board.isoT(t); };
    // The Business Units the board is filtered to (the Hold list uses the same filter).
    const boardBUs = () => board.bus();
    const buNames = ids => {
      const all = (window.App && window.App.Data && window.App.Data.BusinessUnits) || [];
      return ids.map(id => (all.find(b => Number(b.Id) === Number(id)) || {}).Name).filter(Boolean);
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
        if (r.status === 401) throw Object.assign(new Error(st.SIGNED_OUT), { kind: 'signedOut' });
        if (!r.ok) throw Object.assign(new Error('ServiceTitan answered ' + r.status), { kind: r.status >= 500 ? 'trouble' : 'bad' });
        const d = await r.json();
        if (!d || !Array.isArray(d.Jobs)) { health.flag(TOOL, 'the Hold list came back in a shape the Toolbox doesn\'t know', '/Dispatch/GetJobs'); throw new Error('unexpected reply'); }
        return d;
      };
      const seen = new Set(), jobs = [];
      const take = d => d.Jobs.forEach(j => {
        if (!j || !j.JobId || seen.has(j.JobId)) return;
        seen.add(j.JobId);
        jobs.push({ jobId: j.JobId, customer: norm(j.Customer), customerId: j.CustomerId, type: norm(j.Type) || '(no type)', status: norm(j.JobStatus) });
      });
      const firstPage = await page(0);
      const total = firstPage.Count || 0;
      take(firstPage);
      const skips = [];
      for (let skip = PAGE; skip < Math.min(total, 20000); skip += PAGE) skips.push(skip);
      const rest = await st.pool(skips, 3, page);
      if (rest.halted) throw rest.haltError;
      rest.forEach(d => { if (d && d.error) throw d.error; take(d); });
      health.clear(TOOL);
      return { jobs, total, bus: buNames(ids), at: new Date() };
    };

    // ---------- Jobs picked on the board ----------
    // Customer and tech: from the board's data if the job is on it, else from the Jobs Tray row it was picked from,
    // else from what ＋ Everyone on the board loaded (it also loads Unassigned jobs that aren't showing).
    const boardInfo = new Map();   // job -> { jobId, customer, customerId, tech }
    const jobInfo = j => {
      const b = board.job(j);
      if (b) return { customer: b.customer, customerId: b.customerId, tech: b.tech };
      const loaded = boardInfo.get(String(j));
      if (loaded) return loaded;
      const p = picker.info(j);
      return p ? { customer: p.label, customerId: p.customerId || null, tech: '' } : null;
    };

    // ---------- ＋ Everyone on the board ----------
    // Every job on the day the board shows: the timeline (with your board's filters) plus the whole
    // Unassigned list (all pages, for your board's branches). Holds aren't included: they have
    // their own choice under Who. Canceled appointments are left out.
    let everyoneLoading = false;
    const boardDay = () => board.day();
    const sameDay = (a, b) => board.sameDay(a, b);
    // The board's whole day (shared with Job Notifications' ＋ Whole board).
    const loadEveryone = () => boardData.whole(TOOL);

    // ---------- UI ----------
    const pane = el('div', 'padding:8px 10px 10px');
    const views = {};
    const sub = name => { Object.keys(views).forEach(k => { views[k].style.display = k === name ? 'block' : 'none'; }); };
    const mkView = name => { views[name] = el('div', 'display:none'); pane.appendChild(views[name]); return views[name]; };
    const msgLine = () => el('div', 'font-size:12px;color:var(--st-ink-2);margin-bottom:6px;min-height:16px;white-space:pre-wrap');
    const head = text => el('div', 'font-weight:700;margin-bottom:4px', text);
    const row = () => el('div', 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px');
    const label = text => el('div', 'font-size:11px;font-weight:700;color:var(--st-ink-2);text-transform:uppercase;letter-spacing:.03em;margin-top:10px;margin-bottom:3px', text);
    const check = (text, checked, onChange) => {
      const l = el('label', 'display:flex;gap:6px;align-items:center;padding:2px 0;cursor:pointer;font-size:12px');
      const c = el('input'); c.type = 'checkbox'; c.checked = !!checked;
      c.onchange = () => onChange(c.checked);
      l.append(c, document.createTextNode(text));
      return { l, c };
    };
    const chip = (text, on, onClick) => {
      const b = el('button', 'padding:4px 10px;cursor:pointer;border:1px solid ' + (on ? 'var(--st-blue)' : 'var(--st-ctl)') + ';border-radius:14px;background:' + (on ? 'var(--st-blue)' : 'var(--st-bg)') + ';color:' + (on ? '#fff' : 'var(--st-ink)') + ';font:inherit;font-size:12px;font-weight:' + (on ? '700' : '600'), text);
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
    const ruleLine = el('div', 'font-size:11px;color:var(--st-ink-3);margin-top:4px');
    const msgList = el('div', '');
    const whoRow = el('div', 'display:grid;gap:1px');
    const whoBox = el('div', 'margin-top:4px');
    const modeRow = el('div', 'display:grid;gap:1px');
    const startBtn = smallBtn('Start', () => openConfirm(), PRIMARY + 'margin-top:10px;' + FULL + 'padding:8px');
    const mainNav = row();
    mainNav.append(
      smallBtn('← Menu', () => { if (!running) showView('menu'); }),
      smallBtn('✏️ Edit messages', () => openEditor()),
      smallBtn('📁 Edit folders', () => openFolders()),
      smallBtn('⚙️ Settings', () => openSettings())
    );
    // 📥 Check replies: only on folders whose texts ask customers to reply C.
    const repliesBtn = smallBtn('📥 Check replies and confirm', () => openReplies(), 'margin-top:6px;' + FULL + 'padding:7px;border-color:var(--st-green);color:var(--st-green-d);font-weight:600');
    repliesBtn.title = 'Reads the replies to this folder\'s texts from everyone on the board (or the jobs you picked) for the day shown. Customers who answered C get their appointment confirmed; anyone who answered something else is listed for you to read. Nothing is sent.';
    vMain.append(mainMsg, label('Folder'), folderRow, ruleLine, label('Message'), msgList, label('Who'), whoRow, whoBox, label('How'), modeRow, startBtn, repliesBtn, mainNav);
    const say = s => { mainMsg.textContent = s; };

    let stopRun = false, running = false, stepResolve = null;
    let source = get(K.source) === 'picked' ? 'picked' : 'holds';
    // Jobs you pick: green outline while this tool is open on "Jobs I pick".
    const picker = jobPicker({
      color: '#2e7d32', soft: 'rgba(46,125,50,.22)',
      shown: () => textsPane.style.display !== 'none' && source === 'picked',
      busy: () => running,
      say: t => say(t),
      changed: () => renderMain(),
      tool: TOOL
    });
    let mode = get(K.mode) === 'auto' ? 'auto' : 'type';
    const openGroups = new Set();

    // Who gets texted: one entry per customer (the first job found for them).
    const recipients = () => {
      const out = [], seen = new Set();
      const addOne = r => { const key = r.customerId ? 'c' + r.customerId : 'j' + r.jobId; if (seen.has(key)) return; seen.add(key); out.push(r); };
      if (source === 'holds') {
        if (!holds) return out;
        holds.jobs.forEach(h => { if (typeSel.has(h.type)) addOne({ jobId: h.jobId, customer: h.customer, customerId: h.customerId, tech: '', hold: true, listStatus: h.status }); });
      } else {
        picker.ids().forEach(j => { const b = jobInfo(j) || {}; addOne({ jobId: j, customer: b.customer || picker.label(j) || '', customerId: b.customerId || null, tech: b.tech || '', day: jobDay(j) }); });
      }
      return out;
    };

    const renderHolds = () => {
      whoBox.textContent = '';
      const top = el('div', 'display:flex;gap:6px;align-items:center;flex-wrap:wrap');
      const info = el('span', 'font-size:12px;flex:1;min-width:120px');
      const loadBtn = smallBtn(holds ? '↻ Reload' : 'Load holds', () => doLoadHolds());
      if (holdsLoading) { info.textContent = 'Loading holds…'; loadBtn.disabled = true; loadBtn.style.opacity = '.5'; loadBtn.classList.add('st-busy'); }
      else if (!holds) info.textContent = onBoard() ? 'Loads every hold on the board\'s Hold list.' : board.need();
      else info.textContent = s1(holds.jobs.length, 'hold') + (holds.bus.length ? ' · ' + holds.bus.join(', ') : ' · all business units') +
        ' · ' + holds.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      top.append(info, loadBtn);
      whoBox.appendChild(top);
      if (!holds) return;
      const groups = new Map();
      holds.jobs.forEach(h => { const g = groupOf(h.type); if (!groups.has(g)) groups.set(g, new Map()); const m = groups.get(g); m.set(h.type, (m.get(h.type) || 0) + 1); });
      const box = el('div', 'max-height:190px;overflow:auto;border:1px solid var(--st-line);border-radius:6px;padding:3px 6px;background:var(--st-soft);margin-top:5px');
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
      if (!onBoard()) { say(board.need()); return; }
      holdsLoading = true; renderMain();
      try { holds = await loadHolds(); say('Loaded ' + s1(holds.jobs.length, 'hold') + '. Tick the kinds to text.'); }
      catch (e) { say('⚠️ Couldn\'t load the Hold list: ' + errText(e)); }
      finally { holdsLoading = false; renderMain(); }
    };

    const everyoneBtn = smallBtn('＋ Everyone on the board', () => addEveryone());
    everyoneBtn.title = 'Adds every job on the board for the day it shows: the timeline and the whole Unassigned list (all pages, your board\'s branches). Holds aren\'t included. Take anyone off with ✕.';
    // ＋ A department…: everyone on one team's schedule (the team names on the board, like Level 1
    // Service or Installers), or the Unassigned list. Pick more than one to add them all.
    const deptSel = el('select', 'padding:4px 6px;border:1px solid var(--st-ctl);border-radius:5px;font:inherit;font-size:12px;color:var(--st-ink);background:var(--st-bg);max-width:100%;cursor:pointer');
    deptSel.title = 'Adds the jobs of one department (a team on the board, like Level 1 Service or Installers) on the day the board shows, or the whole Unassigned list. Pick another to add it too. Take anyone off with ✕.';
    const UNASSIGNED_OPT = '\u0001unassigned';
    let deptKey = null;
    const fillDepts = force => {
      if (running || everyoneLoading) return;
      const rows = onBoard() ? boardData.teams() : [];
      const key = onBoard() ? (boardDay() ? boardDay().toDateString() : '') + '|' + rows.map(r => r.name + ':' + r.n).join(',') : 'off';
      if (!force && key === deptKey) return;   // nothing changed: leave the list alone (it may be open)
      deptKey = key;
      deptSel.textContent = '';
      const top = el('option', '', onBoard() ? '＋ A department…' : board.view() === 'week' ? '＋ A department (switch the board to Day)' : '＋ A department (open the board)');
      top.value = '';
      deptSel.appendChild(top);
      rows.forEach(r => { const o = el('option', '', r.name + '  (' + s1(r.n, 'job') + ')'); o.value = r.name; deptSel.appendChild(o); });
      if (onBoard()) { const o = el('option', '', 'Unassigned list'); o.value = UNASSIGNED_OPT; deptSel.appendChild(o); }
      deptSel.value = '';
    };
    // Read again when you point at it or tab to it, so it matches the board.
    deptSel.addEventListener('mouseenter', () => fillDepts());
    deptSel.addEventListener('focus', () => fillDepts());
    deptSel.onchange = () => { const v = deptSel.value; deptSel.value = ''; if (v) addDept(v); };
    const everyoneRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap;margin-top:5px;align-items:center');
    everyoneRow.append(everyoneBtn, deptSel);
    const renderPicked = () => {
      whoBox.textContent = '';
      everyoneBtn.textContent = everyoneLoading ? 'Loading…' : '＋ Everyone on the board';
      everyoneBtn.classList.toggle('st-busy', !!everyoneLoading);
      everyoneBtn.disabled = everyoneLoading;
      everyoneBtn.style.opacity = everyoneLoading ? '.5' : '1';
      deptSel.disabled = everyoneLoading;
      deptSel.style.opacity = everyoneLoading ? '.5' : '1';
      fillDepts();
      whoBox.append(picker.box, everyoneRow);
    };
    const addDept = async name => {
      if (everyoneLoading || running) return;
      if (!onBoard()) { say(board.need()); return; }
      const what = name === UNASSIGNED_OPT ? 'the Unassigned list' : name;
      everyoneLoading = true; renderMain();
      say('Loading ' + what + '…');
      try {
        const r = await loadEveryone();
        r.jobs.forEach(x => { boardInfo.set(x.jobId, x); });
        const jobs = r.jobs.filter(x => name === UNASSIGNED_OPT ? x.unassigned : (x.teams || []).indexOf(name) > -1);
        if (!jobs.length) { say('No jobs ' + (name === UNASSIGNED_OPT ? 'in the Unassigned list' : 'for ' + name) + ' on ' + boardDay().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '.'); return; }
        const labels = {};
        jobs.forEach(x => { labels[x.jobId] = { label: x.customer, tags: x.tags, customerId: x.customerId }; });
        const n = picker.addMany(jobs.map(x => x.jobId), labels);
        say('Added ' + s1(n, 'job') + ' from ' + what + (n < jobs.length ? ' (' + (jobs.length - n) + ' already picked)' : '') +
          '. That\'s ' + s1(recipients().length, 'customer') + ' in the list (one text each). Take anyone off with ✕.');
      } catch (e) { say('⚠️ Couldn\'t load ' + what + ': ' + errText(e)); }
      finally { everyoneLoading = false; deptKey = null; renderMain(); }
    };
    const addEveryone = async () => {
      if (everyoneLoading || running) return;
      if (!onBoard()) { say(board.need()); return; }
      everyoneLoading = true; renderMain();
      say('Loading everyone on the board…');
      try {
        const r = await loadEveryone();
        const labels = {};
        r.jobs.forEach(x => { boardInfo.set(x.jobId, x); labels[x.jobId] = { label: x.customer, tags: x.tags, customerId: x.customerId }; });
        const n = picker.addMany(r.jobs.map(x => x.jobId), labels);
        say('Added ' + s1(n, 'job') + ' from the board (' + r.onTimeline + ' on the timeline, ' + r.unassigned + ' unassigned' +
          (r.canceled ? ', ' + r.canceled + ' canceled left out' : '') + '). That\'s ' + s1(recipients().length, 'customer') + ' (one text each). Take anyone off with ✕.');
      } catch (e) { say('⚠️ Couldn\'t load everyone on the board: ' + errText(e)); }
      finally { everyoneLoading = false; renderMain(); }
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
      ruleLine.textContent = '🔁 ' + ruleText(f) + (isConfirmFolder(f) ? '\n✅ Customers confirm by replying C: use 📥 Check replies afterwards.' : '');
      ruleLine.style.whiteSpace = 'pre-wrap';
      repliesBtn.style.display = isConfirmFolder(f) ? 'block' : 'none';
      repliesBtn.disabled = !onBoard(); repliesBtn.style.opacity = onBoard() ? '1' : '.5';
      msgList.textContent = '';
      if (!f.msgs.length) msgList.appendChild(el('div', 'font-size:12px;color:var(--st-ink-3)', 'No messages in this folder yet. Use ✏️ Edit messages.'));
      f.msgs.forEach(([name, text], i) => {
        const on = i === curMsgIdx();
        const b = el('button', FULL + 'margin:4px 0;padding:8px 10px;cursor:pointer;border:1px solid ' + (on ? 'var(--st-blue)' : 'var(--st-line)') + ';border-radius:8px;font-weight:600;background:' + (on ? 'var(--st-blue-s)' : 'var(--st-bg)') + ';color:var(--st-ink);text-align:left;font:inherit' + (on ? ';box-shadow:inset 3px 0 0 var(--st-blue)' : ''), (on ? '✔ ' : '') + (name || '(no name)'));
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
      picker.render();   // the list and its highlights
      if (!onBoard()) say(board.need());
      else if (m && uses(m[1], 'dispatcher') && !myName()) say('⚠️ This message uses {dispatcher}, but your name couldn\'t be found. Set it in ⚙️ Settings.');
      else if (!mainMsg.textContent || /^(Open the Dispatch|Switch the Dispatch|Wait for the Dispatch|⚠️ This message uses)/.test(mainMsg.textContent)) say(myName() ? 'Texts are signed as ' + myName() + '.' : '');
    };

    // ===== Edit messages =====
    const vEdit = mkView('edit');
    const editHead = head('');
    const editMsg = msgLine();
    const EDIT_HINT = 'Fill-ins: {dispatcher} = your first name, {first} = customer\'s first name, {tech} = the tech\'s first name (jobs on the board only), {when} = when their appointment is: "today", "tomorrow" or "on Friday, October 30" (not for holds). Saved in this browser.';
    const ed = listEditor('message', 'Button name (e.g. 🆓 Free quote)', 'Message text', 'calc(100vh - 320px)', { allowEmpty: true });
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
    const foldBox = el('div', 'max-height:calc(100vh - 300px);overflow:auto;margin:0 -4px;padding:0 4px');
    let draftF = [];
    const renderFolders = () => {
      foldBox.textContent = '';
      draftF.forEach((f, i) => {
        const r = el('div', 'border:1px solid var(--st-line);border-radius:8px;padding:7px;margin-bottom:8px;background:var(--st-soft);font-size:12px');
        const nm = el('input', FULL + 'padding:5px 6px;border:1px solid var(--st-ctl);border-radius:5px;font:inherit;font-weight:600;color:var(--st-ink);background:var(--st-bg)');
        nm.type = 'text'; nm.value = f.name; nm.placeholder = 'Folder name'; nm.oninput = () => { f.name = nm.value; };
        const rule = el('div', 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:5px');
        const days = el('input', 'width:46px;padding:3px 5px;border:1px solid var(--st-ctl);border-radius:5px;font:inherit;color:var(--st-ink);background:var(--st-bg)');
        days.type = 'number'; days.min = '0'; days.max = '365'; days.value = String(f.days);
        days.oninput = () => { f.days = Math.max(0, Math.min(365, parseInt(days.value, 10) || 0)); };
        rule.append(document.createTextNode('Skip if texted in the last'), days, document.createTextNode('days (0 = never skip, 1 = today)'));
        const sameOnly = check('Only count this same message (not other texts)', f.same, v => { f.same = v; });
        sameOnly.l.style.marginTop = '3px';
        const confirms = check('✅ Customers confirm by replying C (for 📥 Check replies)', !!f.confirm, v => { f.confirm = v; });
        confirms.l.title = 'Turn on for reminder texts that ask customers to reply C. 📥 Check replies then confirms the appointments of everyone who answered C. Leave it off for every other folder (OutReach, Holds...): replies to those are never read as a confirmation.';
        const tools = el('div', 'display:flex;gap:4px;margin-top:5px;align-items:center');
        const mv = d => () => { const j = i + d; if (j < 0 || j >= draftF.length) return; const t = draftF[i]; draftF[i] = draftF[j]; draftF[j] = t; renderFolders(); };
        tools.append(smallBtn('↑', mv(-1), i === 0 ? 'opacity:.4' : ''), smallBtn('↓', mv(1), i === draftF.length - 1 ? 'opacity:.4' : ''),
          el('span', 'flex:1;color:var(--st-ink-3);padding-left:4px', s1(f.msgs.length, 'message')),
          smallBtn('Delete', () => { draftF.splice(i, 1); renderFolders(); }, 'color:var(--st-red);border-color:var(--st-red-l)'));
        r.append(nm, rule, sameOnly.l, confirms.l, tools);
        foldBox.appendChild(r);
      });
    };
    const foldNav = row();
    foldNav.append(
      smallBtn('Save', () => {
        const kept = draftF.filter(f => norm(f.name) || f.msgs.length);
        const clean = kept.map(f => tidy({ name: norm(f.name), days: f.days, same: f.same, msgs: f.msgs }));
        if (!clean.length) { foldMsg.textContent = '⚠️ Keep at least one folder.'; return; }
        clean.forEach((f, i) => { if (!f.name) f.name = 'Folder ' + (i + 1); });
        const names = clean.map(f => f.name.toLowerCase());
        if (new Set(names).size !== names.length) { foldMsg.textContent = '⚠️ Two folders have the same name.'; return; }
        folders = clean; saveFolders();
        confirmKeys = clean.filter((f, i) => kept[i].confirm).map(f => folderKey(f.name)); saveConfirm();
        fIdx = Math.min(fIdx, folders.length - 1); set(K.folder, String(fIdx));
        sub('main'); say('✅ Folders saved.'); renderMain();
      }, PRIMARY),
      smallBtn('Cancel', () => { sub('main'); renderMain(); }),
      smallBtn('+ Add folder', () => { draftF.push({ name: '', days: 1, same: true, confirm: false, msgs: [] }); renderFolders(); foldBox.scrollTop = foldBox.scrollHeight; }),
      smallBtn('Reset to original', () => { draftF = cloneDefaults().map(f => Object.assign(f, { confirm: CONFIRM_DEFAULT.indexOf(f.name) > -1 })); renderFolders(); foldMsg.textContent = 'Back to the original folders and messages. Press Save to keep this.'; })
    );
    vFolders.append(head('📁 Edit folders'), foldMsg, foldBox, foldNav);
    const openFolders = () => {
      if (running) return;
      draftF = folders.map(f => ({ name: f.name, days: f.days, same: f.same, confirm: isConfirmFolder(f), msgs: f.msgs.map(m => m.slice()) }));
      foldMsg.textContent = 'Each folder has its own repeat rule. Deleting a folder deletes its messages when you Save.';
      renderFolders(); sub('folders');
    };

    // ===== Settings =====
    const vSet = mkView('settings');
    const setMsg = msgLine();
    const nameIn = el('input', FULL + 'padding:5px 6px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;color:var(--st-ink);background:var(--st-bg)');
    nameIn.type = 'text';
    const allChk = check('Text every mobile number on the Bill To (not just the primary)', allMobiles, () => {});
    const neverIn = el('textarea', FULL + 'padding:5px 6px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;font-size:12px;color:var(--st-ink);background:var(--st-bg);resize:vertical');
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
      el('div', 'font-size:11px;color:var(--st-ink-3);margin:2px 0 0 20px', 'Off: the primary number, or their first mobile if the primary is a landline.'),
      label('🚫 Never text these numbers'), neverIn, setNav);
    const openSettings = () => {
      if (running) return;
      const auto = autoName();
      nameIn.value = norm(get(K.name));
      nameIn.placeholder = auto ? auto + ' (from your ServiceTitan login)' : 'Your first name';
      setMsg.textContent = 'Leave the name empty to use the first name on your ServiceTitan login' + (auto ? ' (' + auto + ').' : '.');
      allChk.c.checked = allMobiles;
      syncNever();   // so saving here doesn't undo a number blocked in another tab
      neverIn.value = never.map(n => '(' + n.slice(0, 3) + ') ' + n.slice(3, 6) + '-' + n.slice(6)).join('\n');
      sub('settings');
    };

    // ===== Confirm =====
    // Before anything is typed, every customer is checked without opening their conversation:
    // their Bill To numbers, then each number's history (STOP, unread replies, the folder's
    // repeat rule, blocked in ServiceTitan). This screen then shows exactly who will be texted.
    const vConfirm = mkView('confirm');
    const confHead = head('Check before texting');
    const confText = el('div', 'font-size:12px;white-space:pre-wrap;max-height:calc(100vh - 340px);overflow:auto;border:1px solid var(--st-line);border-radius:6px;padding:6px;background:var(--st-soft)');
    const confAsk = el('div', 'font-size:12px;margin-top:8px');
    const confInput = el('input', 'width:70px;padding:5px 6px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;color:var(--st-ink);background:var(--st-bg);margin-left:6px');
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
      syncNever();
      const f = curFolder(), tmpl = m[1];
      const id = ++checkId;
      planned = null;
      confHead.textContent = 'Checking before texting';
      confText.textContent = 'Checking ' + s1(pending.length, 'customer') + '…';
      confAsk.textContent = ''; confGo.style.display = 'none';
      sub('confirm');
      const t0 = Date.now();
      const result = await plan(pending, f, tmpl, (d, t) => { if (id === checkId) confText.textContent = 'Checking customers… ' + d + ' of ' + t; }, () => id !== checkId);
      if (id !== checkId || result.stopped) return;   // cancelled
      if (result.signedOut) {
        confHead.textContent = 'Couldn\'t check';
        confText.textContent = '⚠️ ' + st.SIGNED_OUT + '\n\nNothing was sent.';
        return;
      }
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
      if (jobRecordBlocked && pending.some(r => r.hold)) lines.push('', 'ℹ️ Your ServiceTitan login can\'t open job records, so holds booked since the Hold list loaded can\'t be spotted. Reload the Hold list first if it\'s been a while.');
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
      confAsk.appendChild(el('div', 'color:var(--st-ink-3);margin-top:4px', 'Keep this tab on screen while it runs (browsers slow down hidden tabs). About 3 to 4 seconds per text.'));
    };
    confInput.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } };

    // ===== Run =====
    const vRun = mkView('run');
    const runMsg = el('div', 'font-size:12px;color:var(--st-ink-2);margin-bottom:6px;min-height:16px');
    const runLog = el('pre', 'max-height:220px;overflow:auto;margin:0;padding:6px;background:var(--st-soft);border:1px solid var(--st-line);border-radius:6px;white-space:pre-wrap;font:12px/1.35 ui-monospace,Consolas,monospace');
    const runStep = el('div', 'display:none;margin-top:8px;padding:8px;border:1px solid var(--st-blue);background:var(--st-blue-s);border-radius:6px;font-size:12px');
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
    // Many logins can't open the job record any more (ServiceTitan answers "not allowed"). Once
    // that's seen, job records aren't asked for again this session.
    let jobRecordBlocked = false;
    const NO_JOB_RECORD = 'your ServiceTitan login can\'t open job records, so a typed job number can\'t be looked up. Pick the job on the board or from the Hold list instead';
    // The job record (for its status, or a typed job's customer), or null if this login can't see it.
    const jobRecord = async jobId => {
      if (jobRecordBlocked) return null;
      try { return await st.job(jobId); }
      catch (e) {
        if (st.isNoPermission(e)) { jobRecordBlocked = true; return null; }
        throw st.isSignedOut(e) ? e : Object.assign(new Error('the job didn\'t load (' + errText(e) + ')'), { kind: e.kind });
      }
    };
    // The Bill To's phone numbers, primary first. Read from the customer (the same data as the
    // customer page's Contact Methods), which works without permission to view job records. A
    // typed job number has no customer yet, so that one comes from the job record.
    // alive(): optional; once false, the answer isn't wanted any more, so it stops asking.
    const billTo = async (r, alive) => {
      if (r.customerId) {
        let phones;
        try { phones = await st.customerPhones(r.customerId); }
        catch (e) {
          if (st.isSignedOut(e)) throw e;
          if (st.isNoPermission(e)) throw Object.assign(new Error('your ServiceTitan login doesn\'t have permission to see this customer\'s phone numbers'), { kind: e.kind });
          if (e && e.kind === 'bad' && /shape/.test(errText(e))) health.flag(TOOL, 'can\'t read the customer\'s phone numbers', 'contact-methods/getContactMethods');
          throw Object.assign(new Error('the customer\'s phone numbers didn\'t load (' + errText(e) + ')'), { kind: e.kind });
        }
        // Only a Hold-list job needs its status (to skip ones booked since the list loaded).
        const j = r.hold && (!alive || alive()) ? await jobRecord(r.jobId) : null;
        return { name: '', phones, status: j && typeof j.Status === 'string' ? j.Status : '' };
      }
      const j = await jobRecord(r.jobId);
      if (!j) throw Object.assign(new Error(NO_JOB_RECORD), { kind: 'noPermission' });
      const c = j.Customer;
      if (!c || !Array.isArray(c.Contacts)) { health.flag(TOOL, 'can\'t read the Bill To phone numbers from a job', 'Job/Index Customer.Contacts'); throw new Error('no Bill To contacts in the job data'); }
      if (c.Id && !r.customerId) r.customerId = c.Id;
      const phones = c.Contacts.filter(x => x && /phone/i.test(x.Type || '') && last10(x.Value).length === 10)
        .map(x => ({ num: last10(x.Value), mobile: /mobile/i.test(x.Type || '') }));
      return { name: norm(c.Name), phones, status: typeof j.Status === 'string' ? j.Status : '' };
    };
    // A job from the Hold list whose status has changed since the list was loaded (booked,
    // started, cancelled…) is skipped. Almost every job on the Hold list is "Hold" itself; a few
    // are on it because one of their appointments is on hold while the job is "Scheduled" or
    // "InProgress". Those are only skipped if their status changes too.
    const holdGone = (r, now) => {
      if (!r.hold || !r.listStatus || !now || same(now, r.listStatus)) return '';
      return /^hold$/i.test(r.listStatus) ? 'no longer on hold (now ' + now + ')' : 'changed since the Hold list was loaded (was ' + r.listStatus + ', now ' + now + ')';
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
    // Goes to a page without adding a step to the browser's Back button. A run starts on the
    // board and every page it opens takes the place of the one before, ending back on the board,
    // so a 150-text run leaves Back working as it did (instead of 150 conversations behind it).
    // The full address is used so only the part after # changes (never a page reload).
    const goTo = hash => {
      try { location.replace(location.href.split('#')[0] + hash); } catch (e) { location.hash = hash; }
    };
    const openChat = async (num, jobId) => {
      const want = '#/ChatCenter/' + num;
      if (location.hash.split('?')[0] === want) { goTo(board.HOME); await wait(800); }
      goTo(want + (jobId ? '?jobid=' + jobId : ''));
      const c = await until(() => chatFor(num), 15000, 100);
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
    // Replies in the order they came in. Two with the same time (or no time) go by message number
    // (normally higher for newer messages), so a STOP and a START close together are read in order.
    const idOf = m => { const n = Number(m && m.SmsId); return isFinite(n) ? n : 0; };
    const optedOut = list => {
      let out = false;
      list.filter(m => m.IsInbound).sort((a, b) => timeOf(a) - timeOf(b) || idOf(a) - idOf(b)).forEach(m => {
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
        Body: m.Body, CreatedOn: m.CreatedOn, SmsId: m.SmsId, Channel: m.Channel,
        IsOutbound: outbound, IsInbound: !outbound,
        // Reminders, confirmations, surveys and the like are automatic, not texts from us.
        IsNotification: outbound && c.auto.has(m.Channel),
        SmsSendErrorCode: m.SmsSendErrorCode || 0,
        HasNotBeenDelivered: m.SmsDeliveryStatus === c.sendErr || m.SmsDeliveryStatus === c.deliveryErr
      };
    });
    // One number, checked from the chat data: { ok } or { skip: reason, kind }.
    // alive(): optional; once false, the answer isn't wanted any more, so it stops asking.
    // What the conversation looks like right now (its last message, read and blocked status), so a
    // later quick read can tell whether anything has changed since. null if it can't be told.
    const threadSig = t => {
      if (!t) return 'none';
      const m = Array.isArray(t.Messages) && t.Messages.length ? t.Messages[t.Messages.length - 1] : null;
      if (!m || (m.SmsId == null && !m.CreatedOn)) return null;
      return [t.ThreadId, t.ReadStatus, t.BlockedStatus, m.SmsId, m.CreatedOn, m.SmsDeliveryStatus].join('|');
    };
    const checkNumber = async (num, f, text, alive) => {
      const c = codes();
      const t = await st.chatThread(num);
      const sig = threadSig(t);
      if (!t || (alive && !alive())) return { ok: true, sig };   // never texted before (or no longer wanted)
      if (t.BlockedStatus === c.blocked) return { skip: 'blocked in ServiceTitan (opted out)', kind: 'skipped', sig };
      if (t.ReadStatus === c.unread) return { skip: 'they have an unread reply. Read it first', kind: 'look', sig };
      const hist = asPageMsgs(await st.chatMessages(t.ThreadId, 100), c);
      if (optedOut(hist)) return { skip: 'they replied STOP', kind: 'skipped', sig };
      const recent = recentText(hist, f, text);
      if (recent) return { skip: (f.same ? 'got this message ' : 'texted ') + ago(recent), kind: 'skipped', sig };
      return { ok: true, sig };
    };
    // Everyone in the list, checked a few at a time: who gets a text and who's skipped (and why).
    // stop(): true once the check is cancelled. Returns { sends, skips }, or { stopped } or { signedOut }.
    const plan = async (list, f, tmpl, progress, stop) => {
      // If the chat data keeps failing, stop asking for it: those numbers get checked on their
      // conversation's page during the run instead (as when it can't be read at all).
      let chatTrouble = 0;
      const results = await st.pool(list, 4, async (r, i, alive) => {
        if (uses(tmpl, 'tech') && !r.tech) return { skips: [{ why: 'no tech on the board for {tech}', kind: 'skipped' }] };
        let when = '';
        if (uses(tmpl, 'when')) {
          if (r.hold) return { skips: [{ why: 'on hold, so there\'s no appointment day for {when}', kind: 'skipped' }] };
          let day = r.day;
          if (!day) {
            try { day = await nextApptDay(r.jobId); }
            catch (e) {
              if (st.isSignedOut(e)) throw e;
              return { skips: [{ why: 'its appointment couldn\'t be read for {when} (' + errText(e) + ')', kind: 'problem' }] };
            }
            if (!alive()) return null;
            if (!day) return { skips: [{ why: 'no upcoming appointment for {when}', kind: 'skipped' }] };
          }
          when = whenText(day);
          if (when === null) return { skips: [{ why: 'their appointment day has already passed', kind: 'skipped' }] };
        }
        const info = await billTo(r, alive);
        if (!alive()) return null;
        if (holdGone(r, info.status)) return { info, skips: [{ why: holdGone(r, info.status), kind: 'skipped' }] };
        const name = info.name || r.customer;
        const pickN = pickNumbers(info.phones);
        if (!pickN.nums.length) return { info, skips: [{ why: 'no mobile number on the Bill To', kind: 'skipped' }] };
        if (uses(tmpl, 'first') && !firstWord(name)) return { info, skips: [{ why: 'no customer name for {first}', kind: 'skipped' }] };
        const text = fill(tmpl, { first: titleCase(firstWord(name)), tech: r.tech, when });
        const nums = await Promise.all(pickN.nums.map(async num => {
          if (never.indexOf(num) > -1) return { num, skip: 'on your 🚫 never-text list', kind: 'skipped' };
          // If the chat data can't be read, the conversation's own page is checked during the run.
          if (chatTrouble >= 4) return { num, ok: true, unchecked: 'chat data skipped (ServiceTitan slow)' };
          if (!alive()) return { num, ok: true };
          try { const v = Object.assign({ num }, await checkNumber(num, f, text, alive)); chatTrouble = 0; return v; }
          catch (e) {
            if (st.isSignedOut(e)) throw e;
            if (e && e.kind === 'trouble') chatTrouble++;
            return { num, ok: true, unchecked: errText(e) };
          }
        }));
        return { info, text, note: pickN.note, nums };
      }, progress, { stop });
      if (results.stopped) return { stopped: true };
      if (results.halted === 'signedOut') return { signedOut: true };
      const sends = [], skips = [], seen = new Set();
      list.forEach((r, i) => {
        const x = results[i] || {};
        if (x === st.NOT_RUN) { skips.push({ r, num: '', why: 'not checked: ServiceTitan is slow or not answering. Try again in a bit', kind: 'problem' }); return; }
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
      const home = board.homeHash();
      runLog.textContent = ''; runMsg.textContent = '';
      stopBtn.disabled = false; stopBtn.textContent = 'Stop'; stopBtn.style.display = 'inline-block';
      doneBtn.style.display = 'none'; copyBtn.textContent = 'Copy results';
      sub('run');
      add((auto ? 'Auto-send' : 'Type only') + ' · ' + f.name + ' · "' + m[0] + '" · ' + s1(planned.customers, 'customer') + ' checked, ' + s1(sends.length, 'text') + ' to send');
      const tally = {}, look = [];
      let failsInRow = 0, signedOut = false;
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
      // A quick fresh look (no page) before each text: still a hold? Anything new since the check,
      // like a reply or a STOP? Signed out? To save time, the next customer's full look starts
      // while the current text is being typed and sent. At their turn, one quick read of their
      // conversation confirms nothing has changed since (and that you're still signed in); if
      // anything has, the full look is done again. A look more than 15 seconds old (Type only,
      // while you take your time) is redone, holds always get the full look at their turn, and the
      // open conversation is still checked right before typing.
      const LOOK_FRESH_MS = 15000;
      const lookAt = x => { const p = checkNumber(x.num, f, x.text); p.catch(() => {}); return { x, p, at: Date.now() }; };
      const fullLook = async x => {
        const r = x.r;
        if (r.hold && r.listStatus) { const j = await jobRecord(r.jobId); const why = holdGone(r, j && typeof j.Status === 'string' ? j.Status : ''); if (why) return { skip: why, kind: 'skipped' }; }
        return x.unchecked ? null : await checkNumber(x.num, f, x.text);
      };
      const canLookAhead = x => !!(x && !x.unchecked && !(x.r.hold && x.r.listStatus));
      let ahead = null;
      try {
        for (let n = 0; n < sends.length; n++) {
          if (stopRun) { add('Stopped. ' + s1(sends.length - n, 'text') + ' not sent.'); break; }
          const x = sends[n], r = x.r, num = x.num, text = x.text;
          runMsg.textContent = (auto ? 'Texting ' : 'Typing ') + (n + 1) + ' of ' + sends.length + ': ' + (r.customer || '#' + r.jobId);
          // The 🚫 never-text list again, as saved right now (it may have changed in another tab).
          syncNever();
          if (never.indexOf(num) > -1) { ahead = null; out(r, num, 'skipped: on your 🚫 never-text list', 'skipped'); continue; }
          const look = ahead && ahead.x === x && Date.now() - ahead.at <= LOOK_FRESH_MS ? ahead : null;
          ahead = null;
          let fresh = null;
          try {
            if (look) {
              let early = null;
              try { early = await look.p; } catch (e) { if (st.isSignedOut(e)) throw e; }
              if (early && early.skip) fresh = early;
              else if (early && early.sig) fresh = threadSig(await st.chatThread(num)) === early.sig ? early : await checkNumber(num, f, text);
              else fresh = await checkNumber(num, f, text);
            } else fresh = await fullLook(x);
          } catch (e) {
            // If ServiceTitan has signed you out, stop here.
            if (st.isSignedOut(e)) { signedOut = true; add('⚠️ ' + e.message + ' Stopped. ' + s1(sends.length - n, 'text') + ' not sent.'); break; }
            /* otherwise the page's own checks below still run */
          }
          if (n + 1 < sends.length && !stopRun && canLookAhead(sends[n + 1])) ahead = lookAt(sends[n + 1]);
          if (fresh && fresh.skip) { out(r, num, 'skipped: ' + fresh.skip, fresh.kind); continue; }
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
              while (watch) { if (wentOut(num, text, before)) return 'sent'; await wait(150); }
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
          const sent = await until(() => wentOut(num, text, before), 15000, 150);
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
        runMsg.textContent = signedOut ? '⚠️ ' + st.SIGNED_OUT + ' (Before that: ' + summary + '.)' : 'Done: ' + summary + '.';
      } catch (e) {
        runMsg.textContent = '⚠️ Stopped by an error: ' + errText(e);
      } finally {
        if (stepResolve) stepResolve('stop');
        if (location.hash !== home) { goTo(home); await wait(800); }
        running = false; lock = null; planned = null;
        stopBtn.style.display = 'none'; doneBtn.style.display = 'inline-block';
      }
    };

    // ===================================================================
    // 📥 Check replies (folders whose texts ask customers to reply C)
    // Reads each customer's conversation (nothing is sent), finds the confirm texts about the
    // board's day (one sent days ahead that names the day counts too), and the replies after them:
    //   - only C, Yes, OK, 👍 and the like -> their appointments on the board's day get confirmed
    //     (after a C, "already did" or "thanks" to a newer reminder still counts as a yes)
    //   - anything else, or STOP           -> "Needs a look", with what they said
    //   - no reply yet, or never texted    -> listed; nothing is changed for them
    // You see the list first. Nothing is confirmed until you press Confirm. Each appointment is
    // read fresh just before (already confirmed? canceled or done?), confirmed with the request the
    // job panel's ⋮ → Confirm sends, and read again to make sure it stuck. Right before a
    // customer's appointments are confirmed, their conversation is looked at once more: if anything
    // new came in since the check, they go to "Needs a look" instead.
    // ===================================================================
    // Which confirm texts count for the board's day: the message says "tomorrow", so one sent on
    // the last weekday before it (a Monday's reaches back to Friday, through the weekend) or on the
    // day itself. An older text was for an earlier appointment, so a C to it doesn't count.
    const textsFrom = day => {
      const d = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1);
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
      return d;
    };
    const escRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // A saved message as a pattern that matches it once sent. Only letters and numbers are
    // compared, so "Air South" / "AirSouth", "&" / "and", quotes and spacing don't matter, and a
    // fill-in can be any short text.
    const lettersOf = t => String(t == null ? '' : t).toLowerCase().replace(/[^a-z0-9]/g, '');
    const tmplMatcher = tmpl => {
      const re = new RegExp('^' + norm(tmpl).split(/(\{(?:dispatcher|first|tech|when)\})/i)
        .map(p => /^\{(?:dispatcher|first|tech|when)\}$/i.test(p) ? '[a-z0-9]{0,40}?' : escRe(lettersOf(p).replace(/and/g, '\u0001')).replace(/\u0001/g, '(?:and)?')).join('') + '$');
      return { test: body => re.test(lettersOf(body)) };
    };
    // Any text that asks the customer to reply C to confirm, however it's worded: ServiceTitan's
    // own automatic reminder ("…Reply 'C' to confirm."), a coworker's own wording ("respond…with
    // a, "C" to CONFIRM"), or a saved message from a confirm folder.
    const ASKS_FOR_C = /(["'‘’“”]\s*c\s*["'‘’“”][^.!?\n]{0,15}confirm)|(\b(reply|respond|text|send)\b[^.!?\n]{0,40}\bc\b[^.!?\n]{0,15}confirm)/i;
    // The day a text names ("on Friday, October 30", "Oct 30th", "10/30", or ServiceTitan's
    // "Friday October 23 2026"), or null. A December text naming January is next year's.
    const MONTH_RE = /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;
    const MONTHS3 = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const namedDay = (body, sent) => {
      const t = String(body == null ? '' : body);
      let mo = -1, dd = 0;
      const m = MONTH_RE.exec(t);
      if (m) { mo = MONTHS3.indexOf(m[1].slice(0, 3).toLowerCase()); dd = Number(m[2]); }
      else { const n = /(?:^|[^\d\/])(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?(?![\d\/])/.exec(t); if (n) { mo = Number(n[1]) - 1; dd = Number(n[2]); } }
      if (mo < 0 || mo > 11 || dd < 1 || dd > 31) return null;
      let d = new Date(sent.getFullYear(), mo, dd);
      if (d.getMonth() !== mo) return null;   // no such day (Feb 31)
      if (d.getTime() < sent.getTime() - 7 * 86400000) d = new Date(sent.getFullYear() + 1, mo, dd);
      return d;
    };
    // The day a text names by weekday only ("your appointment Monday", sent Thursday or Saturday):
    // the next one after the day it was sent. null when it names no weekday, more than one, or the
    // weekday it was sent on (that could be the same day or a week later).
    const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const namedWeekday = (body, sent) => {
      const found = Array.from(new Set((String(body == null ? '' : body).toLowerCase().match(/\b(sun|mon|tues|wednes|thurs|fri|satur)day\b/g) || [])));
      if (found.length !== 1) return null;
      const wd = WEEKDAYS.indexOf(found[0]);
      const ahead = (wd - sent.getDay() + 7) % 7;
      if (!ahead) return null;
      return new Date(sent.getFullYear(), sent.getMonth(), sent.getDate() + ahead);
    };
    const isConfirmText = (m, pats) => !!m && m.IsOutbound && (ASKS_FOR_C.test(norm(m.Body)) || (!m.IsNotification && pats.some(p => p.test(m.Body))));
    // Is this reply a yes? C, Yes, OK, Confirmed, 👍 and the like, with or without "thanks". A
    // question, a second sentence or anything else is not: those are read by you.
    const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
    const YES_EMOJI = /[\u{1F44D}\u{1F44C}\u{2705}\u{2714}\u{2611}]/u;   // 👍 👌 ✅ ✔ ☑
    const YES_WORDS = /^(c|cc|c c|confirm|confirmed|confirming|i confirm|confirm appt|confirm appointment|confirmed appt|confirmed appointment|y|ye|yes|yes sir|yes maam|yes mam|yes mame|yes please|yes yes|yep|yup|yeah|yea|ya|ok|okay|ok c|okay c|k|kk|sure|sounds good|will do|alright|all right|ok thats fine|okay thats fine|thats fine|that works|perfect|great|got it|ok got it|i will be waiting|ill be waiting|we will be waiting|well be waiting|see you then|see you tomorrow|see ya then|see ya tomorrow|we will be there|well be there|i will be there|ill be there|we will be home|well be home|i will be home|ill be home|10 4|104)$/;
    const isYes = body => {
      let b = norm(body).toLowerCase().replace(/[‘’`´]/g, '\'').replace(/[“”]/g, '"');
      if (/^(liked|loved|emphasized|emphasised) ["']/.test(b)) return true;   // an iPhone reaction (👍 ❤️ ‼️) to our text
      if (!b || b.indexOf('?') > -1) return false;
      const yesEmoji = YES_EMOJI.test(b);
      b = b.replace(EMOJI_RE, ' ').replace(/'/g, '').replace(/[.!,;:~*"()-]/g, ' ').replace(/\s+/g, ' ').trim();
      b = b.replace(/\s*\b(thanks|thank you|thank u|thankyou|thx|ty|tysm)( so much| very much)?$/, '').trim();
      if (!b) return yesEmoji;
      return YES_WORDS.test(b);
    };
    // After they've already said yes, a newer reminder often gets "I already confirmed", "Already
    // did" or just "Thanks". That's still a yes. Anything else (a question, a change of plans) isn't.
    const ALREADY_WORDS = /^(yes |yep |yeah |ok |okay )?(i |we )?(have |had )?(already )?(did|did that|did it|done|confirmed|confirmed it|confirmed that|replied|responded|answered|said yes|said c|sent c|sent it|texted c|replied c|responded c)( it| that)?( already)?( yesterday| earlier| last night| this morning| on (sun|mon|tues|wednes|thurs|fri|satur)day| (sun|mon|tues|wednes|thurs|fri|satur)day)?$/;
    const isAlready = body => {
      if (isYes(body)) return true;
      let b = norm(body).toLowerCase().replace(/[‘’`´]/g, '\'');
      if (!b || b.indexOf('?') > -1) return false;
      b = b.replace(EMOJI_RE, ' ').replace(/'/g, '').replace(/[.!,;:~*"()-]/g, ' ').replace(/\s+/g, ' ').trim();
      b = b.replace(/\s*\b(thanks|thank you|thank u|thankyou|thx|ty|tysm)( so much| very much)?$/, '').trim();
      return !b || b === 'already' || b === 'yes already' || ALREADY_WORDS.test(b);
    };
    // Every appointment on the board's day (timeline and the whole Unassigned list), canceled ones
    // left out: [{ apptId, jobId, customer, customerId, confirmed }].
    const dayAppts = async () => {
      if (!onBoard()) throw new Error(board.need().replace(/\.$/, '').toLowerCase());
      const snap = await board.load({ fresh: true });
      const day = snap.day, out = new Map();
      const take = (a, j, customer, customerId, confirmed, start, status) => {
        if (a == null || !/^\d+$/.test(String(a)) || !/^\d+$/.test(String(j)) || out.has(String(a))) return;
        if (start && !sameDay(start, day)) return;
        if (board.isCanceled(status)) return;
        out.set(String(a), { apptId: a, jobId: String(j), customer, customerId: customerId || null, confirmed: confirmed === true });
      };
      snap.appts.forEach(x => take(x.apptId, x.jobId, x.customer, x.customerId, x.confirmed, x.start, x.status));
      const un = await board.unassigned(TOOL, { fresh: true });
      un.rows.forEach(x => take(x.apptId, x.jobId, x.customer, x.customerId, x.confirmed, x.start, x.status));
      return Array.from(out.values());
    };
    // One customer's replies. ctx.readUnread decides whether an unread conversation can be read
    // without ServiceTitan marking it read (see below).
    const readReplies = async (cust, pats, fromT, toT, ctx, alive, day) => {
      const c = codes();
      let phones;
      try { phones = await st.customerPhones(cust.customerId); }
      catch (e) {
        if (st.isSignedOut(e)) throw e;
        throw Object.assign(new Error('their phone numbers didn\'t load (' + errText(e) + ')'), { kind: e.kind });
      }
      const nums = Array.from(new Set(phones.map(p => p.num)));
      // Per number: the confirm texts sent since the last weekday before the board's day (all for
      // this appointment), and the replies after the first one that went through. A C to
      // ServiceTitan's automatic reminder gets confirmed by ServiceTitan itself (it shows as
      // already confirmed); anything else said to it is read like any other reply.
      const per = [];
      let unreadLeft = '';
      for (const num of nums) {
        if (!alive()) return null;
        const t = await st.chatThread(num);
        if (!t) continue;
        let raw;
        if (t.ReadStatus === c.unread) { raw = await ctx.readUnread(t, num); if (!raw) { unreadLeft = unreadLeft || num; continue; } }
        else raw = await st.chatMessages(t.ThreadId, 60);
        const msgs = asPageMsgs(raw, c).sort((a, b) => timeOf(a) - timeOf(b) || idOf(a) - idOf(b));
        // A text that names a date counts for that date only (a reminder sent a week ahead, or one
        // for a different appointment), however long ago it went out. So does one that names only
        // the weekday ("Monday", sent Thursday or Saturday): it's for the next one. One that names
        // neither counts when it was sent since the last weekday before the day, except that
        // "today" only counts if sent on the day itself and "tomorrow" doesn't if sent on the day
        // itself (each is about another appointment).
        const forDay = m => {
          const t = timeOf(m);
          if (t >= toT) return false;
          const named = namedDay(m.Body, new Date(t)) || namedWeekday(m.Body, new Date(t));
          if (named) return sameDay(named, day);
          if (t < fromT) return false;
          const b = String(m.Body == null ? '' : m.Body).toLowerCase();
          if (/\btoday\b/.test(b)) return sameDay(new Date(t), day);        // "today" is the day it was sent
          if (/\btomorrow\b/.test(b)) return !sameDay(new Date(t), day);    // "tomorrow" sent on the day is the next day's
          return true;
        };
        const asks = msgs.filter(m => isConfirmText(m, pats) && forDay(m));
        if (!asks.length) continue;
        const ok = asks.filter(m => !m.SmsSendErrorCode && !m.HasNotBeenDelivered);
        const first = ok[0] || null;
        const after = m => first && (timeOf(m) > timeOf(first) || (timeOf(m) === timeOf(first) && idOf(m) > idOf(first)));
        per.push({ num, sig: replySig(t), failed: !first, replies: msgs.filter(m => m.IsInbound && after(m)) });
      }
      if (!per.length) return unreadLeft ? { kind: 'look', why: 'has an unread message. Read it in the Chat Center', num: unreadLeft } : { kind: 'notTexted', num: nums[0] || '' };
      const sigs = {};
      per.forEach(x => { sigs[x.num] = x.sig; });
      const sent = per.filter(x => !x.failed);
      if (!sent.length) return { kind: 'look', why: 'the confirm text didn\'t go through', num: per[0].num, sigs };
      const replies = [].concat.apply([], sent.map(x => x.replies)).sort((a, b) => timeOf(a) - timeOf(b) || idOf(a) - idOf(b));
      // The number they answered from (the latest reply), else the first one texted.
      const last = replies[replies.length - 1];
      const base = { num: last ? sent.find(x => x.replies.indexOf(last) > -1).num : sent[0].num, sigs };
      if (!replies.length) return Object.assign(base, { kind: 'noReply' });
      const said = replies.map(m => norm(m.Body) || '(a picture or empty message)');
      if (optedOut(replies)) return Object.assign(base, { kind: 'look', why: 'replied STOP / Cancel', said });
      // A yes to any confirm text for the day (Saturday's for Monday, say) stands when all that came
      // after it is another yes, "already did" or "thanks" (to a newer reminder, say).
      let saidYes = false;
      if (replies.every(m => { if (isYes(m.Body)) { saidYes = true; return true; } return saidYes && isAlready(m.Body); })) return Object.assign(base, { kind: 'yes', said });
      return Object.assign(base, { kind: 'look', why: 'replied', said });
    };
    // What the conversation's newest message is, ignoring read/unread (you or a coworker reading
    // the reply in the Chat Center isn't something new). null if it can't be told.
    const replySig = t => {
      if (!t) return 'none';
      const m = Array.isArray(t.Messages) && t.Messages.length ? t.Messages[t.Messages.length - 1] : null;
      if (!m || (m.SmsId == null && !m.CreatedOn)) return null;
      return [t.ThreadId, t.BlockedStatus, m.SmsId, m.CreatedOn].join('|');
    };

    const vReplies = mkView('replies');
    const repHead = head('📥 Check replies');
    const repMsg = el('div', 'font-size:12px;color:var(--st-ink-2);margin-bottom:6px;min-height:16px;white-space:pre-wrap');
    // The report: every customer as a card, in sections (customerCards, shared with other tools).
    const cards = customerCards();
    const repGo = smallBtn('Confirm', () => confirmRun(), 'background:var(--st-green);color:#fff;border-color:var(--st-green);font-weight:600;');
    const repStop = smallBtn('Stop', () => { if (!rBusy) return; rStop = true; repStop.disabled = true; repStop.textContent = 'Stopping...'; });
    const repCopy = smallBtn('Copy results', async () => { if (await copy(repMsg.textContent + '\n\n' + cards.text())) repCopy.textContent = 'Copied'; });
    const repBack = smallBtn('← Back', () => { rCheckId++; sub('main'); renderMain(); });
    const repNav = row();
    repNav.append(repGo, repStop, repCopy, repBack);
    vReplies.append(repHead, repMsg, cards.box, repNav);
    const jobsOf = cu => Array.from(new Set((cu.appts || []).map(a => a.jobId)));
    // A customer as a card: { customer, phone, jobs, status, said }.
    const item = (cu, status, jobs) => ({ customer: cu.customer || '', phone: cu.num || '', jobs: jobs || jobsOf(cu), status: status || '', said: cu.said || null });
    let rBusy = false, rStop = false, rCheckId = 0, rPlan = null;
    const showRep = (go, stop) => { repGo.style.display = go ? 'inline-block' : 'none'; repStop.style.display = stop ? 'inline-block' : 'none'; repBack.style.display = stop ? 'none' : 'inline-block'; repCopy.textContent = 'Copy results'; };

    const openReplies = async () => {
      if (running || rBusy) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      if (!onBoard()) return say(board.need());
      const pats = [];
      folders.filter(isConfirmFolder).forEach(f => f.msgs.forEach(m => { if (norm(m[1])) pats.push(tmplMatcher(m[1])); }));
      if (!pats.length) return say('This folder has no messages to look for replies to.');
      picker.setPicking(false);
      const id = ++rCheckId;
      const day = boardDay();
      const dayText = day ? day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'the day shown';
      rPlan = null;
      repHead.textContent = '📥 Check replies: ' + dayText;
      repMsg.textContent = 'Loading the appointments on ' + dayText + '…'; cards.render([]);
      showRep(false, false);
      sub('replies');
      const t0 = Date.now();
      let appts;
      try { appts = await dayAppts(); }
      catch (e) { if (id === rCheckId) repMsg.textContent = '⚠️ Couldn\'t load the board: ' + errText(e); return; }
      if (id !== rCheckId) return;
      // Jobs picked (if any), else everyone on the board.
      const picked = picker.ids().map(String);
      const notOnDay = picked.filter(j => !appts.some(a => a.jobId === j));
      if (picked.length) appts = appts.filter(a => picked.indexOf(a.jobId) > -1);
      const byCust = new Map(), noCust = [];
      appts.forEach(a => {
        if (!a.customerId) { noCust.push(a); return; }
        const k = String(a.customerId);
        if (!byCust.has(k)) byCust.set(k, { customerId: a.customerId, customer: a.customer, appts: [] });
        byCust.get(k).appts.push(a);
      });
      const custs = Array.from(byCust.values());
      repMsg.textContent = 'Reading replies from ' + s1(custs.length, 'customer') + '…';
      const toT = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();
      const fromT = textsFrom(day).getTime();
      // Reading an unread conversation must not mark it read in ServiceTitan (the Chat Center page
      // does that with a separate request, so reading the data shouldn't, but it's checked): the
      // first unread one read is looked at again right after. If it turned read, no other unread
      // conversation is read this time; those go to "Needs a look".
      const ctx = { markRead: false, markedNum: '', canary: null };
      ctx.readUnread = async (t, num) => {
        if (ctx.markRead) return null;
        if (!ctx.canary) {
          const p = (async () => {
            const raw = await st.chatMessages(t.ThreadId, 60);
            const t2 = await st.chatThread(num);
            if (t2 && t2.ReadStatus !== codes().unread) { ctx.markRead = true; ctx.markedNum = num; }
            return raw;
          })();
          ctx.canary = p.then(() => true, () => { ctx.canary = null; return false; });
          return await p;
        }
        await ctx.canary;
        if (ctx.markRead) return null;
        return await st.chatMessages(t.ThreadId, 60);
      };
      const res = await st.pool(custs, 4, (cu, i, alive) => readReplies(cu, pats, fromT, toT, ctx, alive, day),
        (d, t) => { if (id === rCheckId) repMsg.textContent = 'Reading replies… ' + d + ' of ' + t; }, { stop: () => id !== rCheckId });
      if (id !== rCheckId || res.stopped) return;
      if (res.halted === 'signedOut') { repMsg.textContent = '⚠️ ' + st.SIGNED_OUT + '\n\nNothing was confirmed.'; return; }
      const P = { yes: [], already: [], look: [], noReply: [], notTexted: [], day, dayText };
      custs.forEach((cu, i) => {
        const r = res[i];
        if (r === st.NOT_RUN) { P.look.push(Object.assign(cu, { why: 'not checked: ServiceTitan is slow or not answering. Try again in a bit' })); return; }
        if (!r || r.error) { P.look.push(Object.assign(cu, { why: r && r.error ? errText(r.error) : 'not checked' })); return; }
        Object.assign(cu, r);
        if (r.kind === 'yes') {
          cu.todo = cu.appts.filter(a => !a.confirmed);
          (cu.todo.length ? P.yes : P.already).push(cu);
        } else P[r.kind].push(cu);
      });
      noCust.forEach(a => P.look.push({ customer: a.customer, appts: [a], why: 'no customer on the job' }));
      // The board can be behind (someone confirmed since it loaded), so the yes customers'
      // appointments are read fresh to show which are already confirmed.
      const yesAppts = [];
      P.yes.forEach(cu => cu.todo.forEach(a => yesAppts.push(a)));
      if (yesAppts.length) {
        repMsg.textContent = 'Reading ' + s1(yesAppts.length, 'appointment') + '…';
        const fr = await st.pool(yesAppts, 4, a => st.apptConfirmed(a.apptId), null, { stop: () => id !== rCheckId });
        if (id !== rCheckId || fr.stopped) return;
        if (fr.halted === 'signedOut') { repMsg.textContent = '⚠️ ' + st.SIGNED_OUT + '\n\nNothing was confirmed.'; return; }
        yesAppts.forEach((a, i) => { const r = fr[i]; if (r && r !== st.NOT_RUN && !r.error) a.confirmed = r.confirmed; });
        P.yes = P.yes.filter(cu => { cu.todo = cu.todo.filter(a => !a.confirmed); if (cu.todo.length) return true; P.already.push(cu); return false; });
      }
      rPlan = P;
      P.notes = [];
      if (ctx.markRead) P.notes.push('ℹ️ ServiceTitan marked a conversation read when its replies were read (…' + ctx.markedNum.slice(-4) + '), so other unread ones were left unread and are under Needs a look.');
      if (!custs.length) P.notes.push('No appointments' + (picked.length ? ' for the jobs you picked' : '') + ' on ' + dayText + '.');
      if (notOnDay.length) P.notes.push('Picked jobs not on ' + dayText + ': #' + notOnDay.join(', #'));
      P.checked = 'Checked ' + s1(custs.length, 'customer') + ' in ' + Math.max(1, Math.round((Date.now() - t0) / 1000)) + 's.';
      showPlan(P);
    };
    // The check's report, before Confirm. Needs a look, No reply yet and Not texted cards have
    // ✅ Add to confirm, for when you decide they're a yes ("C call before you come", or they
    // confirmed by phone): the card moves to Will confirm, with ↩ Take off to put it back. Nothing
    // is confirmed until you press Confirm. A card you added is still looked at once more before
    // it's confirmed: if a new message came in since the check, it isn't.
    const todoOf = cu => (cu.appts || []).filter(a => !a.confirmed);
    const showPlan = P => {
      const todo = P.yes.reduce((k, x) => k + x.todo.length, 0);
      const move = (cu, from, to) => {
        if (rBusy || rPlan !== P) return;
        const i = P[from].indexOf(cu);
        if (i < 0) return;
        P[from].splice(i, 1);
        if (to === 'yes') { cu.manual = from; cu.todo = todoOf(cu); P.yes.push(cu); }
        else {
          // Someone who answered yes and you took off goes to Needs a look, saying so.
          if (!cu.manual) cu.why = 'Taken off the list by you';
          delete cu.manual;
          P[to].push(cu);
        }
        showPlan(P);
      };
      // Not on the list: ✅ Add to confirm, or, when every appointment of theirs that day is already
      // confirmed in ServiceTitan (a C to ServiceTitan's own reminder, or a coworker), a note saying so.
      const addable = (from, x, status) => {
        const it = item(x, status);
        if (todoOf(x).length) it.actions = [{ label: '✅ Add to confirm', style: 'border-color:var(--st-green);color:var(--st-green-d);font-weight:600',
          title: 'Puts them on the list to confirm. Nothing is confirmed until you press Confirm at the bottom.', onClick: () => move(x, from, 'yes') }];
        else it.note = '☑️ Already confirmed in ServiceTitan';
        return it;
      };
      cards.render([
        { key: 'look', title: '⚠️ Needs a look', tone: 'warn', open: true, items: P.look.map(x => addable('look', x, x.why)) },
        { key: 'yes', title: '✅ Will confirm ' + s1(todo, 'appointment'), tone: 'good', open: true, items: P.yes.map(x => {
          const it = item(x, (x.manual ? 'Added by you. ' : '') + 'Will be confirmed when you press Confirm', x.todo.map(a => a.jobId));
          it.actions = [{ label: '↩ Take off', title: x.manual ? 'Puts them back where they were. They won\'t be confirmed.' : 'Takes them off the list (to Needs a look). They won\'t be confirmed.', onClick: () => move(x, 'yes', x.manual || 'look') }];
          return it;
        }) },
        { key: 'already', title: '☑️ Answered yes, already confirmed', tone: 'done', items: P.already.map(x => item(x, 'Already confirmed')) },
        { key: 'noReply', title: '💤 No reply yet', tone: 'quiet', items: P.noReply.map(x => addable('noReply', x, 'No reply yet')) },
        { key: 'notTexted', title: '📭 Not texted (no confirm text for ' + P.dayText + ')', tone: 'faint', items: P.notTexted.map(x => addable('notTexted', x, 'No confirm text for ' + P.dayText)) }
      ], P.notes);
      repMsg.textContent = P.checked + ' ' + (todo ? 'Nothing is confirmed until you press Confirm.' : 'Nothing to confirm.');
      repGo.textContent = 'Confirm ' + s1(todo, 'appointment');
      showRep(todo > 0, false);
    };

    const confirmRun = async () => {
      if (rBusy || running || !rPlan) return;
      if (lock) { repMsg.textContent = 'Wait for ' + lock + ' to finish first.'; return; }
      const P = rPlan; rPlan = null;
      rBusy = true; rStop = false; lock = TOOL;
      repStop.disabled = false; repStop.textContent = 'Stop';
      showRep(false, true);
      const done = [], already = [], look = [], notes = [];
      let signedOut = false, failsInRow = 0, n = 0;
      const total = P.yes.reduce((k, x) => k + x.todo.length, 0);
      const one = async cu => {
        // Anything new in their conversation since the check? Then you read it first.
        const nums = Object.keys(cu.sigs || {});
        let changed = !nums.length && !cu.manual, unknown = false;
        for (const num of nums) {
          if (!cu.sigs[num]) { unknown = true; continue; }
          if (replySig(await st.chatThread(num)) !== cu.sigs[num]) changed = true;
        }
        if (unknown && !changed) { look.push(item(cu, 'Not confirmed: couldn\'t tell whether a new message came in. Read their conversation', cu.todo.map(a => a.jobId))); n += cu.todo.length; return; }
        if (changed) { look.push(item(cu, 'Not confirmed: a new message came in after the check. Read it, then check again', cu.todo.map(a => a.jobId))); n += cu.todo.length; return; }
        for (let ai = 0; ai < cu.todo.length; ai++) {
          const a = cu.todo[ai];
          if (rStop || signedOut) { look.push(item(cu, 'Not confirmed (stopped)', cu.todo.slice(ai).map(z => z.jobId))); return; }
          n++; repMsg.textContent = 'Confirming ' + n + ' of ' + total + ': ' + (cu.customer || '#' + a.jobId);
          const bad = why => look.push(item(cu, why, [a.jobId]));
          try {
            const now = await st.apptConfirmed(a.apptId);
            if (now.confirmed) { already.push(item(cu, 'Already confirmed', [a.jobId])); continue; }
            const sd = now.start ? new Date(now.start) : null;
            if (sd && !isNaN(sd) && P.day && !sameDay(sd, P.day)) { bad('Not confirmed: it was moved to ' + sd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' after the check'); continue; }
            const s = now.status;
            if (s === 4 || s === 5 || (typeof s === 'string' && /^(done|completed|cancell?ed)$/i.test(norm(s)))) { bad('Not confirmed: the appointment is ' + (s === 4 || /^(done|completed)$/i.test(String(s)) ? 'done' : 'canceled')); continue; }
            await st.setConfirmed(a.apptId, true);
            let stuck = false;
            for (let k = 0; k < 3 && !stuck; k++) { if (k) await wait(500); stuck = (await st.apptConfirmed(a.apptId, 8000)).confirmed; }
            if (stuck) { done.push(item(cu, 'Confirmed', [a.jobId])); failsInRow = 0; }
            else { bad('ServiceTitan didn\'t keep it confirmed'); if (++failsInRow >= 3) { rStop = true; notes.push('3 problems in a row. Stopped to be safe.'); } }
          } catch (e) {
            if (st.isSignedOut(e)) { signedOut = true; return; }
            bad('Not confirmed: ' + errText(e));
            if (++failsInRow >= 3) { rStop = true; notes.push('3 problems in a row. Stopped to be safe.'); }
          }
        }
      };
      try {
        // Three customers at a time; each customer's appointments one after another.
        let next = 0;
        const worker = async () => {
          while (next < P.yes.length && !rStop && !signedOut) {
            const cu = P.yes[next++];
            try { await one(cu); }
            catch (e) { if (st.isSignedOut(e)) { signedOut = true; break; } look.push(item(cu, 'Not confirmed: ' + errText(e), cu.todo.map(a => a.jobId))); }
          }
        };
        await Promise.all([worker(), worker(), worker()]);
        const notDone = P.yes.slice(next).map(cu => item(cu, 'Not confirmed (stopped)', cu.todo.map(a => a.jobId)));
        cards.render([
          { key: 'look', title: '⚠️ Needs a look', tone: 'warn', open: true, items: cards.merge(look.concat(notDone, P.look.map(x => item(x, x.why)))) },
          { key: 'done', title: '✅ Confirmed', tone: 'good', open: true, items: cards.merge(done) },
          { key: 'already', title: '☑️ Already confirmed', tone: 'done', items: cards.merge(already.concat(P.already.map(x => item(x, 'Already confirmed')))) },
          { key: 'noReply', title: '💤 No reply yet', tone: 'quiet', items: P.noReply.map(x => item(x, 'No reply yet')) },
          { key: 'notTexted', title: '📭 Not texted (no confirm text for ' + P.dayText + ')', tone: 'faint', items: P.notTexted.map(x => item(x, 'No confirm text for ' + P.dayText)) }
        ], notes);
        const sum = s1(done.length, 'appointment') + ' confirmed' + (look.length + notDone.length + P.look.length ? ', ' + (look.length + notDone.length + P.look.length) + ' need a look' : '') + ', ' + P.noReply.length + ' no reply yet';
        repMsg.textContent = signedOut ? '⚠️ ' + st.SIGNED_OUT + ' (Before that: ' + sum + '.)' : (rStop ? 'Stopped: ' : 'Done: ') + sum + '.';
      } catch (e) {
        repMsg.textContent = '⚠️ Stopped by an error: ' + errText(e);
      } finally {
        rBusy = false; lock = null;
        showRep(false, false);
      }
    };

    textsPane.appendChild(pane);
    sub('main');
    return {
      refresh: () => { if (!running && !rBusy) { sub('main'); renderMain(); } },
      leave: () => { checkId++; rCheckId++; picker.setPicking(false); },
      isRunning: () => running || rBusy,
      stop: () => { if (rBusy) { rStop = true; return; } requestStop(); },
      cleanup: () => picker.cleanup()
    };
  })();

  // ===================================================================
  // Tool 6: Move Jobs
  // Moves jobs to a tech, adds a tech, unassigns, or swaps, without dragging on the board.
  // It sends the same requests the job panel's ⋮ → Assign/Unassign sends, and makes the same
  // checks the panel makes first:
  //   - skills: the job needs a skill the tech doesn't have (the panel's "Confirmation")
  //   - already booked: the tech has something else at that time
  //   - managed tech: a job with a price must keep at least one managed tech
  // Review (changes nothing) shows every job and every warning before anything happens; jobs
  // with a warning are only done if you tick that warning's box.
  // A new tech is always added before the old one comes off, so a job is never left in
  // Unassigned halfway (where a job from another branch would drop off your board). Plain
  // Unassign warns about those. Each change is confirmed from ServiceTitan's data, problem jobs
  // get one more try, and ↩ Put back undoes the last run. Up to three jobs are worked on at once
  // (a two-job swap goes one job after the other, as both jobs or neither).
  // ===================================================================
  const moves = (() => {
    const TOOL = 'Move Jobs';
    const MAX_PER_RUN = 300;
    const MODES = [
      ['move', '➡️ Move to a tech'],
      ['add', '➕ Add a tech (keeps who\'s on it)'],
      ['unassign', '⬅️ Unassign'],
      ['swapJobs', '🔄 Swap two jobs\' techs'],
      ['swapDays', '🔁 Swap two techs\' whole day']
    ];
    const u = v => { try { return window.ko && typeof window.ko.unwrap === 'function' ? window.ko.unwrap(v) : (typeof v === 'function' ? v() : v); } catch (e) { return v; } };
    const S = x => String(x);
    const hasId = (list, id) => list.some(x => S(x) === S(id));

    // ---------- The board ----------
    const boardDay = () => board.day();
    const sameDay = (a, b) => board.sameDay(a, b);
    const pad = n => String(n).padStart(2, '0');
    const dayISO = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T00:00:00';
    const dayText = d => d ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'the day shown';
    const toDate = v => { v = u(v); if (v == null || v === '') return null; const d = v instanceof Date ? v : new Date(v); return isNaN(d) ? null : d; };
    const boardBUs = () => board.bus();
    const buName = id => { try { const b = ((window.App && window.App.Data && window.App.Data.BusinessUnits) || []).find(x => Number(x.Id) === Number(id)); if (b && b.Name) return norm(b.Name); } catch (e) {} return 'another branch'; };
    const otherBranch = id => { const ids = boardBUs(); return !!(ids.length && id != null && ids.indexOf(Number(id)) < 0); };
    const skillsOn = () => { try { return !(window.App && window.App.Data && window.App.Data.EnableSkillsManagement === false); } catch (e) { return true; } };

    const seenNames = new Map();   // tech id -> name, from the board
    // One appointment from the Unassigned list (the same request the Jobs Tray answers from).
    const rowOf = x => {
      const r = {
        apptId: u(x.Id), jobId: S(u(x.JobId)), number: u(x.AppointmentNumber),
        customer: norm(u(x.Customer)), start: toDate(x.Start), end: toDate(x.End),
        techs: (u(x.Technicians) || []).map(t => ({ id: u(t.Id), name: norm(u(t.Name)) })).filter(t => t.id != null),
        bu: u(x.BusinessUnitId)
      };
      r.techs.forEach(t => { if (t.name) seenNames.set(S(t.id), t.name); });
      return r;
    };
    let unassigned = { day: null, rows: [] };   // the whole Unassigned list for a day, once loaded
    // An appointment from the board's data.
    const snapRow = a => {
      const r = { apptId: Number(a.apptId), jobId: S(a.jobId), number: a.number, customer: a.customer, start: a.start, end: a.end,
        techs: a.techs.map(id => ({ id: Number(id), name: board.techName(id) })), bu: a.bu };
      r.techs.forEach(t => { if (t.name) seenNames.set(S(t.id), t.name); });
      return r;
    };
    // Every appointment on the day the board shows, one entry each (a job with two techs is on the
    // board twice, once in each tech's row): the board's data as last read, plus the Unassigned
    // list when it's been loaded for that day.
    const dayRows = () => {
      const day = boardDay(), s = board.latest(), out = new Map();
      if (s) s.appts.forEach(a => { if (board.live(a)) out.set(S(a.apptId), snapRow(a)); });
      if (day && unassigned.day && sameDay(unassigned.day, day)) unassigned.rows.forEach(x => {
        try {
          const r = rowOf(x);
          if (r.apptId == null || !/^\d+$/.test(r.jobId) || out.has(S(r.apptId))) return;
          if (r.start && !sameDay(r.start, day)) return;
          out.set(S(r.apptId), r);
        } catch (e) {}
      });
      return Array.from(out.values());
    };
    // The whole Unassigned list for the day the board shows (all pages), for your board's branches.
    const loadUnassigned = async () => {
      const day = boardDay();
      if (!day) throw new Error(board.need());
      const un = await board.unassigned(TOOL, { fresh: true });
      unassigned = { day, rows: un.rows.map(r => r.raw) };
      return un.rows.map(r => rowOf(r.raw)).filter(r => r.apptId != null && /^\d+$/.test(r.jobId) && !r.techs.length);
    };

    // ---------- Techs ----------
    let techList = null;    // [{ id, name, active, managed, skillIds }]
    let techsNote = '';     // why skills can't be checked, if they can't
    const loadTechs = async force => {
      if (techList && !force) return techList;
      try { techList = await st.technicians(); techsNote = ''; health.clear(TOOL); }
      catch (e) {
        if (st.isSignedOut(e)) throw e;
        // The page's own list has no skills in it, so skills can't be checked with it.
        // Then the techs the board shows (no managed flag or skills there either).
        const D = (window.App && window.App.Data) || {};
        const list = D.Technicians || D.ActiveTechnicians || [];
        techList = list.filter(t => t && t.Id != null).map(t => ({ id: t.Id, name: norm(t.Name), active: t.Active !== false, managed: !!t.IsManagedTechnician, skillIds: null }));
        const s = board.latest();
        if (!techList.length && s) techList = s.techs.map(t => ({ id: t.id, name: t.name, active: true, managed: null, skillIds: null }));
        techsNote = 'couldn\'t load the techs\' skills (' + errText(e) + ')';
        if (e && e.kind === 'bad') health.flag(TOOL, 'can\'t read the technician list', '/app/api/data/technicians');
      }
      return techList;
    };
    const techById = id => (techList || []).find(t => S(t.id) === S(id)) || null;
    const techName = id => { const t = techById(id); return (t && t.name) || seenNames.get(S(id)) || 'tech #' + id; };
    const names = ids => ids.map(techName).join(', ');

    // ---------- Pane ----------
    const wrap = el('div', 'padding:8px 10px 10px;display:grid;gap:8px');
    const msg = el('div', 'font-size:12px;color:var(--st-ink-2);min-height:16px');
    const say = s => { msg.textContent = s; };
    let mode = MODES.some(m => m[0] === get('stMoveMode')) ? get('stMoveMode') : 'move';
    // A plan from 🧭 Tech Router (🗺️ Plan the day): each job goes to its own tech. Mode 'plan' works
    // like ➡️ Move to a tech, one job at a time, with that job's tech. job number -> { id, name }.
    let plan = null;
    const modeBox = el('div', 'display:grid;gap:1px;font-size:12px');
    const modeRadios = MODES.map(([val, text]) => {
      const l = el('label', 'display:flex;gap:6px;align-items:center;cursor:pointer');
      const r = el('input'); r.type = 'radio'; r.name = 'st-move-mode'; r.value = val; r.checked = mode === val;
      r.onchange = () => {
        mode = val; plan = null; set('stMoveMode', val); clearReview();
        if (val === 'swapDays') picker.setPicking(false);
        layout();
        if (val === 'swapJobs' && picker.size() > 2) say('⚠️ Swap uses two jobs, and ' + picker.size() + ' are picked. Take some off (✕) or Clear.');
      };
      l.append(r, document.createTextNode(text));
      modeBox.appendChild(l);
      return r;
    });

    // A tech list with a box to narrow it down by typing. allLabel: an extra first choice (value '').
    const techPicker = (label, allLabel, key) => {
      const box = el('div', 'display:grid;gap:3px');
      const top = el('div', 'display:flex;gap:6px;align-items:center');
      const lab = el('span', 'font-size:12px;font-weight:600;min-width:46px', label);
      const find = el('input', 'flex:1;min-width:0;padding:4px 6px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;font-size:12px;color:var(--st-ink);background:var(--st-bg)');
      find.type = 'text'; find.placeholder = 'Type to find a tech';
      top.append(lab, find);
      const sel = el('select', FULL + 'padding:5px;border:1px solid var(--st-ctl);border-radius:6px;font:inherit;color:var(--st-ink);background:var(--st-bg)');
      box.append(top, sel);
      const fill = () => {
        const keep = sel.value || get(key) || '';
        const q = norm(find.value).toLowerCase();
        sel.textContent = '';
        if (allLabel) { const o = el('option', '', allLabel); o.value = ''; sel.appendChild(o); }
        const list = (techList || []).filter(t => t.active && t.name && (!q || t.name.toLowerCase().indexOf(q) > -1)).sort((a, b) => a.name.localeCompare(b.name));
        if (!allLabel && !list.length) { const o = el('option', '', techList ? 'No tech matches' : 'Loading techs…'); o.value = ''; sel.appendChild(o); }
        list.forEach(t => { const o = el('option', '', t.name); o.value = S(t.id); sel.appendChild(o); });
        if (q && list.length && !list.some(t => S(t.id) === keep)) sel.value = S(list[0].id);
        else if (Array.from(sel.options).some(o => o.value === keep)) sel.value = keep;
      };
      find.oninput = () => { fill(); set(key, sel.value); clearReview(); updateButtons(); };
      sel.onchange = () => { set(key, sel.value); clearReview(); updateButtons(); };
      return {
        box, fill, find, sel,
        value: () => sel.value ? Number(sel.value) : null,
        setEnabled: on => { [find, sel].forEach(x => { x.disabled = !on; x.style.opacity = on ? '1' : '.5'; }); }
      };
    };
    const HINTS = {
      move: 'Pick the jobs and the tech they go to.',
      add: 'Pick the jobs and the tech to add. Whoever is on them stays.',
      unassign: 'Pick the jobs. Everyone (or the tech in From) comes off.',
      swapJobs: 'Pick two jobs. Each one gets the other\'s tech(s).',
      swapDays: 'Pick two techs. Every open job of one goes to the other, on the day the board shows.',
      plan: 'A plan from 🧭 Tech Router: each job goes to the tech shown next to it. Take any off with ✕.'
    };
    const hint = el('div', 'font-size:12px;color:var(--st-ink-2);background:var(--st-purple-s);border-radius:6px;padding:4px 7px');
    const toPick = techPicker('To', '', 'stMoveTo');
    const fromPick = techPicker('From', 'Anyone on the job', 'stMoveFrom');
    const aPick = techPicker('Tech A', '', 'stMoveA');
    const bPick = techPicker('Tech B', '', 'stMoveB');
    toPick.sel.id = 'st-move-to'; fromPick.sel.id = 'st-move-from'; aPick.sel.id = 'st-move-a'; bPick.sel.id = 'st-move-b';
    const pickers3 = [toPick, fromPick, aPick, bPick];

    // The jobs: picked on the board, from the Unassigned list, or typed (on the day the board shows).
    const picker = jobPicker({
      color: '#6a1b9a', soft: 'rgba(106,27,154,.22)',
      // Swap uses exactly two jobs, so a third can't be picked.
      max: () => mode === 'swapJobs' ? 2 : MAX_PER_RUN,
      fullText: max => max === 2 && mode === 'swapJobs' ? '⚠️ Swap uses two jobs. Take one off (✕) to pick a different one.' : '⚠️ The list is full (' + max + ' jobs per run).',
      shown: () => movesPane.style.display !== 'none' && mode !== 'swapDays',
      busy: () => busy,
      say: t => say(t),
      changed: () => { clearReview(); updateButtons(); },
      tool: TOOL
    });
    const uaBtn = smallBtn('＋ All Unassigned', () => addUnassigned());
    uaBtn.title = 'Adds every job in the Unassigned list for the day the board shows (all pages), for your board\'s branches';
    const jobsBox = el('div', 'display:grid;gap:5px');
    const uaRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    uaRow.appendChild(uaBtn);
    jobsBox.append(picker.box, uaRow);

    const actions = el('div', 'display:flex;flex-wrap:wrap;gap:6px');
    const reviewBtn = smallBtn('Review (changes nothing)', () => review(mode), PRIMARY);
    const undoBtn = smallBtn('↩ Put back', () => review('putback'));
    // ↩ Put back sits by Review, so it's there even before a run (a saved one from earlier).
    const reviewStopBtn = smallBtn('Stop checking', () => { reviewStop = true; reviewStopBtn.disabled = true; });
    actions.append(reviewBtn, reviewStopBtn, undoBtn);

    const reviewBox = el('div', 'display:none;padding:8px;border:1px solid var(--st-purple-l);background:var(--st-purple-s);border-radius:6px;font-size:12px;gap:6px');
    const reviewText = el('div', 'white-space:pre-wrap;max-height:260px;overflow:auto');
    const reviewOpts = el('div', 'display:grid;gap:3px');
    const reviewBtns = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    const goBtn = smallBtn('Go', () => go(), 'background:#6a1b9a;color:#fff;border-color:#6a1b9a;font-weight:600');
    goBtn.id = 'st-move-go';
    reviewBtns.append(goBtn, smallBtn('Cancel', () => clearReview()));
    reviewBox.append(reviewText, reviewOpts, reviewBtns);

    const progress = el('div', 'display:none;gap:6px');
    const log = el('pre', 'max-height:220px;overflow:auto;margin:0;padding:6px;background:var(--st-soft);border:1px solid var(--st-line);border-radius:6px;white-space:pre-wrap;font:12px/1.35 ui-monospace,Consolas,monospace');
    const progRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    // Up to three jobs are worked on at once, so Stop lets the ones already started finish.
    const requestStop = () => { if (!running) return; stop = true; stopBtn.disabled = true; stopBtn.textContent = 'Stopping after the jobs in progress...'; };
    const stopBtn = smallBtn('Stop', () => requestStop());
    const copyBtn = smallBtn('Copy results', async () => { if (await copy(log.textContent)) copyBtn.textContent = 'Copied'; });
    const notifBtn = smallBtn('🔕 Notifications…', () => handOff());
    notifBtn.title = 'Opens Job Notifications with these jobs picked, to turn their notifications off (or on). Needs permission to open job records.';
    progRow.append(stopBtn, copyBtn, notifBtn);
    progress.append(log, progRow);
    const navRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    navRow.append(smallBtn('← Menu', () => { if (!busy) showView('menu'); }));
    wrap.append(msg, modeBox, hint, toPick.box, fromPick.box, aPick.box, bPick.box, jobsBox, actions, reviewBox, progress, navRow);
    movesPane.appendChild(wrap);

    // Move Jobs is taller than a laptop screen once a review shows, so its area scrolls inside the
    // space left on screen (under the header and any bars, wherever the panel was dragged).
    const fit = () => {
      if (movesPane.style.display === 'none') return;
      const pr = panel.getBoundingClientRect(), others = pr.height - movesPane.getBoundingClientRect().height;
      const top = panel.style.top && panel.style.top !== 'auto' ? Math.max(0, pr.top) : 16;
      movesPane.style.maxHeight = Math.max(220, innerHeight - top - others - 16) + 'px';
    };
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    resized.push(fit);
    let busy = false, running = false, stop = false;
    let reviewing = false, reviewStop = false;   // a review in progress, and Stop checking pressed
    let planned = null;   // the last review: { mode, items, at }
    let undo = [];        // [{ apptId, jobId, number, customer, before, after }] from the last run
    let undoDay = null;   // the day the last run was on (Put back works from any day)
    let movedJobs = [];   // job numbers the last run changed (for Notifications)
    // ↩ Put back is saved in this browser, so it still works after the Toolbox is closed, the page
    // is reloaded, or a new copy is loaded. It's kept for a day. Putting back is still safe later:
    // a job someone changed since the move is left alone.
    const UNDO_KEY = 'stMoveUndo', UNDO_KEEP_MS = 24 * 3600 * 1000;
    const saveUndo = () => {
      if (!undo.length) { try { localStorage.removeItem(UNDO_KEY); } catch (e) {} return; }
      set(UNDO_KEY, JSON.stringify({ at: Date.now(), day: undoDay ? undoDay.getTime() : null, items: undo }));
    };
    const loadUndo = () => {
      try {
        const s = JSON.parse(get(UNDO_KEY) || 'null');
        if (!s || !Array.isArray(s.items) || !(Date.now() - s.at < UNDO_KEEP_MS)) { undo = []; undoDay = null; return; }
        undo = s.items.filter(z => z && z.apptId != null && Array.isArray(z.before) && (Array.isArray(z.after) || z.after === null));   // after null: a change that couldn't be confirmed
        undoDay = s.day ? new Date(s.day) : null;
      } catch (e) { undo = []; undoDay = null; }
    };
    loadUndo();
    const add = s => { log.textContent += s + '\n'; log.scrollTop = log.scrollHeight; };
    const clearReview = () => { planned = null; reviewBox.style.display = 'none'; };

    const layout = () => {
      const show = (x, on) => { x.style.display = on ? 'grid' : 'none'; };
      show(toPick.box, mode === 'move' || mode === 'add');
      show(fromPick.box, mode === 'move' || mode === 'unassign');
      show(aPick.box, mode === 'swapDays');
      show(bPick.box, mode === 'swapDays');
      show(jobsBox, mode !== 'swapDays');
      uaRow.style.display = mode === 'move' || mode === 'add' ? 'flex' : 'none';
      modeRadios.forEach(r => { r.checked = r.value === mode; });
      hint.textContent = HINTS[mode] || '';
      const allOpt = fromPick.sel.options[0];
      if (allOpt && allOpt.value === '') allOpt.textContent = mode === 'unassign' ? 'Everyone on the job' : 'Anyone on the job (replaces everyone)';
      picker.render();
      updateButtons();
    };
    const updateButtons = () => {
      const on = !busy;
      modeRadios.forEach(r => { r.disabled = !on; });
      pickers3.forEach(p => p.setEnabled(on));
      picker.setEnabled(on);
      uaBtn.disabled = !on; uaBtn.style.opacity = on ? '1' : '.5';
      let ready = on && onBoard();
      if (mode === 'move' || mode === 'add') ready = ready && !!toPick.value() && picker.size() > 0;
      if (mode === 'unassign') ready = ready && picker.size() > 0;
      if (mode === 'swapJobs') ready = ready && picker.size() === 2;
      if (mode === 'plan') ready = ready && !!plan && picker.size() > 0;
      if (mode === 'swapDays') ready = ready && !!aPick.value() && !!bPick.value() && S(aPick.value()) !== S(bPick.value());
      reviewBtn.disabled = !ready; reviewBtn.style.opacity = ready ? '1' : '.5';
      reviewStopBtn.style.display = reviewing ? 'inline-block' : 'none';
      if (!reviewing) reviewStopBtn.disabled = false;
      undoBtn.style.display = !busy && undo.length ? 'inline-block' : 'none';
      undoBtn.textContent = '↩ Put back (' + undo.length + ')';
      undoBtn.title = 'Undoes the last run' + (undoDay ? ' on ' + dayText(undoDay) : '') + '. Kept for a day, even if the Toolbox is closed.';
      notifBtn.style.display = !busy && movedJobs.length ? 'inline-block' : 'none';
      notifBtn.textContent = '🔕 Notifications for these ' + plural(movedJobs.length, 'job') + '…';
    };

    const addUnassigned = async () => {
      if (busy) return;
      if (!onBoard()) return say(board.need());
      busy = true; updateButtons();
      uaBtn.classList.add('st-busy');
      say('Loading the Unassigned list for ' + dayText(boardDay()) + '...');
      try {
        const rows = await loadUnassigned();
        const labels = {};
        rows.forEach(r => { if (r.customer && !labels[r.jobId]) labels[r.jobId] = r.customer; });
        const jobs = Array.from(new Set(rows.map(r => r.jobId)));
        busy = false;
        const n = picker.addMany(jobs, labels);
        say(jobs.length ? 'Added ' + plural(n, 'job') + ' from the Unassigned list for ' + dayText(boardDay()) + (n < jobs.length ? ' (' + (jobs.length - n) + ' were already picked or didn\'t fit)' : '') + '.' : 'The Unassigned list for ' + dayText(boardDay()) + ' is empty.');
      } catch (e) {
        say('⚠️ ' + (st.isSignedOut(e) ? e.message : 'Couldn\'t load the Unassigned list: ' + errText(e)));
      } finally { busy = false; uaBtn.classList.remove('st-busy'); updateButtons(); }
    };

    // ---------- Working out what to do ----------
    const label = r => '#' + r.jobId + (r.number ? '-' + r.number : '') + (r.customer ? ' ' + r.customer : '');
    const res = (text, kind, extra) => Object.assign({ text, kind }, extra || {});
    // What should change on one appointment, given who's on it now. p: the run's choices
    // ({ to, from } or { want: [tech ids] }). Returns { add, remove } or { skip, kind }.
    const decide = (m, cur, p) => {
      const has = id => hasId(cur, id);
      if (m === 'move') {
        if (p.from) {
          if (!has(p.from)) return { skip: 'doesn\'t have ' + techName(p.from), kind: 'skipped' };
          if (S(p.from) === S(p.to)) return { skip: 'already on ' + techName(p.to), kind: 'already' };
          return { add: has(p.to) ? [] : [p.to], remove: [p.from] };
        }
        const remove = cur.filter(x => S(x) !== S(p.to));
        if (has(p.to) && !remove.length) return { skip: 'already on ' + techName(p.to), kind: 'already' };
        return { add: has(p.to) ? [] : [p.to], remove };
      }
      if (m === 'add') return has(p.to) ? { skip: 'already on ' + techName(p.to), kind: 'already' } : { add: [p.to], remove: [] };
      if (m === 'unassign') {
        if (p.from) return has(p.from) ? { add: [], remove: [p.from] } : { skip: 'doesn\'t have ' + techName(p.from), kind: 'skipped' };
        return cur.length ? { add: [], remove: cur.slice() } : { skip: 'already unassigned', kind: 'already' };
      }
      // Swaps and Put back ('exact'): an exact set of techs, worked out at review time.
      const want = p.want || [];
      const add = want.filter(x => !has(x)), remove = cur.filter(x => !hasId(want, x));
      if (!add.length && !remove.length) return { skip: 'already has ' + (want.length ? names(want) : 'no tech'), kind: 'already' };
      return { add, remove };
    };
    const kindOf = m => m === 'plan' ? 'move' : m === 'move' || m === 'add' || m === 'unassign' ? m : 'exact';
    const after = (cur, d) => cur.filter(x => !hasId(d.remove, x)).concat(d.add.filter(x => !hasId(cur, x)));
    // ServiceTitan's own rule (its job panel greys these techs out): a tech who isn't a managed
    // tech can only be alone on a job whose invoice is $0. It asks for a managed tech first.
    // A tech who isn't in the tech list can't be counted as managed: if no known tech on the job is
    // managed, the job is left alone rather than guessed.
    const managedProblem = (total, fin) => {
      if (!(total > 0) || !fin.length) return '';
      if (fin.some(id => { const t = techById(id); return t && t.managed; })) return '';
      // Unknown: not in the tech list, or the list didn't load (the board's own tech list doesn't say).
      const unknown = fin.filter(id => { const t = techById(id); return !t || t.managed == null; });
      const missing = unknown.filter(id => !techById(id));
      if (unknown.length) return 'couldn\'t confirm a managed tech on this $' + Number(total).toFixed(2) + ' job (' +
        (missing.length ? names(missing) + (missing.length === 1 ? ' isn\'t' : ' aren\'t') + ' in the tech list' : 'the tech list didn\'t load') + '). Check it by hand';
      return 'ServiceTitan won\'t allow it: ' + names(fin) + (fin.length === 1 ? ' isn\'t a managed tech' : ' aren\'t managed techs') +
        ', so the invoice must be $0 (it\'s $' + Number(total).toFixed(2) + '). Put a managed tech on it too';
    };
    const changeText = (cur, d) => {
      const fin = after(cur, d);
      if (d.add.length && d.remove.length) return names(d.remove) + ' → ' + names(d.add);
      if (d.add.length) return (cur.length ? '+ ' : '') + names(d.add);
      return '− ' + names(d.remove) + (fin.length ? '' : ' (to Unassigned)');
    };
    // Appointment status, from the job panel's data (read fresh each time), never the board's word
    // (the board can be behind). All six numbers were checked against the board on the live
    // account in Oct 2026: 0 Scheduled, 1 Dispatched, 2 Working, 3 Hold, 4 Done, 5 Canceled.
    //   Scheduled: fine.  Dispatched, Working, Hold: a warning you have to tick.
    //   Done, Canceled, or anything else (a number or word the Toolbox doesn't know): left alone.
    const STATUS_NAMES = ['Scheduled', 'Dispatched', 'Working', 'Hold', 'Done', 'Canceled'];
    const isScheduled = name => name === 'Scheduled';
    // The status's name, or '' if the Toolbox doesn't know it.
    const statusName = raw => {
      if (typeof raw === 'number') return STATUS_NAMES[raw] || '';
      const w = norm(raw).toLowerCase().replace('cancelled', 'canceled');
      return STATUS_NAMES.find(n => n.toLowerCase() === w) || '';
    };
    // Why a job is left alone because of its status, or '' if it isn't.
    const statusStop = raw => {
      const name = statusName(raw);
      if (!name) return 'appointment has a status the Toolbox doesn\'t know (' + raw + '), left alone';
      if (name === 'Done' || name === 'Canceled') return 'appointment is ' + name + ', left alone';
      return '';
    };
    const sameSet = (a, b) => a.length === b.length && a.every(id => hasId(b, id));
    const overlap = (a, b) => !!(a && b && a.start && a.end && b.start && b.end) && new Date(a.start) < new Date(b.end) && new Date(b.start) < new Date(a.end);
    // A read that came back in a shape the Toolbox doesn't know also shows the yellow warning bar.
    const noteBad = e => { if (e && e.kind === 'bad') health.flag(TOOL, errText(e)); };

    // The day's full schedule (every branch and team). Within one review or run it's reused for up
    // to 5 seconds (a big stack can need it for every job); every review and run starts fresh.
    // A booking can land between any check and the change itself, as it can for the job panel; the
    // 5 seconds only add to that window, and only in this rare case.
    // Jobs worked on at the same time share one read of it while it's on its way.
    let sched = { day: '', at: 0, list: null, loading: null };
    const freshSchedule = () => { sched = { day: '', at: 0, list: null, loading: null }; };
    const fullDay = when => {
      const key = dayISO(new Date(when));
      if (sched.day === key && sched.list && Date.now() - sched.at < 5000) return Promise.resolve(sched.list);
      if (sched.day === key && sched.loading) return sched.loading;
      const mine = sched = { day: key, at: 0, list: null, loading: null };
      mine.loading = st.daySchedule(key).then(
        list => { mine.list = list; mine.at = Date.now(); mine.loading = null; return list; },
        e => { mine.loading = null; throw e; });
      return mine.loading;
    };
    // Which techs are booked at an appointment's time, not counting the appointments in ignore(id):
    // jobs a swap takes them off, and the jobs this run puts on them. ServiceTitan's check can
    // leave out one appointment itself. With two or more to leave out (stacking three or more
    // overlapping jobs, or a whole-day swap where a tech already has overlapping jobs), a job
    // booking is looked up in the day's full schedule, every branch and team, so a job your board's
    // filters hide still counts. If that can't be read, the tech counts as booked (safe side).
    // Non-job and recurring events always count. Returns [{ id, why }] for the booked techs.
    const bookedAt = async (techIds, appt, ignore) => {
      const out = [], plain = [];
      for (const id of techIds) {
        const seen = new Set();   // each appointment once
        const ig = (ignore ? ignore(id) : []).filter(g => S(g.apptId) !== S(appt.apptId) && overlap(g, appt) && !seen.has(S(g.apptId)) && !!seen.add(S(g.apptId)));
        if (!ig.length) { plain.push(id); continue; }
        const b = (await st.techsBooked([id], appt.start, appt.end, ig.length === 1 ? ig[0].apptId : appt.apptId)).find(y => S(y.id) === S(id));
        if (!b || !b.booked) continue;
        if (b.nonJob || b.recurring || ig.length === 1) { out.push({ id, why: b.why }); continue; }
        const skip = ig.map(g => S(g.apptId)).concat([S(appt.apptId)]);
        let list;
        try { list = await fullDay(appt.start); }
        catch (e) { if (st.isSignedOut(e)) throw e; noteBad(e); out.push({ id, why: 'might be booked (couldn\'t read the day\'s full schedule to check: ' + errText(e) + ')' }); continue; }
        if (list.some(r => S(r.techId) === S(id) && skip.indexOf(S(r.apptId)) < 0 && !/^cancel/i.test(r.status) && overlap(r, appt))) out.push({ id, why: 'is already booked on another job then' });
      }
      if (plain.length) (await st.techsBooked(plain, appt.start, appt.end, appt.apptId)).forEach(b => { if (b.booked) out.push({ id: b.id, why: b.why }); });
      return out;
    };
    const bookedText = list => list.map(b => techName(b.id) + ' ' + b.why).join('; ');

    // The appointments a run works on, with the choices for each.
    const targets = m => {
      const rows = dayRows();
      if (m === 'swapDays') {
        const A = aPick.value(), B = bPick.value();
        const out = [];
        rows.forEach(r => {
          const ids = r.techs.map(t => t.id);
          if (hasId(ids, A) === hasId(ids, B)) return;   // neither, or both: nothing to swap
          out.push({ r, p: { a: A, b: B } });
        });
        return { list: out, missing: [] };
      }
      const list = [], missing = [];
      picker.ids().forEach(j => {
        const appts = rows.filter(r => r.jobId === S(j));
        if (!appts.length) { missing.push(j); return; }
        const to = m === 'plan' ? (plan && plan.get(S(j)) ? plan.get(S(j)).id : null) : toPick.value();
        appts.forEach(r => list.push({ r, p: { to, from: m === 'plan' ? null : fromPick.value() } }));
      });
      return { list, missing };
    };

    const TITLE = { move: 'Move to', add: 'Add', unassign: 'Unassign', swapJobs: 'Swap two jobs\' techs', swapDays: 'Swap whole day', putback: 'Put back the last run', plan: 'Planned (each job to its own tech)' };
    const GO = { move: 'Move', add: 'Add to', unassign: 'Unassign', swapJobs: 'Swap', swapDays: 'Swap', putback: 'Put back', plan: 'Assign' };

    // ---------- Review (reads only) ----------
    // A review is only good for a few minutes: after that, Go asks for a new one.
    const REVIEW_MAX_MS = 5 * 60 * 1000;
    const review = async m => {
      if (busy) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      if (!onBoard()) return say(board.need());
      let day = boardDay();
      let list = [], missing = [];
      // The board's data, read fresh, and the Unassigned list too when a picked job isn't on the timeline.
      if (m !== 'putback') {
        say('Reading the board...');
        try {
          const s = await board.load({ fresh: true });
          if (m !== 'swapDays' && picker.ids().some(j => !board.apptsOf(j).length)) await loadUnassigned();
          day = s.day;
        } catch (e) { return say('⚠️ ' + (st.isSignedOut(e) ? e.message : 'Couldn\'t read the board: ' + errText(e))); }
      }
      if (m === 'putback') {
        // The saved copy is the one to trust (another tab, or a reload, may have changed it).
        loadUndo(); updateButtons();
        if (!undo.length) return say('There\'s nothing to put back (it\'s kept for a day).');
        if (undoDay) day = undoDay;
        list = undo.map(x => ({ r: { apptId: x.apptId, jobId: x.jobId, number: x.number, customer: x.customer, start: null, end: null, bu: null, techs: [] }, p: { want: x.before, expect: x.after } }));
      } else {
        ({ list, missing } = targets(m));
        if (m === 'swapJobs') {
          if (picker.size() !== 2) return say('Pick exactly two jobs to swap.');
          if (missing.length) return say('#' + missing.join(', #') + ' isn\'t on the board for ' + dayText(day) + '. Open its day first.');
          if (list.length !== 2) return say('One of those jobs has more than one visit on ' + dayText(day) + '. Swap needs one visit each.');
        }
      }
      if (!list.length && !missing.length) return say(m === 'swapDays' ? 'Neither tech has jobs on ' + dayText(day) + '.' : 'Nothing to do.');
      if (list.length > MAX_PER_RUN) return say('⚠️ ' + MAX_PER_RUN + ' jobs per run at most.');
      busy = reviewing = true; reviewStop = false; clearReview(); picker.setPicking(false); updateButtons();
      freshSchedule();
      say('Checking ' + plural(list.length, 'job') + '...');
      try {
        // A fresh tech list every review: skills, managed techs and who's active can change.
        await loadTechs(true);
        pickers3.forEach(p => p.fill());
        if (reviewStop) { say('Stopped checking. Nothing changed.'); return; }
        // Swaps: the appointments each tech is leaving. Those don't count as "booked" for the job
        // they're getting; anything else at that time (another job, time off, a meeting) does.
        const leaving = new Map();   // tech id -> [{ apptId, start, end }]
        const leave = (id, g) => { const k = S(id); if (!leaving.has(k)) leaving.set(k, []); leaving.get(k).push(g); };
        if (m === 'swapJobs') {
          // Each job gets the other's techs, as they are right now.
          const [x, y] = list;
          const [ax, ay] = await Promise.all([st.appointment(x.r.apptId), st.appointment(y.r.apptId)]);
          const tx = ax.appointment.techIds, ty = ay.appointment.techIds;
          if (sameSet(tx, ty)) {
            say('Both jobs are on ' + (tx.length ? names(tx) : 'no tech') + ', so there\'s nothing to swap. Pick a job from a different tech.');
            return;
          }
          x.p = { want: ty.slice() }; y.p = { want: tx.slice() };
          tx.filter(id => !hasId(ty, id)).forEach(id => leave(id, { apptId: x.r.apptId, start: ax.appointment.start, end: ax.appointment.end }));
          ty.filter(id => !hasId(tx, id)).forEach(id => leave(id, { apptId: y.r.apptId, start: ay.appointment.start, end: ay.appointment.end }));
        }
        if (m === 'swapDays') list.forEach(it => { const ids = it.r.techs.map(t => t.id); [it.p.a, it.p.b].forEach(id => { if (hasId(ids, id)) leave(id, { apptId: it.r.apptId, start: it.r.start, end: it.r.end }); }); });
        const skillCache = new Map();
        const results = await st.pool(list, 4, async (it, i, alive) => {
          const now = await st.appointment(it.r.apptId);
          if (!alive()) return null;
          const a = now.appointment, cur = a.techIds;
          const status = statusName(a.status), stopWhy = statusStop(a.status);
          const out = { it, cur, total: now.jobTotal, bu: now.businessUnitId, jobId: S(now.jobId), start: a.start, end: a.end, status, warn: {} };
          if (m === 'putback') {
            if (!it.p.expect) return Object.assign(out, { skip: 'the earlier run couldn\'t confirm what it did to this job, so it\'s left for you to check (it started as ' + (it.p.want.length ? names(it.p.want) : 'unassigned') + ', now ' + (cur.length ? names(cur) : 'unassigned') + ')', kind: 'skipped' });
            if (!sameSet(cur, it.p.expect)) return Object.assign(out, { skip: 'changed since the move (now ' + (cur.length ? names(cur) : 'unassigned') + '), left alone', kind: 'skipped' });
          }
          if (stopWhy) return Object.assign(out, { skip: stopWhy, kind: 'skipped' });
          if (m === 'plan' && !it.p.to) return Object.assign(out, { skip: 'no tech planned for it (🗺️ Plan the day again to include it)', kind: 'skipped' });
          if (m === 'swapDays') {
            const hA = hasId(cur, it.p.a), hB = hasId(cur, it.p.b);
            if (hA === hB) return Object.assign(out, { skip: hA ? 'has both ' + techName(it.p.a) + ' and ' + techName(it.p.b) : 'has neither tech now', kind: 'skipped' });
            it.p.want = cur.filter(x => S(x) !== S(it.p.a) && S(x) !== S(it.p.b)).concat([hA ? it.p.b : it.p.a]);
          }
          const d = decide(kindOf(m), cur, it.p);
          if (d.skip) return Object.assign(out, { skip: d.skip, kind: d.kind });
          const fin = after(cur, d);
          const mp = managedProblem(out.total, fin);
          if (mp) return Object.assign(out, { skip: mp, kind: 'skipped' });
          out.d = d;   // only now is it a job to do
          if (!isScheduled(status)) out.warn.status = 'it\'s ' + status + ', not Scheduled';
          if (!fin.length && m !== 'putback' && otherBranch(out.bu)) out.warn.branch = 'goes to ' + buName(out.bu) + '\'s Unassigned list, not yours';
          if (d.add.length && m !== 'putback') {
            // Skills, as the job panel checks them before assigning.
            if (skillsOn()) {
              const unknown = d.add.filter(id => { const t = techById(id); return !t || !Array.isArray(t.skillIds); });
              if (unknown.length) out.warn.skills = 'skills couldn\'t be checked for ' + names(unknown) + (techsNote ? ' (' + techsNote + ')' : '');
              else {
                if (!skillCache.has(out.jobId)) skillCache.set(out.jobId, st.jobSkills(out.jobId));
                const need = await skillCache.get(out.jobId);
                const gaps = d.add.map(id => { const t = techById(id); const miss = need.filter(s => !hasId(t.skillIds, s.id)); return miss.length ? t.name + ' doesn\'t have ' + miss.map(s => s.name).join(', ') : ''; }).filter(Boolean);
                if (gaps.length) out.warn.skills = gaps.join('; ');
              }
            }
            // Already booked at that time? For swaps, not counting the job each tech is leaving.
            const booked = await bookedAt(d.add, { apptId: it.r.apptId, start: a.start, end: a.end }, id => leaving.get(S(id)) || []);
            if (booked.length) out.warn.booked = bookedText(booked);
          }
          return out;
        }, (d, t) => say('Checking jobs... ' + d + ' of ' + t), { stop: () => reviewStop });
        if (results.stopped) { say('Stopped checking. Nothing changed.'); return; }
        if (results.halted === 'signedOut') throw results.haltError;
        const items = [];
        list.forEach((it, i) => {
          const x = results[i];
          if (x === st.NOT_RUN || !x) items.push({ it, skip: 'not checked: ServiceTitan is slow or not answering. Try again in a bit', kind: 'problem' });
          else if (x.error) { noteBad(x.error); items.push({ it, skip: st.isNoPermission(x.error) ? 'your ServiceTitan login doesn\'t have permission to see this job in the job panel' : 'couldn\'t check (' + errText(x.error) + ')', kind: 'problem' }); }
          else items.push(x);
        });
        missing.forEach(j => items.push({ it: { r: { jobId: S(j), customer: picker.label(j) } }, skip: 'not on the board for ' + dayText(day) + ' (open its day first)', kind: 'skipped' }));
        // Put back: is a tech going back on a job booked elsewhere since the move? Checked once every
        // job has been read, because undoing a swap takes each tech off the job they were swapped
        // onto, and that one doesn't count.
        if (m === 'putback') {
          items.forEach(x => { if (x.d && !x.skip) x.d.remove.forEach(id => leave(id, { apptId: x.it.r.apptId, start: x.start, end: x.end })); });
          const check = items.filter(x => x.d && !x.skip && x.d.add.length);
          for (let n = 0; n < check.length; n++) {
            if (reviewStop) { say('Stopped checking. Nothing changed.'); return; }
            say('Checking bookings... ' + (n + 1) + ' of ' + check.length);
            const x = check[n];
            try {
              const booked = await bookedAt(x.d.add, { apptId: x.it.r.apptId, start: x.start, end: x.end }, id => leaving.get(S(id)) || []);
              if (booked.length) x.warn.booked = bookedText(booked);
            } catch (e) {
              if (st.isSignedOut(e)) throw e;
              noteBad(e);
              Object.assign(x, { skip: 'couldn\'t check if the tech is booked (' + errText(e) + ')', kind: 'problem' });
            }
          }
        }
        planned = { mode: m, items, at: Date.now(), day, leaving, params: m === 'move' || m === 'add' ? { to: toPick.value(), from: fromPick.value() } : m === 'unassign' ? { from: fromPick.value() } : m === 'swapDays' ? { a: aPick.value(), b: bPick.value() } : {} };
        showReview();
      } catch (e) {
        noteBad(e);
        say('⚠️ ' + (st.isSignedOut(e) ? e.message : 'Couldn\'t check the jobs: ' + errText(e)));
      } finally { busy = reviewing = false; updateButtons(); }
    };

    const WARNS = [
      ['status', '⚠️ Not Scheduled (on the way, working or on hold)', 'Also do the jobs that aren\'t Scheduled'],
      ['skills', '⚠️ Skill warning', 'Also do the jobs with a skill warning'],
      ['booked', '⚠️ Already booked at that time', 'Also do the jobs where the tech is already booked'],
      ['branch', '⚠️ Would drop off your board (another branch)', 'Also unassign the jobs from another branch']
    ];
    const ticks = {};
    const allTicked = x => Object.keys(x.warn).every(k => ticks[k] && ticks[k].checked);
    // The jobs Go will do. A two-job swap is both jobs or neither: if one side is left alone or has
    // a warning that isn't ticked, nothing is swapped.
    const included = () => {
      if (!planned) return [];
      const ok = planned.items.filter(x => x.d && !x.skip && allTicked(x));
      if (planned.mode === 'swapJobs') return ok.length === 2 ? ok : [];
      return ok;
    };
    const showReview = () => {
      const p = planned, ready = p.items.filter(x => x.d && !x.skip), skipped = p.items.filter(x => !x.d || x.skip);
      const head = TITLE[p.mode] + (p.mode === 'move' || p.mode === 'add' ? ' ' + techName(p.params.to) + (p.params.from ? ' (from ' + techName(p.params.from) + ')' : '') :
        p.mode === 'unassign' ? (p.params.from ? ' ' + techName(p.params.from) : ' everyone') : p.mode === 'swapDays' ? ': ' + techName(p.params.a) + ' ⇄ ' + techName(p.params.b) : '');
      const lines = [head + '   ·   ' + dayText(p.day), ''];
      if (p.mode === 'swapJobs' && ready.length !== 2) lines.push('⚠️ A swap needs both jobs, and one is left alone (below), so nothing will be swapped.', '');
      const clean = ready.filter(x => !Object.keys(x.warn).length);
      lines.push('✅ Ready: ' + plural(clean.length, 'job'));
      clean.slice(0, 60).forEach(x => lines.push('• ' + label(x.it.r) + ': ' + changeText(x.cur, x.d)));
      if (clean.length > 60) lines.push('…and ' + (clean.length - 60) + ' more');
      WARNS.forEach(([k, title]) => {
        const w = ready.filter(x => x.warn[k]);
        if (!w.length) return;
        lines.push('', title + ' (' + w.length + '):');
        w.slice(0, 40).forEach(x => lines.push('• ' + label(x.it.r) + ': ' + changeText(x.cur, x.d) + '. ' + x.warn[k]));
        if (w.length > 40) lines.push('…and ' + (w.length - 40) + ' more');
      });
      if (skipped.length) {
        lines.push('', '⏭️ Left alone (' + skipped.length + '):');
        skipped.slice(0, 40).forEach(x => lines.push('• ' + label(x.it.r) + ': ' + x.skip));
        if (skipped.length > 40) lines.push('…and ' + (skipped.length - 40) + ' more');
      }
      // Stacking: jobs in this run that overlap each other end up at the same time on one tech.
      if ((p.mode === 'move' || p.mode === 'add') && ready.length > 1) {
        const n = ready.filter(x => ready.some(y => y !== x && overlap(x, y))).length;
        if (n) lines.push('', 'ℹ️ ' + n + ' of these overlap each other, so ' + techName(p.params.to) + ' will have them at the same time (stacked).');
      }
      if (p.mode === 'swapDays' && (skipped.length || ready.some(x => Object.keys(x.warn).length))) lines.push('', 'ℹ️ Jobs left alone (or with a warning you don\'t tick) stay where they are, so it won\'t be a full swap.');
      if (p.mode === 'swapJobs' || p.mode === 'swapDays') lines.push('', 'Swaps don\'t count the job each tech is leaving as "booked". Anything else at that time does.');
      reviewText.textContent = lines.join('\n');
      reviewOpts.textContent = '';
      WARNS.forEach(([k, , text]) => {
        const n = ready.filter(x => x.warn[k]).length;
        if (!n) { delete ticks[k]; return; }
        const l = el('label', 'display:flex;gap:6px;align-items:center;cursor:pointer;font-weight:600');
        const c = el('input'); c.type = 'checkbox'; c.className = 'st-move-tick-' + k;
        c.onchange = () => setGo();
        ticks[k] = c;
        l.append(c, document.createTextNode(text + ' (' + n + ')'));
        reviewOpts.appendChild(l);
      });
      setGo();
      reviewBox.style.display = 'grid';
      fit();
      reviewBox.scrollIntoView({ block: 'nearest' });
      say(ready.length ? 'Review the list, then press ' + GO[p.mode] + '.' : 'Nothing to change.');
    };
    const setGo = () => {
      const n = included().length;
      if (planned && planned.mode === 'swapJobs') {
        const ready = planned.items.filter(x => x.d && !x.skip).length;
        goBtn.textContent = n ? 'Swap them' : ready === 2 ? 'Tick the warning to swap' : 'Can\'t swap';
      } else goBtn.textContent = GO[planned ? planned.mode : 'move'] + ' ' + plural(n, 'job');
      goBtn.disabled = !n; goBtn.style.opacity = n ? '1' : '.5';
    };

    // ---------- Doing it ----------
    // Each appointment the run touches remembers:
    //   x.origin:   its techs at the run's first fresh look, before anything was sent. Kept across
    //               the retry, so Put back always returns it to where it really started.
    //   x.lastSeen: its techs at the latest reading. null right after a change is sent, until a
    //               reading comes back, so an unconfirmed change is never mistaken for "nothing".
    // Put back is worked out from those two, not from what the requests answered: a request can
    // fail to answer after ServiceTitan has already made the change.
    const readTechs = async (apptId, x, ms) => {
      const a = (await st.appointment(apptId, ms)).appointment;
      if (x) x.lastSeen = a.techIds.slice();
      return a.techIds;
    };
    // Reads until ServiceTitan's data passes ok(techIds), for up to `ms` of clock time.
    const confirmTechs = async (apptId, ok, x, ms) => {
      const end = Date.now() + (ms || 6000);
      await wait(150);
      for (;;) {
        try { const ids = await readTechs(apptId, x, Math.max(2000, end - Date.now())); if (ok(ids)) return ids; }
        catch (e) { if (st.isSignedOut(e)) throw e; }
        if (Date.now() >= end) return null;
        await wait(400);
      }
    };
    const nowText = ids => ids ? (ids.length ? names(ids) : 'unassigned') : 'unknown';
    // ctx.given: what this run puts on whom ([{ apptId, ids, start, end }], one entry per
    // appointment). It starts with every job the run will do (several are done at once, so a job
    // can't wait to hear what the others did), and a job's entry gets its fresh times once its
    // tech is on. A job that ends up not done just means a tech isn't on it, so leaving it out of
    // "booked" changes nothing.
    const give = (ctx, apptId, ids, start, end) => {
      const g = ctx.given.find(z => S(z.apptId) === S(apptId));
      if (!g) { ctx.given.push({ apptId, ids: ids.slice(), start, end }); return; }
      ids.forEach(id => { if (!hasId(g.ids, id)) g.ids.push(id); });
      g.start = start; g.end = end;
    };
    // One appointment: a fresh look, the change worked out again from who's on it now (in case the
    // board changed since the review), the checks again, then add first and remove second.
    // ctx.given: what this run puts on whom (above), and ctx.leaving: the jobs a swap takes each
    // tech off. Neither counts as "booked"; anything else does.
    const doItem = async (x, m, okWarn, ctx) => {
      const r = x.it.r;
      let now;
      try { now = await st.appointment(r.apptId); }
      catch (e) { if (st.isSignedOut(e)) throw e; noteBad(e); return res('couldn\'t read the job (' + errText(e) + '). Nothing changed', 'problem'); }
      const cur = now.appointment.techIds;
      x.lastSeen = cur.slice();
      if (!x.origin) x.origin = cur.slice();
      // Exactly the techs the review saw, or it's left alone. (On a retry after this run already
      // changed part of it, the check below, against what the review planned, is the one that applies.)
      if (!x.touched && x.cur && !sameSet(cur, x.cur)) return res('changed since the review (now ' + nowText(cur) + '). Review again', 'problem', { noRetry: true });
      const status = statusName(now.appointment.status), stopWhy = statusStop(now.appointment.status);
      if (stopWhy) return res(stopWhy, 'skipped');
      const d = decide(kindOf(m), cur, x.it.p);
      if (d.skip) return res(d.skip, d.kind);
      // Only what the review showed: a tech to add, or one to take off, that wasn't in it means
      // someone changed the job since. Leave it for you to look at.
      if (d.add.some(id => !hasId(x.d.add, id)) || d.remove.some(id => !hasId(x.d.remove, id))) return res('changed since the review (now ' + nowText(cur) + '). Review again', 'problem', { noRetry: true });
      const fin = after(cur, d);
      const mp = managedProblem(now.jobTotal, fin);
      if (mp) return res(mp, 'skipped');
      if (!isScheduled(status) && !okWarn.status) return res('is ' + status + ' now, not Scheduled (not ticked), left alone', 'skipped');
      if (!fin.length && otherBranch(now.businessUnitId) && !okWarn.branch && m !== 'putback') return res('would go to ' + buName(now.businessUnitId) + '\'s Unassigned list (not ticked)', 'skipped');
      // Booked, checked again right before (someone may have booked the tech since the review).
      // Jobs this run put on the tech, and the job a swap (or undoing one) takes them off, don't count.
      if (d.add.length && !okWarn.booked) {
        try {
          const appt = { apptId: r.apptId, start: now.appointment.start, end: now.appointment.end };
          const since = await bookedAt(d.add, appt, id => (ctx.leaving.get(S(id)) || []).concat(ctx.given.filter(g => hasId(g.ids, id))));
          if (since.length) return res(bookedText(since) + ' (since the review), left alone. Review again to see it', 'skipped');
        } catch (e) { if (st.isSignedOut(e)) throw e; noteBad(e); return res('couldn\'t check if the tech is booked (' + errText(e) + '). Nothing changed', 'problem'); }
      }
      let lost = '';
      // 1) Add the new tech(s) first, so the job is never left without a tech halfway.
      // A sign-out answer means ServiceTitan refused the request (nothing changed), so the job's
      // last reading still stands. Other failures leave it unknown until the job is read again.
      if (d.add.length) {
        let sent = null;
        const pre = x.lastSeen;
        x.lastSeen = null; x.touched = true;
        try { await st.assignTechs(r.apptId, d.add); }
        catch (e) { if (st.isSignedOut(e)) { x.lastSeen = pre; throw e; } sent = e; }
        // If the request failed, ServiceTitan may still have made the change: look before saying anything.
        const got = await confirmTechs(r.apptId, ids => d.add.every(id => hasId(ids, id)), x, sent ? 2000 : 6000);
        if (!got) {
          const why = sent ? 'couldn\'t add ' + names(d.add) + ' (' + errText(sent) + ')' : 'ServiceTitan didn\'t add ' + names(d.add);
          if (x.lastSeen && sameSet(x.lastSeen, cur)) return res(why + '. Nothing changed', 'problem');
          return res(why + ', and couldn\'t confirm what it did (now ' + nowText(x.lastSeen) + '). Review again', 'problem');
        }
        if (sent) lost = 'ServiceTitan\'s answer got lost, but the change went through. ';
        give(ctx, r.apptId, d.add, now.appointment.start, now.appointment.end);
      }
      // 2) Then take the old one(s) off.
      if (d.remove.length) {
        let sent = null;
        const pre = x.lastSeen;
        x.lastSeen = null; x.touched = true;
        try { await st.unassignTechs(r.apptId, d.remove); }
        catch (e) { if (st.isSignedOut(e)) { x.lastSeen = pre; throw e; } sent = e; }
        const got = await confirmTechs(r.apptId, ids => d.remove.every(id => !hasId(ids, id)), x, sent ? 2000 : 6000);
        if (!got) {
          const why = sent ? 'couldn\'t take off ' + names(d.remove) + ' (' + errText(sent) + ')' : 'ServiceTitan didn\'t take off ' + names(d.remove);
          return res(lost + (d.add.length ? 'added ' + names(d.add) + ' but ' : '') + why + ' (now ' + nowText(x.lastSeen) + ')', 'problem');
        }
        if (sent) lost = 'ServiceTitan\'s answer got lost, but the change went through. ';
      }
      return res(lost + changeText(cur, d), 'done');
    };

    // Up to AT_ONCE jobs at a time. Each job is still done the same careful way as before (fresh
    // look, checks, add first, confirm, then take off, confirm); only the waiting for ServiceTitan
    // overlaps, which is where the time went (a job moving off a tech waits on six answers).
    //   - Two visits of the same job are never worked on at the same time.
    //   - After a job has a problem (one that gets a retry), it goes back to one job at a time
    //     until a job goes through, to go easy on ServiceTitan when it's slow or failing.
    //   - Stop (or ServiceTitan signing you out) starts nothing new. The jobs already started are
    //     always finished first, so nothing is still changing after the run says it's done.
    // done(x, result) for each job as it finishes; progress(finished). Returns how many were never
    // started (0 unless stopped). A sign-out, or an unexpected error, is thrown once the rest finish.
    const AT_ONCE = 3;
    const doMany = (list, m, okWarn, ctx, done, progress) => new Promise((resolve, reject) => {
      const started = list.map(() => false), working = new Set();
      let active = 0, finished = 0, limit = AT_ONCE, fatal = null;
      const nextOne = () => list.findIndex((x, i) => !started[i] && !working.has(S(x.it.r.jobId)));
      const one = async i => {
        const x = list[i], key = S(x.it.r.jobId);
        try {
          const rr = await doItem(x, m, okWarn, ctx);
          done(x, rr);
          if (rr.kind === 'problem' && !rr.noRetry) limit = 1;
          else if (rr.kind === 'done') limit = AT_ONCE;
        } catch (e) { if (!fatal) fatal = e; }
        finally { active--; finished++; working.delete(key); progress(finished); pump(); }
      };
      const pump = () => {
        while (!stop && !fatal && active < limit) {
          const i = nextOne();
          if (i < 0) break;
          started[i] = true; active++; working.add(S(list[i].it.r.jobId));
          one(i);
        }
        if (active) return;
        if (fatal) reject(fatal);
        else resolve(started.filter(s => !s).length);
      };
      pump();
    });

    const go = async () => {
      if (!planned || busy) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      const p = planned, m = p.mode;
      if (Date.now() - p.at > REVIEW_MAX_MS) { clearReview(); return say('⚠️ That review is more than ' + (REVIEW_MAX_MS / 60000) + ' minutes old. Press Review again so the checks are fresh.'); }
      const todo = included();
      if (!todo.length) return;
      const okWarn = {}; Object.keys(ticks).forEach(k => { okWarn[k] = !!(ticks[k] && ticks[k].checked); });
      reviewBox.style.display = 'none'; planned = null;
      busy = running = true; stop = false; lock = TOOL;
      log.textContent = ''; progress.style.display = 'grid';
      stopBtn.disabled = false; stopBtn.textContent = 'Stop'; stopBtn.style.display = 'inline-block';
      copyBtn.textContent = 'Copy results';
      updateButtons();
      fit(); progress.scrollIntoView({ block: 'nearest' });
      todo.forEach(x => { x.origin = null; x.lastSeen = null; x.touched = false; });
      freshSchedule();
      const results = new Map();   // apptId -> result
      const ctx = { given: [], leaving: p.leaving || new Map() };
      todo.forEach(x => { if (x.d && x.d.add.length) give(ctx, x.it.r.apptId, x.d.add, x.start, x.end); });
      const record = (x, rr, retry) => { results.set(S(x.it.r.apptId), { x, rr }); add(label(x.it.r) + ': ' + (retry ? 'retry: ' : '') + rr.text); };
      const verb = m === 'putback' ? 'Putting back' : m === 'unassign' ? 'Unassigning' : m === 'add' ? 'Adding' : m === 'move' ? 'Moving' : m === 'plan' ? 'Assigning' : 'Swapping';
      const needsRetry = rr => rr.kind === 'problem' && !rr.noRetry;
      // What the run changed, worked out from each job's first and latest reading.
      const changes = () => todo.filter(x => x.origin && (x.lastSeen === null || !sameSet(x.origin, x.lastSeen)))
        .map(x => ({ apptId: x.it.r.apptId, jobId: x.it.r.jobId, number: x.it.r.number, customer: x.it.r.customer, before: x.origin.slice(), after: x.lastSeen ? x.lastSeen.slice() : null }));
      let finished = false, lastRun = [];
      try {
        add(TITLE[m] + (m === 'move' || m === 'add' ? ' ' + techName(p.params.to) : '') + ' · ' + dayText(p.day) + ' (' + plural(todo.length, 'job') + ')');
        if (m === 'swapJobs') {
          // Both jobs are read again first: nothing is done unless both are as the review saw them.
          let ok = true;
          for (const x of todo) {
            let ids;
            try { ids = await readTechs(x.it.r.apptId, null); }
            catch (e) { if (st.isSignedOut(e)) throw e; add('Nothing swapped: couldn\'t read ' + label(x.it.r) + ' (' + errText(e) + '). Try again.'); ok = false; break; }
            if (!sameSet(ids, x.cur)) { add('Nothing swapped: ' + label(x.it.r) + ' changed since the review (now ' + nowText(ids) + '). Review again.'); ok = false; break; }
          }
          // Then one job at a time, each with one more try right away. If the first doesn't go
          // through, the second isn't started.
          for (let n = 0; ok && n < 2; n++) {
            if (stop) { add('Stopped. ' + (n ? 'Only the first job was swapped.' : 'Nothing swapped.')); break; }
            say('Swapping ' + (n + 1) + ' of 2 (job ' + todo[n].it.r.jobId + ')');
            let rr = await doItem(todo[n], m, okWarn, ctx);
            record(todo[n], rr);
            if (needsRetry(rr) && !stop) { await wait(1500); rr = await doItem(todo[n], m, okWarn, ctx); record(todo[n], rr, true); }
            if (rr.kind !== 'done' && rr.kind !== 'already') {
              if (n === 0) add('Stopped: the first job didn\'t change' + (todo[0].origin && todo[0].lastSeen && sameSet(todo[0].origin, todo[0].lastSeen) ? ', so nothing was swapped.' : ' as it should. Check it.'));
              else add('⚠️ Half swapped: ' + label(todo[0].it.r) + ' has the other job\'s tech(s) now, but ' + label(todo[1].it.r) + ' didn\'t change. Fix it by hand, or ↩ Put back.');
              break;
            }
          }
        } else {
          say(verb + '... 0 of ' + todo.length + ' done');
          const notStarted = await doMany(todo, m, okWarn, ctx, (x, rr) => record(x, rr), n => say(verb + '... ' + n + ' of ' + todo.length + ' done'));
          if (notStarted) add('Stopped. ' + plural(notStarted, 'job') + ' not done.');
          // One more try for jobs that had a problem (a fresh look decides what's still left to do).
          const failed = todo.filter(x => { const y = results.get(S(x.it.r.apptId)); return y && needsRetry(y.rr); });
          if (failed.length && !stop) {
            add(''); add('Retrying ' + plural(failed.length, 'job') + ' that had a problem...');
            await wait(1500);
            for (let n = 0; n < failed.length; n++) {
              if (stop) { add('Stopped. ' + (failed.length - n) + ' retry(s) not done.'); break; }
              say('Retrying ' + (n + 1) + ' of ' + failed.length + ' (job ' + failed[n].it.r.jobId + ')');
              const mid = failed[n].lastSeen;   // after the first try (null: it couldn't be read back)
              const rr = await doItem(failed[n], m, okWarn, ctx);
              const o = failed[n].origin, touched = o && (mid === null || !sameSet(mid, o));
              // The first try had already changed part of it: the retry finished the rest.
              if (rr.kind === 'done' && touched) rr.text = 'finished the change, now ' + nowText(failed[n].lastSeen);
              // "Already done" can mean the first try's change went through after all.
              else if (rr.kind === 'already' && o && failed[n].lastSeen && !sameSet(o, failed[n].lastSeen)) rr.text = 'the first try went through after all, now ' + nowText(failed[n].lastSeen);
              record(failed[n], rr, true);
            }
          }
        }
        lastRun = changes();
        if (m === 'putback') undo = undo.filter(z => { const y = results.get(S(z.apptId)); return !(y && (y.rr.kind === 'done' || y.rr.kind === 'already')); });
        else {
          undo = lastRun;
          undoDay = p.day || null;
          movedJobs = Array.from(new Set(lastRun.map(z => z.jobId)));
          // Done jobs come off the picked list; anything with a problem stays so you can try again.
          if (m !== 'swapDays') {
            const problemJobs = new Set();
            results.forEach(({ x, rr }) => { if (rr.kind === 'problem') problemJobs.add(x.it.r.jobId); });
            results.forEach(({ x, rr }) => { if ((rr.kind === 'done' || rr.kind === 'already') && !problemJobs.has(x.it.r.jobId)) picker.remove(x.it.r.jobId); });
          }
        }
        finished = true;
        const tally = {};
        results.forEach(({ rr }) => { tally[rr.kind] = (tally[rr.kind] || 0) + 1; });
        const summary = Object.keys(tally).map(k => tally[k] + ' ' + k).join(', ') || 'nothing done';
        const left = []; results.forEach(({ x, rr }) => { if (rr.kind === 'problem') left.push('#' + x.it.r.jobId); });
        if (left.length) add('Needs a look: ' + left.join(', '));
        const unsure = lastRun.filter(z => !z.after);
        if (unsure.length) add('⚠️ Couldn\'t confirm what ServiceTitan did on ' + unsure.map(z => '#' + z.jobId).join(', ') + '. Check ' + (unsure.length === 1 ? 'it' : 'them') + ' on the board.');
        if (undo.length && m !== 'putback') add('↩ Put back can undo ' + plural(undo.length, 'job') + '.');
        if (lastRun.length) {
          // The board's own Refresh (same day and filters, no page reload), so it shows the changes.
          let refreshed = false;
          if (onBoard()) { say('Refreshing the board...'); refreshed = await board.refresh(); }
          add(refreshed ? 'Refreshed the board to show the changes.' : 'ServiceTitan has the changes. Press the board\'s ⟳ Refresh (or F5) if it doesn\'t show them in a moment.');
        }
        if (lastRun.length) health.clear(TOOL);
        say('Done: ' + summary + '.');
      } catch (e) {
        noteBad(e);
        if (st.isSignedOut(e)) { add('⚠️ ' + e.message); say('⚠️ ' + e.message); }
        else say('⚠️ Stopped by an error: ' + errText(e));
      } finally {
        // An error mid-run: whatever this run had already changed (or may have) can still be put back.
        if (!finished) {
          if (m === 'putback') undo = undo.filter(z => { const y = results.get(S(z.apptId)); return !(y && (y.rr.kind === 'done' || y.rr.kind === 'already')); });
          else { const ch = changes(); if (ch.length) { undo = ch; undoDay = p.day || null; movedJobs = Array.from(new Set(ch.map(z => z.jobId))); } }
          if (undo.length && m !== 'putback') add('↩ Put back can undo ' + plural(undo.length, 'job') + '.');
        }
        saveUndo();
        busy = running = false; lock = null;
        stopBtn.style.display = 'none';
        updateButtons();
        fit();
      }
    };

    // Another tool (🧭 Tech Router) hands over jobs and the tech they should go to: ➡️ Move to a
    // tech, with that tech in To and Anyone in From, and only these jobs picked (anything picked
    // before is taken off). Nothing changes until Review and the button. Returns how many jobs are
    // picked, or -1 if Move Jobs is busy.
    const take = (ids, toId, toName) => {
      if (busy) return -1;
      if (toName && !seenNames.has(S(toId))) seenNames.set(S(toId), toName);
      mode = 'move'; plan = null; set('stMoveMode', 'move');
      modeRadios.forEach(r => { r.checked = r.value === 'move'; });
      picker.setPicking(false);
      clearReview();
      picker.removeMany(picker.ids());
      // Saved first: if the tech list is still loading, filling it in afterwards picks this tech.
      set('stMoveTo', S(toId)); set('stMoveFrom', '');
      toPick.find.value = ''; fromPick.find.value = '';
      toPick.sel.value = ''; fromPick.sel.value = '';
      toPick.fill(); fromPick.fill();
      const n = picker.addMany(ids);
      layout();
      updateButtons();
      say('From 🧭 Tech Router: ' + plural(n, 'job') + ' to ' + techName(toId) + '. Press Review to see it first; nothing changes until you press Move.');
      return n;
    };
    // A plan from 🧭 Tech Router: [{ jobId, techId, techName, customer }]. Only these jobs are picked
    // (anything picked before is taken off), each with its own tech. Nothing changes until Review and
    // Assign. Returns how many jobs are picked, or -1 if Move Jobs is busy.
    const takePlan = items => {
      if (busy) return -1;
      plan = new Map();
      const labels = {};
      items.forEach(x => {
        plan.set(S(x.jobId), { id: x.techId, name: x.techName });
        if (x.techName && !seenNames.has(S(x.techId))) seenNames.set(S(x.techId), x.techName);
        labels[S(x.jobId)] = (x.customer ? x.customer + ' ' : '') + '→ ' + (x.techName || techName(x.techId));
      });
      mode = 'plan';
      picker.setPicking(false);
      clearReview();
      picker.removeMany(picker.ids());
      const n = picker.addMany(items.map(x => S(x.jobId)), labels);
      layout();
      say('From 🧭 Tech Router: a plan for ' + plural(n, 'job') + '. Press Review to check it; nothing changes until you press Assign.');
      return n;
    };
    // Hands the jobs the last run changed to Job Notifications.
    const handOff = () => {
      if (busy || !movedJobs.length) return;
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      const n = notify.takeJobs(movedJobs);
      showView('jobs');
      if (!n && movedJobs.length) say('They were already picked in Job Notifications.');
    };

    const refresh = async () => {
      if (busy) return;
      loadUndo();   // a run in another tab may have saved a newer one
      layout();
      fit();
      if (!onBoard()) say(board.need());
      else if (!msg.textContent) say('Pick what to do, then the jobs. Nothing changes until you review and press the button.');
      if (!techList) {
        try { await loadTechs(); } catch (e) { say('⚠️ ' + (st.isSignedOut(e) ? e.message : errText(e))); }
        pickers3.forEach(p => p.fill());
        layout();
      }
    };
    pickers3.forEach(p => p.fill());
    layout();
    return {
      refresh,
      take,
      takePlan,
      leave: () => picker.setPicking(false),
      isRunning: () => running,
      stop: requestStop,
      cleanup: () => { picker.cleanup(); window.removeEventListener('resize', onResize); }
    };
  })();

  // ===================================================================
  // Tool 7: Tech Router (Beta)
  // Still being built: it says so each time it's opened. It only reads. Anything that changes a
  // job goes through 🔀 Move Jobs, where nothing changes until it's reviewed and the button pressed.
  //   📞 Fill a spot: a tech's day is already planned and they need one more job, first thing, in
  //     the middle of the day or at the end. Pick the tech (from the list, or their name on the
  //     board) and it finds their open time on the day the board shows (their shift, less their
  //     jobs and other events; 8 AM–5 PM when the board has no shift for them; from now on, today),
  //     then looks through the Unassigned list for that day and the next 14 days, and the Hold list,
  //     for jobs to fill it. For each open time it lists the best few, with the customer's phone
  //     number, to call and offer the earlier time:
  //       - The right kind of job, learned from the last LEARN_DAYS days of schedules: the job types
  //         the tech did (2 or more) or their department did (3 or more). So a project coordinator
  //         gets quotes, not electrical or plumbing ones (the Electrical and Plumbing departments do
  //         those). A job type too rare to go by is matched by the start of its name ("Quote - Lead
  //         Turn Over - …"); one with nothing to go by is shown with ⚠️ and ranks lower.
  //       - It fits: the job's length plus the driving (from their job before, and on to their job
  //         after) fits the open time, give or take SLACK minutes.
  //       - Least extra driving: from where they'll be before it (their job before, or home first
  //         thing) to it and on to where they go next (their next job, or home at the end of the
  //         day), compared with going straight there. More than MAX_DETOUR minutes extra is left out.
  //       - Then: Urgent and High priority first, an Unassigned job that's already on that day
  //         (and better, one whose time already fits), and jobs waiting longest a little sooner.
  //       - Sales rule (Sales/ Service and Project Coordinators): tries to keep a day of driving
  //         under SALES_MAX minutes; a job that would go over is marked ⚠️ and ranks lower.
  //     ➡️ hands a job already on that day's Unassigned list to Move Jobs. The others need a call
  //     first: the phone number, 📋 to copy it and 🔎 to open the job.
  //   🗺️ Plan the day: a tech and a route for every job on the Unassigned list for the day the board
  //     shows (see planDay, below), handed to Move Jobs as a plan (each job to its own tech).
  //   🔎 Closest techs: type a zip code or a job number, or click a job on the board with 🖱️: the
  //     techs closest by drive time (from where they are now, today, or from home). For a job with a
  //     tech: 📍 Next job, the Unassigned jobs nearby that tech could take after it.
  //   Where things are: Unassigned and Hold jobs by their map point in ServiceTitan; jobs on the
  //   timeline by the middle of their zip code (the US Census's point, saved in this browser); techs'
  //   homes from their tech profile. Every point is rounded to about half a mile before it's sent
  //   for drive times, and nothing else about a job (no address, no name) is sent anywhere.
  //   Drive times: Mapbox, with a public key built in (it only works from go.servicetitan.com), or
  //   your own (⚙️). If they can't be had, straight-line miles are used and marked ~.
  // ===================================================================
  const router = (() => {
    const TOOL = 'Tech Router';
    const S = x => String(x);
    const pad = n => String(n).padStart(2, '0');
    const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const toDate = v => { if (v == null || v === '') return null; const d = v instanceof Date ? v : new Date(v); return isNaN(d) ? null : d; };
    const dayText = d => d ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'the day shown';
    const clock = d => { const h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + (m ? ':' + pad(m) : '') + (h < 12 ? ' AM' : ' PM'); };
    const span = (s, e) => { s = toDate(s); e = toDate(e); if (!s) return ''; if (!e) return clock(s); const a = clock(s), b = clock(e); return a.slice(-2) === b.slice(-2) ? a.slice(0, -3) + '–' + b : a + '–' + b; };
    const mins = m => { m = Math.max(0, Math.round(m)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' hr' + (m % 60 ? ' ' + (m % 60) + ' min' : ''); };
    const miText = n => (n < 10 ? n.toFixed(1) : String(Math.round(n))) + ' mi';
    const zip5 = z => { const m = /\b(\d{5})(?:-\d{4})?\b/.exec(String(z == null ? '' : z)); return m ? m[1] : ''; };
    // Town names typed in capitals ("MENDENHALL") shown as Mendenhall.
    const tidy = t => { t = norm(t); return /[a-z]/.test(t) ? t : t.toLowerCase().replace(/(^|[\s'-])([a-z])/g, (m, a, b) => a + b.toUpperCase()); };
    const overlap = (a, b) => !!(a.start && a.end && b.start && b.end) && a.start < b.end && b.start < a.end;
    const hours = a => a.start && a.end ? (a.end - a.start) / 3600000 : 0;

    const LEARN_DAYS = 28, UA_DAYS = 15, MIN_GAP = 30, SLACK = 15, MAX_DETOUR = 90, ROUTED = 24, SKILL_MISS = 45;
    const SHOW = 5, MAX = 12, NEAR_SHOW = 3, NEAR_MAX = 10, STACK = 60, LONG_JOB = 4;
    const SALES = [/^sales\s*\/\s*service\b/i, /^project coordinator/i], SALES_MAX = 330, OVER_WEIGHT = 2;
    const isSales = team => SALES.some(re => re.test(norm(team)));
    const PRIORITY = { urgent: -30, high: -15, normal: 0, low: 10 };
    const PHONE_ONLY = /\bphone call\b/i;

    // ---------- Map points and drive times ----------
    // A public Mapbox key (not a secret): in Mapbox it only works from go.servicetitan.com.
    const BUILT_IN_KEY = 'pk.eyJ1IjoiYWpvbmVzNTY2IiwiYSI6ImNtdnFuajN1bzAxNDkyenB2YzNmY3FoNGsifQ.DMF49WglFplflrSntyyoMQ';
    const KEY = 'stNearKey';   // your own Mapbox key, saved in this browser (⚙️ Drive times)
    const ownKey = () => norm(get(KEY) || '');
    const driveKey = () => ownKey() || BUILT_IN_KEY;
    const MB = 'https://api.mapbox.com/';
    const ZCTA = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1/query';
    const ZIP_KEY = 'stZipPoints';
    const okPt = p => Array.isArray(p) && p.length === 2 && p.every(n => typeof n === 'number' && isFinite(n)) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180 && !(p[0] === 0 && p[1] === 0);
    const miles = (a, b) => {
      const R = 3958.8, r = x => x * Math.PI / 180;
      const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    };
    // A guess from straight-line miles, for when Mapbox can't be reached: roads run about 25% longer,
    // at about 45 mph.
    const guessMin = mi => Math.max(1, Math.round(mi * 1.25 / 45 * 60));
    const guess = (a, b) => miles(a, b) < 0.1 ? 0 : guessMin(miles(a, b));
    // About half a mile: every point is rounded to this before it's sent, so no address can be read from it.
    const r2 = n => Math.round(n * 100) / 100;
    const ptText = p => r2(p.lon) + ',' + r2(p.lat);
    // A request to a service outside ServiceTitan: no cookies, a time limit, the answer as JSON.
    const outside = async (url, ms) => {
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctl ? setTimeout(() => ctl.abort(), ms) : null;
      try {
        const r = await fetch(url, { credentials: 'omit', signal: ctl ? ctl.signal : undefined });
        if (!r.ok) throw new Error('answered ' + r.status);
        return await r.json();
      } catch (e) { throw e && e.name === 'AbortError' ? new Error('took too long to answer') : e; }
      finally { if (timer) clearTimeout(timer); }
    };
    // Zip codes' middle points: the US Census's own point for each (only the zip codes are sent).
    // Saved in this browser, so a zip is only looked up once. { points: Map(zip -> { lat, lon }), error }.
    const savedZips = () => { const m = readSaved(ZIP_KEY, {}, {}); return m && typeof m === 'object' && !Array.isArray(m) ? m : {}; };
    const zipPoints = async zips => {
      const want = Array.from(new Set(zips.filter(z => /^\d{5}$/.test(z))));
      const saved = savedZips(), found = {};
      const missing = want.filter(z => !okPt(saved[z]));
      let error = '';
      for (let i = 0; i < missing.length; i += 50) {
        const part = missing.slice(i, i + 50);
        const q = new URLSearchParams({ where: 'ZCTA5 IN (\'' + part.join('\',\'') + '\')', outFields: 'ZCTA5,INTPTLAT,INTPTLON', returnGeometry: 'false', f: 'json' });
        try {
          const j = await outside(ZCTA + '?' + q, 12000);
          if (!j || !Array.isArray(j.features)) throw new Error('answered in a shape the Toolbox doesn\'t know');
          j.features.forEach(f => {
            const a = f && f.attributes;
            if (!a || part.indexOf(String(a.ZCTA5)) < 0) return;
            const p = [Number(a.INTPTLAT), Number(a.INTPTLON)];
            if (okPt(p)) found[a.ZCTA5] = [Math.round(p[0] * 1e4) / 1e4, Math.round(p[1] * 1e4) / 1e4];
          });
        } catch (e) { error = 'the US Census map service ' + errText(e); }
      }
      if (Object.keys(found).length) set(ZIP_KEY, JSON.stringify(Object.assign(savedZips(), found)));   // read again: another tab may have saved some
      const all = Object.assign({}, saved, found), points = new Map();
      want.forEach(z => { if (okPt(all[z])) points.set(z, { lat: all[z][0], lon: all[z][1] }); });
      return { points, error };
    };
    // Drive times from each place in `from` to each in `to`: Mapbox's Matrix, at most 25 places a
    // request (10 with traffic), so long lists go in parts. { out: out[i][j] = { min, mi } or null,
    // ok }. If Mapbox fails it isn't asked again for a minute (the guesses are used meanwhile).
    let mapboxDown = 0;
    const matrix = async (from, to, traffic) => {
      const out = from.map(() => to.map(() => null));
      const key = driveKey();
      if (!key || !from.length || !to.length || Date.now() - mapboxDown < 60000) return { out, ok: false };
      const L = traffic ? 10 : 25, fc = Math.min(from.length, L - 1), tc = L - fc;
      try {
        for (let i = 0; i < from.length; i += fc) for (let j = 0; j < to.length; j += tc) {
          const F = from.slice(i, i + fc), T = to.slice(j, j + tc);
          const q = 'sources=' + F.map((x, k) => k).join(';') + '&destinations=' + T.map((x, k) => F.length + k).join(';') + '&annotations=duration,distance&access_token=' + encodeURIComponent(key);
          const r = await outside(MB + 'directions-matrix/v1/mapbox/' + (traffic ? 'driving-traffic' : 'driving') + '/' + F.concat(T).map(ptText).join(';') + '?' + q, 12000);
          if (!r || r.code !== 'Ok' || !Array.isArray(r.durations)) throw new Error('no drive times');
          F.forEach((x, a) => T.forEach((y, b) => {
            const d = r.durations[a] && r.durations[a][b], m = r.distances && r.distances[a] && r.distances[a][b];
            if (typeof d === 'number' && isFinite(d)) out[i + a][j + b] = { min: Math.round(d / 60), mi: typeof m === 'number' ? m / 1609.34 : null };
          }));
        }
        return { out, ok: true };
      } catch (e) { mapboxDown = Date.now(); return { out, ok: false }; }
    };

    // ---------- Techs' homes (their ServiceTitan profile), read once ----------
    let homes = null;
    const loadHomes = async () => {
      if (homes) return homes;
      try { homes = new Map((await st.technicians()).map(t => [S(t.id), t])); }
      catch (e) { if (st.isSignedOut(e)) throw e; if (e && e.kind === 'bad') health.flag(TOOL, 'can\'t read the technician list (for where techs live)', '/app/api/data/technicians'); return new Map(); }
      return homes;
    };
    const homeOf = id => { const h = homes && homes.get(S(id)); return h && h.home ? h.home : null; };
    const homeWords = h => 'home' + (h && h.town ? ' (' + tidy(h.town) + ')' : '');

    // ---------- Who does which jobs: the last LEARN_DAYS days of schedules ----------
    // Every appointment of the techs in the board's branches (every team, even if the board is
    // filtered to some), read in four week-long parts, then counted:
    // { key, at, jobs, names: { typeId: name }, all: { typeId: n }, team: { team: { typeId: n } },
    //   tech: { techId: { typeId: n } } }. A two-tech job counts once for each tech. Kept for the
    //   day in this browser (a few kilobytes of counts, no customers).
    const LEARN_KEY = 'stRouterLearned';
    let learned = null, learning = null;
    const learnKey = () => ymd(new Date()) + '|' + board.bus().join(',');
    const learn = async s => {
      const key = learnKey();
      if (learned && learned.key === key) return learned;
      const saved = readSaved(LEARN_KEY, null, null);
      if (saved && saved.v === 1 && saved.key === key && saved.all && saved.team && saved.tech && saved.names) return (learned = saved);
      if (learning && learning.key === key) return learning.p;
      const p = (async () => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        // Every tech and their team in the board's branches (the board's own list, without its team filter).
        const res = await st.getJSON('/dispatch-center/technicians/resources', 30000, { page: 1, pageSize: 100000, businessUnitIds: board.bus(), skillIds: [], teamIds: [], workstreamIds: [], shiftTypes: [],
          technicianIds: [], orderBy: ['Team', 'Technician'], includeSkills: false, applyTeamsManagement: true, includeLicenseTypes: false, startDate: ymd(today), endDate: ymd(addDays(today, 1)) }).catch(e => { if (st.isSignedOut(e)) throw e; return null; });
        const techs = res && Array.isArray(res.items) && res.items.length ? res.items.filter(t => t && t.id != null).map(t => ({ id: S(t.id), team: norm(t.teamName) })) : s.techs;
        const ids = techs.map(t => Number(t.id)).filter(n => isFinite(n));
        const teamOf = new Map(techs.map(t => [S(t.id), t.team || '']));
        const parts = [0, 1, 2, 3].map(i => [addDays(today, -7 * (i + 1)), addDays(today, -7 * i)]);
        const got = ids.length ? await Promise.all(parts.map(([a, b]) => st.getJSON('/dispatch-center/daily-assignments', 45000, { technicianIds: ids, startDate: ymd(a), endDate: ymd(b), page: 1, pageSize: ids.length, fields: '', showOnHoldJobs: false }))) : [];
        const L = { v: 1, key, at: Date.now(), jobs: 0, names: {}, all: {}, team: {}, tech: {} };
        const seen = new Set(), start = addDays(today, -LEARN_DAYS);
        got.forEach(sch => {
          if (!sch || !Array.isArray(sch.items)) { health.flag(TOOL, 'can\'t read the last 4 weeks of schedules', '/dispatch-center/daily-assignments'); throw Object.assign(new Error('the last 4 weeks of schedules came back in a shape the Toolbox doesn\'t know'), { kind: 'bad' }); }
          sch.items.forEach(it => (it && Array.isArray(it.technicianSchedule) ? it.technicianSchedule : []).forEach(d => (d && Array.isArray(d.assignments) ? d.assignments : []).forEach(a => {
            if (!a || a.jobTypeId == null || a.appointmentId == null || board.isCanceled(a.appointmentStatus)) return;
            const at = toDate(a.appointmentStart);
            if (at && (at < start || at >= today)) return;
            const tid = S(it.technicianId), k = a.appointmentId + '|' + tid;
            if (seen.has(k)) return;
            seen.add(k);
            const ty = S(a.jobTypeId), tm = teamOf.get(tid) || '';
            if (!L.names[ty]) L.names[ty] = norm(a.jobTypeName);
            L.all[ty] = (L.all[ty] || 0) + 1;
            (L.team[tm] = L.team[tm] || {})[ty] = (L.team[tm][ty] || 0) + 1;
            (L.tech[tid] = L.tech[tid] || {})[ty] = (L.tech[tid][ty] || 0) + 1;
          })));
        });
        L.jobs = seen.size;
        health.clear(TOOL);
        set(LEARN_KEY, JSON.stringify(L));
        return (learned = L);
      })();
      learning = { key, p };
      try { return await p; } finally { if (learning && learning.p === p) learning = null; }
    };
    // Does a kind of job suit this tech? { tier, text, by }:
    //   good:    they did 2 or more of that job type, or their department did 3 or more
    //   family:  a job type too rare to go by (fewer than RARE of it), but their department does a
    //            good share of the jobs whose names start the same way ("Quote - Lead Turn Over")
    //   no:      other departments do these (by: the one that does the most)
    //   unknown: nothing to go by (shown with ⚠️)
    const RARE = 5;
    const SPLIT = /\s*-\s+|\s+-\s*/;
    const segs = name => norm(name).split(SPLIT).map(norm).filter(Boolean);
    const topTeam = (L, types) => {
      let best = '', n = 0;
      Object.keys(L.team).forEach(tm => { const c = types.reduce((t, ty) => t + ((L.team[tm] || {})[ty] || 0), 0); if (c > n) { n = c; best = tm; } });
      return best;
    };
    const fitOf = (L, tech, typeId, typeName) => {
      const ty = S(typeId), team = tech.team || '';
      const mine = (L.tech[S(tech.id)] || {})[ty] || 0, tm = (L.team[team] || {})[ty] || 0, all = L.all[ty] || 0;
      const first = board.firstName(tech.name) || tech.name;
      if (mine >= 2) return { tier: 'good', text: first + ' did ' + mine + ' of these in the last 4 weeks' };
      if (tm >= 3) return { tier: 'good', text: (team || 'Their department') + ' did ' + tm + ' of these in the last 4 weeks' };
      if (all >= RARE) return { tier: 'no', by: topTeam(L, [ty]) };
      // A rare job type: the jobs whose names start the same way, longest start first (at least two
      // parts: "Quote - Generator", never just "Quote").
      const name = typeName || L.names[ty] || '', mineSegs = segs(name).map(x => x.toLowerCase());
      const family = n => Object.keys(L.all).filter(t => { const g = segs(L.names[t]).map(x => x.toLowerCase()); return g.length >= n && g.slice(0, n).join(' - ') === mineSegs.slice(0, n).join(' - '); });
      for (let n = mineSegs.length - 1; n >= 2; n--) {
        const types = family(n), fa = types.reduce((t, x) => t + L.all[x], 0), ft = types.reduce((t, x) => t + ((L.team[team] || {})[x] || 0), 0);
        if (fa < RARE) continue;
        const words = segs(name).slice(0, n).join(' - ');
        return ft >= 3 && ft / fa >= 0.2 ? { tier: 'family', text: (team || 'Their department') + ' did ' + ft + ' "' + words + '" jobs in the last 4 weeks (this exact type is rare)' } : { tier: 'no', by: topTeam(L, types) };
      }
      // Nothing that close: the department word ("Plumbing", "Install"…) can still say it's another department's.
      if (mineSegs.length) {
        const types = family(1), fa = types.reduce((t, x) => t + L.all[x], 0), ft = types.reduce((t, x) => t + ((L.team[team] || {})[x] || 0), 0);
        if (fa >= 20 && ft / fa < 0.05) return { tier: 'no', by: topTeam(L, types) };
      }
      return { tier: 'unknown', text: 'No recent jobs like it to go by. Check it\'s one for them.' };
    };

    // ---------- The jobs to fill a spot with: the Unassigned list (the day and the next 14) and the Hold list ----------
    // A job from either list: { apptId, jobId, customer, customerId, phone, typeId, type, priority,
    // start, end, dur (minutes), created, pt ({ lat, lon } or null), zip, city, tags, source ('ua' or
    // 'hold'), day (the Unassigned list's day) }, or null (canceled, or Unassigned with a tech on it).
    const candOf = (x, source, day) => {
      if (!x || x.Id == null || x.JobId == null) return null;
      const jobId = S(x.JobId);
      if (!/^\d+$/.test(jobId)) return null;
      if (x.AppointmentStatus === 5 || board.isCanceled(x.AppointmentStatus) || board.isCanceled(x.Status) || board.isCanceled(x.JobStatus)) return null;
      if (source === 'ua' && Array.isArray(x.Technicians) && x.Technicians.length) return null;
      const s0 = toDate(x.Start), e0 = toDate(x.End);
      if (source === 'ua' && s0 && day && !board.sameDay(s0, day)) return null;
      const secs = Number(x.Duration);
      const dur = secs > 0 ? secs / 60 : s0 && e0 && e0 > s0 ? (e0 - s0) / 60000 : 60;
      // The job's map point (seen Oct 29 2026 in Latitude / Longitude; JobLatitude / JobLongitude empty).
      const num = v => (typeof v === 'number' && isFinite(v) && v !== 0 ? v : null);
      const lat = num(x.JobLatitude) != null ? num(x.JobLatitude) : num(x.Latitude), lon = num(x.JobLongitude) != null ? num(x.JobLongitude) : num(x.Longitude);
      return { apptId: S(x.Id), jobId, customer: norm(x.Customer), customerId: x.CustomerId || null, phone: last10(x.CustomerPhone),
        typeId: x.TypeId != null ? S(x.TypeId) : '', type: norm(x.Type), priority: norm(x.Priority), start: s0, end: e0,
        dur: Math.max(15, Math.min(dur, 12 * 60)), created: toDate(x.CreatedOn), pt: lat != null && lon != null && okPt([lat, lon]) ? { lat, lon } : null,
        zip: zip5(x.Zip), city: tidy(x.City), tags: (Array.isArray(x.Tags) ? x.Tags : []).map(board.tagOf).filter(Boolean), source, day: day || null };
    };
    // Read at most once a minute. { rows, notes (what couldn't be read) } or null if stopped.
    let uaCache = null, holdCache = null;
    const candidates = async (s, wantUA, wantHold, stale) => {
      const bus = board.bus(), notes = [];
      let rows = [];
      if (wantUA) {
        const key = ymd(s.day) + '|' + bus.join(',');
        if (!(uaCache && uaCache.key === key && Date.now() - uaCache.at < 60000)) {
          const days = Array.from({ length: UA_DAYS }, (x, i) => addDays(s.day, i));
          const got = await st.pool(days, 4, d => st.getJobs('Unassigned', board.isoT(d), bus), null, { stop: stale });
          if (got.stopped || stale()) return null;
          if (got.halted) throw got.haltError;
          const list = [], missed = [];
          got.forEach((r, i) => {
            if (!Array.isArray(r)) {
              if (r && r.error && r.error.kind === 'bad') health.flag(TOOL, 'can\'t read the Unassigned list', '/Dispatch/GetJobs');
              missed.push(dayText(days[i]));
              return;
            }
            r.forEach(x => { const c = candOf(x, 'ua', days[i]); if (c) list.push(c); });
          });
          uaCache = { key, at: Date.now(), rows: list, missed };
        }
        if (uaCache.missed.length) notes.push('⚠️ Couldn\'t read the Unassigned list for ' + uaCache.missed.join(', ') + '.');
        rows = rows.concat(uaCache.rows);
      }
      if (wantHold) {
        const key = bus.join(',');
        if (!(holdCache && holdCache.key === key && Date.now() - holdCache.at < 60000)) {
          let raw = null;
          try { raw = await st.getJobs('Hold', board.isoT(s.day), bus); }
          catch (e) {
            if (st.isSignedOut(e)) throw e;
            if (e && e.kind === 'bad') health.flag(TOOL, 'can\'t read the Hold list', '/Dispatch/GetJobs');
            notes.push('⚠️ Couldn\'t read the Hold list (' + errText(e) + ').');
          }
          if (stale()) return null;
          if (raw) holdCache = { key, at: Date.now(), rows: raw.map(x => candOf(x, 'hold', null)).filter(Boolean) };
        }
        if (holdCache && holdCache.key === key) rows = rows.concat(holdCache.rows);
      }
      // One entry per appointment (one on both lists stays as Unassigned).
      const seen = new Set();
      rows = rows.filter(c => !seen.has(c.apptId) && seen.add(c.apptId));
      return { rows, notes };
    };

    // ---------- A tech's day and its open time ----------
    // { start, end (their shift, or 8 AM–5 PM), guessed (no shift on the board), off (time off all
    // day), offIgnored (time off at the same time as their jobs, not counted), jobs (in time order),
    // events (how many other events), gaps: [{ start, end, kind, prev,
    // next }] }. kind: 'first' (before their first job), 'mid' (between jobs), 'last' (after their
    // last job) or 'open' (no jobs that day). Today, open time starts from now (to the next quarter hour).
    const KINDS = { first: '🌅 First thing', mid: '🕛 Mid-day', last: '🌇 End of day', open: '📭 Open all day' };
    const dayOf = (s, techId) => {
      const at = h => { const d = new Date(s.day); d.setHours(h, 0, 0, 0); return d; };
      const shifts = s.shifts && s.shifts.get(S(techId)) || [];
      const work = shifts.filter(x => !x.off);
      const start = work.length ? new Date(Math.min.apply(null, work.map(x => +x.start))) : at(8);
      const end = work.length ? new Date(Math.max.apply(null, work.map(x => +x.end))) : at(17);
      const jobs = (s.byTech.get(S(techId)) || []).filter(a => board.live(a) && a.start && a.end).sort((a, b) => a.start - b.start);
      const events = s.events && s.events.get(S(techId)) || [];
      // Time off on the board counts, unless it's at the same time as one of their jobs (seen Oct 29
      // 2026: time off from 7 AM to 7 PM on days full of jobs). Then it's left out, and the day says so.
      const offs = shifts.filter(x => x.off && !jobs.some(j => overlap(x, j))), offIgnored = shifts.some(x => x.off && jobs.some(j => overlap(x, j)));
      const busy = jobs.map(a => ({ start: a.start, end: a.end })).concat(events, offs).sort((a, b) => a.start - b.start);
      const off = offs.some(x => x.start <= start && x.end >= end);
      const now = new Date(), cut = board.sameDay(s.day, now) ? new Date(Math.ceil(now / 900000) * 900000) : null;
      const raw = [];
      let cursor = start;
      busy.forEach(b => {
        if (b.end <= cursor) return;
        if (b.start > cursor) raw.push([cursor, b.start < end ? b.start : end]);
        if (b.end > cursor) cursor = b.end;
      });
      if (cursor < end) raw.push([cursor, end]);
      const gaps = [];
      raw.forEach(([a, b]) => {
        if (cut && a < cut) a = cut;
        if (a >= end || (b - a) / 60000 < MIN_GAP) return;
        const before = jobs.filter(j => j.end <= a), after = jobs.filter(j => j.start >= b);
        const prev = before.sort((x, y) => y.end - x.end)[0] || null, next = after[0] || null;
        gaps.push({ start: a, end: b, prev, next, kind: !jobs.length ? 'open' : !before.length ? 'first' : !after.length ? 'last' : 'mid' });
      });
      return { start, end, guessed: !work.length, off, offIgnored, jobs, events: events.length, gaps };
    };

    // ---------- Pane ----------
    const wrap = el('div', 'padding:8px 10px 10px;display:grid;gap:8px');
    // The Beta warning, each time the tool is opened.
    const beta = el('div', 'padding:8px 10px;border:1px solid var(--st-amber-l);background:var(--st-amber-s);color:var(--st-amber);border-radius:8px;font-size:12px;line-height:1.4');
    beta.className = 'st-router-beta';
    const betaOk = smallBtn('Got it', () => { beta.style.display = 'none'; fit(); }, 'margin-top:6px;padding:2px 10px;min-height:24px');
    beta.append(el('div', 'font-weight:800;font-size:12.5px;margin-bottom:2px', '🚧 Beta: this tool isn\'t finished yet'),
      el('div', '', 'Parts of it are still being built and its suggestions can be off, so check a job before you call the customer or move it. It only reads: nothing changes unless you take a job to 🔀 Move Jobs and press the button there.'), betaOk);
    const msg = el('div', 'font-size:12px;color:var(--st-ink-2);min-height:16px');
    msg.id = 'st-router-msg';
    const say = t => { msg.textContent = t; };
    let tab = ['near', 'plan'].indexOf(get('stRouterTab')) > -1 ? get('stRouterTab') : 'fill';
    const tabs = el('div', 'display:flex;gap:4px');
    const tabBtn = (val, text) => smallBtn(text, () => { tab = val; set('stRouterTab', val); setPicking(null); showTab(); }, 'flex:1;padding:4px 4px;white-space:nowrap');
    const fillTab = tabBtn('fill', '📞 Fill a spot'), planTab = tabBtn('plan', '🗺️ Plan the day'), nearTab = tabBtn('near', '🔎 Closest');
    tabs.append(fillTab, planTab, nearTab);
    const small = (text, extra) => el('div', 'font-size:11px;color:var(--st-ink-3);' + (extra || ''), text);
    // A line that folds open to show more.
    const fold = (head, body) => {
      const box = el('div', 'font-size:11px;color:var(--st-ink-3)');
      const b = el('button', 'border:none;background:transparent;padding:0;cursor:pointer;font:inherit;color:var(--st-ink-2);text-align:left');
      b.type = 'button';
      const inner = el('div', 'display:none;margin-top:2px;white-space:pre-wrap', body);
      const label = () => { b.textContent = (inner.style.display === 'none' ? '▸ ' : '▾ ') + head; };
      b.onclick = () => { inner.style.display = inner.style.display === 'none' ? 'block' : 'none'; label(); fit(); };
      label();
      box.append(b, inner);
      return box;
    };
    const pill = (label, title, onClick, extra) => { const b = smallBtn(label, onClick, 'padding:2px 7px;min-height:24px;font-size:11.5px;' + (extra || '')); b.title = title; b.addEventListener('mousedown', e => e.preventDefault()); return b; };
    const copyPill = (label, text, title) => {
      const b = pill(label, title || text, async () => { const ok = await copy(text); b.textContent = ok ? '✓ Copied' : label; setTimeout(() => { b.textContent = label; }, 1500); });
      return b;
    };
    const openJob = j => { try { window.open(location.href.split('#')[0] + '#/Job/Index/' + j, '_blank'); } catch (e) {} };
    const setOn = (b, on) => { b.style.background = on ? 'var(--st-blue)' : ''; b.style.color = on ? '#fff' : ''; b.style.borderColor = on ? 'var(--st-blue)' : ''; };

    // ---------- 📞 Fill a spot: the controls ----------
    const fillBox = el('div', 'display:grid;gap:6px');
    const techRow = el('div', 'display:flex;gap:6px;align-items:center');
    const techSel = el('select', 'flex:1;min-width:0;' + FIELD);
    techSel.id = 'st-router-tech';
    const techPick = smallBtn('🖱️', () => setPicking(picking === 'tech' ? null : 'tech'));
    techPick.title = 'Pick the tech by clicking their name on the board';
    techRow.append(techSel, techPick);
    const WHERE = [['any', 'Any time'], ['first', '🌅 First'], ['mid', '🕛 Mid-day'], ['last', '🌇 End']];
    let where = WHERE.some(w => w[0] === get('stRouterWhere')) ? get('stRouterWhere') : 'any';
    const whereRow = el('div', 'display:flex;gap:4px');
    const whereBtns = WHERE.map(([v, text]) => {
      const b = smallBtn(text, () => { where = v; set('stRouterWhere', v); paintWhere(); }, 'flex:1;padding:3px 4px;white-space:nowrap');
      b.setAttribute('data-where', v);
      b.title = v === 'any' ? 'Any open time in their day' : v === 'first' ? 'Before their first job' : v === 'mid' ? 'Between two of their jobs' : 'After their last job';
      whereRow.appendChild(b);
      return b;
    });
    const paintWhere = () => whereBtns.forEach(b => setOn(b, b.getAttribute('data-where') === where));
    const lookRow = el('div', 'display:flex;gap:12px;flex-wrap:wrap;font-size:12px;align-items:center');
    lookRow.appendChild(el('span', 'font-weight:600', 'Look in:'));
    const tick = (id, text, key, title) => {
      const l = el('label', 'display:flex;gap:5px;align-items:center;cursor:pointer');
      l.title = title;
      const c = el('input'); c.type = 'checkbox'; c.id = id; c.checked = get(key) !== '0';
      c.onchange = () => set(key, c.checked ? '1' : '0');
      l.append(c, document.createTextNode(text));
      lookRow.appendChild(l);
      return c;
    };
    const uaBox = tick('st-router-ua', 'Unassigned', 'stRouterUA', 'The Unassigned list for the day the board shows and the next 14 days (your board\'s branches)');
    const holdBox = tick('st-router-hold', 'Holds', 'stRouterHold', 'Every job on hold (your board\'s branches)');
    const fillBtn = smallBtn('🔍 Find jobs for their open time', () => fill(), PRIMARY + 'padding:7px 9px;font-size:13px');
    fillBtn.id = 'st-router-find';
    const fillOut = el('div', 'display:none;gap:7px');
    fillOut.id = 'st-router-fill-out';
    fillBox.append(techRow, whereRow, lookRow, fillBtn, fillOut);
    // The techs on the board, by team (filled again only when the board's day or filter changes).
    let techsKey = '';
    const fillTechs = force => {
      const s = board.latest();
      const k = s ? s.key + '|' + s.techs.length : onBoard() ? 'loading' : 'off';
      if (!force && k === techsKey) return;
      techsKey = k;
      const keep = techSel.value || get('stRouterTech') || '';
      techSel.textContent = '';
      const top = el('option', '', s ? 'Pick a tech…' : onBoard() ? 'Loading the board…' : 'Open the Dispatch board first');
      top.value = '';
      techSel.appendChild(top);
      if (s) {
        const groups = new Map();
        s.techs.forEach(t => { const g = t.team || 'Other'; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(t); });
        groups.forEach((list, team) => {
          const g = el('optgroup'); g.label = team;
          list.forEach(t => { const o = el('option', '', t.name); o.value = t.id; g.appendChild(o); });
          techSel.appendChild(g);
        });
      }
      if (Array.from(techSel.options).some(o => o.value === keep)) techSel.value = keep;
    };
    techSel.onchange = () => { set('stRouterTech', techSel.value); fillOut.style.display = 'none'; paint(); };

    // ---------- 🔎 Closest techs: the controls ----------
    const nearBox = el('div', 'display:none;gap:6px');
    const nearRow = el('div', 'display:flex;gap:5px');
    const typed = el('input', 'flex:1;min-width:0;' + FIELD);
    typed.type = 'text'; typed.id = 'st-router-input'; typed.placeholder = 'Zip code or job #';
    typed.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); findTyped(); } };
    const jobPick = smallBtn('🖱️', () => setPicking(picking === 'job' ? null : 'job'));
    jobPick.title = 'Pick a job: click this, then a job on the board or a row in the Jobs Tray below it';
    const nearBtn = smallBtn('Find', () => findTyped(), PRIMARY);
    nearBtn.id = 'st-router-near-find';
    nearRow.append(typed, jobPick, nearBtn);
    const nearOpts = el('div', 'display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px');
    const fromSel = el('select', 'flex:1;min-width:0;' + FIELD + 'padding:3px 6px');
    fromSel.id = 'st-router-from';
    [['now', 'From where they are now'], ['home', 'From their home']].forEach(([v, t]) => { const o = el('option', '', t); o.value = v; fromSel.appendChild(o); });
    fromSel.value = get('stNearFrom') === 'home' ? 'home' : 'now';
    const teamSel = el('select', FULL + FIELD + 'padding:3px 6px');
    teamSel.id = 'st-router-team';
    const fieldLab = el('label', 'flex:none;display:flex;gap:5px;align-items:center;cursor:pointer');
    const fieldBox = el('input'); fieldBox.type = 'checkbox'; fieldBox.id = 'st-router-field';
    fieldBox.checked = get('stNearField') !== '0';
    fieldLab.title = 'Only ServiceTitan\'s managed technicians (field techs), so office staff on the board are left out';
    fieldLab.append(fieldBox, document.createTextNode('Field techs only'));
    nearOpts.append(fromSel, fieldLab);
    const nearOut = el('div', 'display:none;gap:5px');
    nearOut.id = 'st-router-near-out';
    nearBox.append(nearRow, nearOpts, teamSel, nearOut);
    const fillTeams = s => {
      const keep = teamSel.value || get('stNearTeam') || '';
      teamSel.textContent = '';
      const any = el('option', '', 'Any department'); any.value = ''; teamSel.appendChild(any);
      (s ? s.teams : []).forEach(n => { const o = el('option', '', n); o.value = n; teamSel.appendChild(o); });
      teamSel.value = Array.from(teamSel.options).some(o => o.value === keep) ? keep : '';
    };
    fromSel.onchange = () => { set('stNearFrom', fromSel.value); if (lastNear) near(lastNear); };
    teamSel.onchange = () => { set('stNearTeam', teamSel.value); if (lastNear) near(lastNear); };
    fieldBox.onchange = () => { set('stNearField', fieldBox.checked ? '1' : '0'); if (lastNear) near(lastNear); };

    // ---------- 🗺️ Plan the day: the controls ----------
    const planBox = el('div', 'display:none;gap:6px');
    const planOpts = el('div', 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px');
    const graceSel = el('select', FIELD + 'padding:3px 6px');
    graceSel.id = 'st-plan-grace';
    graceSel.title = 'How late an arrival can be and still count as fine (8-12s, 12-5s). Later than this counts heavily against a plan. 5-9s always count lightly.';
    [[30, '30 min'], [60, '1 hr'], [90, '1 hr 30 min'], [120, '2 hr']].forEach(([v, t]) => { const o = el('option', '', 'Late is OK up to ' + t); o.value = String(v); graceSel.appendChild(o); });
    graceSel.value = ['30', '60', '90', '120'].indexOf(get('stPlanGrace')) > -1 ? get('stPlanGrace') : '60';
    graceSel.onchange = () => set('stPlanGrace', graceSel.value);
    const planFieldLab = el('label', 'display:flex;gap:5px;align-items:center;cursor:pointer');
    const planField = el('input'); planField.type = 'checkbox'; planField.id = 'st-plan-field';
    planField.checked = get('stNearField') !== '0';
    planField.onchange = () => { set('stNearField', planField.checked ? '1' : '0'); fieldBox.checked = planField.checked; };
    planFieldLab.title = 'Only ServiceTitan\'s managed technicians (field techs), so office staff on the board get no jobs';
    planFieldLab.append(planField, document.createTextNode('Field techs only'));
    planOpts.append(graceSel, planFieldLab);
    // Departments: the teams whose techs can be given jobs. The ones left out are saved in this
    // browser, so a new department is always in until it's taken out.
    const SKIP_TEAMS = 'stPlanSkipTeams';
    const skipTeams = new Set((Array.isArray(readSaved(SKIP_TEAMS, [], [])) ? readSaved(SKIP_TEAMS, [], []) : []).filter(x => typeof x === 'string'));
    const teamHead = el('button', FULL + 'padding:3px 6px;border:1px solid var(--st-line);border-radius:6px;background:var(--st-bg);color:var(--st-ink-2);font:inherit;font-size:12px;text-align:left;cursor:pointer');
    teamHead.type = 'button'; teamHead.id = 'st-plan-teams';
    const teamBody = el('div', 'display:none;padding:5px 7px;border:1px solid var(--st-line);border-radius:6px;background:var(--st-soft);max-height:220px;overflow:auto;font-size:12px');
    const teamLabel = () => {
      const s = board.latest(), all = s ? s.teams : [], out = all.filter(t => skipTeams.has(t)).length;
      teamHead.textContent = 'Departments: ' + (!out ? 'all' : (all.length - out) + ' of ' + all.length) + (teamBody.style.display === 'none' ? '  ▸' : '  ▾');
    };
    const renderTeams = () => {
      teamBody.textContent = '';
      const s = board.latest();
      if (!s) { teamBody.appendChild(el('div', 'color:var(--st-ink-3)', 'Loading the board…')); return; }
      const save = () => { set(SKIP_TEAMS, JSON.stringify(Array.from(skipTeams))); teamLabel(); };
      const top = el('div', 'display:flex;gap:5px;margin-bottom:3px');
      top.append(smallBtn('All', () => { s.teams.forEach(t => skipTeams.delete(t)); save(); renderTeams(); }, 'padding:1px 8px;min-height:22px'),
        smallBtn('None', () => { s.teams.forEach(t => skipTeams.add(t)); save(); renderTeams(); }, 'padding:1px 8px;min-height:22px'));
      teamBody.appendChild(top);
      s.teams.forEach(team => {
        const l = el('label', 'display:flex;gap:6px;align-items:center;cursor:pointer');
        const c = el('input'); c.type = 'checkbox'; c.checked = !skipTeams.has(team); c.setAttribute('data-team', team);
        c.onchange = () => { if (c.checked) skipTeams.delete(team); else skipTeams.add(team); save(); };
        l.append(c, document.createTextNode(team + ' (' + plural(s.techs.filter(t => t.team === team).length, 'tech') + ')'));
        teamBody.appendChild(l);
      });
    };
    teamHead.onclick = () => { teamBody.style.display = teamBody.style.display === 'none' ? 'block' : 'none'; renderTeams(); teamLabel(); fit(); };
    const planBtn = smallBtn('🗺️ Plan the Unassigned list', () => planDay(), PRIMARY + 'padding:7px 9px;font-size:13px');
    planBtn.id = 'st-plan-go';
    const planOut = el('div', 'display:none;gap:7px');
    planOut.id = 'st-plan-out';
    planBox.append(planOpts, teamHead, teamBody, planBtn, planOut);

    // ---------- ⚙️ Drive times (your own Mapbox key) ----------
    const keyHead = el('button', FULL + 'padding:3px 6px;border:1px solid var(--st-line);border-radius:6px;background:var(--st-soft);color:var(--st-ink-2);font:inherit;font-size:11.5px;text-align:left;cursor:pointer');
    keyHead.type = 'button';
    const keyBox = el('div', 'display:none;gap:5px;padding:7px;border:1px solid var(--st-line);border-radius:6px;background:var(--st-soft);font-size:12px');
    const keyInput = el('input', FULL + FIELD);
    keyInput.type = 'text'; keyInput.placeholder = 'pk.…'; keyInput.autocomplete = 'off'; keyInput.spellcheck = false;
    const keyMsg = el('div', 'min-height:14px;color:var(--st-ink-2)');
    const keyLabel = () => { keyHead.textContent = '⚙️ Drive times: ' + (ownKey() ? 'your own Mapbox key' : 'built-in Mapbox key') + (keyBox.style.display === 'none' ? '  ▸' : '  ▾'); };
    keyHead.onclick = () => { keyBox.style.display = keyBox.style.display === 'none' ? 'grid' : 'none'; keyInput.value = ownKey(); keyMsg.textContent = ''; keyLabel(); fit(); };
    const saveKey = async () => {
      const k = norm(keyInput.value);
      if (/^sk\./.test(k)) { keyMsg.textContent = '⚠️ That\'s a secret key (sk.). Use a public key (pk.) that only works from go.servicetitan.com.'; return; }
      if (!/^pk\.[\w-]+\.[\w-]+$/.test(k)) { keyMsg.textContent = '⚠️ That doesn\'t look like a Mapbox public key (pk.…).'; return; }
      keyMsg.textContent = 'Checking it with Mapbox…';
      let ok = false;
      try { const r = await outside(MB + 'directions-matrix/v1/mapbox/driving/-89.87,31.96;-89.73,31.87?sources=0&destinations=1&access_token=' + encodeURIComponent(k), 10000); ok = !!(r && r.code === 'Ok'); } catch (e) { ok = false; }
      if (!ok) { keyMsg.textContent = '⚠️ Mapbox didn\'t accept it from this page (check the key and its URL restriction). Not saved.'; return; }
      set(KEY, k); mapboxDown = 0;
      keyMsg.textContent = '✓ Saved. Drive times use this key in this browser.';
      keyLabel();
    };
    const keyBtns = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    keyBtns.append(smallBtn('Save', () => saveKey(), PRIMARY), smallBtn('Use the built-in key', () => { try { localStorage.removeItem(KEY); } catch (e) {} keyInput.value = ''; mapboxDown = 0; keyMsg.textContent = 'Using the built-in key.'; keyLabel(); }));
    keyBox.append(el('div', '', 'Drive times come from Mapbox with the Toolbox\'s built-in key. To use a different one in this browser, paste a Mapbox public key (it starts with pk.), set in Mapbox to only work from go.servicetitan.com.'), keyInput, keyBtns, keyMsg);
    keyLabel();

    const navRow = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
    navRow.append(smallBtn('← Menu', () => showView('menu')));
    wrap.append(beta, tabs, msg, fillBox, planBox, nearBox, keyHead, keyBox, navRow);
    routerPane.appendChild(wrap);
    const showTab = () => {
      setOn(fillTab, tab === 'fill'); setOn(planTab, tab === 'plan'); setOn(nearTab, tab === 'near');
      fillBox.style.display = tab === 'fill' ? 'grid' : 'none';
      planBox.style.display = tab === 'plan' ? 'grid' : 'none';
      nearBox.style.display = tab === 'near' ? 'grid' : 'none';
      teamLabel();
      planBtn.textContent = searching ? planBtn.textContent : '🗺️ Plan the Unassigned list' + (board.day() ? ' for ' + dayText(board.day()) : '');
      if (!onBoard()) say(board.need());
      else if (tab === 'fill') say(fillOut.style.display === 'none' ? 'Pick a tech, then 🔍 Find. It reads only; nothing changes.' : msg.textContent);
      else if (tab === 'plan') say(planOut.style.display === 'none' ? 'Plans a tech and a route for every Unassigned job on the day the board shows. Nothing changes until you send it to Move Jobs and press Assign there.' : msg.textContent);
      else say(nearOut.style.display === 'none' ? 'Type a zip code or job number, or press 🖱️ and click a job. It reads only; nothing changes.' : msg.textContent);
      paint(); fit();
    };
    const fit = () => {
      if (routerPane.style.display === 'none') return;
      const pr = panel.getBoundingClientRect(), others = pr.height - routerPane.getBoundingClientRect().height;
      const top = panel.style.top && panel.style.top !== 'auto' ? Math.max(0, pr.top) : 16;
      routerPane.style.maxHeight = Math.max(220, innerHeight - top - others - 16) + 'px';
    };
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    resized.push(fit);
    let searching = false;
    const setBusy = on => {
      searching = on;
      [[fillBtn, '🔍 Find jobs for their open time', 'Finding…'], [nearBtn, 'Find', 'Finding…'], [planBtn, '🗺️ Plan the Unassigned list' + (board.day() ? ' for ' + dayText(board.day()) : ''), 'Planning…']].forEach(([b, idle, busyText]) => { b.disabled = on; b.textContent = on ? busyText : idle; b.classList.toggle('st-busy', on); });
    };

    // ---------- Picking a tech or a job on the board ----------
    let picking = null, alive = true;
    const shown = () => routerPane.style.display !== 'none';
    const style = el('style');
    const paint = () => {
      let css = '';
      if (shown() && tab === 'fill' && techSel.value) css = board.techsCss([techSel.value], '#0265dc', 'rgba(2,101,220,.12)');
      if (shown() && tab === 'near' && lastNear && lastNear.jobId) css = board.jobsCss([lastNear.jobId], '#00796b', 'rgba(0,121,107,.22)');
      style.textContent = css;
      if (css) board.mount(style);
    };
    const setPicking = what => {
      picking = what && onBoard() ? what : null;
      if (what && !onBoard()) say(board.need());
      setOn(techPick, picking === 'tech'); setOn(jobPick, picking === 'job');
      if (picking === 'tech') say('Click a tech\'s name on the board.');
      if (picking === 'job') say('Click a job on the board, or a row in the Jobs Tray below it.');
    };
    const onClick = async e => {
      if (!picking || !onBoard() || !shown() || panel.contains(e.target)) return;
      if (picking === 'tech') {
        const id = board.clickedTech(e);
        if (!id) return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        setPicking(null);
        fillTechs(true);
        if (!Array.from(techSel.options).some(o => o.value === id)) { say('⚠️ Couldn\'t find that tech in the board\'s list yet. Try again in a moment.'); return; }
        techSel.value = id; set('stRouterTech', id); paint();
        fill();
        return;
      }
      const hit = board.clickedJob(e);
      if (!hit) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      setPicking(null);
      let j = hit.jobId;
      if (!j && hit.apptId) { try { await board.load({ fresh: true }); } catch (err) {} j = board.jobOfAppt(hit.apptId); }
      if (!j) { say('⚠️ Couldn\'t tell which job that is. Click it again in a moment.'); return; }
      typed.value = j;
      near({ jobId: j });
    };
    window.addEventListener('click', onClick, true);
    pickers.push({ active: () => !!picking && shown(), hit: e => picking === 'tech' ? !!board.clickedTech(e) : !!board.clickedJob(e) });

    // ---------- 📞 Fill a spot ----------
    let runId = 0, lastFill = null;
    const fill = async () => {
      const run = ++runId;
      const stale = () => run !== runId || !alive;
      setPicking(null);
      fillOut.style.display = 'none'; fillOut.textContent = '';
      lastFill = null;
      if (!onBoard()) return say(board.need());
      const techId = techSel.value;
      if (!techId) return say('Pick a tech first: from the list, or 🖱️ and their name on the board.');
      if (!uaBox.checked && !holdBox.checked) return say('Tick Unassigned, Holds or both, for where to look.');
      setBusy(true);
      try {
        say('Reading their day…');
        const s = await board.load({ fresh: true });   // their day as it is right now
        if (stale()) return;
        const t = s.techById.get(S(techId));
        if (!t) return say('⚠️ That tech isn\'t on the board for ' + dayText(s.day) + ' (its filter may hide them).');
        await loadHomes();
        if (stale()) return;
        if (!learned || learned.key !== learnKey()) say('Learning which jobs each department does, from the last 4 weeks of schedules…');
        let L;
        try { L = await learn(s); }
        catch (e) { if (st.isSignedOut(e) || stale()) throw e; return say('⚠️ Couldn\'t read the last 4 weeks of schedules (' + errText(e) + '), so it can\'t tell which jobs suit them. Try again in a minute.'); }
        if (stale()) return;
        const D = dayOf(s, t.id);
        if (D.off) return renderFill({ s, t, D, gaps: [], L, notes: [], left: null });
        const want = D.gaps.filter(g => where === 'any' || g.kind === where || g.kind === 'open');
        if (!want.length) return renderFill({ s, t, D, gaps: [], L, notes: [], left: null, noneWhere: D.gaps.length > 0 });
        say('Looking through ' + [uaBox.checked ? 'the Unassigned list (' + dayText(s.day) + ' and the next 14 days)' : '', holdBox.checked ? 'the Hold list' : ''].filter(Boolean).join(' and ') + '…');
        const C = await candidates(s, uaBox.checked, holdBox.checked, stale);
        if (!C || stale()) return;
        // The right kind of job, and somewhere to measure to.
        const onDay = new Set(board.techJobs(t.id)), memo = new Map(), left = { other: 0, otherBy: new Map(), place: 0, phone: 0 };
        const fitFor = c => { const k = c.typeId + '|' + c.type; if (!memo.has(k)) memo.set(k, fitOf(L, t, c.typeId, c.type)); return memo.get(k); };
        const pool = [];
        C.rows.forEach(c => {
          if (onDay.has(c.jobId)) return;
          // A phone-call-only job isn't a visit to fit into their day.
          if (PHONE_ONLY.test(c.type)) { left.phone++; return; }
          const f = fitFor(c);
          if (f.tier === 'no') { left.other++; const by = f.by || 'other departments'; left.otherBy.set(by, (left.otherBy.get(by) || 0) + 1); return; }
          pool.push(Object.assign({}, c, { fit: f }));
        });
        say('Measuring the driving for ' + plural(pool.length, 'job') + ' that suit ' + t.name + '…');
        const { points, error: zipError } = await zipPoints(D.jobs.map(a => zip5(a.zip)).concat(pool.filter(c => !c.pt).map(c => c.zip)));
        if (stale()) return;
        pool.forEach(c => { if (!c.pt && c.zip && points.get(c.zip)) c.pt = points.get(c.zip); });
        const placed = pool.filter(c => c.pt);
        left.place = pool.length - placed.length;
        const home = homeOf(t.id), homePt = home ? { lat: home.lat, lon: home.lon } : null;
        const jobPt = a => (a && points.get(zip5(a.zip))) || null;
        const jobWords = a => 'their ' + span(a.start, a.end) + ' job' + (a.city ? ' in ' + tidy(a.city) : '');
        // Sales: about how much they drive that day now (home, their jobs in time order, home).
        const sales = isSales(t.team);
        let dayDrive = 0;
        if (sales) { const route = [homePt].concat(D.jobs.map(jobPt), [homePt]).filter(Boolean); for (let i = 1; i < route.length; i++) dayDrive += guess(route[i - 1], route[i]); }
        const today = board.sameDay(s.day, new Date());
        const fitsAsIs = (c, g) => c.source === 'ua' && c.start && c.end && c.start >= g.start && c.end <= g.end;
        const bonus = (c, g) => {
          let b = PRIORITY[c.priority.toLowerCase()] || 0;
          if (c.fit.tier === 'family') b += 8; else if (c.fit.tier === 'unknown') b += 30;
          if (c.source === 'ua' && c.day && board.sameDay(c.day, s.day)) b -= fitsAsIs(c, g) ? 30 : 20;
          if (c.created) b -= Math.min(15, Math.max(0, (Date.now() - c.created) / (7 * 86400000)) * 2);
          return b;
        };
        const gaps = [];
        for (const g0 of want) {
          const g = Object.assign({}, g0, { list: [], left: { long: 0, far: 0 } });
          g.len = (g.end - g.start) / 60000;
          g.prevPt = g.prev ? jobPt(g.prev) : homePt;
          g.nextPt = g.next ? jobPt(g.next) : homePt;
          g.prevWords = g.prev ? jobWords(g.prev) : home ? homeWords(home) : '';
          g.nextWords = g.next ? jobWords(g.next) : home ? homeWords(home) : '';
          const base0 = g.prevPt && g.nextPt ? guess(g.prevPt, g.nextPt) : 0;
          // A first pass with straight-line miles; the best few get real drive times.
          const rough = [];
          placed.forEach(c => {
            if (c.dur > g.len + SLACK) { g.left.long++; return; }
            const a = g.prevPt ? guess(g.prevPt, c.pt) : 0, b = g.nextPt ? guess(c.pt, g.nextPt) : 0, extra = a + b - base0;
            if (extra > MAX_DETOUR * 1.6) { g.left.far++; return; }
            rough.push({ c, a, b, extra, score: extra + bonus(c, g) });
          });
          rough.sort((x, y) => x.score - y.score);
          const top = rough.slice(0, ROUTED);
          const from = [g.prevPt, g.nextPt].filter(Boolean), both = !!(g.prevPt && g.nextPt);
          const m = await matrix(from, top.map(x => x.c.pt).concat(both ? [g.nextPt] : []), today);
          if (stale()) return;
          const iPrev = g.prevPt ? 0 : -1, iNext = g.nextPt ? (g.prevPt ? 1 : 0) : -1;
          const base = both && m.out[0][top.length] ? m.out[0][top.length].min : base0;
          top.forEach((x, k) => {
            const dp = iPrev > -1 ? m.out[iPrev][k] : null, dn = iNext > -1 ? m.out[iNext][k] : null;
            x.guess = (iPrev > -1 && !dp) || (iNext > -1 && !dn);
            x.a = iPrev > -1 ? (dp ? dp.min : x.a) : 0;
            x.b = iNext > -1 ? (dn ? dn.min : x.b) : 0;
            x.extra = Math.max(0, x.a + x.b - (both ? base : 0));
            const need = x.c.dur + (g.prev ? x.a : 0) + (g.next ? x.b : 0);
            x.need = need;
            if (need > g.len + SLACK) { x.out = 'long'; return; }
            if (x.extra > MAX_DETOUR) { x.out = 'far'; return; }
            x.asIs = fitsAsIs(x.c, g);
            x.salesOver = 0;
            let penalty = 0;
            if (sales) {
              const total = dayDrive + x.extra;
              if (total > SALES_MAX) { x.salesOver = total; penalty = (total - Math.max(SALES_MAX, dayDrive)) * OVER_WEIGHT; }
            }
            x.score = x.extra + bonus(x.c, g) + penalty;
          });
          top.forEach(x => { if (x.out === 'long') g.left.long++; else if (x.out === 'far') g.left.far++; });
          g.list = top.filter(x => !x.out).sort((x, y) => x.score - y.score || x.extra - y.extra).slice(0, MAX);
          g.noDrive = !m.ok && top.length > 0;
          gaps.push(g);
        }
        // Skills: the jobs it suggests need skills the tech has? (The same check Move Jobs makes.) One
        // that doesn't is marked ⚠️ and ranks SKILL_MISS minutes lower.
        const prof = homes && homes.get(S(t.id));
        const skillsOn = (() => { try { return !(window.App && window.App.Data && window.App.Data.EnableSkillsManagement === false); } catch (e) { return true; } })();
        if (skillsOn && prof && Array.isArray(prof.skillIds)) {
          const ids = Array.from(new Set([].concat.apply([], gaps.map(g => g.list.map(x => x.c.jobId)))));
          if (ids.length) say('Checking the skills ' + plural(ids.length, 'job') + ' need…');
          const got = await st.pool(ids, 4, j => st.jobSkills(j), null, { stop: stale });
          if (stale() || got.stopped) return;
          const have = new Set(prof.skillIds.map(String)), need = new Map();
          ids.forEach((j, i) => { if (Array.isArray(got[i])) need.set(j, got[i]); });
          gaps.forEach(g => {
            g.list.forEach(x => {
              const miss = (need.get(x.c.jobId) || []).filter(k => !have.has(String(k.id)));
              x.missing = miss.map(k => k.name || 'skill #' + k.id);
              if (miss.length) x.score += SKILL_MISS;
            });
            g.list.sort((x, y) => x.score - y.score || x.extra - y.extra);
          });
        }
        const notes = C.notes.slice();
        if (zipError) notes.push('⚠️ Some zip codes couldn\'t be looked up: ' + zipError + '.');
        renderFill({ s, t, D, gaps, L, notes, left, sales, dayDrive, home, total: C.rows.length, suited: pool.length });
      } catch (e) {
        if (stale()) return;
        say('⚠️ ' + (st.isSignedOut(e) ? e.message : 'Couldn\'t look for jobs: ' + errText(e)));
      } finally { if (run === runId) setBusy(false); }
    };

    const whenOf = (c, r) => {
      if (c.source === 'hold') return { text: '⏸️ On hold' + (c.start ? ' (it was for ' + dayText(c.start) + ')' : '') + ': call to book it', tone: 'var(--st-amber)' };
      const later = c.day ? Math.round((new Date(c.day.getFullYear(), c.day.getMonth(), c.day.getDate()) - new Date(r.s.day.getFullYear(), r.s.day.getMonth(), r.s.day.getDate())) / 86400000) : 0;
      const t = c.start ? span(c.start, c.end) : '';
      if (later <= 0) return { text: '🗓️ Unassigned ' + (board.sameDay(r.s.day, new Date()) ? 'today' : dayText(r.s.day)) + (t ? ' · ' + t : ''), tone: 'var(--st-green-d)' };
      return { text: '📅 Unassigned ' + dayText(c.day) + (t ? ' · ' + t : '') + ' (' + plural(later, 'day') + ' later): call to move it up', tone: 'var(--st-blue-d)' };
    };
    const waiting = c => {
      if (!c.created) return '';
      const d = Math.floor((Date.now() - c.created) / 86400000);
      return d < 2 ? '' : 'waiting ' + (d < 14 ? d + ' days' : Math.round(d / 7) + ' weeks');
    };
    const driveWords = (x, g) => {
      const t = n => (x.guess ? '~' : '') + mins(n);
      const parts = [];
      if (g.prevPt) parts.push(t(x.a) + ' from ' + g.prevWords);
      if (g.nextPt) parts.push(t(x.b) + ' on to ' + g.nextWords);
      return (parts.length ? '🚗 ' + parts.join(', ') : '🚗 Can\'t measure the driving (nowhere to measure from)') + ' · a ' + mins(x.c.dur) + ' job';
    };
    const card = (x, n, g, r) => {
      const c = x.c, w = whenOf(c, r);
      const box = el('div', 'border:1px solid var(--st-line);border-radius:10px;padding:7px 9px;background:var(--st-bg);font-size:12px;display:grid;gap:2px;color:var(--st-ink)');
      box.className = 'st-router-card';
      box.setAttribute('data-job', c.jobId);
      const top = el('div', 'display:flex;gap:6px;align-items:baseline');
      const nm = el('span', 'font-weight:800;font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;user-select:text', n + '. ' + (c.customer || 'Job #' + c.jobId));
      nm.title = c.customer;
      const ex = el('span', 'font-weight:800;white-space:nowrap;color:' + (x.extra <= 15 ? 'var(--st-green-d)' : 'var(--st-ink)'), (x.guess ? '~' : '') + '+' + mins(x.extra));
      ex.className = 'st-router-extra';
      ex.title = 'Extra driving, compared with going straight from ' + (g.prevWords || 'their day') + (g.nextWords ? ' to ' + g.nextWords : '');
      top.append(nm, ex);
      box.appendChild(top);
      box.appendChild(el('div', 'color:var(--st-ink-2);user-select:text;overflow-wrap:anywhere', '#' + c.jobId + ' · ' + (c.type || 'no job type') + (c.city ? ' · ' + c.city : c.zip ? ' · ' + c.zip : '')));
      box.appendChild(el('div', 'font-weight:700;color:' + w.tone, w.text + (x.asIs ? ' · its time fits ✓' : '')));
      box.appendChild(el('div', 'color:' + (c.fit.tier === 'unknown' ? 'var(--st-amber)' : 'var(--st-green-d)') + (c.fit.tier === 'unknown' ? ';font-weight:600' : ''), (c.fit.tier === 'unknown' ? '⚠️ ' : '✅ ') + c.fit.text));
      box.appendChild(el('div', 'color:var(--st-ink-2)', driveWords(x, g)));
      if (x.missing && x.missing.length) box.appendChild(el('div', 'color:var(--st-amber);font-weight:600', '⚠️ Needs a skill ' + board.firstName(r.t.name) + ' doesn\'t have: ' + x.missing.join(', ')));
      if (x.salesOver) box.appendChild(el('div', 'color:var(--st-amber);font-weight:600', '⚠️ That makes about ' + mins(x.salesOver) + ' of driving that day (the sales goal is under ' + mins(SALES_MAX) + ')'));
      const extras = [/^(urgent|high)$/i.test(c.priority) ? '⭐ ' + c.priority + ' priority' : '', waiting(c)].filter(Boolean);
      if (extras.length || c.tags.length) {
        const meta = el('div', 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:1px');
        if (extras.length) meta.appendChild(el('span', 'font-size:11px;color:var(--st-ink-2)', extras.join(' · ')));
        if (c.tags.length) meta.appendChild(tagChips(c.tags, 3));
        box.appendChild(meta);
      }
      box.appendChild(el('div', 'font-size:13px;font-weight:700;margin-top:2px;user-select:text;color:' + (c.phone ? 'var(--st-ink)' : 'var(--st-ink-3)'), c.phone ? '📞 ' + fmtPhone(c.phone) : 'No phone number on the job'));
      const btns = el('div', 'display:flex;gap:4px;flex-wrap:wrap;margin-top:3px');
      if (c.phone) btns.appendChild(copyPill('📋 Phone', fmtPhone(c.phone)));
      if (c.customer) btns.appendChild(copyPill('📋 Name', c.customer));
      btns.appendChild(pill('🔎 Open job', 'Opens job #' + c.jobId + ' in a new tab', () => openJob(c.jobId)));
      if (c.source === 'ua' && c.day && board.sameDay(c.day, r.s.day)) {
        const mv = pill('➡️ Move Jobs', 'Opens 🔀 Move Jobs with #' + c.jobId + ' and ' + r.t.name + ' filled in. Nothing changes until you review it and press Move.' + (x.asIs ? '' : ' Its time doesn\'t fit this open time yet: change it first.'), () => assign(c.jobId, r.t.id, r.t.name), 'background:#6a1b9a;border-color:#6a1b9a;color:#fff');
        mv.className = 'st-router-assign';
        btns.appendChild(mv);
      }
      box.appendChild(btns);
      return box;
    };
    const gapWords = (g, r) => {
      const a = g.prev ? 'after ' + jobOnly(g.prev) : (r.D.guessed ? 'from 8 AM' : 'from the start of their shift');
      const b = g.next ? 'before ' + jobOnly(g.next) : (r.D.guessed ? 'until 5 PM' : 'until the end of their shift');
      return a + ', ' + b;
    };
    const jobOnly = a => 'their ' + span(a.start, a.end) + ' job' + (a.city ? ' (' + tidy(a.city) + ')' : '');
    const renderFill = r => {
      lastFill = r;
      fillOut.textContent = '';
      const D = r.D, t = r.t;
      const dayBox = el('div', 'padding:7px 9px;border:1px solid var(--st-line);border-radius:8px;background:var(--st-soft);font-size:12px;display:grid;gap:1px');
      dayBox.className = 'st-router-day';
      dayBox.append(el('div', 'font-weight:800;font-size:13px', t.name), el('div', 'color:var(--st-ink-2)', (t.team || 'No team') + ' · ' + dayText(r.s.day)));
      dayBox.appendChild(el('div', '', (D.off ? 'Time off that day' : D.guessed ? 'No shift on the board (8 AM–5 PM used)' : 'Shift ' + span(D.start, D.end)) + ' · ' + plural(D.jobs.length, 'job') +
        (D.jobs.length ? ': ' + D.jobs.map(a => span(a.start, a.end) + (a.city ? ' ' + tidy(a.city) : '')).join(', ') : '') + (D.events ? ' · ' + plural(D.events, 'other event') : '')));
      if (D.offIgnored) dayBox.appendChild(el('div', 'color:var(--st-amber)', '⚠️ Time off on the board at the same time as their jobs isn\'t counted.'));
      if (D.gaps.length) dayBox.appendChild(el('div', 'color:var(--st-ink-2)', 'Open: ' + D.gaps.map(g => KINDS[g.kind].split(' ')[0] + ' ' + span(g.start, g.end)).join(' · ')));
      if (r.sales) dayBox.appendChild(el('div', 'color:var(--st-ink-2)', 'Sales goal: under ' + mins(SALES_MAX) + ' of driving a day. Their day now: about ' + mins(r.dayDrive) + '.'));
      fillOut.appendChild(dayBox);
      if (D.off || !D.gaps.length || !r.gaps.length) {
        const why = D.off ? t.name + ' has time off on ' + dayText(r.s.day) + '.' :
          !D.gaps.length ? 'No open time of ' + MIN_GAP + ' minutes or more in ' + t.name + '\'s day' + (board.sameDay(r.s.day, new Date()) ? ' from now on' : '') + '.' :
          'No open time ' + (where === 'first' ? 'before their first job' : where === 'mid' ? 'between their jobs' : 'after their last job') + '. Try Any time.';
        fillOut.appendChild(el('div', 'font-size:12px;color:var(--st-ink-2)', why));
        fillOut.style.display = 'grid';
        say('Nothing to fill.');
        fit();
        return;
      }
      r.gaps.forEach(g => {
        const sec = el('div', 'display:grid;gap:5px');
        sec.className = 'st-router-gap';
        sec.setAttribute('data-kind', g.kind);
        sec.appendChild(el('div', 'font-weight:800;font-size:12.5px;color:var(--st-ink);margin-top:2px', KINDS[g.kind] + ' · ' + span(g.start, g.end) + ' (' + mins(g.len) + ')'));
        sec.appendChild(small(gapWords(g, r)));
        if (!g.list.length) sec.appendChild(el('div', 'font-size:12px;color:var(--st-ink-2)', 'No jobs fit here.'));
        const showN = g.showAll ? g.list.length : Math.min(SHOW, g.list.length);
        g.list.slice(0, showN).forEach((x, i) => sec.appendChild(card(x, i + 1, g, r)));
        if (g.list.length > SHOW) sec.appendChild(smallBtn(g.showAll ? 'Show fewer' : 'Show more (' + (g.list.length - SHOW) + ')', () => { g.showAll = !g.showAll; renderFill(r); }, 'justify-self:start;padding:2px 8px;min-height:24px'));
        const out = [];
        if (g.left.long) out.push(plural(g.left.long, 'job') + ' too long for this time');
        if (g.left.far) out.push(plural(g.left.far, 'job') + ' more than ' + mins(MAX_DETOUR) + ' out of the way');
        if (out.length) sec.appendChild(small('Left out here: ' + out.join(', ') + '.'));
        if (g.noDrive) sec.appendChild(small('⚠️ Drive times aren\'t available right now, so these are guesses from straight-line miles (marked ~).', 'color:var(--st-amber)'));
        fillOut.appendChild(sec);
      });
      if (r.left && (r.left.other || r.left.place || r.left.phone)) {
        const head = 'Left out: ' + [r.left.other ? plural(r.left.other, 'job') + ' other departments do' : '', r.left.place ? plural(r.left.place, 'job') + ' with no location' : '',
          r.left.phone ? plural(r.left.phone, 'phone-call-only job') : ''].filter(Boolean).join(', ');
        const by = Array.from(r.left.otherBy.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => '• ' + k + ': ' + v).join('\n');
        fillOut.appendChild(fold(head, 'Only the kinds of jobs ' + t.name + ' or ' + (t.team || 'their department') + ' did in the last 4 weeks are suggested.' + (by ? '\nMostly done by:\n' + by : '')));
      }
      r.notes.forEach(n => fillOut.appendChild(small(n, 'color:var(--st-amber)')));
      const foot = el('div', 'display:flex;gap:6px;align-items:center;flex-wrap:wrap');
      foot.append(copyPill('📋 Copy list', fillText(r), 'Copies these suggestions as text'));
      fillOut.appendChild(foot);
      fillOut.appendChild(small('Looked at ' + plural(r.total, 'job') + '; ' + r.suited + ' suit ' + board.firstName(t.name) + '. From ' + plural(r.L.jobs, 'appointment') + ' in the last 4 weeks. Drive times © Mapbox © OpenStreetMap. Jobs on their day are measured to the middle of their zip code.', 'color:var(--st-ink-3)'));
      fillOut.style.display = 'grid';
      const n = r.gaps.reduce((a, g) => a + g.list.length, 0);
      say(n ? 'Best first. Call the customer to offer the time; it changes nothing by itself.' : 'No jobs fit their open time.');
      fit();
    };
    const fillText = r => {
      const lines = [r.t.name + ' · ' + dayText(r.s.day)];
      r.gaps.forEach(g => {
        lines.push('', KINDS[g.kind] + ' ' + span(g.start, g.end) + ' (' + gapWords(g, r) + ')');
        if (!g.list.length) lines.push('  No jobs fit here.');
        g.list.slice(0, g.showAll ? MAX : SHOW).forEach((x, i) => lines.push('  ' + (i + 1) + '. ' + (x.c.customer || 'Job') + (x.c.phone ? '  ' + fmtPhone(x.c.phone) : '') + '  #' + x.c.jobId + ' ' + x.c.type + (x.c.city ? ', ' + x.c.city : '') +
          ' · ' + whenOf(x.c, r).text.replace(/^\S+ /, '') + ' · +' + mins(x.extra) + ' driving'));
      });
      return lines.join('\n');
    };
    const assign = (jobId, techId, techName) => {
      if (lock) return say('Wait for ' + lock + ' to finish first.');
      const n = moves.take([jobId], techId, techName);
      if (n < 0) return say('🔀 Move Jobs is busy. Wait for it to finish, then try again.');
      showView('moves');
    };

    // ---------- 🔎 Closest techs ----------
    let lastNear = null, nearView = 'techs', nearAll = false;
    // A zip code or a job number: a job on the board is a job; otherwise five digits that are a zip
    // code are a zip code (with a "did you mean the job" button); anything else is looked up as a job.
    const findTyped = async () => {
      const v = norm(typed.value).replace(/^#/, '');
      if (!/^\d{3,}$/.test(v)) return say('Type a zip code or a job number.');
      if (!onBoard()) return say(board.need());
      const s = board.latest() || await board.load().catch(() => null);
      if (s && s.byJob.has(v)) return near({ jobId: v });
      if (/^\d{5}$/.test(v)) {
        say('Finding the closest techs…');
        const { points, error } = await zipPoints([v]);
        if (points.has(v) || error) return near({ zip: v, orJob: true });
      }
      near({ jobId: v });
    };
    // Where a tech is: today and "where they are now": the job they're working, else the one they're
    // on the way to, else the last one they finished today; otherwise (or "from home") their home.
    const placeNow = (s, t, mode, today) => {
      if (mode === 'now' && today) {
        const appts = (s.byTech.get(t.id) || []).filter(board.live);
        const latest = (re, by) => appts.filter(a => re.test(a.techStatus[t.id] || a.status)).sort((a, b) => (b[by] || 0) - (a[by] || 0))[0];
        const pick = [[latest(/^working$/i, 'start'), 'working a job'], [latest(/^dispatched$/i, 'start'), 'on the way to a job'], [latest(/^(done|completed)$/i, 'end'), 'finished a job']].find(([a]) => a && zip5(a.zip));
        if (pick) return { zip: zip5(pick[0].zip), why: pick[1] + (pick[0].city ? ' in ' + tidy(pick[0].city) : '') };
      }
      const h = homeOf(t.id);
      return h ? { pt: { lat: h.lat, lon: h.lon }, why: 'from ' + homeWords(h) } : null;
    };
    const near = async target => {
      const run = ++runId;
      const stale = () => run !== runId || !alive;
      lastNear = target; nearAll = false;
      paint();
      nearOut.style.display = 'none'; nearOut.textContent = '';
      if (!onBoard()) return say(board.need());
      setBusy(true);
      try {
        say('Finding the closest techs…');
        const s = await board.load();
        await loadHomes();
        if (stale()) return;
        fillTeams(s);
        const today = board.sameDay(s.day, new Date());
        const place = { zip: target.zip || '', city: '', pt: null, techIds: [], customer: '', onDay: false };
        if (target.jobId) {
          const list = (s.byJob.get(S(target.jobId)) || []).filter(board.live);
          if (list.length) {
            const z = list.find(a => zip5(a.zip)) || list[0];
            place.zip = zip5(z.zip); place.city = z.city; place.customer = z.customer; place.onDay = true;
            list.forEach(a => a.techs.forEach(id => { if (place.techIds.indexOf(id) < 0) place.techIds.push(id); }));
          } else {
            // Not on the timeline: the Unassigned list (with its map point), then the job's own panel.
            const un = await board.unassigned(TOOL).catch(e => { if (st.isSignedOut(e)) throw e; return null; });
            if (stale()) return;
            const row = un && un.rows.find(x => x.jobId === S(target.jobId));
            if (row) {
              const c = candOf(row.raw, 'ua', s.day);
              place.pt = c && c.pt; place.zip = zip5(row.raw && row.raw.Zip); place.city = tidy(row.raw && row.raw.City); place.customer = row.customer;
            } else {
              let jp;
              try { jp = await st.jobPlace(target.jobId); }
              catch (e) { if (st.isSignedOut(e)) throw e; if (!stale()) say('⚠️ Couldn\'t find job #' + target.jobId + ' (' + errText(e) + '). Check the number.'); return; }
              if (stale()) return;
              place.zip = jp.zip; place.city = jp.city; place.customer = jp.customer; place.techIds = jp.techIds;
            }
          }
          if (!place.zip && !place.pt) return say('⚠️ Job #' + target.jobId + ' has no zip code in ServiceTitan, so there\'s nothing to measure to.');
        }
        const team = teamSel.value, fieldOnly = fieldBox.checked, mode = fromSel.value;
        // Field techs: ServiceTitan's managed technicians (when the tech list can't be read, everyone).
        const usable = t => { if (!homes) return true; const h = homes.get(S(t.id)); return h ? h.active && (!fieldOnly || h.managed) : !fieldOnly; };
        const pool = s.techs.filter(t => (!team || t.team === team) && usable(t));
        const places = pool.map(t => ({ t, at: placeNow(s, t, mode, today) }));
        const { points, error } = await zipPoints([place.zip].concat(places.map(x => x.at && x.at.zip)).filter(Boolean));
        if (stale()) return;
        const to = place.pt || points.get(place.zip);
        if (!to) return say('⚠️ ' + (error ? 'Couldn\'t look up where ' + place.zip + ' is (' + error + '). Try again in a minute.' : place.zip + ' isn\'t a zip code the US Census knows.'));
        const placed = [], unplaced = [];
        places.forEach(x => {
          const p = x.at ? (x.at.pt || points.get(x.at.zip)) : null;
          if (p) placed.push({ t: x.t, pt: p, why: x.at.why, line: miles(p, to), sameZip: !!x.at.zip && x.at.zip === place.zip });
          else unplaced.push(x.t);
        });
        placed.sort((a, b) => a.line - b.line || a.t.name.localeCompare(b.t.name));
        const top = placed.slice(0, NEAR_MAX);
        if (top.length) say('Getting drive times for ' + plural(top.length, 'tech') + '…');
        const m = await matrix(top.map(x => x.pt), [to], today);
        if (stale()) return;
        top.forEach((x, i) => {
          x.drive = m.out[i][0];
          x.min = x.drive ? x.drive.min : guessMin(x.line);
          x.onIt = place.techIds.indexOf(S(x.t.id)) > -1;
          x.jobsToday = board.techJobs(x.t.id).length;
        });
        top.sort((a, b) => a.min - b.min || a.line - b.line);
        let next = null;
        // 📍 Next job: for a job on the board's day with a tech on it.
        if (target.jobId && place.onDay && place.techIds.length) {
          try { next = await nextJobs(s, target.jobId, to, place, stale); }
          catch (e) { if (st.isSignedOut(e)) throw e; next = { error: errText(e) }; }
          if (stale()) return;
        }
        nearView = next && !next.error ? 'next' : 'techs';
        renderNear({ target, place, top, unplaced, error, s, today, mode, team, fieldOnly, total: pool.length, next, noDrive: top.filter(x => !x.drive).length });
      } catch (e) {
        if (stale()) return;
        say('⚠️ ' + (st.isSignedOut(e) ? e.message : 'Couldn\'t find the closest techs: ' + errText(e)));
      } finally { if (run === runId) setBusy(false); }
    };
    // 📍 Next job: the Unassigned jobs closest to a job that the tech on it could take next.
    //   - Not over before this job ends; never during an all-day job of theirs (LONG_JOB hours or
    //     more); at the same time as a shorter one is marked ⚠️ and counts STACK minutes farther.
    //   - The right kind of job for them (the last 4 weeks of schedules, as in 📞 Fill a spot).
    const nextJobs = async (s, jobId, to, place, stale) => {
      const tech = s.techById.get(S(place.techIds[0]));
      if (!tech) return null;
      const mine = (s.byJob.get(S(jobId)) || []).filter(a => board.live(a) && a.techs.indexOf(tech.id) > -1).sort((a, b) => (b.end || 0) - (a.end || 0))[0];
      const endAt = mine ? mine.end : null;
      const others = (s.byTech.get(tech.id) || []).filter(a => board.live(a) && a.jobId !== S(jobId));
      say('Finding the closest Unassigned jobs for ' + tech.name + '…');
      const L = await learn(s);
      const un = await board.unassigned(TOOL);
      if (stale()) return null;
      const rows = un.rows.map(r => candOf(r.raw, 'ua', s.day)).filter(c => c && c.jobId !== S(jobId) && !PHONE_ONLY.test(c.type));
      const { points } = await zipPoints(rows.filter(c => !c.pt).map(c => c.zip));
      if (stale()) return null;
      const left = { time: 0, busy: 0, dept: 0, place: 0 }, cands = [];
      rows.forEach(c => {
        const p = c.pt || points.get(c.zip);
        if (!p) { left.place++; return; }
        if (endAt && c.end && c.end <= endAt) { left.time++; return; }
        if (others.some(b => overlap(b, c) && hours(b) >= LONG_JOB)) { left.busy++; return; }
        const f = fitOf(L, tech, c.typeId, c.type);
        if (f.tier === 'no') { left.dept++; return; }
        const clash = others.find(b => overlap(b, c)) || null;
        cands.push({ c, pt: p, f, line: miles(to, p), clash });
      });
      cands.sort((a, b) => (a.line + (a.clash ? STACK : 0)) - (b.line + (b.clash ? STACK : 0)));
      const top = cands.slice(0, NEAR_MAX);
      const m = await matrix([to], top.map(x => x.pt), board.sameDay(s.day, new Date()));
      if (stale()) return null;
      top.forEach((x, i) => { const d = m.out[0][i]; x.min = d ? d.min : guessMin(x.line); x.guess = !d; x.mi = d && d.mi != null ? d.mi : x.line; });
      top.sort((a, b) => (a.min + (a.clash ? STACK : 0)) - (b.min + (b.clash ? STACK : 0)) || a.line - b.line);
      return { tech, list: top, left, endAt, multi: place.techIds.length > 1 };
    };
    const nearRowEl = (n, name, time, detail, extraLine, btns) => {
      const c = el('div', 'display:flex;gap:6px;align-items:center;padding:6px 8px;background:var(--st-bg);font-size:12px;color:var(--st-ink)' + (n > 1 ? ';border-top:1px solid var(--st-line)' : ''));
      c.className = 'st-router-near-row';
      const left = el('div', 'flex:1;min-width:0');
      const top = el('div', 'display:flex;gap:5px;align-items:baseline');
      const nm = el('span', 'font-weight:700;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;user-select:text', name);
      nm.className = 'st-router-near-name';
      top.append(el('span', 'color:#00796b;font-weight:800', n + '.'), nm, el('span', 'margin-left:auto;font-weight:800;white-space:nowrap', time));
      const d2 = el('div', 'color:var(--st-ink-3);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', detail);
      d2.title = detail;
      left.append(top, d2);
      if (extraLine) left.appendChild(extraLine);
      const b = el('div', 'display:flex;gap:3px;flex:none');
      btns.forEach(x => b.appendChild(x));
      c.append(left, b);
      return c;
    };
    const listBox = () => el('div', 'border:1px solid var(--st-line);border-radius:8px;overflow:hidden');
    const renderNear = r => {
      nearOut.textContent = '';
      const what = r.target.jobId ? 'job #' + r.target.jobId + (r.place.customer ? ' ' + r.place.customer : '') + ' (' + [r.place.city ? tidy(r.place.city) : '', r.place.zip].filter(Boolean).join(' ') + ')' : r.place.zip;
      const head = el('div', 'font-size:12px;font-weight:800;color:var(--st-ink)');
      head.className = 'st-router-near-head';
      head.textContent = 'Closest to ' + what + (r.team ? ' · ' + r.team : '') + (r.fieldOnly ? '' : ' · everyone on the board');
      nearOut.appendChild(head);
      if (r.target.orJob) nearOut.appendChild(smallBtn('Job #' + r.target.zip + ' instead?', () => near({ jobId: r.target.zip }), 'padding:1px 6px;min-height:22px;font-size:11px;justify-self:start'));
      if (r.next && !r.next.error) {
        const seg = el('div', 'display:flex;gap:4px');
        const segBtn = (val, text) => { const b = smallBtn(text, () => { nearView = val; nearAll = false; renderNear(r); }, 'flex:1;padding:3px 6px;min-height:24px'); setOn(b, nearView === val); b.className = 'st-router-seg'; return b; };
        seg.append(segBtn('next', '📍 Next job for ' + board.firstName(r.next.tech.name) + ' (' + r.next.list.length + ')'), segBtn('techs', '🔎 Closest techs'));
        nearOut.appendChild(seg);
      } else if (r.next && r.next.error) nearOut.appendChild(small('⚠️ Couldn\'t look for a next job: ' + r.next.error + '.', 'color:var(--st-amber)'));
      if (nearView === 'next' && r.next && !r.next.error) { renderNext(r); return; }
      if (r.mode === 'now' && !r.today) nearOut.appendChild(small('The board shows ' + dayText(r.s.day) + ', so everyone is measured from home ("where they are now" is for today).', 'color:var(--st-amber)'));
      if (!r.top.length) nearOut.appendChild(el('div', 'font-size:12px;color:var(--st-ink-2)', r.total ? 'No one could be placed (see below).' : 'No ' + (r.fieldOnly ? 'field techs' : 'techs') + ' on the board' + (r.team ? ' in ' + r.team : '') + ' for ' + dayText(r.s.day) + '.'));
      const list = listBox();
      (nearAll ? r.top : r.top.slice(0, NEAR_SHOW)).forEach((x, i) => {
        const detail = [x.sameZip ? 'same zip code' : x.drive && x.drive.mi != null ? miText(x.drive.mi) : '~' + miText(x.line), x.why, x.t.team, plural(x.jobsToday, 'job') + (r.today ? ' today' : '')].filter(Boolean).join(' · ');
        const btns = [pill('🗺️', 'Directions in Google Maps (new tab), from about where they are to the zip code', () => {
          const url = 'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=' + r2(x.pt.lat) + ',' + r2(x.pt.lon) + '&destination=' + encodeURIComponent(r.place.zip ? r.place.zip + (r.place.city ? ' ' + tidy(r.place.city) : '') : r2(r.place.pt.lat) + ',' + r2(r.place.pt.lon));
          try { window.open(url, '_blank', 'noopener'); } catch (e) {}
        })];
        if (r.target.jobId && !x.onIt) { const b = pill('➡️', 'Opens 🔀 Move Jobs with this job and ' + x.t.name + ' filled in. Nothing changes until you review it and press Move.', () => assign(r.target.jobId, x.t.id, x.t.name), 'background:#6a1b9a;border-color:#6a1b9a;color:#fff'); b.className = 'st-router-assign'; btns.push(b); }
        list.appendChild(nearRowEl(i + 1, x.t.name, (x.drive ? '' : '~') + mins(x.min), detail, x.onIt ? el('div', 'color:var(--st-blue-d);font-size:11px;font-weight:600', 'Already on this job') : null, btns));
      });
      if (r.top.length) nearOut.appendChild(list);
      if (r.top.length > NEAR_SHOW) nearOut.appendChild(smallBtn(nearAll ? 'Show fewer' : 'Show more (' + (r.top.length - NEAR_SHOW) + ')', () => { nearAll = !nearAll; renderNear(r); }, 'justify-self:start;padding:2px 8px;min-height:24px'));
      if (r.noDrive) nearOut.appendChild(small(r.noDrive === r.top.length ? '⚠️ Drive times aren\'t available right now, so these are guesses from straight-line miles (marked ~).' : '⚠️ ' + plural(r.noDrive, 'drive time') + ' couldn\'t be had; those are guesses (marked ~).', 'color:var(--st-amber)'));
      if (r.unplaced.length) nearOut.appendChild(fold('Can\'t place ' + plural(r.unplaced.length, 'tech'), (r.mode === 'home' || !r.today ? 'No home on their tech profile: ' : 'No job with a zip code today and no home on their tech profile: ') + r.unplaced.map(t => t.name).sort().join(', ') + '.'));
      if (r.error) nearOut.appendChild(small('⚠️ Some zip codes couldn\'t be looked up: ' + r.error + '.'));
      nearOut.appendChild(small('Drive times © Mapbox © OpenStreetMap. Jobs on the timeline and zip codes are measured to the middle of the zip code.'));
      nearOut.style.display = 'grid';
      say(r.top.length ? 'Closest first.' : 'Nothing to show.');
      fit();
    };
    const renderNext = r => {
      const n = r.next;
      if (n.multi) nearOut.appendChild(small('This job has ' + plural(r.place.techIds.length, 'tech') + '; these are for ' + n.tech.name + '.'));
      if (n.endAt) nearOut.appendChild(small(n.tech.name + ' is done here around ' + clock(n.endAt) + '. Unassigned jobs nearby they could take next:'));
      if (!n.list.length) nearOut.appendChild(el('div', 'font-size:12px;color:var(--st-ink-2)', 'No Unassigned jobs fit ' + n.tech.name + ' next (see below).'));
      const list = listBox();
      (nearAll ? n.list : n.list.slice(0, NEAR_SHOW)).forEach((x, i) => {
        const detail = [[x.c.city || x.c.zip, span(x.c.start, x.c.end)].filter(Boolean).join(' '), (x.guess ? '~' : '') + miText(x.mi) + ' from this job', x.c.type, x.f.tier === 'unknown' ? '⚠️ nothing like it to go by' : ''].filter(Boolean).join(' · ');
        const b = pill('➡️', 'Opens 🔀 Move Jobs with #' + x.c.jobId + ' and ' + n.tech.name + ' filled in. Nothing changes until you review it and press Move.', () => assign(x.c.jobId, n.tech.id, n.tech.name), 'background:#6a1b9a;border-color:#6a1b9a;color:#fff');
        b.className = 'st-router-assign';
        list.appendChild(nearRowEl(i + 1, '#' + x.c.jobId + (x.c.customer ? ' ' + x.c.customer : ''), (x.guess ? '~' : '') + mins(x.min), detail,
          x.clash ? el('div', 'font-size:11px;color:var(--st-amber);font-weight:600', '⚠️ on top of their ' + (span(x.clash.start, x.clash.end) || 'other') + ' job') : null, [b]));
      });
      if (n.list.length) nearOut.appendChild(list);
      if (n.list.length > NEAR_SHOW) nearOut.appendChild(smallBtn(nearAll ? 'Show fewer' : 'Show more (' + (n.list.length - NEAR_SHOW) + ')', () => { nearAll = !nearAll; renderNear(r); }, 'justify-self:start;padding:2px 8px;min-height:24px'));
      const why = [];
      if (n.left.time) why.push(plural(n.left.time, 'job') + ' over before this one ends');
      if (n.left.busy) why.push(plural(n.left.busy, 'job') + ' during an all-day job of theirs');
      if (n.left.dept) why.push(plural(n.left.dept, 'job') + ' other departments do');
      if (n.left.place) why.push(plural(n.left.place, 'job') + ' with no location');
      if (why.length) nearOut.appendChild(fold('Left out: ' + why.join(', '), 'Only Unassigned jobs for ' + dayText(r.s.day) + ' on your board\'s branches are looked at. Who does which jobs comes from the last 4 weeks of schedules.'));
      nearOut.appendChild(small('Drive times © Mapbox © OpenStreetMap. Measured from this job to each one.'));
      nearOut.style.display = 'grid';
      say(n.list.length ? 'Closest first. ➡️ hands one to Move Jobs.' : 'Nothing fits next.');
      fit();
    };

    // ---------- 🗺️ Plan the day ----------
    // Plans a tech for every job on the Unassigned list for the day the board shows, and the order
    // each tech's day goes in, then hands the plan to 🔀 Move Jobs (nothing changes until Assign there).
    //   - Each tech's day is a route: from home (or, today, from now and where they are) through
    //     their jobs to home. Jobs already on the board keep their order; Unassigned jobs go in
    //     between them where they cost least.
    //   - Arrival windows, by the job's tag (8-12 MORNING, 12-5 AFTERNOON, 5-9 EVENING), else its
    //     appointment's window: no earlier than EARLY minutes before the window. Late is OK up to the
    //     grace you pick (counts lightly); later counts heavily. 5-9s always count lightly. So 8-12s
    //     come first, then 12-5s, then 5-9s. Urgent jobs get no grace, and High priority half, and
    //     both count a little for every minute after their window opens, so they go early.
    //   - The right department (the last 4 weeks of schedules, as 📞 Fill a spot). Field techs only,
    //     and only the departments ticked.
    //   - Least extra driving; PER_JOB minutes for each job a tech already has (spreads the work);
    //     time past the end of their shift counts too, and a day can't end more than MAX_OVER minutes
    //     late (except for a 5-9). More than MAX_ADD minutes of extra driving is left out.
    //   - A job isn't put where it, or a job after it, would be more than TOO_LATE minutes past the
    //     grace (an 8-12 at 3 PM with a 1-hour grace), unless that was already so.
    //   - Sales rule: a salesperson's day of driving over SALES_MAX counts OVER_WEIGHT times.
    //   Driving is guessed from straight-line miles while planning, then the finished routes get
    //   Mapbox drive times (one request per tech) for their arrival times.
    const PER_JOB = 15, EARLY = 30, MAX_OVER = 90, MAX_ADD = 90, LATE_WEIGHT = 0.5, VERY_LATE = 4, EVENING_WEIGHT = 0.2, TOO_LATE = 120;
    const WIN_TAG = /^\s*(\d{1,2})\s*-\s*(\d{1,2})\s+(morning|afternoon|evening)\b/i;
    // A job's arrival window on the plan's day: { start, end, label, evening } or null.
    const windowOf = (tags, ws, we, day) => {
      const at = h => { const d = new Date(day); d.setHours(h, 0, 0, 0); return d; };
      for (const t of tags || []) {
        const m = WIN_TAG.exec(t && t.name || '');
        if (!m) continue;
        let a = Number(m[1]), b = Number(m[2]);
        if (!/morning/i.test(m[3])) { if (a < 12) a += 12; if (b < 12) b += 12; }
        if (b > a && b <= 24) return { start: at(a), end: at(b), label: m[1] + '-' + m[2], evening: a >= 17 };
      }
      ws = toDate(ws); we = toDate(we);
      if (ws && we && we > ws) return { start: ws, end: we, label: span(ws, we), evening: ws.getHours() >= 17 };
      return null;
    };
    const prioRank = p => ({ urgent: 0, high: 1, normal: 2, low: 3 })[norm(p).toLowerCase()] != null ? ({ urgent: 0, high: 1, normal: 2, low: 3 })[norm(p).toLowerCase()] : 2;
    // How late a stop can be and still count lightly: Urgent none, High half the grace.
    const graceFor = (x, grace) => x.prio === 'urgent' ? 0 : x.prio === 'high' ? grace / 2 : grace;
    // A route's day: arrival at each stop, lateness, driving and when they're home. leg(a, b): minutes.
    const simulate = (R, stops, leg, grace) => {
      let t = +R.start, pos = R.startPt, drive = 0, cost = 0, tooLate = 0;
      const out = stops.map(x => {
        const d = pos && x.pt ? leg(pos, x.pt) : 0;
        t += d * 60000; drive += d;
        if (x.win && t < +x.win.start - EARLY * 60000) t = +x.win.start - EARLY * 60000;
        if (x.notBefore && t < +x.notBefore) t = +x.notBefore;
        const arrive = t, late = x.win ? Math.max(0, (arrive - x.win.end) / 60000) : 0;
        const gr = graceFor(x, grace);
        cost += !late ? 0 : x.win.evening ? late * EVENING_WEIGHT : late <= gr ? late * LATE_WEIGHT : gr * LATE_WEIGHT + (late - gr) * VERY_LATE;
        if (late > gr + TOO_LATE && !x.win.evening) tooLate++;
        // Urgent and High: the sooner in their window the better.
        if (x.win && (x.prio === 'urgent' || x.prio === 'high')) cost += Math.max(0, (arrive - x.win.start) / 60000) * (x.prio === 'urgent' ? 0.3 : 0.15);
        t += x.dur * 60000;
        if (x.pt) pos = x.pt;
        return { x, arrive: new Date(arrive), drive: d, late };
      });
      const back = pos && R.homePt ? leg(pos, R.homePt) : 0;
      drive += back; t += back * 60000;
      const over = Math.max(0, (t - R.end) / 60000);
      return { cost: cost + drive + over, drive, over, home: new Date(t), back, out, tooLate };
    };
    let planRun = 0, lastPlan = null;
    const planDay = async () => {
      const run = ++planRun;
      const stale = () => run !== planRun || !alive;
      lastPlan = null;
      planOut.style.display = 'none'; planOut.textContent = '';
      if (!onBoard()) return say(board.need());
      setBusy(true);
      try {
        say('Reading the board and the Unassigned list…');
        const s = await board.load({ fresh: true });
        const [un] = await Promise.all([board.unassigned(TOOL, { fresh: true }), loadHomes()]);
        if (stale()) return;
        const grace = Number(graceSel.value) || 60, fieldOnly = planField.checked;
        const day = s.day, now = new Date(), today = board.sameDay(day, now);
        const jobs0 = un.rows.map(r => { const c = candOf(r.raw, 'ua', day); if (c) c.win = windowOf(c.tags, r.raw.ArrivalWindowStart, r.raw.ArrivalWindowEnd, day); return c; }).filter(Boolean);
        if (!jobs0.length) return say('The Unassigned list for ' + dayText(day) + ' is empty. Nothing to plan.');
        if (!learned || learned.key !== learnKey()) say('Learning which jobs each department does, from the last 4 weeks of schedules…');
        let L;
        try { L = await learn(s); }
        catch (e) { if (st.isSignedOut(e) || stale()) throw e; return say('⚠️ Couldn\'t read the last 4 weeks of schedules (' + errText(e) + '), so it can\'t tell which department does what. Try again in a minute.'); }
        if (stale()) return;
        say('Finding where everyone is…');
        const allZips = jobs0.filter(c => !c.pt).map(c => c.zip);
        s.techs.forEach(t => (s.byTech.get(t.id) || []).forEach(a => allZips.push(zip5(a.zip))));
        const { points, error: zipError } = await zipPoints(allZips);
        if (stale()) return;
        jobs0.forEach(c => { if (!c.pt && c.zip && points.get(c.zip)) c.pt = points.get(c.zip); });
        // Each tech's route as it stands.
        const usable = t => { if (!homes) return true; const h = homes.get(S(t.id)); return h ? h.active && (!fieldOnly || h.managed) : !fieldOnly; };
        const routes = [];
        s.techs.forEach(t => {
          if (skipTeams.has(t.team) || !usable(t)) return;
          const D = dayOf(s, t.id);
          if (D.off) return;
          const h = homeOf(t.id), homePt = h ? { lat: h.lat, lon: h.lon } : null;
          const jobs = D.jobs.filter(a => !(today && /^(done|completed)$/i.test(a.status)));
          const done = today ? D.jobs.filter(a => /^(done|completed)$/i.test(a.status)).sort((a, b) => b.end - a.end) : [];
          const lastDone = done.find(a => points.get(zip5(a.zip)));
          const stops = jobs.map(a => {
            const busyNow = today && /^(working|dispatched)$/i.test(a.techStatus[t.id] || a.status);
            return { kind: 'board', a, jobId: a.jobId, customer: a.customer, city: a.city, pt: points.get(zip5(a.zip)) || null, win: windowOf(a.tags, a.windowStart, a.windowEnd, day),
              dur: Math.max(15, busyNow && a.end > now ? (a.end - now) / 60000 : (a.end - a.start) / 60000), busyNow };
          }).sort((x, y) => (y.busyNow - x.busyNow) || (x.a.start - y.a.start));
          const start = today ? new Date(Math.max(+D.start, Math.ceil(now / 900000) * 900000)) : D.start;
          // Where their day starts: today, the job they're working (it's their first stop), else the
          // last one they finished, else home.
          const working = stops.find(x => x.busyNow && /^working$/i.test(x.a.techStatus[t.id] || x.a.status));
          const startPt = working && working.pt ? working.pt : lastDone ? points.get(zip5(lastDone.zip)) : homePt;
          const startWords = working && working.pt ? '🔧 Working now' : lastDone ? '✅ From their last job' + (lastDone.city ? ' (' + tidy(lastDone.city) + ')' : '') : '🏠 ' + (today ? 'From ' : 'Leaves ') + homeWords(h);
          const R = { t, D, start, end: D.end, startPt, startWords, homePt, home: h, stops, fixedN: stops.filter(x => x.busyNow).length, n0: new Set(jobs.map(a => a.jobId)).size, added: [], sales: isSales(t.team) };
          if (!R.startPt && !stops.some(x => x.pt)) return;   // nowhere to measure from
          if (today && start >= D.end) return;                 // their day is over
          R.base = simulate(R, stops, guess, grace);
          R.before = R.base;
          routes.push(R);
        });
        // The jobs, most urgent first, then the earliest window, then the longest waiting.
        const order = jobs0.slice().sort((a, b) => prioRank(a.priority) - prioRank(b.priority) || ((a.win ? +a.win.start : 864e13) - (b.win ? +b.win.start : 864e13)) || ((a.created || 0) - (b.created || 0)) || a.jobId.localeCompare(b.jobId));
        const left = [];
        const memo = new Map();
        const fitFor = (R, c) => { const k = R.t.id + '|' + c.typeId + '|' + c.type; if (!memo.has(k)) memo.set(k, fitOf(L, R.t, c.typeId, c.type)); return memo.get(k); };
        order.forEach((c, i) => {
          if (PHONE_ONLY.test(c.type)) { left.push({ c, why: 'a phone call only, not a visit' }); return; }
          if (!c.pt) { left.push({ c, why: 'no location in ServiceTitan to measure to' }); return; }
          const x = { kind: 'new', c, jobId: c.jobId, customer: c.customer, city: c.city, pt: c.pt, win: c.win, dur: c.dur, prio: norm(c.priority).toLowerCase() };
          let best = null, why = null, closest = null;
          const fits = routes.filter(R => fitFor(R, c).tier !== 'no');
          if (!fits.length) {
            const f = routes.length ? fitFor(routes[0], c) : null, by = f && f.by;
            const off = by && skipTeams.has(by);
            left.push({ c, why: off ? 'its department (' + by + ') is left out (Departments)' : 'no one on the board ' + (by ? 'in ' + by + ' ' : '') + 'does this kind of job' + (fieldOnly ? ' (field techs only)' : '') });
            return;
          }
          fits.forEach(R => {
            const f = fitFor(R, c);
            for (let p = R.fixedN; p <= R.stops.length; p++) {
              const stops = R.stops.slice(0, p).concat([x], R.stops.slice(p));
              const sim = simulate(R, stops, guess, grace);
              const add = sim.drive - R.base.drive;
              if (!closest || add < closest.add) closest = { R, add, over: sim.over };
              if (add > MAX_ADD) { why = why || 'far'; continue; }
              const overCap = Math.max(MAX_OVER, R.base.over) + (x.win && x.win.evening ? Math.max(0, (x.win.end - R.end) / 60000) : 0);
              if (sim.over > overCap) { why = why === 'late' ? why : 'room'; continue; }
              if (sim.tooLate > R.base.tooLate) { why = 'late'; continue; }
              let score = sim.cost - R.base.cost + PER_JOB * (R.n0 + R.added.length) + (f.tier === 'family' ? 8 : f.tier === 'unknown' ? 30 : 0);
              if (R.sales) score += (Math.max(0, sim.drive - SALES_MAX) - Math.max(0, R.base.drive - SALES_MAX)) * OVER_WEIGHT;
              if (!best || score < best.score) best = { R, p, stops, sim, score, f };
            }
          });
          if (!best) {
            left.push({ c, why: why === 'late' ? 'no one who does it can get there anywhere near its window (' + (c.win ? c.win.label : '') + ')' : why === 'room' ? 'no one close has room in their day' + (closest ? ' (' + closest.R.t.name + ' would be home about ' + mins(closest.over) + ' after their shift)' : '') :
              'more than ' + mins(MAX_ADD) + ' out of the way for everyone who does it' + (closest ? ' (closest: ' + closest.R.t.name + ', about ' + mins(closest.add) + ' more driving)' : '') });
            return;
          }
          x.fit = best.f;
          best.R.stops = best.stops; best.R.base = best.sim; best.R.added.push(x);
        });
        // Real drive times for the routes that changed: one Mapbox Directions request each.
        const changed = routes.filter(R => R.added.length);
        say('Getting drive times for ' + plural(changed.length, 'route') + '…');
        let noDrive = 0;
        await Promise.all(changed.map(async R => {
          const pts = [R.startPt].concat(R.stops.map(x => x.pt), [R.homePt]).filter(Boolean);
          const legs = new Map();
          try {
            if (Date.now() - mapboxDown < 60000 || pts.length < 2 || pts.length > 25) throw new Error('skip');
            const j = await outside(MB + 'directions/v5/mapbox/driving/' + pts.map(ptText).join(';') + '?overview=false&alternatives=false&access_token=' + encodeURIComponent(driveKey()), 12000);
            const r = j && j.code === 'Ok' && Array.isArray(j.routes) ? j.routes[0] : null;
            if (!r || !Array.isArray(r.legs)) throw new Error('no route');
            r.legs.forEach((g, i) => { if (typeof g.duration === 'number') legs.set(ptText(pts[i]) + '>' + ptText(pts[i + 1]), Math.round(g.duration / 60)); });
          } catch (e) { if (e.message !== 'skip') mapboxDown = Date.now(); noDrive++; R.guess = true; }
          const leg = (a, b) => { const k = legs.get(ptText(a) + '>' + ptText(b)); return k != null ? k : guess(a, b); };
          R.final = simulate(R, R.stops, leg, grace);
          R.was = simulate(R, R.stops.filter(x => x.kind === 'board'), leg, grace);
        }));
        if (stale()) return;
        const rows = [];
        changed.forEach(R => R.added.forEach(x => rows.push({ jobId: x.jobId, techId: R.t.id, techName: R.t.name, customer: x.customer })));
        lastPlan = { s, routes: changed, left, rows, grace, today, noDrive, zipError, total: jobs0.length };
        renderPlan(lastPlan);
      } catch (e) {
        if (stale()) return;
        say('⚠️ ' + (st.isSignedOut(e) ? e.message : 'Couldn\'t plan: ' + errText(e)));
      } finally { if (run === planRun) setBusy(false); }
    };
    const renderPlan = P => {
      planOut.textContent = '';
      const n = P.rows.length;
      const head = el('div', 'font-size:12.5px;font-weight:800;color:var(--st-ink)');
      head.className = 'st-plan-head';
      head.textContent = 'Plan for ' + dayText(P.s.day) + ': ' + n + ' of ' + plural(P.total, 'Unassigned job') + ' on ' + plural(P.routes.length, 'tech');
      planOut.appendChild(head);
      const btns = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
      if (n) {
        const send = smallBtn('➡️ Send ' + plural(n, 'job') + ' to Move Jobs', () => {
          if (lock) return say('Wait for ' + lock + ' to finish first.');
          const k = moves.takePlan(P.rows);
          if (k < 0) return say('🔀 Move Jobs is busy. Wait for it to finish, then try again.');
          showView('moves');
        }, 'background:#6a1b9a;border-color:#6a1b9a;color:#fff');
        send.id = 'st-plan-send';
        send.title = 'Opens 🔀 Move Jobs with each job and its tech. Nothing changes until you review it and press Assign.';
        btns.appendChild(send);
      }
      btns.appendChild(copyPill('📋 Copy routes', planText(P), 'Copies every route as text'));
      planOut.appendChild(btns);
      P.routes.forEach(R => planOut.appendChild(routeCard(R, P)));
      if (P.left.length) {
        const box = el('div', 'display:grid;gap:3px;padding:7px 9px;border:1px solid var(--st-amber-l);background:var(--st-amber-s);border-radius:8px;font-size:12px');
        box.className = 'st-plan-left';
        box.appendChild(el('div', 'font-weight:800;color:var(--st-amber)', 'Not planned (' + P.left.length + ')'));
        P.left.forEach(l => box.appendChild(el('div', 'color:var(--st-ink-2)', '• #' + l.c.jobId + (l.c.customer ? ' ' + l.c.customer : '') + (l.c.win ? ' (' + l.c.win.label + ')' : '') + ': ' + l.why)));
        planOut.appendChild(box);
      }
      if (P.noDrive) planOut.appendChild(small('⚠️ Drive times aren\'t available for ' + plural(P.noDrive, 'route') + ', so those times are guesses from straight-line miles (marked ~).', 'color:var(--st-amber)'));
      if (P.zipError) planOut.appendChild(small('⚠️ Some zip codes couldn\'t be looked up: ' + P.zipError + '.', 'color:var(--st-amber)'));
      planOut.appendChild(small('Late is OK up to ' + mins(P.grace) + ' after a window; 5-9s count lightly. Arrival times assume each job takes its booked time. Jobs on the board are measured to the middle of their zip code. Drive times © Mapbox © OpenStreetMap.'));
      planOut.style.display = 'grid';
      say(n ? 'Check the routes, then ➡️ Send to Move Jobs. Nothing changes until you press Assign there.' : 'Nothing could be planned (see why below).');
      fit();
    };
    const routeCard = (R, P) => {
      const f = R.final, g = R.guess ? '~' : '';
      const box = el('div', 'border:1px solid var(--st-line);border-radius:10px;padding:7px 9px;background:var(--st-bg);font-size:12px;display:grid;gap:2px;color:var(--st-ink)');
      box.className = 'st-plan-route';
      box.setAttribute('data-tech', R.t.id);
      const top = el('div', 'display:flex;gap:6px;align-items:baseline');
      top.append(el('span', 'font-weight:800;font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', R.t.name),
        el('span', 'font-weight:800;white-space:nowrap;color:#6a1b9a', '+' + plural(R.added.length, 'job')));
      box.appendChild(top);
      box.appendChild(el('div', 'color:var(--st-ink-3)', R.t.team || 'No team'));
      box.appendChild(el('div', 'color:var(--st-ink-2)', 'Driving ' + g + mins(f.drive) + ' (was ' + g + mins(R.was.drive) + ')' + (R.sales && f.drive > SALES_MAX ? ' ⚠️ over the ' + mins(SALES_MAX) + ' sales goal' : '')));
      const list = el('div', 'display:grid;gap:1px;margin-top:3px');
      const line = (time, text, tone, bold, extra) => {
        const r = el('div', 'display:flex;gap:6px;align-items:baseline;padding:2px 0;border-top:1px solid var(--st-line)' + (bold ? ';font-weight:700' : ''));
        r.append(el('span', 'flex:none;width:62px;color:var(--st-ink-3);font-variant-numeric:tabular-nums', time), el('span', 'flex:1;min-width:0;overflow-wrap:anywhere;color:' + (tone || 'var(--st-ink)'), text));
        if (extra) r.className = extra;
        list.appendChild(r);
      };
      line(clock(R.start), R.startPt ? R.startWords : 'Start (nowhere to measure from)', 'var(--st-ink-3)');
      f.out.forEach(o => {
        const x = o.x, isNew = x.kind === 'new';
        // Late within the grace is fine ("OK"); later than that is marked ⚠️.
        const bad = o.late >= 5 && o.late > graceFor(x, P.grace) && !x.win.evening;
        const lateText = o.late < 5 ? '' : (bad ? ' · ⚠️ ' : ' · ') + mins(o.late) + ' after ' + (x.win.label.indexOf('-') > -1 ? x.win.label.split('-')[1] : 'the window') + (bad ? '' : ' (OK)');
        const text = (isNew ? '🆕 ' : '') + (x.customer || 'Job #' + x.jobId) + ' #' + x.jobId + (x.prio === 'urgent' || x.prio === 'high' ? ' ⭐' : '') + (x.win ? ' · ' + x.win.label : '') + (x.city ? ' · ' + tidy(x.city) : '') + (o.drive ? ' · ' + g + mins(o.drive) + ' drive' : '') + lateText;
        line(clock(o.arrive), text, bad ? 'var(--st-red)' : o.late >= 5 ? 'var(--st-amber)' : isNew ? '#6a1b9a' : null, isNew, isNew ? 'st-plan-new' : 'st-plan-stop');
      });
      line(clock(f.home), '🏠 Home' + (f.over >= 5 ? ' · ' + mins(f.over) + ' after their shift' : ''), f.over >= 5 ? 'var(--st-amber)' : 'var(--st-ink-3)');
      box.appendChild(list);
      return box;
    };
    const planText = P => {
      const lines = ['Plan for ' + dayText(P.s.day)];
      P.routes.forEach(R => {
        lines.push('', R.t.name + ' (' + (R.t.team || 'no team') + '): +' + plural(R.added.length, 'job') + ', driving ' + mins(R.final.drive));
        R.final.out.forEach(o => lines.push('  ' + clock(o.arrive) + '  ' + (o.x.kind === 'new' ? 'NEW ' : '') + (o.x.customer || 'Job') + ' #' + o.x.jobId + (o.x.win ? ' (' + o.x.win.label + ')' : '') + (o.late >= 5 ? ' ' + mins(o.late) + ' late' : '')));
        lines.push('  ' + clock(R.final.home) + '  home');
      });
      if (P.left.length) { lines.push('', 'Not planned:'); P.left.forEach(l => lines.push('  #' + l.c.jobId + ' ' + (l.c.customer || '') + ': ' + l.why)); }
      return lines.join('\n');
    };

    board.onChange(() => { if (shown()) { fillTechs(); paint(); if (teamBody.style.display !== 'none') renderTeams(); teamLabel(); } });
    paintWhere();
    const refresh = () => {
      beta.style.display = 'block';   // the Beta warning, every time it's opened
      fillTechs();
      showTab();
      if (onBoard()) board.load().then(() => { if (shown()) { fillTechs(); paint(); } }).catch(() => {});
    };
    return {
      refresh,
      leave: () => { setPicking(null); style.textContent = ''; },
      cleanup: () => { alive = false; runId++; window.removeEventListener('click', onClick, true); window.removeEventListener('resize', onResize); board.unmount(style); }
    };
  })();

  // ===================================================================
  // Dragging, closing, and starting up
  // ===================================================================
  header.addEventListener('mousedown', e => {
    if (e.target === closeX || e.target === minBtn) return;
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

  // Wider or narrower: drag the Toolbox's left edge or its bottom-right corner (the title bar
  // still moves it). Double-click either for the usual width. The width is remembered in this
  // browser, and the tools that fit their lists to the window fit them again.
  const grip = side => {
    const g = el('div', side === 'left' ? 'left:0;top:0;bottom:0;width:6px' : 'right:0;bottom:0;width:14px;height:14px;border-radius:0 0 11px 0;' +
      'background:linear-gradient(135deg,transparent 50%,var(--st-ctl) 50%,var(--st-ctl) 58%,transparent 58%,transparent 70%,var(--st-ctl) 70%,var(--st-ctl) 78%,transparent 78%)');
    g.className = side === 'left' ? 'st-grip st-grip-l' : 'st-grip st-grip-r';
    g.title = 'Drag to make the Toolbox wider or narrower. Double-click for the usual width.';
    g.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      const r = panel.getBoundingClientRect();
      // Held by its left edge from here on (like after dragging it), so it grows the way you pull.
      panel.style.left = r.left + 'px'; panel.style.top = r.top + 'px';
      panel.style.right = panel.style.bottom = 'auto';
      g.classList.add('st-on');
      const grab = side === 'right' ? r.right - e.clientX : e.clientX - r.left;   // where on the grip it was pressed
      const move = ev => {
        if (side === 'right') {
          panel.style.width = Math.max(MIN_WIDTH, Math.min(maxWidth(), ev.clientX + grab - r.left, innerWidth - r.left - 4)) + 'px';
        } else {
          const left = Math.max(4, Math.min(ev.clientX - grab, r.right - MIN_WIDTH));
          const w = Math.min(maxWidth(), r.right - left);
          panel.style.left = (r.right - w) + 'px';
          panel.style.width = w + 'px';
        }
      };
      const up = () => {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        g.classList.remove('st-on');
        set('stWidth', String(Math.round(panel.getBoundingClientRect().width)));
        set('stPos', parseInt(panel.style.left, 10) + ',' + parseInt(panel.style.top, 10));
        afterResize();
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
    g.addEventListener('dblclick', e => {
      e.preventDefault(); e.stopPropagation();
      const r = panel.getBoundingClientRect();
      panel.style.width = DEFAULT_WIDTH + 'px';
      // The side you didn't double-click stays where it was.
      if (side === 'left' && panel.style.left && panel.style.left !== 'auto') panel.style.left = Math.max(0, r.right - DEFAULT_WIDTH) + 'px';
      set('stWidth', '');
      if (panel.style.left && panel.style.left !== 'auto') set('stPos', parseInt(panel.style.left, 10) + ',' + parseInt(panel.style.top, 10));
      afterResize();
    });
    return g;
  };
  panel.append(grip('left'), grip('right'));
  // A smaller browser window: the Toolbox stays inside it.
  window.addEventListener('resize', () => {
    const w = panel.getBoundingClientRect().width;
    if (w > maxWidth()) panel.style.width = maxWidth() + 'px';
    if (panel.style.left && panel.style.left !== 'auto') {
      const left = parseFloat(panel.style.left);
      if (left + panel.getBoundingClientRect().width > innerWidth) panel.style.left = Math.max(0, innerWidth - panel.getBoundingClientRect().width) + 'px';
    }
  });

  // Closing while a tool is running (Job Notifications, Tech Messages, Business Unit, Customer Texts or Move Jobs) would
  // hide the panel but leave the run going in the background. So ask first, stop the run, then close.
  const closeBar = el('div', 'display:none;padding:8px 12px;background:var(--st-red-s);color:var(--st-red-d);font-size:12px;border-bottom:1px solid var(--st-red-l)');
  const closeText = el('div', 'margin-bottom:6px');
  const closeBtns = el('div', 'display:flex;gap:6px;flex-wrap:wrap');
  closeBar.append(closeText, closeBtns);
  closeBar.classList.add('st-bar');
  header.after(closeBar);
  let closing = false;
  const finishClose = () => {
    PRESS_EVENTS.forEach(t => window.removeEventListener(t, pressGuard, true));
    notes.cleanup();
    notify.cleanup();
    msgs.cleanup();
    biz.cleanup();
    texts.cleanup();
    moves.cleanup();
    router.cleanup();
    board.stop();
    delete window.__stToolbox;
    const gone = () => { panel.remove(); sheet.remove(); };
    if (!motionOK() || typeof panel.animate !== 'function') return gone();
    // Its styles follow it to the other name, so it looks the same while it fades.
    panel.style.animation = 'none';
    sheet.textContent = sheet.textContent.split('#' + ID).join('#' + ID + '-bye');
    panel.id = ID + '-bye';
    // Its insides give up their names too, so nothing (a new Toolbox opened right away, say) finds
    // the fading one's lists and boxes instead of its own.
    panel.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    panel.style.pointerEvents = 'none';
    const fade = panel.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }], { duration: 150, easing: 'ease-in', fill: 'forwards' });
    fade.onfinish = gone;
    setTimeout(gone, 600);
  };
  const close = () => {
    const runners = [[notify, 'Job Notifications'], [msgs, 'Tech Messages'], [biz, 'Business Unit'], [texts, 'Customer Texts'], [moves, 'Move Jobs']];
    const found = runners.find(r => r[0].isRunning());
    if (!found) return finishClose();
    if (closing) return;
    setMin(false);
    const runner = found[0];
    closeText.textContent = found[1] + ' is still running. Closing now would leave it running out of sight.';
    closeBtns.textContent = '';
    closeBtns.append(
      smallBtn('Stop it and close', async () => {
        closing = true;
        closeBtns.textContent = '';
        closeText.textContent = 'Stopping, then closing...';
        runner.stop();
        // Close only once the run has really stopped: its controls stay until then. A run finishes
        // the job it's on, which can take a while if ServiceTitan is slow.
        const started = Date.now();
        while (runners.some(r => r[0].isRunning())) {
          if (Date.now() - started > 20000) closeText.textContent = 'Stopping, then closing... (still finishing the job it was on; ServiceTitan is slow)';
          await wait(250);
        }
        finishClose();
      }, DANGER),
      smallBtn('Keep running', () => { closeBar.style.display = 'none'; })
    );
    closeBar.style.display = 'block';
  };
  closeX.onclick = close;
  window.__stToolbox = { version: VERSION, close };

  document.body.appendChild(panel);
  if (get('stMin') === '1') setMin(true);
  const startView = get('stView');
  showView(['notes', 'jobs', 'msgs', 'biz', 'texts', 'moves', 'router'].indexOf(startView) > -1 ? startView : 'menu');
  health.checkBoard(false);
})();
