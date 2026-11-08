"""Reading the board, lighter (2.2), and 🗺️ Plan the day's fixes.

- The board's list of techs is kept 2 minutes: a fresh read of the board only reads the day's schedule
  again (one request ServiceTitan answers before the schedule can be asked for). 🔀 Move Jobs' review
  still reads the list fresh.
- Today's history (Dispatched, Working, Done…) is only asked for on today's board: a later day's is
  always empty.
- A job's summary and the skills it needs come in one answer, read once (📞 Fill a spot, then 🎯 Place a
  job for the same job asks nothing more).
- 🎯 Place a job reads the days after the board's without changing the board's own (the other tools
  still see the board's day).
- 🗺️ Plan the day with ＋ Fit in holds no longer stops with an error when the Hold list can't be read.
- 🗺️ Plan the day checks the skills a planned job needs: one planned onto a tech without them goes to
  someone who has them, or is left not planned, saying which skill.

Runs on tests/board_router.html (the board for tomorrow) and tests/board_send.html (today)."""
import sys, time, pathlib, json, re
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_router.html').as_uri()
SEND = (HERE / 'board_send.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def ev(page, js, arg=None):
    return page.evaluate(js, arg) if arg is not None else page.evaluate(js)
def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first
def calls(page, what):
    return ev(page, "(w) => NB.calls.filter(u => u === '/dispatch-center/' + w).length", what)
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
    time.sleep(0.3)
    return page, errors
def plan(page):
    page.click('#st-toolbox [data-tab=plan]')
    ev(page, "() => { document.getElementById('st-plan-out').style.display = 'none'; }")
    page.click('#st-plan-go')
    page.wait_for_function("() => !document.getElementById('st-plan-go').disabled && (document.getElementById('st-plan-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=60000)
    return page.inner_text('#st-plan-out') if page.is_visible('#st-plan-out') else ''
def find(page, tech):
    page.click('#st-toolbox [data-tab=fill]')
    page.select_option('#st-router-tech', str(tech))
    page.click('#st-router-find')
    page.wait_for_function("() => !document.getElementById('st-router-find').disabled && (document.getElementById('st-router-fill-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=30000)
def place(page, job):
    page.click('#st-toolbox [data-tab=place]')
    ev(page, "() => { document.getElementById('st-place-out').style.display = 'none'; }")
    page.fill('#st-place-input', str(job))
    page.click('#st-place-go')
    page.wait_for_function("() => !document.getElementById('st-place-go').disabled && (document.getElementById('st-place-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=30000)

with sync_playwright() as p:
    b = p.chromium.launch()

    # ================= The tech list kept; no history for a later day =================
    page, errors = start(b)
    r0, d0 = calls(page, 'technicians/resources'), calls(page, 'daily-assignments')
    check(r0 == 1 and d0 >= 1, 'opening Tech Router read the board once (techs %d, schedule %d)' % (r0, d0))
    plan(page)
    r1 = calls(page, 'technicians/resources')
    po = plan(page)
    r2, past = calls(page, 'technicians/resources'), ev(page, 'NB.pastCalls')
    check('planned' in po and r2 == r1, 'planning again reads the day fresh but not the tech list again (techs %d → %d)' % (r1, r2))
    check(calls(page, 'daily-assignments') - past >= 3, 'each plan read the day\'s schedule fresh')
    check(calls(page, 'technicians/activity-history') == 0, 'the board shows tomorrow: today\'s history is never asked for')
    # 🔀 Move Jobs' review reads the list of techs fresh.
    place(page, 7101)
    page.click('#st-place-send')
    page.wait_for_function("() => document.getElementById('st-move-to') && document.getElementById('st-move-to').value === '201'", timeout=10000)
    before = calls(page, 'technicians/resources')
    B(page, 'Review').click()
    page.wait_for_function("() => { const g = document.getElementById('st-move-go'); return g && g.offsetParent && !g.disabled; }", timeout=30000)
    check(calls(page, 'technicians/resources') == before + 1, '🔀 Move Jobs\' review reads the tech list fresh')
    check(errors == [], 'reads: no page errors: %s' % errors)
    page.close()

    # ================= Today's board still reads today's history =================
    page = b.new_page(viewport={'width': 1400, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(SEND + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    ev(page, "() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '2.2'); }")
    page.evaluate(TOOLBOX)
    B(page, 'Tech Messages').click()
    page.wait_for_function("() => NB.calls.some(u => u === '/dispatch-center/technicians/activity-history')", timeout=8000)
    check(True, 'today\'s board: today\'s history is read')
    page.close()

    # ================= A job's summary and skills: read once =================
    page, errors = start(b)
    find(page, 201)
    n = ev(page, 'window.summaryCalls || 0')
    place(page, 7101)
    check(ev(page, 'window.summaryCalls || 0') == n, '🎯 Place a job for a job 📞 Fill a spot just listed asks nothing more for its skills (%d → %d)' % (n, ev(page, 'window.summaryCalls || 0')))
    page.close()

    # ================= Other days don't change the board's own =================
    page, errors = start(b)
    place(page, 7104)
    check(len(ev(page, 'NB.otherCalls') or []) >= 1, '🎯 Place a job read the days after the board\'s')
    find(page, 201)
    fo = page.inner_text('#st-router-fill-out')
    day = ev(page, "() => new Date(APPTS[0].start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })")
    check(day in fo and '2 jobs' in fo, 'then 📞 Fill a spot still sees the board\'s day: %s, Dustin\'s 2 jobs (%r)' % (day, fo[:120]))
    check(day in page.inner_text('#st-plan-go'), 'and 🗺️ Plan still says the board\'s day')
    check(errors == [], 'other days: no page errors: %s' % errors)
    page.close()

    # ================= 🗺️ Plan the day: the Hold list can't be read, with ＋ Fit in holds ticked =================
    page, errors = start(b, "() => { window.HOLD_DOWN = true; }")
    page.click('#st-toolbox [data-tab=plan]')
    page.check('#st-plan-holds')
    po = plan(page)
    check('planned' in po and "Couldn't read the Hold list" in po, 'the plan is still made, and it says the Hold list couldn\'t be read (%r)' % po[-300:])
    check('before initialization' not in page.inner_text('#st-router-msg') and errors == [], 'no error (it used to stop: "Cannot access … before initialization") (%r, %s)' % (page.inner_text('#st-router-msg'), errors))
    page.close()

    # ================= 🗺️ Plan the day: a skill the tech it would go to doesn't have =================
    page, errors = start(b, "() => { JOB_SKILLS[7108] = [5]; }")
    po = plan(page)
    on_dustin = ev(page, "() => Array.from(document.querySelectorAll('#st-plan-out .st-plan-route[data-tech=\"201\"] .st-plan-chip')).map(c => c.textContent).join('|')")
    left = page.inner_text('#st-plan-out .st-plan-left') if page.locator('#st-plan-out .st-plan-left').count() else ''
    others = ev(page, "() => Array.from(document.querySelectorAll('#st-plan-out .st-plan-route:not([data-tech=\"201\"]) .st-plan-chip')).map(c => c.textContent).join('|')")
    check('Late Quote' not in on_dustin, 'Late Quote needs Generator Certified: not planned onto Dustin (who doesn\'t have it) (%r)' % on_dustin)
    check('Late Quote' in others or ('Late Quote' in left and 'needs Generator Certified' in left), 'it went to someone who has it, or is left not planned saying which skill (%r)' % (left or others))
    check(errors == [], 'plan skills: no page errors: %s' % errors)
    page.close()

    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
