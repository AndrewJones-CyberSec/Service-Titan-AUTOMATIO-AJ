"""🧭 Tech Router (Beta), 2.1.

Its name says Beta and it warns that it isn't finished each time it's opened.
📞 Fill a spot: for a tech whose day is planned, it finds their open time (first thing, mid-day, end
of day) and suggests jobs from the Unassigned list (the board's day and the next 14) and the Hold list
that suit them, learned from the last 4 weeks of schedules: a project coordinator gets quotes, not
electrical or plumbing ones. Jobs too long for the time or too far out of the way are left out; the
closest come first, a job whose time already fits first of all. Each has the customer's phone number.
It never changes anything: ➡️ only fills in Move Jobs.
🗺️ Plan the day: a tech and a route for every Unassigned job (8-12s first), ＋ holds to call and book.
✨ Optimize: a tech's route scored 0–100% for its order, the best order of the same jobs and what
moves; 📊 Score every tech lists everyone's score, lowest first. It only suggests.
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
def find(page, tech):
    page.select_option('#st-router-tech', str(tech))
    page.click('#st-router-find')
    page.wait_for_function("() => !document.getElementById('st-router-find').disabled && (document.getElementById('st-router-fill-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=30000)
def gaps(page):
    """[(kind, [customer names in order])] for every open time (each one's tab clicked, Show more pressed).
    The last open time is left showing."""
    out = []
    for i in range(page.locator('#st-router-fill-out .st-gap-chip').count()):
        page.locator('#st-router-fill-out .st-gap-chip').nth(i).click()
        more = page.locator('#st-router-fill-out button', has_text=re.compile(r'^Show \d+ more'))
        if more.count(): more.first.click()
        out.append(ev(page, """() => { const g = document.querySelector('#st-router-fill-out .st-router-gap'); return [g.getAttribute('data-kind'),
          Array.from(g.querySelectorAll('.st-router-card')).map(c => c.querySelector('span').textContent.replace(/^\\d+\\. /, ''))]; }"""))
    return out
def show_gap(page, kind):
    page.locator('#st-router-fill-out .st-gap-chip[data-kind="%s"]' % kind).first.click()
    more = page.locator('#st-router-fill-out button', has_text=re.compile(r'^Show \d+ more'))
    if more.count(): more.first.click()
def card(page, name):
    return ev(page, "(n) => { const c = Array.from(document.querySelectorAll('#st-router-fill-out .st-router-card')).find(c => c.querySelector('span').textContent.replace(/^\\d+\\. /, '') === n); return c ? c.innerText : ''; }", name)
def out(page):
    return page.inner_text('#st-router-fill-out')
def opt(page, tech):
    """✨ Optimize: pick a tech (it checks their route right away) and wait for it."""
    ev(page, "() => { document.getElementById('st-opt-out').style.display = 'none'; }")
    page.select_option('#st-opt-tech', str(tech))
    page.wait_for_function("() => !document.getElementById('st-opt-go').disabled && (document.getElementById('st-opt-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=30000)
def score(page):
    s = page.locator('#st-opt-score')
    return int(s.inner_text().rstrip('%')) if s.count() else -1
def stops(page):
    """The customers on the route shown, in order."""
    return ev(page, "() => Array.from(document.querySelectorAll('#st-opt-out .st-opt-stop')).map(r => r.querySelector('.st-tl-what').textContent.replace(/^(\\d+-\\d+|booked [^A-Z]*[AP]M)/, '').split(' #')[0].trim())")

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
    show_gap(page, 'mid')
    c = card(page, 'Near Quote')
    check('(601) 555-0101' in c, 'the customer\'s phone number is on the card')
    check('its time fits' in c and 'Dustin did 5 of these' in c, 'it says why: the time fits, and Dustin did 5 like it (%r)' % c[:300])
    check('Unassigned' in c and 'from their 8–10 AM job in Hattiesburg' in c and 'on to their 1–3 PM job in Petal' in c, 'it says where the driving is from and to')
    c = card(page, 'Gen Later')
    check('needs Generator Certified' in c, 'and its card says which skill (%r)' % c[:400])
    check('3 days later' in c and 'call to move it up' in c, 'a job 3 days later: call to move it up (%r)' % c[:200])
    check('Assign' not in c, 'a job on another day can\'t be sent to Move Jobs (it needs a call first)')
    c = card(page, 'Holly Heater')
    check('On hold' in c and 'call to book it' in c and '⭐ High' in c, 'a hold: on hold, call to book it, High priority (%r)' % c[:220])
    c = card(page, 'Lee Turnover')
    check('"Quote - Lead Turn Over" jobs' in c, 'a rare job type is matched by the start of its name (%r)' % c[:260])
    c = card(page, 'New Kind')
    check('⚠️ nothing like it to go by' in c, 'a job type with nothing to go by is marked ⚠️')
    o = out(page)
    check('Left out: 8 jobs other departments do' in o and '1 phone-call-only job' in o, 'it says how many jobs other departments do, and phone-call-only jobs (%s)' % re.findall(r'Left out: [^\n]*', o))
    show_gap(page, 'last')
    o = out(page)
    check('too long for this time' in o and 'out of the way' in o, 'and what was too long or too far for that open time')
    check(ev(page, 'NB.pastCalls') == 4, 'the last 4 weeks were read in 4 parts (%s)' % ev(page, 'NB.pastCalls'))
    check(ev(page, "() => window.mapboxCookies") is None, 'Mapbox is asked without cookies')
    coords = ev(page, 'window.mapboxCoords')
    check(all(abs(x * 100 - round(x * 100)) < 1e-6 for pt in coords for x in pt), 'every point sent to Mapbox is rounded to about half a mile (%d points)' % len(coords))
    check(ev(page, 'window.WRITES') == [], 'nothing was changed in ServiceTitan (%s)' % ev(page, 'window.WRITES'))
    hl = ev(page, "() => Array.from(NB.host.shadowRoot.querySelectorAll('style')).map(s => s.textContent).join('')")
    check('data-technician-id="201"' in hl, 'Dustin\'s name is highlighted on the board')

    # Each open time is a tab: Mid-day is shown first (it's the first with jobs); the 4 weeks aren't read again.
    find(page, 201)
    tabs_ = ev(page, "() => Array.from(document.querySelectorAll('#st-router-fill-out .st-gap-chip')).map(b => [b.getAttribute('data-kind'), b.textContent, b.classList.contains('on')])")
    check([t[0] for t in tabs_] == ['mid', 'last'] and tabs_[0][2] and '(7)' in tabs_[0][1], 'the open times are tabs with how many jobs fit, the first one showing (%s)' % tabs_)
    page.locator('#st-router-fill-out .st-gap-chip[data-kind="last"]').click()
    check(page.locator('#st-router-fill-out .st-router-gap').get_attribute('data-kind') == 'last' and 'End of day' in out(page), 'clicking End shows the end of the day')
    check(ev(page, 'NB.pastCalls') == 4, 'searching again doesn\'t read the 4 weeks again')

    # No holds.
    page.uncheck('#st-router-hold')
    find(page, 201)
    names = set(n for _, l in gaps(page) for n in l)
    check(not ({'Holly Heater', 'Lee Turnover', 'New Kind'} & names), 'Holds unticked: no holds (%s)' % sorted(names))
    page.check('#st-router-hold')

    # ➡️ Move Jobs: the same-day job and Dustin filled in, nothing changed.
    find(page, 201)
    page.locator('#st-router-fill-out .st-router-card', has_text='Near Quote').first.locator('button', has_text='Assign').click()
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
    check("isn't counted" in o and 'has time off' not in o and page.locator('#st-router-fill-out .st-gap-chip').count() > 0, 'time off at the same time as his job isn\'t counted, and it says so (%r)' % o[:300])
    # No shift on the board.
    find(page, 202)
    check('no shift on the board (8 AM–5 PM used)' in out(page), 'no shift on the board: 8 AM–5 PM is used')
    # Sales: a long day of driving already.
    find(page, 205)
    o = out(page)
    show_gap(page, 'last')
    o = out(page)
    check('~5 hr' in o and 'driving that day' in o and '⚠️ ~' in o, 'sales: his day of driving shows, and a job that takes it past 5 hr 30 min is marked ⚠️ (%r)' % o[:400])
    # A meeting in the middle of the day splits the opening.
    ev(page, "() => { window.EVENTS = { 201: [{ start: (() => { const d = new Date(NB.day()); d.setHours(11, 0, 0, 0); return d; })(), end: (() => { const d = new Date(NB.day()); d.setHours(12, 0, 0, 0); return d; })() }] }; }")
    ev(page, "() => NB.render()")
    page.wait_for_timeout(300)
    find(page, 201)
    o = out(page)
    mids = ev(page, "() => Array.from(document.querySelectorAll('#st-router-fill-out .st-gap-chip[data-kind=mid]')).map(b => b.textContent)")
    check(len(mids) == 2 and '10–11' in mids[0] and '12–1' in mids[1] and '1 other event' in o, 'a meeting 11–12 splits the mid-day opening (%s)' % mids)
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
    B(page, '🔎 Closest').click()
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

    # ================= 🗺️ Plan the day =================
    def plan(page):
        page.click('#st-plan-go')
        page.wait_for_function("() => !document.getElementById('st-plan-go').disabled && (document.getElementById('st-plan-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=30000)
    def routes(page):
        """{ tech name: [each stop's line] } for the routes shown (every stop showing)."""
        if page.locator('#st-plan-all', has_text='Show every stop').count(): page.click('#st-plan-all')
        return ev(page, """() => Object.fromEntries(Array.from(document.querySelectorAll('#st-plan-out .st-plan-route')).map(r => [r.querySelector('span').textContent.replace(/^[▸▾] /, ''),
          Array.from(r.querySelectorAll('.st-plan-new, .st-plan-stop, .st-plan-hold')).map(x => x.innerText.replace(/\\s+/g, ' '))]))""")
    def who(rts, name):
        return [t for t, stops in rts.items() if any(name + ' #' in x for x in stops)]
    page, errors = start(b)
    open_router(page)
    page.click('#st-toolbox [data-tab=plan]')
    check(re.search(r'Plan (Mon|Tue|Wed|Thu|Fri|Sat|Sun), ', page.inner_text('#st-plan-go')), 'the button says which day it plans (%r)' % page.inner_text('#st-plan-go'))
    plan(page)
    po = page.inner_text('#st-plan-out')
    chips_ = ev(page, "() => Object.fromEntries(Array.from(document.querySelectorAll('#st-plan-out .st-plan-route')).map(r => [r.querySelector('span').textContent.replace(/^[▸▾] /, ''), Array.from(r.querySelectorAll('.st-plan-chip')).map(c => c.textContent)]))")
    check('8 of 10 jobs planned' in po and '4 techs' in po, 'planned 8 of the 10 Unassigned jobs on 4 techs (%r)' % po[:90])
    check(len(chips_.get('Dustin J', [])) == 3 and all(re.match(r'\d+:\d\d \w', c) for c in chips_['Dustin J']), 'at a glance: each tech\'s new jobs as chips with their time (%s)' % chips_.get('Dustin J'))
    check(ev(page, "() => document.querySelectorAll('#st-plan-out .st-tl').length") == 0, 'the routes start folded')
    rts = routes(page)
    print(json.dumps(rts, indent=1))
    check(who(rts, 'Near Quote') == ['Dustin J'] and who(rts, 'Late Quote') == ['Dustin J'], 'the quotes near Dustin\'s day go to Dustin (%s, %s)' % (who(rts, 'Near Quote'), who(rts, 'Late Quote')))
    check(who(rts, 'Sparky Lamp') == ['Eli E'], 'the electrical job goes to the electrician (%s)' % who(rts, 'Sparky Lamp'))
    check(all(who(rts, n) == ['Pam P'] for n in ['Drippy Sink', 'Pipe Burst', 'Slow Drain']), 'the plumbing jobs go to the plumber')
    check(who(rts, 'Big Install') == ['Ian I'], 'the install goes to the installer')
    wins = [re.search(r'(?:AM|PM) (\d+-\d+) ', x).group(1) for x in rts.get('Dustin J', []) if re.search(r'(?:AM|PM) (\d+-\d+) ', x)]
    check(wins == sorted(wins, key=lambda w: int(w.split('-')[0]) % 12 + (0 if w.startswith('8') else 12 if w.startswith('12') else 24)) and wins[:2] == ['8-12', '8-12'] and wins[-1] == '5-9',
          'Dustin\'s route goes 8-12s, then 12-5s, then the 5-9 last (%s)' % wins)
    check(any('Ann Early' in x for x in rts.get('Dustin J', [])) and any('Bo Petal' in x for x in rts.get('Dustin J', [])), 'his jobs already on the board are in his route')
    pam = rts.get('Pam P', [])
    check(pam and 'Pipe Burst' in pam[0], 'the Urgent job is Pam\'s first stop (%s)' % pam[:1])
    check(any('⚠️' in x and 'late' in x for x in pam), 'one of Pam\'s three morning jobs is more than an hour late, marked ⚠️ (%s)' % pam)
    left = page.inner_text('#st-plan-out .st-plan-left')
    check('Way Off' in left and 'no one close has room' in left and 'Just Call' in left and 'phone call only' in left, 'not planned, with why: the far job and the phone call (%r)' % left)
    check(ev(page, 'window.WRITES') == [], 'planning changed nothing')
    check(ev(page, 'window.routeCalls') == 4, 'one drive-time request per route (%s)' % ev(page, 'window.routeCalls'))
    # A 2-hour grace: the late morning job is OK now.
    page.select_option('#st-plan-grace', '120')
    plan(page)
    pam = routes(page).get('Pam P', [])
    check(not any('⚠️' in x for x in pam) and any('late (OK)' in x for x in pam), 'late is OK up to 2 hr: the same stop is fine (%s)' % pam)
    page.select_option('#st-plan-grace', '60')
    # One department at a time: the plumbers, then the sales team.
    opts = ev(page, "() => Array.from(document.querySelectorAll('#st-plan-team option')).map(o => o.textContent)")
    check(opts[:2] == ['All departments', 'Sales & Project Coordinators'] and 'Plumbing Dept - Sales/Service' in opts and 'Project Coordinator' in opts, 'departments by their short names, and the sales team together (%s)' % opts)
    page.select_option('#st-plan-team', 'Plumbing Dept - Sales/Service - James S')
    plan(page)
    rts = routes(page)
    po = page.inner_text('#st-plan-out')
    check(list(rts) == ['Pam P'] and '3 of 3 jobs planned' in po and 'for other departments are left on the Unassigned list' in po, 'Plumbing only: just Pam, her 3 jobs, the rest left for the others (%s, %r)' % (list(rts), po[:120]))
    page.select_option('#st-plan-team', 'sales')
    plan(page)
    rts = routes(page)
    check(set(rts) <= {'Dustin J', 'Pat P', 'Sam S'} and who(rts, 'Near Quote') == ['Dustin J'] and who(rts, 'Drippy Sink') == [], 'Sales & Project Coordinators: only their routes and jobs (%s)' % list(rts))
    page.select_option('#st-plan-team', '')
    # ＋ Fit in holds: off to start; ticked, the electrical hold near Petal goes on Eli's afternoon, to call.
    check(not page.is_checked('#st-plan-holds') and 'Hold Spark' not in page.inner_text('#st-plan-out'), 'holds aren\'t in the plan unless ＋ Fit in holds is ticked')
    page.check('#st-plan-holds')
    plan(page)
    po = page.inner_text('#st-plan-out')
    rts = routes(page)
    eli = rts.get('Eli E', [])
    check(who(rts, 'Hold Spark') == ['Eli E'] and any('⏸️ Hold' in x and '(601) 555-0205' in x and 'call to book it' in x for x in eli), 'the hold goes on Eli\'s route, with the number to call (%s)' % eli)
    check('⏸️ 1 hold to call' in po and 'Far Hold' not in po, 'it says how many holds to call; a hold far from everyone isn\'t fitted in (%r)' % po[:160])
    check('8 of 10 jobs planned' in po and 'Send 8 jobs to Move Jobs' in po, 'the Unassigned jobs are planned the same, and only they go to Move Jobs')
    check(page.evaluate("() => Array.from(document.querySelectorAll('#st-plan-out .st-plan-route[data-tech=\"203\"] .st-plan-chip')).map(c => c.textContent).join('|')").count('⏸️') == 1, 'Eli\'s card shows the hold as a ⏸️ chip')
    page.uncheck('#st-plan-holds')
    plan(page)
    # ➡️ Send to Move Jobs, Review, Assign: each job to its own tech (on this fake page).
    page.click('#st-plan-send')
    page.wait_for_function("() => /Move Jobs/.test(document.querySelector('#st-toolbox .st-head').innerText)", timeout=10000)
    tb = page.inner_text('#st-toolbox')
    check('each job goes to the tech shown' in tb and '→ Dustin J' in tb and '→ Pam P' in tb and '7205' not in tb, 'Move Jobs has the plan: each job with its tech, and no hold')
    B(page, 'Review').click()
    page.wait_for_function("() => { const g = document.getElementById('st-move-go'); return g && g.offsetParent && !g.disabled; }", timeout=30000)
    check('Planned (each job to its own tech)' in page.inner_text('#st-toolbox'), 'the review says it\'s a plan')
    check(ev(page, 'window.WRITES') == [], 'the review changed nothing')
    page.click('#st-move-go')
    page.wait_for_function("() => Object.keys(window.ASSIGNED).length >= 8", timeout=60000)
    page.wait_for_timeout(500)
    A = ev(page, 'window.ASSIGNED')
    want = {'9101': [201], '9108': [201], '9110': [201], '9102': [203], '9103': [204], '9111': [204], '9112': [204], '9105': [206]}
    check(all(A.get(k) == v for k, v in want.items()), 'Assign gave each job its planned tech (%s)' % A)
    check(errors == [], 'plan the day: no page errors: %s' % errors)
    page.close()

    # ================= 🗺️ Plan the day for today, mid-morning =================
    # The page is made on Oct 29 (its board day is Oct 30), then the clock moves to Oct 30, 10:30 AM:
    # Ann Early (Dustin) is done, Ed Volt (Eli) is being worked.
    page = b.new_page(viewport={'width': 1400, 'height': 1000}, timezone_id='America/Chicago')
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.clock.install(time='2026-10-29T10:30:00-05:00')
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    page.clock.set_system_time('2026-10-30T10:30:00-05:00')
    ev(page, "() => { APPTS[0].status = 'Done'; APPTS[4].status = 'Working'; NB.render(); localStorage.clear(); localStorage.setItem('stSeenVersion', '2.1'); }")
    page.evaluate(TOOLBOX)
    open_router(page)
    page.click('#st-toolbox [data-tab=plan]')
    plan(page)
    rts = routes(page)
    po = page.inner_text('#st-plan-out')
    check('🔧 Working now' in po and '✅ From their last job' in po, 'today: Eli starts at the job he\'s working, Dustin at the job he finished')
    times = [re.match(r'(\d+):(\d+) (AM|PM)', x) for stops in rts.values() for x in stops]
    check(all(m and (int(m.group(1)) % 12 + (12 if m.group(3) == 'PM' else 0)) * 60 + int(m.group(2)) >= 10 * 60 + 30 for m in times), 'today: nothing is planned before now (10:30 AM)')
    check('Ann Early' not in po, 'today: a done job isn\'t a stop any more')
    check('Big Install' in page.inner_text('#st-plan-out .st-plan-left'), 'today: the 8-hour install doesn\'t fit anyone\'s day any more')
    # ✨ Optimize today: only what's left of their day.
    page.click('#st-toolbox [data-tab=opt]')
    opt(page, 201)
    check('only one job left' in page.inner_text('#st-opt-out'), 'today: Dustin has one job left (Ann Early is done), nothing to put in order (%r)' % page.inner_text('#st-opt-out'))
    opt(page, 203)
    check('underway' in page.inner_text('#st-opt-out'), 'today: Eli\'s only job is being worked (%r)' % page.inner_text('#st-opt-out'))
    check(errors == [], 'today: no page errors: %s' % errors)
    page.close()

    # ================= ✨ Optimize =================
    # Ian's afternoon zig-zags: Purvis, Petal, then Purvis again (all 12-5s). Pat's day starts with a
    # 12-5 booked at 8 AM, so his 8-12 is late; his 3 PM job has no window (it stays near 3 PM).
    ZIGZAG = """() => { const PM = [{ name: '12-5 AFTERNOON', color: '#ffd6a8' }], AM = [{ name: '8-12 MORNING ', color: '#fff2a8' }], I = 'Install - HVAC - Standard - Residential', Q = 'Quote - HVAC - Central Home System';
      APPTS.push({ id: 9301, job: 7301, techs: [206], customer: 'Zig One', start: at(12), end: at(13), zip: '39475', city: 'Purvis', jobType: I, jobTypeId: 41, tags: PM },
        { id: 9302, job: 7302, techs: [206], customer: 'Zag Two', start: at(13), end: at(14), zip: '39465', city: 'Petal', jobType: I, jobTypeId: 41, tags: PM },
        { id: 9303, job: 7303, techs: [206], customer: 'Zig Three', start: at(14, 30), end: at(15, 30), zip: '39475', city: 'Purvis', jobType: I, jobTypeId: 41, tags: PM },
        { id: 9311, job: 7311, techs: [202], customer: 'Afternoon Al', start: at(8), end: at(10), zip: '39401', city: 'Hattiesburg', jobType: Q, jobTypeId: 11, tags: PM },
        { id: 9312, job: 7312, techs: [202], customer: 'Morning Mo', start: at(10), end: at(11), zip: '39465', city: 'Petal', jobType: Q, jobTypeId: 11, tags: AM },
        { id: 9313, job: 7313, techs: [202], customer: 'Booked Bea', start: at(15), end: at(16), zip: '39401', city: 'Hattiesburg', jobType: Q, jobTypeId: 11, tags: [] });
      NB.render(); }"""
    page, errors = start(b, ZIGZAG)
    open_router(page)
    page.click('#st-toolbox [data-tab=opt]')
    tabs_ = ev(page, "() => Array.from(document.querySelectorAll('#st-toolbox .st-seg button[data-tab]')).map(b => [b.textContent, b.scrollWidth <= b.clientWidth])")
    check([x[0] for x in tabs_] == ['📞 Fill', '🗺️ Plan', '✨ Optimize', '🔎 Closest'] and all(x[1] for x in tabs_), 'four tabs, every name shown in full (%s)' % tabs_)
    check('100%' in msg(page) and 'only suggests' in msg(page), 'it says what it does: a score, and it only suggests (%r)' % msg(page))
    opt(page, 206)
    o = page.inner_text('#st-opt-out')
    sc = score(page)
    check(0 < sc < 100 and 'A better order saves' in o, 'Ian\'s zig-zag scores under 100%% and says what it saves (%s%%, %r)' % (sc, o[:160]))
    check(stops(page) == ['Zig One', 'Zig Three', 'Zag Two'], 'suggested: both Purvis jobs, then Petal on the way home (%s)' % stops(page))
    moves_ = ev(page, "() => Array.from(document.querySelectorAll('#st-opt-out .st-opt-move')).map(e => e.textContent)")
    check(len(moves_) == 2 and moves_[0].startswith('⬆️ Zig Three') and '3rd → 2nd' in moves_[0] and moves_[1].startswith('⬇️ Zag Two'), 'what changes: Zig Three up, Zag Two down (%s)' % moves_)
    check('home at' in o and 'Driving' in o and '→' in o, 'and how the day changes: driving and when they\'re home')
    check(ev(page, "() => document.querySelectorAll('#st-opt-out .st-opt-stop.new').length") == 2, 'the moved jobs stand out on the route')
    page.click('#st-opt-out .st-opt-view[data-view=now]')
    check(stops(page) == ['Zig One', 'Zag Two', 'Zig Three'], 'As it is now: the board\'s order (%s)' % stops(page))
    page.click('#st-opt-out .st-opt-view[data-view=best]')
    check('Leaves home (Hattiesburg)' in page.inner_text('#st-opt-out .st-opt-route') and '🏠 Home' in page.inner_text('#st-opt-out .st-opt-route'), 'the route runs from home to home')
    wide = ev(page, """() => Array.from(document.querySelectorAll('#st-toolbox *')).filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 2 &&
      /(auto|scroll)/.test(getComputedStyle(e).overflowX)).map(e => e.tagName + ' ' + e.clientWidth + '<' + e.scrollWidth)""")
    check(wide == [], 'nothing in ✨ Optimize scrolls sideways: %s' % wide)
    check('data-technician-id="206"' in ev(page, "() => Array.from(NB.host.shadowRoot.querySelectorAll('style')).map(s => s.textContent).join('')"), 'Ian is highlighted on the board')
    check(ev(page, 'window.mapboxCalls') >= 1, 'drive times from Mapbox')
    # Already the best order.
    opt(page, 201)
    o = page.inner_text('#st-opt-out')
    check(score(page) == 100 and 'Already the best order' in o and not page.locator('#st-opt-out .st-opt-moves').count(), 'Dustin (8-12 then 12-5): 100%%, already the best order (%r)' % o[:120])
    # A late 8-12 put first; a job with no window stays near its booked time.
    opt(page, 202)
    o = page.inner_text('#st-opt-out')
    check(score(page) < 90 and 'A better order has 1 fewer late stop' in o, 'Pat: the late 8-12 first is a big gain (%s%%, %r)' % (score(page), o[:160]))
    check(stops(page) == ['Morning Mo', 'Afternoon Al', 'Booked Bea'], 'suggested: the 8-12, the 12-5, then the 3 PM job (%s)' % stops(page))
    check('booked 3 PM' in page.inner_text('#st-opt-out .st-opt-route'), 'the job with no window shows its booked time')
    page.click('#st-opt-out .st-opt-view[data-view=now]')
    check('⚠️' in page.inner_text('#st-opt-out .st-opt-route'), 'As it is now: the late 8-12 is marked ⚠️')
    # Nothing to put in order.
    opt(page, 204)
    check('no jobs' in page.inner_text('#st-opt-out') and msg(page) == 'Nothing to put in order.', 'Pam has no jobs: nothing to put in order')
    opt(page, 203)
    check('only one job' in page.inner_text('#st-opt-out'), 'Eli has one job: nothing to put in order')
    # 📊 Score every tech: lowest first, and a click checks one.
    page.click('#st-opt-all')
    page.wait_for_function("() => !document.getElementById('st-opt-all').disabled && document.getElementById('st-opt-out').style.display !== 'none'", timeout=30000)
    rows = ev(page, "() => Array.from(document.querySelectorAll('#st-opt-out .st-opt-tech')).map(b => [b.getAttribute('data-tech'), parseInt(b.textContent, 10)])")
    check(rows and [r[1] for r in rows] == sorted(r[1] for r in rows) and dict(rows).get('206', 100) < 100 and dict(rows).get('201') == 100 and '204' not in dict(rows) and '208' not in dict(rows),
          'Score every tech: lowest first, Ian and Pat under 100%%, Dustin 100%%, no one without two jobs, no office staff (%s)' % rows)
    page.locator('#st-opt-out .st-opt-tech[data-tech="206"]').click()
    page.wait_for_function("() => !document.getElementById('st-opt-go').disabled && document.getElementById('st-opt-score')", timeout=30000)
    check(page.input_value('#st-opt-tech') == '206' and 'Ian I' in page.inner_text('#st-opt-out'), 'clicking a tech there checks their route')
    # Picking the tech on the board.
    page.locator('#st-toolbox button[title^="Click a tech"]').click()
    page.locator('.technician[data-technician-id="201"]').click()
    page.wait_for_function("() => !document.getElementById('st-opt-go').disabled && document.getElementById('st-opt-score')", timeout=30000)
    check(page.input_value('#st-opt-tech') == '201' and 'Dustin J' in page.inner_text('#st-opt-out'), 'clicking Dustin\'s name on the board checks his route')
    check(ev(page, "() => (window.opened || []).indexOf('tech201')") == -1, 'the board itself didn\'t get the click')
    check(ev(page, 'window.WRITES') == [], 'Optimize changed nothing')
    page.reload()
    page.wait_for_selector('.technician')
    page.evaluate(TOOLBOX)
    open_router(page)
    check(ev(page, "() => document.querySelector('#st-toolbox [data-tab=opt]').classList.contains('on')") and page.input_value('#st-opt-tech') == '201', 'opened again: back on ✨ Optimize with the same tech')
    check(errors == [], 'optimize: no page errors: %s' % errors)
    page.close()
    # A long day (10 jobs): too many to try every order, so it moves one job at a time.
    LONG = """() => { const PM = [{ name: '12-5 AFTERNOON', color: '#ffd6a8' }];
      for (let i = 0; i < 10; i++) APPTS.push({ id: 9400 + i, job: 7400 + i, techs: [206], customer: 'Stop ' + i, start: at(12, i * 25), end: at(12, i * 25 + 20), zip: i % 2 ? '39465' : '39475', city: i % 2 ? 'Petal' : 'Purvis', jobType: 'Install - HVAC - Standard - Residential', jobTypeId: 41, tags: PM });
      NB.render(); }"""
    page, errors = start(b, LONG)
    open_router(page)
    page.click('#st-toolbox [data-tab=opt]')
    t0 = time.time()
    opt(page, 206)
    took = time.time() - t0
    zips = [x.split(' ')[1] for x in stops(page)]
    switches = sum(1 for a_, b_ in zip(zips, zips[1:]) if int(a_) % 2 != int(b_) % 2)
    check(score(page) < 100 and switches <= 2 and took < 10, 'a 10-job zig-zag: grouped by town (%d switches, %s%%, %.1fs)' % (switches, score(page), took))
    check(errors == [], 'long day: no page errors: %s' % errors)
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
