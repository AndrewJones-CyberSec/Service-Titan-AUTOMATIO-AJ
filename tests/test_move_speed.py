"""🔀 Move Jobs working on up to three jobs at once (1.6.2): faster, with each job still done the
same careful way. Runs on the fake board (tests/board_moves.html) with slow answers, so jobs
really overlap. Nothing here touches ServiceTitan."""
import sys, time, pathlib, json
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_moves.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first
def T(page):
    return page.locator('#st-toolbox').inner_text()
def ev(page, js, arg=None):
    return page.evaluate(js, arg)
def log(page):
    return ev(page, "() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")
def busy(page):
    return ev(page, "() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))")
def wait_done(page, t=90):
    time.sleep(0.4); end = time.time() + t
    while time.time() < end:
        if not busy(page): return True
        time.sleep(0.2)
    return False
def techs(page, appt):
    return ev(page, "(a) => APPTS[a].techs.slice()", appt)
def mode(page, label):
    page.locator('#st-toolbox label:visible', has_text=label).first.locator('input').check()
def pick_to(page, tech_id):
    page.select_option('#st-move-to', str(tech_id))
def pick_from(page, tech_id):
    page.select_option('#st-move-from', str(tech_id) if tech_id else '')
def clear_jobs(page):
    if B(page, 'Clear').count(): B(page, 'Clear').click()
def type_jobs(page, nums):
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='All').filter(has_not_text='note').first.click()
def review(page):
    B(page, 'Review').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=60000)
    time.sleep(0.2)
    return T(page)
def go(page):
    page.click('#st-move-go')
    return wait_done(page)
def put_back(page):
    B(page, 'Put back (').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=60000)
    time.sleep(0.2)
    return go(page)

# Extra jobs for these tests: appointment id -> (job, visit, hour, techs). Jack is 101, Blake 102, Dana 104.
def add_jobs(page, jobs):
    ev(page, """(jobs) => { Object.keys(jobs).forEach(k => { const [job, n, h, techs] = jobs[k];
        APPTS[k] = { job, n, cust: 'Cust ' + k, s: at(h), e: at(h + 1), techs, bu: 1, total: 0, status: 'Scheduled', skills: [] }; });
        render(); window.calls = []; }""", jobs)
def drop_jobs(page, jobs):
    ev(page, "(ids) => { ids.forEach(k => { delete APPTS[k]; }); BOOKED = {}; BOOKED_BY_SCHEDULE = false; ASSIGN_FAIL = {}; API_401 = false; SIGNOUT_AFTER_ASSIGN = false; window.API_DELAY = 30; localStorage.removeItem('stMoveUndo'); render(); window.calls = []; }", list(jobs.keys()))

# Records every request the run sends (start and end, per appointment), and how many
# assign/unassign requests are on their way at once.
WATCH = """() => { if (window.__watching) { window.ev = []; window.inflight = 0; window.maxInflight = 0; return; }
    window.__watching = true; window.ev = []; window.inflight = 0; window.maxInflight = 0;
    const f = window.fetch;
    window.fetch = async (url, opts) => {
      const u = String(url); let kind = null, appt = null;
      const m = /(Assign|Unassign)Technicians/.exec(u), r = /GetJobEditFlyoutData\\?appointmentId=(\\d+)/.exec(u);
      if (m) { kind = m[1].toLowerCase(); appt = JSON.parse(opts.body).appointmentId; }
      else if (r) { kind = 'read'; appt = Number(r[1]); }
      else if (u.indexOf('/Job/TechniciansAreBooked') === 0) kind = 'booked';
      if (!kind) return f(url, opts);
      const change = kind === 'assign' || kind === 'unassign';
      if (change) { window.inflight++; window.maxInflight = Math.max(window.maxInflight, window.inflight); }
      window.ev.push({ kind, appt, at: performance.now(), edge: 'start', inflight: window.inflight });
      try { return await f(url, opts); }
      finally { if (change) window.inflight--; window.ev.push({ kind, appt, at: performance.now(), edge: 'end' }); }
    }; }"""
def events(page):
    return ev(page, "() => window.ev.slice()")

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate(TOOLBOX)
    B(page, 'Move Jobs').click()
    page.wait_for_function("() => document.querySelectorAll('#st-move-to option').length > 1", timeout=10000)

    # ================= Nine jobs from Jack to Dana, with slow answers =================
    jobs = {str(9600 + i): [7600 + i, 1, 7 + i, [101]] for i in range(9)}
    add_jobs(page, jobs)
    mode(page, 'Move to a tech'); pick_to(page, 104); pick_from(page, 101)
    clear_jobs(page); type_jobs(page, ' '.join(str(7600 + i) for i in range(9)))
    t = review(page)
    check('Ready: 9 jobs' in t, 'nine jobs ready')
    ev(page, "() => { window.API_DELAY = 250; }")
    ev(page, WATCH)
    t0 = time.time(); check(go(page), 'run finishes'); secs = time.time() - t0
    lg = log(page); print(lg)
    check(all(techs(page, int(k)) == [104] for k in jobs), 'all nine are on Dana only')
    check('Done: 9 done' in T(page), 'tally: 9 done')
    e = events(page)
    check(ev(page, "() => window.maxInflight") == 3, 'three jobs at once (most changes on their way together: %d)' % ev(page, "() => window.maxInflight"))
    check(all(x['inflight'] <= 3 for x in e if x['edge'] == 'start' and x['kind'] in ('assign', 'unassign')), 'never more than three')
    # Each job: the add is answered, and a reading confirms it, before the old tech is taken off.
    ok = True
    for k in jobs:
        a = int(k)
        mine = [x for x in e if x['appt'] == a]
        a_end = [x['at'] for x in mine if x['kind'] == 'assign' and x['edge'] == 'end']
        u_start = [x['at'] for x in mine if x['kind'] == 'unassign' and x['edge'] == 'start']
        reads_between = [x for x in mine if x['kind'] == 'read' and x['edge'] == 'end' and a_end and u_start and a_end[0] < x['at'] < u_start[0]]
        if not (len(a_end) == 1 and len(u_start) == 1 and a_end[0] < u_start[0] and reads_between): ok = False; print('order problem', k, mine)
    check(ok, 'each job: add answered and confirmed before the old tech comes off')
    calls = ev(page, "() => window.calls.slice()")
    check(sorted(c[1] for c in calls if c[0] == 'assign') == sorted(int(k) for k in jobs) and all(c[2] == [104] for c in calls if c[0] == 'assign'), 'one add per job')
    # One at a time, each job waits on 6 answers of 250 ms (plus the confirm pauses): over 15 s for nine.
    check(secs < 12, 'quicker than one at a time: %.1fs for 9 jobs' % secs)
    print('9 jobs Jack -> Dana: %.1fs' % secs)
    # Put back, also three at a time, exactly.
    ev(page, WATCH)
    check(put_back(page), 'put back finishes')
    check(all(techs(page, int(k)) == [101] for k in jobs), 'put back exactly: all nine on Jack again')
    check(ev(page, "() => window.maxInflight") <= 3, 'put back: never more than three at once')
    drop_jobs(page, jobs)

    # ================= The run ends as soon as the board shows the change =================
    jobs = {'9650': [7650, 1, 9, [101]]}
    add_jobs(page, jobs)
    clear_jobs(page); type_jobs(page, '7650')
    review(page)
    t0 = time.time(); check(go(page), 'one-job run finishes'); secs = time.time() - t0
    lg = log(page)
    check(techs(page, 9650) == [104] and 'Refreshed' not in lg and "hasn't caught up" not in lg, 'the board showed it by itself')
    check(secs < 2, 'no fixed 2.5 s wait at the end: %.1fs for one job' % secs)
    drop_jobs(page, jobs)

    # ================= Two visits of one job are never worked on at the same time =================
    jobs = {'9701': [7700, 1, 8, [101]], '9702': [7700, 2, 13, [101]], '9703': [7701, 1, 9, [101]], '9704': [7702, 1, 10, [101]]}
    add_jobs(page, jobs)
    clear_jobs(page); type_jobs(page, '7700 7701 7702')
    t = review(page)
    check('Ready: 4 jobs' in t, 'both visits of the two-visit job are in the review')
    ev(page, "() => { window.API_DELAY = 200; }")
    ev(page, WATCH)
    check(go(page), 'two-visit run finishes')
    e = events(page)
    span = lambda a: (min(x['at'] for x in e if x['appt'] == a), max(x['at'] for x in e if x['appt'] == a))
    s1, s2 = span(9701), span(9702)
    check(s1[1] <= s2[0] or s2[1] <= s1[0], 'the two visits were done one after the other: %s %s' % (s1, s2))
    check(all(techs(page, int(k)) == [104] for k in jobs), 'all four visits on Dana')
    check(ev(page, "() => window.maxInflight") >= 2, 'other jobs still ran alongside')
    drop_jobs(page, jobs)

    # ================= A problem slows it to one job at a time =================
    jobs = {str(9800 + i): [7800 + i, 1, 8 + i, [101]] for i in range(5)}
    add_jobs(page, jobs)
    clear_jobs(page); type_jobs(page, ' '.join(str(7800 + i) for i in range(5)))
    review(page)
    ev(page, "() => { Object.keys(APPTS).forEach(k => { if (k >= 9800 && k < 9810) ASSIGN_FAIL[k] = 'always'; }); window.API_DELAY = 100; }")
    ev(page, WATCH)
    check(go(page, ), 'failing run finishes')
    e = events(page)
    starts = [x for x in e if x['kind'] == 'assign' and x['edge'] == 'start']
    print([x['inflight'] for x in starts])
    check(len(starts) == 10 and all(x['inflight'] == 1 for x in starts[3:]), 'after the first problems, one job at a time (then the retries, one at a time)')
    lg = log(page)
    check(lg.count("couldn't add Dana K") == 10 and all(techs(page, int(k)) == [101] for k in jobs), 'each failure reported, tried again once, old tech kept')
    drop_jobs(page, jobs)

    # ================= Signed out with several jobs on their way =================
    jobs = {str(9900 + i): [7900 + i, 1, 8 + i, [101]] for i in range(6)}
    add_jobs(page, jobs)
    clear_jobs(page); type_jobs(page, ' '.join(str(7900 + i) for i in range(6)))
    review(page)
    ev(page, "() => { window.API_DELAY = 150; SIGNOUT_AFTER_ASSIGN = true; }")
    ev(page, WATCH)
    check(go(page), 'signed-out run ends')
    n = len(ev(page, "() => window.calls.slice()")); time.sleep(1)
    lg = log(page); print(lg)
    check('signed you out' in lg, 'says you were signed out')
    check(len(ev(page, "() => window.calls.slice()")) == n, 'nothing sent after the run ended')
    changed = [k for k in jobs if techs(page, int(k)) != [101]]
    check(len(changed) == 1 and 'Put back can undo 1 job' in lg, 'only the job ServiceTitan changed is kept for Put back (refused ones are not): %s' % changed)
    check(all(techs(page, int(k)) == [101] for k in jobs if k not in changed), 'the rest are untouched')
    ev(page, "() => { SIGNOUT_AFTER_ASSIGN = false; API_401 = false; }")
    drop_jobs(page, jobs)

    # ================= Swap a whole day, three at a time, and put it back =================
    jobs = {}
    for i in range(5):
        jobs[str(9950 + i)] = [7950 + i, 1, 8 + 2 * i, [101]]
        jobs[str(9960 + i)] = [7960 + i, 1, 8 + 2 * i, [102]]
    add_jobs(page, jobs)
    # Booked when another of the tech's jobs overlaps: each tech's own day overlaps the other's.
    ev(page, "() => { BOOKED_BY_SCHEDULE = true; }")
    start = {k: sorted(techs(page, int(k))) for k in ev(page, "() => Object.keys(APPTS)")}
    mode(page, "whole day")
    page.select_option('#st-move-a', '101'); page.select_option('#st-move-b', '102')
    t = review(page)
    check('Skill warning' in t and 'Already booked' not in t, 'swap day review: only the skill warning (Bob Smith)')
    page.check('#st-toolbox input.st-move-tick-skills')
    check('Swap 15 jobs' in T(page), 'all 15 open jobs will trade places')
    ev(page, "() => { window.API_DELAY = 150; }")
    ev(page, WATCH)
    check(go(page), 'swap day finishes')
    check(all(techs(page, 9950 + i) == [102] and techs(page, 9960 + i) == [101] for i in range(5)), "Jack's and Blake's extra jobs traded places")
    check('booked' not in log(page), 'the jobs each tech is leaving never count as booked, in any order')
    check(ev(page, "() => window.maxInflight") == 3, 'swap day: three at once')
    B(page, 'Put back (').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=60000)
    time.sleep(0.2)
    pb = T(page)
    check('Already booked' not in pb, 'swap day put back: undoing the swap doesn\'t count the swapped jobs as booked')
    if 'Already booked' in pb: print(pb)
    check(go(page), 'swap day put back finishes')
    now = {k: sorted(techs(page, int(k))) for k in start}
    check(now == start, 'swap day put back exactly: %s' % {k: (start[k], now[k]) for k in start if start[k] != now[k]})
    drop_jobs(page, jobs)

    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails))
for f in fails: print(' - ' + f)
