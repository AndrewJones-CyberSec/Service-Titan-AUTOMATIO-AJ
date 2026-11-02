"""🧭 Tech Router → ✨ Optimize → 🔁 Trade jobs (2.2): a better schedule for the whole board.

Jobs another tech is better placed for at the same time: each job keeps its time (only who does it
changes), and goes to a field tech who's free then, does that kind of job and has its skills. Two jobs
at the same time on two techs can swap. A trade must save 15 minutes or more, make no stop later than
Late OK and no one's day much longer, and never take a tech's last job. ➡️ sends them to Move Jobs as
a plan (each job to its new tech); nothing changes until Assign there.

Runs on tests/board_router.html (the fake new board for tomorrow, with stand-ins for Mapbox)."""
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
def start(b, setup=None):
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    ev(page, "() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '2.2'); }")
    if setup: ev(page, setup); ev(page, "() => NB.render()")
    page.evaluate(TOOLBOX)
    page.locator('#st-toolbox .st-tile', has_text='Tech Router').click()
    page.wait_for_function("() => document.querySelectorAll('#st-router-tech option').length > 2", timeout=10000)
    page.click('#st-toolbox [data-tab=opt]')
    return page, errors
def trade(page):
    ev(page, "() => { document.getElementById('st-opt-out').style.display = 'none'; }")
    page.click('#st-trade-go')
    page.wait_for_function("() => !document.getElementById('st-trade-go').disabled && (document.getElementById('st-opt-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=30000)
    return page.inner_text('#st-opt-out')
def trades(page):
    """[(kind, [(job, text)])] best first."""
    return ev(page, "() => Array.from(document.querySelectorAll('#st-opt-out .st-trade')).map(c => [c.getAttribute('data-kind'), Array.from(c.querySelectorAll('.st-trade-job')).map(j => j.getAttribute('data-job')), c.innerText])")

AT = "const d = new Date(APPTS[0].start), at = (h, m) => { const x = new Date(d); x.setHours(h, m || 0, 0, 0); return x; }; const Q = 'Quote - HVAC - Central Home System', AM = [{ name: '8-12 MORNING ', color: '#fff2a8' }];"
# Dustin (Hattiesburg) has a 10:30 job in Magee; Pat lives in Magee and has nothing that day.
MAGEE = "() => { " + AT + " APPTS.push({ id: 9010, job: 7010, techs: [201], customer: 'Mo Magee', start: at(10, 30), end: at(12), zip: '39111', city: 'Magee', jobType: Q, jobTypeId: 11, tags: AM }); }"
# And Pat has a 10:30 job in Hattiesburg: neither can move alone, but they can swap.
SWAP = "() => { " + AT + " APPTS.push({ id: 9010, job: 7010, techs: [201], customer: 'Mo Magee', start: at(10, 30), end: at(12), zip: '39111', city: 'Magee', jobType: Q, jobTypeId: 11, tags: AM });" + \
       " APPTS.push({ id: 9011, job: 7011, techs: [202], customer: 'Hal Hatt', start: at(10, 30), end: at(12), zip: '39401', city: 'Hattiesburg', jobType: Q, jobTypeId: 11, tags: AM }); }"

with sync_playwright() as p:
    b = p.chromium.launch()

    # ================= Nothing to trade on the board as it is =================
    page, errors = start(b)
    o = trade(page)
    check('No trades to suggest' in o and 'no trade saves 15 minutes' in o, 'the board as it is: no trades to suggest (%r)' % o[:200])
    check(errors == [], 'nothing to trade: no page errors: %s' % errors)
    page.close()

    # ================= A job another tech is much closer to, at its time =================
    page, errors = start(b, MAGEE)
    o = trade(page)
    t = trades(page)
    check(len(t) == 1 and t[0][0] == 'move' and t[0][1] == ['7010'] and 'Dustin J → Pat P' in t[0][2], 'Mo Magee: Dustin → Pat, who lives in Magee (%s)' % t)
    check(t and '✓ Pat free 10:30 AM–12 PM' in t[0][2] and 'driving' in t[0][2] and 'Dustin home' in t[0][2], 'with why: Pat is free then, the driving it saves, Dustin home sooner (%r)' % (t[0][2] if t else ''))
    check(re.search(r'1 trade: \d', o) and 'less driving' in o and '~' not in o.split('\n')[0], 'the head says how much less driving (Mapbox\'s drive times, no ~) (%r)' % o.split('\n')[0])
    check(ev(page, 'window.WRITES') == [], 'looking changed nothing')
    # ➡️ Send to Move Jobs, Review, Assign: Mo Magee goes to Pat at the same time.
    page.click('#st-trade-send')
    page.wait_for_function("() => /Move Jobs/.test(document.querySelector('#st-toolbox .st-head').innerText)", timeout=10000)
    check('→ Pat P' in page.inner_text('#st-toolbox'), 'Move Jobs has the job with its new tech')
    B(page, 'Review').click()
    page.wait_for_function("() => { const g = document.getElementById('st-move-go'); return g && g.offsetParent && !g.disabled; }", timeout=30000)
    check(ev(page, 'window.WRITES') == [], 'the review changed nothing')
    page.click('#st-move-go')
    page.wait_for_function("() => (window.ASSIGNED[9010] || []).length === 1 && window.ASSIGNED[9010][0] === 202", timeout=30000)
    check(ev(page, 'window.ASSIGNED[9010]') == [202], 'Assign: Mo Magee is on Pat now, and off Dustin')
    check(not ev(page, 'window.timePuts || null'), 'its time wasn\'t changed')
    check(errors == [], 'a move: no page errors: %s' % errors)
    page.close()

    # ================= Two jobs at the same time: a swap =================
    page, errors = start(b, SWAP)
    o = trade(page)
    t = trades(page)
    check(t and t[0][0] == 'swap' and sorted(t[0][1]) == ['7010', '7011'] and 'same time: they trade' in t[0][2], 'Mo Magee and Hal Hatt (both 10:30) swap: Dustin ↔ Pat (%s)' % t)
    check(t and 'Dustin → Pat' in t[0][2] and 'Pat → Dustin' in t[0][2], 'each job says who it goes from and to')
    page.locator('#st-opt-out .st-trade').first.locator('.st-trade-one').click()
    page.wait_for_function("() => /Move Jobs/.test(document.querySelector('#st-toolbox .st-head').innerText)", timeout=10000)
    tb = page.inner_text('#st-toolbox')
    check('#7010' in tb and '#7011' in tb, '➡️ Just this one: both jobs of the swap in Move Jobs')
    check(errors == [], 'a swap: no page errors: %s' % errors)
    page.close()

    # ================= Not when the other tech is busy then, or it's their last job =================
    page, errors = start(b, MAGEE.replace("}\"", "") .rstrip('}') + " window.EVENTS = { 202: [{ start: at(10), end: at(12, 30) }] }; }")
    o = trade(page)
    check('No trades to suggest' in o, 'Pat has a meeting 10–12:30: no trade (%r)' % o[:120])
    page.close()
    # Mo Magee is the only job on the board: Pat is closer, but it's Dustin's only job that day.
    page, errors = start(b, MAGEE.rstrip('}') + " APPTS.splice(0, APPTS.length, ...APPTS.filter(a => a.job === 7010)); }")
    o = trade(page)
    check('No trades to suggest' in o, "Mo Magee is Dustin's only job: it isn't taken from him (%r)" % o[:120])
    page.close()

    # ================= A skill the other tech doesn't have =================
    page, errors = start(b, MAGEE.rstrip('}') + " JOB_SKILLS[7010] = [9]; SKILLS[9] = 'Master Tech'; }")
    o = trade(page)
    moved = [j for _, jobs, _ in trades(page) for j in jobs]
    check('7010' not in moved and "needs a skill the other tech doesn't have" in o, "Mo Magee needs a skill Pat doesn't have: not traded, and it says so (%s)" % moved)
    check(errors == [], 'skills: no page errors: %s' % errors)
    page.close()

    # ================= Another department's job isn't traded to them =================
    page, errors = start(b, MAGEE.replace("jobType: Q, jobTypeId: 11", "jobType: 'Plumbing - Clogged Drain', jobTypeId: 31"))
    o = trade(page)
    check('No trades to suggest' in o, 'a plumbing job in Magee isn\'t traded to Pat (a project coordinator) (%r)' % o[:120])
    page.close()

    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
