"""🧭 Tech Router → 🎯 Place a job (2.2).

Click a job (on the board or in the Jobs Tray) or type its number: every field tech who does that kind
of job is tried, the job put where it fits best in their day (as 🗺️ Plan the day puts one), and the
best few are shown with why. It says to put it on someone, that it's fine where it is, who'd do it
better, or to RS it, with the best of the next 6 days from those days' schedules (closed days and techs
not working left out). A hold: the best day and tech to book it with. 📱 and 📝 open Customer Texts and
Notes in their 📅 Reschedule folders. It only reads; ➡️ fills in Move Jobs.

Runs on tests/board_router.html (the fake new board for tomorrow, with the days after it, and stand-ins
for Mapbox and the US Census)."""
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
    ev(page, "() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '2.2'); }")
    if setup: ev(page, setup); ev(page, "() => NB.render()")
    page.evaluate(TOOLBOX)
    page.evaluate("() => { const h = document.getElementById('st-exp-head'); if (h && document.getElementById('st-exp').style.display === 'none') h.click(); }")
    page.locator('#st-toolbox .st-tile', has_text='Tech Router').click()
    page.wait_for_function("() => document.querySelectorAll('#st-router-tech option').length > 2", timeout=10000)
    page.click('#st-toolbox [data-tab=place]')
    return page, errors
def place(page, job):
    ev(page, "() => { document.getElementById('st-place-out').style.display = 'none'; }")
    page.fill('#st-place-input', str(job))
    page.click('#st-place-go')
    page.wait_for_function("() => !document.getElementById('st-place-go').disabled && (document.getElementById('st-place-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=30000)
def out(page):
    return page.inner_text('#st-place-out') if page.is_visible('#st-place-out') else ''
def verdict(page):
    return ev(page, "() => { const v = document.querySelector('#st-place-out .st-place-verdict'); return v ? [v.getAttribute('data-kind'), v.innerText] : [null, '']; }")
def cards(page):
    """The techs on its own day, best first: [(tech id, text)]."""
    return ev(page, "() => Array.from(document.querySelectorAll('#st-place-out .st-place-day .st-place-card')).map(c => [c.getAttribute('data-tech'), c.innerText])")
def days(page):
    return ev(page, "() => Array.from(document.querySelectorAll('#st-place-out .st-place-dayrow')).map(r => r.innerText)")
# A job in Magee on Dustin (Hattiesburg), 10:30–12: Pat lives in Magee and has nothing that day.
MAGEE = """() => { const d = new Date(APPTS[0].start), at = (h, m) => { const x = new Date(d); x.setHours(h, m || 0, 0, 0); return x; };
  APPTS.push({ id: 9010, job: 7010, techs: [201], customer: 'Mo Magee', start: at(10, 30), end: at(12), zip: '39111', city: 'Magee', jobType: 'Quote - HVAC - Central Home System', jobTypeId: 11, tags: [{ name: '8-12 MORNING ', color: '#fff2a8' }] }); }"""

with sync_playwright() as p:
    b = p.chromium.launch()

    # ================= An Unassigned job with a good place: put it on Dustin =================
    page, errors = start(b)
    check('🎯 Place' in page.inner_text('#st-toolbox .st-router-tabs') and 'click a job' in msg(page), 'the 🎯 Place tab, saying what to do')
    place(page, 7101)
    k, v = verdict(page)
    c = cards(page)
    check(k == 'here' and 'Put it on Dustin J' in v and '(8-12)' in v, 'Near Quote: put it on Dustin J, in its 8-12 (%s: %r)' % (k, v))
    check(c and c[0][0] == '201' and '✓ in its 8-12' in c[0][1] and 'Dustin did 5 of these' in c[0][1] and 'Arrives ~' in c[0][1], 'Dustin first, with why: in its window, he did 5 of these, when he\'d get there (%r)' % (c[0][1][:300] if c else c))
    check(c and '🕐 booked 11 AM: move it to ~8' in c[0][1], "its booked time (11 AM) isn't when he'd get there: it says to move it (%r)" % (c[0][1][:400] if c else c))
    check('Left out' in out(page), 'who was left out folds away under Left out')
    page.locator('#st-place-out button', has_text='Left out').click()
    o = out(page)
    check('other departments do these' in o and 'off that day' in o, 'Left out says why: other departments, time off (%r)' % o[o.find('Left out'):o.find('Left out') + 300])
    check(ev(page, 'NB.otherCalls') is None, 'a good place on its day: the next days aren\'t read')
    check('📅 Other days (RS)' in o, '📅 Other days (RS) to look anyway')
    check(ev(page, 'window.WRITES') == [], 'placing changed nothing')
    # ➡️ Assign: Move Jobs with the job and Dustin, nothing changed.
    page.click('#st-place-send')
    page.wait_for_function("() => document.getElementById('st-move-to') && document.getElementById('st-move-to').value === '201'", timeout=10000)
    check('#7101' in page.inner_text('#st-toolbox') and '🔀 Move Jobs' in page.inner_text('#st-toolbox .st-head'), '➡️ Assign opens Move Jobs with #7101 and Dustin in To')
    check(ev(page, 'window.WRITES') == [], 'still nothing changed (Move Jobs waits for Review and Move)')
    check(errors == [], 'put it here: no page errors: %s' % errors)
    page.close()

    # ================= A job already on a tech: fine where it is; picked by clicking it on the board =================
    page, errors = start(b)
    page.click('#st-place-pick')
    ev(page, "() => NB.q('[data-job-appointment-id=\"9001\"]').click()")
    page.wait_for_function("() => !document.getElementById('st-place-go').disabled && document.getElementById('st-place-out').style.display !== 'none'", timeout=30000)
    k, v = verdict(page)
    check(page.input_value('#st-place-input') == '7001' and k == 'stay' and 'in a good place on Dustin J' in v, 'Ann Early clicked on the board: it\'s in a good place on Dustin J (%s: %r)' % (k, v))
    check('(on it now)' in out(page), 'the tech it\'s on is marked (on it now)')
    check(ev(page, "() => Array.from(NB.host.shadowRoot.querySelectorAll('style')).some(s => /9001/.test(s.textContent))"), 'the job is outlined on the board')
    page.close()

    # ================= Better on someone else =================
    page, errors = start(b, MAGEE)
    place(page, 7010)
    k, v = verdict(page)
    check(k == 'move' and 'Better on Pat P' in v and "of driving out of Dustin's way" in v, "Mo Magee (on Dustin, in Magee): better on Pat P, who lives there, and how far out of Dustin's way it is (%s: %r)" % (k, v))
    c = cards(page)
    check(c and c[0][0] == '202' and 'Arrives ~10:30 AM' in c[0][1], 'Pat first, getting there at its booked 10:30 (it keeps its time) (%r)' % (c[0][1][:200] if c else c))
    check("It's on Dustin J now, but it doesn't fit their day well" in out(page), 'Dustin (on it now) is said not to fit it well')
    check(ev(page, "() => Array.from(NB.host.shadowRoot.querySelectorAll('style')).some(s => /data-technician-id=\"202\"/.test(s.textContent))"), 'Pat is outlined on the board')
    check(errors == [], 'better on someone else: no page errors: %s' % errors)
    page.close()

    # ================= Nobody can take it on its day: RS it, with the best of the next days =================
    page, errors = start(b)
    place(page, 7104)
    k, v = verdict(page)
    ds = days(page)
    check(k == 'rs' and 'RS it:' in v and 'with Sam S' in v, 'Way Off (Jackson): RS it, to the next day with Sam S, who lives there (%s: %r)' % (k, v))
    check('no room' in v.lower() or 'out of the way' in v, 'it says why not on its day (%r)' % v)
    check(len(ds) == 6 and 'closed' in ds[1] and 'closed' in ds[2] and 'Sam S' in ds[0] and '✓ best' in ds[0], 'the next 6 days: the weekend closed, the first day best (%s)' % ds)
    oc = ev(page, 'NB.otherCalls') or []
    check(len(oc) == 4 and len(set(oc)) == 4, 'each working day of the next 6 read once (%s)' % oc)
    check('📱 Text: reschedule' in v and '📝 RS note' in v, '📱 Text and 📝 RS note to RS it')
    # 📱: Customer Texts in its Reschedule folder, with the job picked.
    page.locator('#st-place-out .st-place-text').click()
    page.wait_for_function("() => /Customer Texts/.test(document.querySelector('#st-toolbox .st-head').innerText)", timeout=10000)
    tb = page.inner_text('#st-toolbox')
    folder = ev(page, "() => { const f = JSON.parse(localStorage.getItem('stCtFolders') || 'null'); const i = Number(localStorage.getItem('stCtFolder')); return f && f[i] ? f[i].name : (document.querySelector('#st-toolbox').innerText.match(/📅 Reschedule/) ? '📅 Reschedule' : null); }")
    check('Reschedule' in (folder or '') and '7104' in tb, '📱 opens Customer Texts in 📅 Reschedule with #7104 picked (%s)' % folder)
    check(ev(page, 'window.SENT || []') == [] and ev(page, 'window.WRITES') == [], 'nothing texted or changed')
    # 📝: Notes in its Reschedule folder.
    B(page, '← Menu').click()
    page.evaluate("() => { const h = document.getElementById('st-exp-head'); if (h && document.getElementById('st-exp').style.display === 'none') h.click(); }")
    page.locator('#st-toolbox .st-tile', has_text='Tech Router').click()
    page.click('#st-toolbox [data-tab=place]')
    page.locator('#st-place-out .st-place-note').click()
    page.wait_for_function("() => /Notes/.test(document.querySelector('#st-toolbox .st-head').innerText)", timeout=10000)
    check('Tech Availability' in page.inner_text('#st-toolbox'), '📝 opens Notes in 📅 Reschedule (its notes showing)')
    check(errors == [], 'RS: no page errors: %s' % errors)
    page.close()

    # ================= A tech not working that day is left out of it =================
    # The day after: only Pat works (and Sam doesn't), so Way Off goes to the next day Sam works.
    page, errors = start(b, "() => { OTHER_DAYS[1].shifts = { 202: [[8, 17]] }; OTHER_DAYS[1].appts = []; }")
    place(page, 7104)
    k, v = verdict(page)
    ds = days(page)
    check(k == 'rs' and 'Sam S' in v and 'Sam S' not in ds[0] and 'Sam S' in ds[3], 'Sam isn\'t working the day after: RS to the next day he is (%s: %r / %s)' % (k, v, ds))
    page.close()

    # ================= A hold: the best day to book it =================
    page, errors = start(b)
    place(page, 7201)
    k, v = verdict(page)
    o = out(page)
    check(k == 'book' and 'book it' in v.lower() and '(601) 555-0201' in v, 'Holly Heater (a hold): the best day to book it, with the number to call (%s: %r)' % (k, v))
    check('Days to book it' in o and '📱 Text: holds' in v and '📝 RS note' not in v, 'its days, and 📱 Text in the Holds folder (no RS note)')
    page.close()

    # ================= Nothing to place =================
    page, errors = start(b)
    place(page, 7109)
    check('A phone call only' in out(page), 'a phone call only: nothing to place')
    place(page, 99999)
    check('Couldn\'t find job #99999' in msg(page), 'a number it can\'t find says so (%r)' % msg(page))
    check(errors == [], 'nothing to place: no page errors: %s' % errors)
    page.close()

    # ================= An evening job runs past an 8–5 shift, and that's fine =================
    page, errors = start(b)
    place(page, 7110)
    k, v = verdict(page)
    check(k == 'here' and '(5-9)' in v, 'Eve Quote (5-9): put it on someone, not "past their shift" (%s: %r)' % (k, v))
    page.close()

    # ================= Skills: a tech without one it needs isn't a clean fit =================
    page, errors = start(b, "() => { JOB_SKILLS[7108] = [5]; }")
    place(page, 7108)
    k, v = verdict(page)
    c = cards(page)
    dustin = [x for t, x in c if t == '201']
    check(k != 'here' and dustin and '⚠️ needs Generator Certified' in dustin[0], 'Late Quote needs Generator Certified: Dustin (without it) is marked, and it isn\'t "put it on him" (%s: %r)' % (k, v))
    check('doesn\'t have Generator Certified' in v or k in ('rs', 'late', 'none'), 'it says why (%r)' % v)
    check(errors == [], 'skills: no page errors: %s' % errors)
    page.close()

    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
