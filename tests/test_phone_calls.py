"""📱 Customer Texts never texts PHONE CALL ONLY jobs (2.4.5): on the board, in the Unassigned list,
on the Hold list, picked from the Jobs Tray or typed, and a customer with a phone call and a visit
gets texted about the visit."""
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

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first

def panel_text(page):
    return page.locator('#st-toolbox').inner_text()

def review(page, label):
    B(page, label).click()
    page.wait_for_function("() => /Will text|Nobody to text/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    return panel_text(page)

def split(t):
    """(will text part, skipping part) of the check screen."""
    will = t.split('Will text')[1] if 'Will text' in t else ''
    skip = t.split('Skipping')[1] if 'Skipping' in t else ''
    return will.split('Skipping')[0], skip

def add_jobs(page, nums):
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').filter(has_not_text='folder').first.click()

def wait_done(page, timeout=60):
    end = time.time() + timeout
    time.sleep(0.4)
    while time.time() < end:
        if not page.evaluate("() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))"): return True
        fastclock.skip(page)
    return False

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    fastclock.install(page)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    # 6002 (Lou Ng, on the board) and 7101 (Pia Lane, Unassigned) are phone calls. Kim Wu has a visit
    # on the board (6001) and a phone call in the Unassigned list (7102). Hold 5004 (Carl Diaz) is one too.
    page.add_init_script("window.JOB_TYPES = { 6002: 'PHONE CALL ONLY', 7101: 'PHONE CALL ONLY', 7102: 'PHONE CALL ONLY', 5004: 'PHONE CALL ONLY', 5006: 'Phone Call Only' };")
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate(TOOLBOX)
    B(page, 'Customer Texts').click()

    # ＋ Everyone on the board: the phone calls are skipped, with why; Kim Wu is texted about her visit
    B(page, '🚚 Tech Updates').click()
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').first.locator('input').check()
    B(page, 'Everyone on the board').click()
    page.wait_for_function("() => /Added \\d+ job|Couldn't load everyone/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    t = review(page, 'Start (type only)')
    print(t)
    will, skip = split(t)
    check('Lou Ng' not in will and 'Pia Lane' not in will, 'phone calls on the board and in Unassigned not texted')
    check('PHONE CALL ONLY' in skip and 'Lou Ng' in skip and 'Pia Lane' in skip, 'both listed as skipped, saying why')
    check('Kim Wu' in will and '#6001' in will, 'Kim Wu (a visit and a phone call) texted about her visit (#6001)')
    check('Mo Day' in will, 'a regular job still texted')
    log = page.evaluate("() => window.apiLog")
    check(not any('ownerId=21&' in x or 'ownerId=31&' in x for x in log), "a phone call's numbers aren't even looked up")
    B(page, 'Cancel').click()

    # A Hold-list job picked from the Jobs Tray: its type isn't on the tray row, so the Hold list is
    # read for it once it's loaded
    B(page, 'Clear').click()
    B(page, 'Pick on board').click()
    page.click('.job-list tr.qa-job-5006 td')
    add_jobs(page, '6003')

    # The Hold list: a phone-call hold in a ticked kind is skipped
    page.locator('#st-toolbox label:visible', has_text='Hold list').first.locator('input').check()
    B(page, 'Load holds').click()
    page.wait_for_function("() => /\\d+ holds/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    # 5004's type is PHONE CALL ONLY, so it's its own kind on the Hold list; ticking it still texts nobody there
    page.locator('#st-toolbox label:visible', has_text='Quote (').first.locator('input').check()
    page.locator('#st-toolbox label:visible', has_text='PHONE CALL ONLY (').first.locator('input').check()
    t = review(page, 'Start (type only)')
    print(t)
    will, skip = split(t)
    check('Carl Diaz' not in will and 'Carl Diaz' in skip and 'PHONE CALL ONLY' in skip, 'a PHONE CALL ONLY hold skipped, saying why')
    check('Deede Oubre' in will, 'other holds still texted')
    B(page, 'Cancel').click()

    # Back to picked jobs, now the Hold list is loaded: the tray-picked phone-call hold is found and skipped
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').first.locator('input').check()
    t = review(page, 'Start (type only)')
    print(t)
    will, skip = split(t)
    check('Eve Hall' in skip and 'PHONE CALL ONLY' in skip and 'Eve Hall' not in will, 'tray-picked hold found as a phone call from the Hold list ("Phone Call Only", any case)')
    check('Mo Day' in will, 'typed board job texted')
    B(page, 'Cancel').click()

    # A typed Unassigned phone call (not on the timeline): found from the Unassigned list
    B(page, 'Clear').click()
    add_jobs(page, '7101 6003')
    t = review(page, 'Start (type only)')
    print(t)
    will, skip = split(t)
    check('Pia Lane' in skip and 'Pia Lane' not in will and 'Mo Day' in will, 'typed Unassigned phone call skipped')
    B(page, 'Cancel').click()

    # Auto-send: nothing reaches a phone call's number
    B(page, 'Clear').click()
    add_jobs(page, '6002 6003')
    page.locator('#st-toolbox label:visible', has_text='Auto-send').locator('input').check()
    t = review(page, 'Review and send to 2 customers')
    page.fill('#st-ct-confirm-count', '1')
    B(page, 'Send 1 text').click()
    check(wait_done(page), 'auto-send run finishes')
    nums = [x[0] for x in page.evaluate("() => window.SENT.slice()")]
    check('6015550021' not in nums and '6015550022' in nums, 'auto-send: phone call not texted, the other one was: %s' % nums)

    check(not errors, 'no page errors: %s' % errors)

    # 🌙 Late jobs: ＋ Everyone on the board and ＋ A department… leave out jobs at 6 PM or later
    # (6003 Mo Day at 6:30 PM on the board, 7101 Pia Lane at 7 PM in Unassigned); clicked or typed, they're texted
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    fastclock.install(page)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("window.APPT_HOUR = { 6003: 18.5, 7101: 19 };")
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate(TOOLBOX)
    B(page, 'Customer Texts').click()
    B(page, '🚚 Tech Updates').click()
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').first.locator('input').check()
    def everyone():
        B(page, 'Everyone on the board').click()
        page.wait_for_function("() => /Added \\d+ job|Couldn't load everyone/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
        return panel_text(page)
    t = everyone()
    check('🌙 Left out 2 jobs at 6 PM or later' in t, 'everyone: 2 late jobs left out, saying so')
    check('#6003' not in t and '#7101' not in t and '#6001' in t and '#6002' in t, 'the 6:30 PM board job and the 7 PM unassigned job not added')
    # Picked by hand: texted
    add_jobs(page, '6003')
    t = review(page, 'Start (type only)')
    will, skip = split(t)
    check('Mo Day' in will, 'a late job typed in by hand is texted')
    B(page, 'Cancel').click()
    B(page, 'Clear').click()
    B(page, 'Pick on board').click()
    page.locator('a.appointment', has_text='Mo Day').first.click()
    check('#6003' in panel_text(page), 'a late job clicked on the board is added')
    B(page, 'Clear').click()
    # ＋ A department…
    page.locator('#st-toolbox select:visible').filter(has_text='A department').first.select_option(value='Install HVAC')
    page.wait_for_function("() => /Added \\d+ job|All \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    t = panel_text(page)
    check('🌙 Left out 1 job at 6 PM or later' in t and '#6003' not in t, 'department: the late job left out')
    # ⚙️ Settings: 7 PM, then Off
    B(page, 'Clear').click()
    B(page, '⚙️ Settings').click()
    check(page.eval_on_selector('#st-ct-late', 'e => e.value') == '18', 'setting shows 6 PM by default')
    page.select_option('#st-ct-late', '19')
    B(page, 'Save').click()
    t = everyone()
    check('🌙 Left out 1 job at 7 PM or later' in t and '#6003' in t and '#7101' not in t, '7 PM: the 6:30 job added, the 7 PM one left out')
    B(page, 'Clear').click()
    B(page, '⚙️ Settings').click()
    check(page.eval_on_selector('#st-ct-late', 'e => e.value') == '19', 'setting kept')
    page.select_option('#st-ct-late', 'off')
    B(page, 'Save').click()
    t = everyone()
    check('Left out' not in t and '#6003' in t and '#7101' in t, 'Off: every job added')
    check(not errors, 'no page errors (late jobs): %s' % errors)
    b.close()

print('\n%d failed' % len(fails) if fails else '\nALL PASSED')
sys.exit(1 if fails else 0)
