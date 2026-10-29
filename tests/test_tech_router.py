"""🧭 Tech Router (Beta), 2.1.

Its name says Beta and it warns that it isn't finished each time it's opened.
📞 Fill a spot: for a tech whose day is planned, it finds their open time (first thing, mid-day, end
of day) and suggests jobs from the Unassigned list (the board's day and the next 14) and the Hold list
that suit them, learned from the last 4 weeks of schedules: a project coordinator gets quotes, not
electrical or plumbing ones. Jobs too long for the time or too far out of the way are left out; the
closest come first, a job whose time already fits first of all. Each has the customer's phone number.
It never changes anything: ➡️ only fills in Move Jobs.
🔎 Closest techs: the techs closest to a zip code or a job, and 📍 Next job for the tech on a job.

Runs on tests/board_router.html (the fake new board for tomorrow, with stand-ins for Mapbox and the
US Census)."""
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
def msg(page):
    return page.inner_text('#st-router-msg')
def start(b, setup=None):
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    ev(page, "() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '2.1'); }")
    if setup: ev(page, setup)
    page.evaluate(TOOLBOX)
    return page, errors
def open_router(page):
    if B(page, '← Menu').count(): B(page, '← Menu').click()
    page.locator('#st-toolbox .st-tile', has_text='Tech Router').click()
    page.wait_for_function("() => document.querySelectorAll('#st-router-tech option').length > 2", timeout=10000)
def find(page, tech, where=None):
    page.select_option('#st-router-tech', str(tech))
    if where: B(page, where).click()
    page.click('#st-router-find')
    page.wait_for_function("() => !document.getElementById('st-router-find').disabled && (document.getElementById('st-router-fill-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=30000)
def gaps(page):
    """[(kind, [customer names in order])] for the open times shown (every one, Show more pressed)."""
    for i in range(6):
        more = page.locator('#st-router-fill-out button', has_text='Show more')
        if not more.count(): break
        more.first.click()
    return ev(page, """() => Array.from(document.querySelectorAll('#st-router-fill-out .st-router-gap')).map(g => [g.getAttribute('data-kind'),
      Array.from(g.querySelectorAll('.st-router-card')).map(c => c.querySelector('span').textContent.replace(/^\\d+\\. /, ''))])""")
def card(page, name):
    return ev(page, "(n) => { const c = Array.from(document.querySelectorAll('#st-router-fill-out .st-router-card')).find(c => c.querySelector('span').textContent.replace(/^\\d+\\. /, '') === n); return c ? c.innerText : ''; }", name)
def out(page):
    return page.inner_text('#st-router-fill-out')

with sync_playwright() as p:
    b = p.chromium.launch()

    # ================= The name and the Beta warning =================
    page, errors = start(b)
    tile = page.locator('#st-toolbox .st-tile', has_text='Tech Router').inner_text()
    check('Tech Router' in tile and 'BETA' in tile, 'the menu tile says Tech Router and BETA (%r)' % tile.replace('\n', ' '))
    open_router(page)
    check(page.inner_text('#st-toolbox .st-head') .startswith('🧭 Tech Router (Beta)'), 'the title says Tech Router (Beta)')
    warn = page.locator('#st-toolbox .st-router-beta')
    check(warn.is_visible() and "isn't finished" in warn.inner_text(), 'opening it warns that it isn\'t finished')
    warn.locator('button', has_text='Got it').click()
    check(not warn.is_visible(), 'Got it hides the warning')
    B(page, '← Menu').click()
    open_router(page)
    check(warn.is_visible(), 'opened again: the warning shows again')
    check(page.locator('#st-toolbox .st-head').inner_text().find('Beta') > -1, 'still Beta in the title')

    # ================= 📞 Fill a spot: a project coordinator =================
    find(page, 201)
    g = gaps(page)
    print(g)
    kinds = [k for k, _ in g]
    check(kinds == ['mid', 'last'], 'Dustin (8–10, 1–3, shift 8–5): open mid-day and at the end of the day (%s)' % kinds)
    names = set(n for _, l in g for n in l)
    check('Sparky Lamp' not in names and 'Drippy Sink' not in names and 'Leaky Pipe' not in names and 'Big Install' not in names,
          'no electrical, plumbing or install jobs for a project coordinator (%s)' % sorted(names))
    check({'Near Quote', 'Gen Later', 'Holly Heater', 'Lee Turnover'} <= names, 'quotes from today, later days and the Hold list are suggested (%s)' % sorted(names))
    check('Way Off' not in names, 'a quote 90 miles away is left out')
    check('Just Call' not in names, 'a phone-call-only job isn\'t suggested (it isn\'t a visit)')
    check('Long Quote' not in names, 'a 4-hour job is too long for a 3-hour opening')
    mid = dict(g)['mid']; last = dict(g)['last']
    check(mid[0] == 'Near Quote', 'mid-day: the job already in that time and close by comes first (%s)' % mid[:3])
    check(mid.index('Holly Heater') > mid.index('Lee Turnover'), 'a job 58 minutes out of the way comes after the close ones, even at High priority (%s)' % mid)
    check(mid.index('Gen Later') > mid.index('Holly Heater'), 'a job that needs a skill he doesn\'t have ranks lower (%s)' % mid)
    check(last[0] == 'Late Quote', 'end of day: the job already at 3:30 comes first (%s)' % last[:3])
    c = card(page, 'Near Quote')
    check('(601) 555-0101' in c, 'the customer\'s phone number is on the card')
    check('its time fits' in c and 'Dustin did 5 of these' in c, 'it says why: the time fits, and Dustin did 5 like it (%r)' % c[:300])
    check('Unassigned' in c and 'from their 8–10 AM job in Hattiesburg' in c and 'on to their 1–3 PM job in Petal' in c, 'it says where the driving is from and to')
    c = card(page, 'Gen Later')
    check("Needs a skill Dustin doesn't have: Generator Certified" in c, 'and its card says which skill (%r)' % c[:400])
    check('3 days later' in c and 'call to move it up' in c, 'a job 3 days later: call to move it up (%r)' % c[:200])
    check('Move Jobs' not in c, 'a job on another day isn\'t handed to Move Jobs (it needs a call first)')
    c = card(page, 'Holly Heater')
    check('On hold' in c and 'call to book it' in c and 'High priority' in c, 'a hold: on hold, call to book it, High priority (%r)' % c[:220])
    c = card(page, 'Lee Turnover')
    check('"Quote - Lead Turn Over" jobs' in c and 'rare' in c, 'a rare job type is matched by the start of its name (%r)' % c[:260])
    c = card(page, 'New Kind')
    check('No recent jobs like it' in c, 'a job type with nothing to go by is marked ⚠️')
    o = out(page)
    check('Left out: 4 jobs other departments do' in o and '1 phone-call-only job' in o, 'it says how many jobs other departments do, and phone-call-only jobs (%s)' % re.findall(r'Left out: [^\n]*', o))
    check('too long for this time' in o and 'out of the way' in o, 'and what was too long or too far')
    check(ev(page, 'NB.pastCalls') == 4, 'the last 4 weeks were read in 4 parts (%s)' % ev(page, 'NB.pastCalls'))
    check(ev(page, "() => window.mapboxCookies") is None, 'Mapbox is asked without cookies')
    coords = ev(page, 'window.mapboxCoords')
    check(all(abs(x * 100 - round(x * 100)) < 1e-6 for pt in coords for x in pt), 'every point sent to Mapbox is rounded to about half a mile (%d points)' % len(coords))
    check(ev(page, 'window.WRITES') == [], 'nothing was changed in ServiceTitan (%s)' % ev(page, 'window.WRITES'))
    hl = ev(page, "() => Array.from(NB.host.shadowRoot.querySelectorAll('style')).map(s => s.textContent).join('')")
    check('data-technician-id="201"' in hl, 'Dustin\'s name is highlighted on the board')

    # Only the end of the day; the 4 weeks aren't read again.
    find(page, 201, '🌇 End')
    check([k for k, _ in gaps(page)] == ['last'], 'End: only the end of the day')
    check(ev(page, 'NB.pastCalls') == 4, 'searching again doesn\'t read the 4 weeks again')
    B(page, 'Any time').click()

    # No holds.
    page.uncheck('#st-router-hold')
    find(page, 201)
    names = set(n for _, l in gaps(page) for n in l)
    check(not ({'Holly Heater', 'Lee Turnover', 'New Kind'} & names), 'Holds unticked: no holds (%s)' % sorted(names))
    page.check('#st-router-hold')

    # ➡️ Move Jobs: the same-day job and Dustin filled in, nothing changed.
    find(page, 201)
    page.locator('#st-router-fill-out .st-router-card', has_text='Near Quote').first.locator('button', has_text='Move Jobs').click()
    page.wait_for_function("() => document.getElementById('st-move-to') && document.getElementById('st-move-to').value === '201'", timeout=10000)
    tb = page.inner_text('#st-toolbox')
    check('#7101' in tb and '🔀 Move Jobs' in page.inner_text('#st-toolbox .st-head'), '➡️ opens Move Jobs with the job and Dustin in To')
    check(ev(page, 'window.WRITES') == [], 'still nothing changed (Move Jobs waits for Review and Move)')
    check(errors == [], 'no page errors: %s' % errors)
    page.close()

    # ================= Other days =================
    page, errors = start(b)
    open_router(page)
    # The plumber: plumbing jobs, not quotes.
    find(page, 204)
    names = set(n for _, l in gaps(page) for n in l)
    check('Drippy Sink' in names and 'Leaky Pipe' in names and 'Near Quote' not in names, 'a plumber gets the plumbing jobs, not the quotes (%s)' % sorted(names))
    check([k for k, _ in gaps(page)] == ['open'], 'no jobs that day: open all day')
    # Time off.
    find(page, 207)
    check('has time off' in out(page), 'a tech with time off: says so (%r)' % out(page)[:200])
    # Time off on the board at the same time as a job: not counted (it would hide the whole day).
    find(page, 203)
    o = out(page)
    check("isn't counted" in o and 'has time off' not in o and 'Open:' in o, 'time off at the same time as his job isn\'t counted, and it says so (%r)' % o[:300])
    # No shift on the board.
    find(page, 202)
    check('No shift on the board (8 AM–5 PM used)' in out(page), 'no shift on the board: 8 AM–5 PM is used')
    # Sales: a long day of driving already.
    find(page, 205)
    o = out(page)
    check('Sales goal' in o and 'sales goal is under 5 hr 30 min' in o, 'sales: a job that adds to an already long day of driving is marked ⚠️')
    # A meeting in the middle of the day splits the opening.
    ev(page, "() => { window.EVENTS = { 201: [{ start: (() => { const d = new Date(NB.day()); d.setHours(11, 0, 0, 0); return d; })(), end: (() => { const d = new Date(NB.day()); d.setHours(12, 0, 0, 0); return d; })() }] }; }")
    ev(page, "() => NB.render()")
    page.wait_for_timeout(300)
    find(page, 201)
    o = out(page)
    check('10–11 AM' in o and '12–1 PM' in o and '1 other event' in o, 'a meeting 11–12 splits the mid-day opening (%s)' % re.findall(r'Open: [^\n]*', o))
    check(errors == [], 'other days: no page errors: %s' % errors)
    page.close()

    # ================= Mapbox down: guesses, marked ~ =================
    page, errors = start(b, "() => { window.MAPBOX_DOWN = true; }")
    open_router(page)
    find(page, 201)
    o = out(page)
    check('Near Quote' in o and '~+' in o and 'guesses from straight-line miles' in o, 'Mapbox down: guesses marked ~, and it says so')
    page.close()

    # ================= The Hold list can't be read: the rest still works, and it says so =================
    page, errors = start(b, "() => { window.HOLD_DOWN = true; }")
    open_router(page)
    find(page, 201)
    o = out(page)
    check('Near Quote' in o and "Couldn't read the Hold list" in o, 'Hold list down: Unassigned jobs still suggested, and it says the Hold list couldn\'t be read')
    page.close()

    # ================= The 4 weeks can't be read: it stops rather than guess =================
    page, errors = start(b, "() => { window.PAST_BAD = true; }")
    open_router(page)
    find(page, 201)
    check("Couldn't read the last 4 weeks" in msg(page) and ev(page, "() => document.getElementById('st-router-fill-out').style.display") == 'none', 'no 4 weeks to learn from: says so and suggests nothing (%r)' % msg(page))
    check('Tech Router' in ev(page, "() => document.getElementById('st-toolbox').innerText") and 'ServiceTitan may have changed' in page.inner_text('#st-toolbox'), 'and the yellow bar says what changed')
    page.close()

    # ================= Picking the tech on the board =================
    page, errors = start(b)
    open_router(page)
    page.locator('#st-toolbox button[title^="Pick the tech"]').click()
    page.locator('.technician[data-technician-id="201"]').click()
    page.wait_for_function("() => document.getElementById('st-router-fill-out').style.display !== 'none'", timeout=30000)
    check(page.input_value('#st-router-tech') == '201' and 'Dustin J' in out(page), 'clicking Dustin\'s name on the board picks him and looks')
    check(ev(page, "() => (window.opened || []).indexOf('tech201')") == -1, 'the board itself didn\'t get the click (no tech menu)')
    page.close()

    # ================= 🔎 Closest techs =================
    page, errors = start(b)
    open_router(page)
    B(page, 'Closest techs').click()
    page.fill('#st-router-input', '39465')
    page.click('#st-router-near-find')
    page.wait_for_function("() => document.getElementById('st-router-near-out').style.display !== 'none'", timeout=20000)
    names = ev(page, "() => Array.from(document.querySelectorAll('#st-router-near-out .st-router-near-name')).map(e => e.textContent)")
    check(names[:1] == ['Eli E'], 'closest to Petal (39465): Eli, who lives there, first (%s)' % names)
    check('Office Owen' not in ev(page, "() => document.getElementById('st-router-near-out').innerText"), 'field techs only: office staff left out')
    # A job with a tech: Next job for that tech.
    page.fill('#st-router-input', '7002')
    page.click('#st-router-near-find')
    page.wait_for_function("() => document.getElementById('st-router-near-out').style.display !== 'none' && /Next job/.test(document.getElementById('st-router-near-out').innerText)", timeout=20000)
    o = page.inner_text('#st-router-near-out')
    check('Next job for Dustin' in o and 'Late Quote' in o, 'job #7002 (Dustin, 1–3 PM): Next job lists the 3:30 quote nearby (%r)' % o[:300])
    check('Sparky Lamp' not in o and 'Drippy Sink' not in o, 'Next job: no electrical or plumbing jobs for him')
    check(ev(page, "() => NB.host.shadowRoot.innerHTML.indexOf('7002') > -1") and 'data-job-appointment-id="9002"' in ev(page, "() => Array.from(NB.host.shadowRoot.querySelectorAll('style')).map(s => s.textContent).join('')"), 'the job is highlighted on the board')
    check(ev(page, 'window.WRITES') == [], 'Closest techs changed nothing')
    check(errors == [], 'closest techs: no page errors: %s' % errors)
    page.close()

    # ================= Nothing scrolls sideways; leaving and closing tidy up =================
    page, errors = start(b)
    open_router(page)
    find(page, 201)
    wide = ev(page, """() => Array.from(document.querySelectorAll('#st-toolbox *')).filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 2 &&
      /(auto|scroll)/.test(getComputedStyle(e).overflowX)).map(e => e.tagName + ' ' + e.clientWidth + '<' + e.scrollWidth)""")
    check(wide == [], 'nothing in Tech Router scrolls sideways: %s' % wide)
    B(page, '← Menu').click()
    hl = ev(page, "() => Array.from(NB.host.shadowRoot.querySelectorAll('style')).map(s => s.textContent).join('')")
    check('data-technician-id="201"' not in hl, 'back to the menu: the highlight goes')
    ev(page, "() => window.__stToolbox.close()")
    page.wait_for_timeout(700)
    check(page.locator('#st-toolbox').count() == 0, 'closes cleanly')
    check(errors == [], 'no page errors: %s' % errors)
    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
