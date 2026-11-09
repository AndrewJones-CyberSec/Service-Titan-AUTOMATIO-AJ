"""📱 Customer Texts (2.5.1):
- ✅ Confirm Appt doesn't text a job already confirmed in ServiceTitan for its day (on the check
  screen, and again right before each text, for one confirmed while the run goes). A customer
  with one confirmed and one unconfirmed appointment that day is still texted. Other folders
  text confirmed jobs as before.
- A conversation with no message box (someone else has it open) is skipped and listed under
  Needs a look; the run goes on. 3 in a row stops it, with the yellow bar."""
import sys, time, pathlib
from playwright.sync_api import sync_playwright
import fastclock

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_texts.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

# Board: Kim Wu 6001 + 7102 (Unassigned), Lou Ng 6002, Mo Day 6003, Pia Lane 7101 (Unassigned).
# Appointment ids are job + 100000.
KIM, LOU, MO, PIA = '6015550020', '6015550021', '6015550022', '6015550031'

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first

def panel_text(page):
    return page.locator('#st-toolbox').inner_text()

def log_text(page):
    return page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")

def review(page, label):
    B(page, label).click()
    page.wait_for_function("() => /Will text|Nobody to text/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    return panel_text(page)

def split(t):
    will = t.split('Will text')[1] if 'Will text' in t else ''
    skip = t.split('Skipping')[1] if 'Skipping' in t else ''
    return will.split('Skipping')[0], skip

def add_jobs(page, nums):
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').filter(has_not_text='folder').first.click()

def wait_done(page, timeout=90):
    end = time.time() + timeout
    time.sleep(0.4)
    while time.time() < end:
        if not page.evaluate("() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))"): return True
        fastclock.skip(page)
    return False

def fresh_chats(page):
    page.evaluate("() => { Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); window.SENT.length = 0; }")

def sent_nums(page):
    return [x[0] for x in page.evaluate("() => window.SENT.slice()")]

def everyone(page):
    B(page, 'Everyone on the board').click()
    page.wait_for_function("() => /Added \\d+ job|Couldn't load everyone/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    fastclock.install(page)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    # Lou Ng's appointment is confirmed. Kim Wu's board one (6001) is, her Unassigned one (7102) isn't.
    page.add_init_script("window.CONFIRMED = { 106002: true, 106001: true };")
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("() => { localStorage.clear(); window.CONFIRMED[106002] = true; window.CONFIRMED[106001] = true; }")
    page.evaluate(TOOLBOX)
    B(page, 'Customer Texts').click()
    fresh_chats(page)

    # ---- ✅ Confirm Appt, ＋ Everyone on the board: the check screen ----
    B(page, '✅ Confirm Appt').click()
    everyone(page)
    t = review(page, 'Start (type only)')
    print(t)
    will, skip = split(t)
    check('Lou Ng' in skip and 'already confirmed' in skip and 'Lou Ng' not in will, 'a confirmed job is skipped, saying why')
    check('Kim Wu' in will, 'Kim Wu (one appointment confirmed, one not) is still texted')
    check('Mo Day' in will and 'Pia Lane' in will, 'unconfirmed jobs are texted')
    B(page, 'Cancel').click()

    # ---- Typed in: the same ----
    B(page, 'Clear').click()
    page.evaluate("() => { window.CONFIRMED[107101] = true; }")
    add_jobs(page, '7101 6003')
    t = review(page, 'Start (type only)')
    will, skip = split(t)
    check('Pia Lane' in skip and 'already confirmed' in skip and 'Mo Day' in will, 'a typed confirmed Unassigned job is skipped too')
    B(page, 'Cancel').click()
    page.evaluate("() => { delete window.CONFIRMED[107101]; }")

    # ---- Confirmed after the check, while the run goes: skipped right before its text ----
    B(page, 'Clear').click()
    add_jobs(page, '6003 7101')
    page.locator('#st-toolbox label:visible', has_text='Auto-send').locator('input').check()
    t = review(page, 'Review and send to 2 customers')
    will, _ = split(t)
    check('Mo Day' in will and 'Pia Lane' in will, 'both on the list before the run')
    page.evaluate("() => { window.CONFIRMED[106003] = true; }")   # a coworker confirms Mo Day
    page.fill('#st-ct-confirm-count', '2')
    B(page, 'Send 2 texts').click()
    check(wait_done(page), 'run finishes')
    lg = log_text(page); print(lg)
    nums = sent_nums(page)
    check(MO not in nums and PIA in nums, 'the one confirmed during the run wasn\'t texted, the other was: %s' % nums)
    check('#6003' in lg and 'already confirmed' in lg, 'the run log says why')
    if B(page, '← Back').count(): B(page, '← Back').click()
    page.evaluate("() => { delete window.CONFIRMED[106003]; }")

    # ---- Another folder texts confirmed jobs as before ----
    fresh_chats(page)
    B(page, '📅 Reschedule').click()
    B(page, 'Clear').click()
    add_jobs(page, '6002')
    page.locator('#st-toolbox label:visible', has_text='Type only').locator('input').check()
    t = review(page, 'Start (type only)')
    will, _ = split(t)
    check('Lou Ng' in will, 'Reschedule still texts a confirmed job')
    B(page, 'Cancel').click()

    # ---- No message box (someone else has the conversation open) ----
    fresh_chats(page)
    B(page, 'Clear').click()
    page.evaluate("ns => { window.NO_BOX = ns; }", [LOU])
    add_jobs(page, '6002 6003')
    page.locator('#st-toolbox label:visible', has_text='Auto-send').locator('input').check()
    review(page, 'Review and send to 2 customers')
    page.fill('#st-ct-confirm-count', '2')
    B(page, 'Send 2 texts').click()
    check(wait_done(page), 'run with one no-box conversation finishes')
    lg = log_text(page); print(lg)
    check(sent_nums(page) == [MO], 'the next customer was texted: %s' % sent_nums(page))
    check('someone else may have it open' in lg and 'Needs a look' in lg and 'Stopped the run' not in lg, 'skipped, listed under Needs a look, not stopped')
    check('ServiceTitan may have changed' not in panel_text(page), 'no yellow bar for one')
    if B(page, '← Back').count(): B(page, '← Back').click()

    # 3 in a row: the Chat Center itself has changed → stop, yellow bar
    fresh_chats(page)
    B(page, 'Clear').click()
    page.evaluate("ns => { window.NO_BOX = ns; }", [KIM, LOU, MO, PIA])
    add_jobs(page, '6001 6002 6003 7101')
    review(page, 'Review and send to 4 customers')
    page.fill('#st-ct-confirm-count', '4')
    B(page, 'Send 4 texts').click()
    check(wait_done(page), 'run with no boxes ends')
    lg = log_text(page); print(lg)
    check('3 conversations in a row had no message box' in lg and 'Stopped the run' in lg, '3 in a row stops the run')
    check(lg.split('Needs a look')[0].count('no message box (someone else') == 3 and '#7101' not in lg, 'it stopped after the third')
    check('ServiceTitan may have changed' in panel_text(page), 'yellow bar shown')
    check(not sent_nums(page), 'nothing sent')

    check(not errors, 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails) if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
