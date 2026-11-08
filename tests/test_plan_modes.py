"""🧭 Tech Router → 🗺️ Plan the day: what it plans, and new times (2.3).

＋ Unassigned (as before), 📋 The board (who does each of the board's jobs, and in what order) or Both;
🕐 Set times too (each job's new time, inside its window, set by Move Jobs and put back by ↩ Put back).
The board's jobs keep their times unless 🕐 is ticked; a job keeping its time only goes to a tech free
then; shared jobs never move. A plan that swaps two jobs between techs isn't stopped as "already booked"
by its own jobs. Before → after for the routes that change.

Runs on tests/board_router.html (the fake new board for tomorrow)."""
import sys, time, pathlib, json, re
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_router.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def ev(page, js, arg=None):
    return page.evaluate(js, arg) if arg is not None else page.evaluate(js)
def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first
def start(b, setup=None, keep=False):
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    if not keep: ev(page, "() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '2.3'); }")
    if setup: ev(page, setup); ev(page, "() => NB.render()")
    page.evaluate(TOOLBOX)
    page.evaluate("() => { const h = document.getElementById('st-exp-head'); if (h && document.getElementById('st-exp').style.display === 'none') h.click(); }")
    page.locator('#st-toolbox .st-tile', has_text='Tech Router').click()
    page.wait_for_function("() => document.querySelectorAll('#st-router-tech option').length > 2", timeout=10000)
    page.click('#st-toolbox [data-tab=plan]')
    return page, errors
def plan(page, what=None, times=False):
    if what: page.click('#st-toolbox [data-what="%s"]' % what)
    if times: page.check('#st-plan-times')
    else: page.uncheck('#st-plan-times')
    ev(page, "() => { document.getElementById('st-plan-out').style.display = 'none'; }")
    page.click('#st-plan-go')
    page.wait_for_function("() => !document.getElementById('st-plan-go').disabled && (document.getElementById('st-plan-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=60000)
    if page.locator('#st-plan-all', has_text='Show every stop').count(): page.click('#st-plan-all')
    return page.inner_text('#st-plan-out')
def on(page, tech):
    """The stops on a tech's planned route: [line]."""
    return ev(page, "(t) => Array.from(document.querySelectorAll('#st-plan-out .st-plan-route[data-tech=\"' + t + '\"] .st-plan-new, #st-plan-out .st-plan-route[data-tech=\"' + t + '\"] .st-plan-stop')).map(x => x.innerText.replace(/\\s+/g, ' '))", str(tech))
def to_move_jobs(page):
    page.click('#st-plan-send')
    page.wait_for_function("() => /Move Jobs/.test(document.querySelector('#st-toolbox .st-head').innerText)", timeout=10000)
    B(page, 'Review').click()
    page.wait_for_function("() => { const g = document.getElementById('st-move-go'); return g && g.offsetParent; }", timeout=30000)
    time.sleep(0.2)
    return page.inner_text('#st-toolbox')
def go(page, until):
    page.click('#st-move-go')
    page.wait_for_function(until, timeout=60000)
    page.wait_for_timeout(600)

AT = "const d = new Date(APPTS[0].start), at = (h, m) => { const x = new Date(d); x.setHours(h, m || 0, 0, 0); return x; }; const Q = 'Quote - HVAC - Central Home System', AM = [{ name: '8-12 MORNING ', color: '#fff2a8' }];"
# Mo Magee (Magee) on Dustin (Hattiesburg) and Hal Hatt (Hattiesburg) on Pat (Magee), both at 10:30.
SWAP = "() => { " + AT + " APPTS.push({ id: 9010, job: 7010, techs: [201], customer: 'Mo Magee', start: at(10, 30), end: at(12), zip: '39111', city: 'Magee', jobType: Q, jobTypeId: 11, tags: AM });" + \
       " APPTS.push({ id: 9011, job: 7011, techs: [202], customer: 'Hal Hatt', start: at(10, 30), end: at(12), zip: '39401', city: 'Hattiesburg', jobType: Q, jobTypeId: 11, tags: AM }); }"
iso_hm = "(id) => { const t = (window.timePuts || []).filter(p => p.id === id).pop(); if (!t) return null; const d = new Date(t.body.start); return d.getHours() * 60 + d.getMinutes(); }"

with sync_playwright() as p:
    b = p.chromium.launch()

    # ================= The choice, remembered =================
    page, errors = start(b)
    labels = ev(page, "() => Array.from(document.querySelectorAll('#st-toolbox .st-plan-what button')).map(b => [b.textContent, b.classList.contains('on')])")
    check([x[0] for x in labels] == ['＋ Unassigned', '📋 The board', 'Both'] and labels[0][1], 'three choices, ＋ Unassigned to start (%s)' % labels)
    check(not page.is_checked('#st-plan-times'), '🕐 Set times too starts unticked')
    page.click('#st-toolbox [data-what="board"]')
    check(not page.is_visible('#st-plan-holds') and 'Re-plans the jobs already on the board' in page.inner_text('#st-router-msg'), '📋 The board: no ＋ Fit in holds, and it says what it does')
    check(ev(page, "() => localStorage.getItem('stPlanWhat')") == 'board', 'the choice is remembered (saved in this browser)')
    page.close()

    # ================= 📋 The board as it is: nothing to change =================
    page, errors = start(b)
    o = plan(page, 'board')
    check('The board is in good shape' in o and 'Send' not in o, 'the board as it is: in good shape, nothing to send (%r)' % o[:120])
    check(ev(page, 'window.WRITES') == [], 'planning changed nothing')
    page.close()

    # ================= 📋 The board: two jobs at the same time swap techs (times kept) =================
    page, errors = start(b, SWAP)
    o = plan(page, 'board')
    d, pt = on(page, 201), on(page, 202)
    check('2 board jobs change tech' in o, 'two board jobs change tech (%r)' % o[:100])
    check(any('🔁 from Pat P' in x and 'Hal Hatt' in x for x in d) and any('🔁 from Dustin J' in x and 'Mo Magee' in x for x in pt), 'Hal Hatt goes to Dustin, Mo Magee to Pat, each marked where it came from (%s / %s)' % (d, pt))
    sc = page.inner_text('#st-plan-out .st-plan-score')
    m = re.match(r'🚗 (.+?) → (.+?)( ·|$)', sc)
    check(m and 'hr' in m.group(1) and 'hr' not in m.group(2), 'before → after: hours of driving down to minutes (%r)' % sc)
    check('🕐' not in ' '.join(d + pt) and 'keep their times' in o, 'no new times: they keep their times (only who does them changes)')
    rv = to_move_jobs(page)
    check('already booked' not in rv and not page.is_disabled('#st-move-go'), 'Move Jobs\' review: the two jobs aren\'t "already booked" for each other (%r)' % rv[rv.find('Planned'):rv.find('Planned') + 300])
    check(ev(page, 'window.WRITES') == [], 'the review changed nothing')
    go(page, "() => (window.ASSIGNED[9010] || [])[0] === 202 && (window.ASSIGNED[9011] || [])[0] === 201")
    check(ev(page, 'window.ASSIGNED[9010]') == [202] and ev(page, 'window.ASSIGNED[9011]') == [201] and not ev(page, 'window.timePuts || null'), 'Assign: Mo Magee on Pat, Hal Hatt on Dustin, times as they were')
    check(errors == [], 'board swap: no page errors: %s' % errors)
    page.close()

    # ================= 📋 The board with 🕐 Set times too: new times, set and put back =================
    page, errors = start(b, SWAP)
    o = plan(page, 'board', times=True)
    d = on(page, 201)
    hal = [x for x in d if 'Hal Hatt' in x]
    check(hal and '🕐 10:30 AM → 10 AM' in hal[0], 'Hal Hatt goes to Dustin at 10, right after Ann Early (8–10) (%s)' % d)
    check(any('Ann Early' in x and '🕐' not in x for x in d), 'Ann Early keeps her 8 AM (not reshuffled to save a minute)')
    check('(with times)' in o and 'new time' in o, 'the plan says it sends new times (%r)' % o[:160])
    rv = to_move_jobs(page)
    check('10:30 AM → 10 AM' in rv and 'already booked' not in rv, 'the review shows the new times (%r)' % rv[rv.find('Planned'):rv.find('Planned') + 400])
    go(page, "() => (window.ASSIGNED[9011] || [])[0] === 201 && (window.timePuts || []).some(p => p.id === 9011)")
    check(ev(page, iso_hm, 9011) == 600 and ev(page, 'window.ASSIGNED[9011]') == [201], 'Assign: Hal Hatt on Dustin at 10:00 (%s)' % ev(page, iso_hm, 9011))
    check(ev(page, "() => APPTS.find(a => a.id === 9002).start.getHours()") == 12, 'Bo Petal moved up to 12, back to back')
    # ↩ Put back: the times and the techs as they were.
    B(page, 'Put back').click()
    page.wait_for_function("() => { const g = document.getElementById('st-move-go'); return g && g.offsetParent && !g.disabled; }", timeout=30000)
    go(page, "() => (window.ASSIGNED[9011] || [])[0] === 202")
    check(ev(page, "() => APPTS.find(a => a.id === 9011).start.getHours() * 60 + APPTS.find(a => a.id === 9011).start.getMinutes()") == 630 and ev(page, "() => APPTS.find(a => a.id === 9002).start.getHours()") == 13 and ev(page, 'window.ASSIGNED[9011]') == [202],
          '↩ Put back: Hal Hatt back on Pat at 10:30, Bo Petal back at 1')
    check(errors == [], 'board with times: no page errors: %s' % errors)
    page.close()

    # ================= ＋ Unassigned with 🕐 Set times too: the tech first, then the time =================
    page, errors = start(b)
    o = plan(page, 'ua', times=True)
    near = [x for x in on(page, 201) if 'Near Quote' in x]
    check('8 of 10 jobs planned' in o and near and '🕐 11 AM → ' in near[0], 'the Unassigned jobs are planned as before, each with its new time (%s)' % near)
    rv = to_move_jobs(page)
    go(page, "() => (window.ASSIGNED[9101] || []).length && window.TIMES && window.TIMES[9101]")
    w = ev(page, 'window.WRITES')
    a_i = next((i for i, u in enumerate(w) if 'AssignTechnicians' in u), -1)
    t_i = next((i for i, u in enumerate(w) if u.startswith('PUT') and u.endswith('/9101')), -1)
    check(ev(page, 'window.ASSIGNED[9101]') == [201] and ev(page, '!!(window.TIMES && window.TIMES[9101])'), 'Near Quote: on Dustin, with its new time')
    check(a_i > -1 and t_i > a_i, 'an Unassigned job gets its tech first, then its time, as on the board (%s)' % w[:6])
    check(errors == [], 'Unassigned with times: no page errors: %s' % errors)
    page.close()

    # ================= Both: the Unassigned jobs and the board's together =================
    page, errors = start(b, SWAP)
    o = plan(page, 'both')
    check(re.search(r'\d+ of 10 jobs planned · \d board jobs? changes? tech', o), 'Both: the Unassigned jobs planned and board jobs changing tech, in one plan (%r)' % o[:120])
    page.close()

    # ================= The board's jobs' time requests are kept while re-planning =================
    # Hal Hatt's summary asks to be the last stop: he's Pat's only job (so last). He isn't moved into the
    # middle of Dustin's day, and nothing on the plan breaks what a customer asked for.
    page, errors = start(b, SWAP.rstrip('}') + " window.SUMMARIES = { 7011: '<p>Please make this the last stop of the day.</p>' }; }")
    o = plan(page, 'board', times=True)
    hal = [x for t in (201, 202) for x in on(page, t) if 'Hal Hatt' in x]
    check(hal and '🕑 last stop' in hal[0] and not any('Hal Hatt' in x for x in on(page, 201)), 'Hal Hatt (last stop, asked) stays Pat\'s last stop, not moved into Dustin\'s day (%s)' % hal)
    check('⚠️ asked' not in o, 'nothing on the plan breaks a customer\'s time request')
    check(errors == [], 'time requests: no page errors: %s' % errors)
    page.close()

    # ================= A shared job never moves =================
    page, errors = start(b, SWAP.replace("techs: [201], customer: 'Mo Magee'", "techs: [201, 207], customer: 'Mo Magee'"))
    plan(page, 'board', times=True)
    pt = on(page, 202)
    check(not any('Mo Magee' in x for x in pt), 'Mo Magee has two techs: it stays put (%s)' % pt)
    page.close()

    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
