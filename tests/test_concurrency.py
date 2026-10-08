"""Reading several jobs or customers at once: what happens when ServiceTitan is slow, signs you
out, or keeps failing, when the board changes while a run is going, and when you stop a run
in the middle of reading."""
import sys, time, pathlib, re
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
BOARD = (HERE / 'board.html').as_uri()
TEXTS = (HERE / 'board_texts.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, t): return page.locator('#st-toolbox button:visible', has_text=t).first
def T(page): return page.locator('#st-toolbox').inner_text()
def ev(page, js, arg=None): return page.evaluate(js, arg)
def log_text(page): return ev(page, "() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")
def busy(page): return ev(page, "() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))")
def wait_done(page, t=120):
    time.sleep(0.4); end = time.time() + t
    while time.time() < end:
        if not busy(page): return True
        time.sleep(0.2)
    return False
def fresh(b, url):
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    ev(page, "() => { localStorage.clear(); localStorage.setItem('stSeenVersion', 'x'); }")
    ev(page, TOOLBOX)
    page.wait_for_selector('#st-toolbox')
    return page, errors
def open_tool(page, name):
    """Opens a tool from the menu (or the Home screen)."""
    ev(page, "() => { const h = document.querySelector('#st-toolbox [data-nav=\"menu\"]'); if (h && !h.disabled) h.click(); const b = Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /Menu/.test(b.textContent)); if (b) b.click(); }")
    page.locator('#st-toolbox button:visible', has_text=name).first.click()
def type_jobs(page, nums):
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='All').filter(has_not_text='note').filter(has_not_text='folder').first.click()
def pick_mode(page, text):
    """Type only / Auto-send in Customer Texts (opens the How step first if it's folded)."""
    sec = page.locator('#st-toolbox [data-sec="how"]:visible')
    if sec.count() and sec.get_attribute('aria-expanded') != 'true': sec.click()
    page.locator('#st-toolbox label:visible', has_text=text).locator('input').check()
def stop_quickly(page):
    """Presses Stop; returns how long until the run had stopped."""
    t0 = time.time()
    B(page, 'Stop').click()
    while busy(page) and time.time() - t0 < 60: time.sleep(0.05)
    return time.time() - t0

with sync_playwright() as p:
    b = p.chromium.launch()

    # =================== 🔕 Job Notifications ===================
    JOBS8 = '111111 222222 333333 444444 555555 666666 777777 888888'

    # Stop while it's still reading (ServiceTitan slow: 3 s per read)
    page, errors = fresh(b, BOARD)
    open_tool(page, 'Job Notifications')
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').locator('input').check()
    type_jobs(page, JOBS8)
    ev(page, "() => { window.API_DELAY = 3000; window.apiCalls = 0; }")
    B(page, 'Check jobs').click()
    time.sleep(0.6)
    took = stop_quickly(page)
    calls = ev(page, "() => window.apiCalls")
    check(took < 1.5, 'Notify: Stop during reading takes effect at once (%.1fs)' % took)
    check('Stopped' in log_text(page), 'Notify: the log says it stopped')
    time.sleep(3.5)
    check(ev(page, "() => window.apiCalls") == calls and calls <= 4, 'Notify: no more reads after Stop (%d made)' % calls)
    check(not ev(page, "() => (window.indexOpened || []).length"), 'Notify: no job pages opened after Stop')
    check(errors == [], 'Notify: no page errors: %s' % errors)
    page.close()

    # Signed out: stops with a clear message, opens nothing, changes nothing
    page, errors = fresh(b, BOARD)
    open_tool(page, 'Job Notifications')
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').locator('input').check()
    type_jobs(page, '111111 222222 333333')
    ev(page, "() => { window.API_401 = true; window.apiCalls = 0; }")
    B(page, 'Turn off notifications').click(); B(page, 'Yes, turn them off').click()
    check(wait_done(page, 60), 'Notify signed out: run ends')
    t = T(page)
    check('signed you out' in t, 'Notify signed out: says ServiceTitan signed you out')
    check(not ev(page, "() => (window.indexOpened || []).length"), 'Notify signed out: no job pages opened')
    check(ev(page, "() => JSON.stringify(window.NOTIF || {})") in ('{}', 'null'), 'Notify signed out: nothing changed')
    check('Job Notifications switch' not in t, 'Notify signed out: not reported as a ServiceTitan change')
    check(errors == [], 'Notify signed out: no page errors: %s' % errors)
    page.close()

    # ServiceTitan keeps failing: it stops asking after a few, then opens jobs one at a time
    page, errors = fresh(b, BOARD)
    open_tool(page, 'Job Notifications')
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').locator('input').check()
    type_jobs(page, JOBS8)
    ev(page, "() => { window.API_DOWN = true; window.apiCalls = 0; window.NOTIF = { '444444': false }; }")
    B(page, 'Check jobs').click()
    check(wait_done(page, 120), 'Notify failing: run ends')
    lg = log_text(page); print(lg)
    calls = ev(page, "() => window.apiCalls")
    check(calls <= 4, 'Notify failing: stopped asking after a few failures (%d reads)' % calls)
    check(lg.count('ON (left alone)') == 7 and '444444: already off' in lg, 'Notify failing: every job still checked, on its page')
    check(errors == [], 'Notify failing: no page errors: %s' % errors)
    page.close()

    # The board changes during a real run: decisions use what's true at that job's turn
    page, errors = fresh(b, BOARD)
    open_tool(page, 'Job Notifications')
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').locator('input').check()
    type_jobs(page, '111111 222222 333333 444444 555555')
    ev(page, "() => { window.NOTIF = { '555555': false }; }")
    B(page, 'Turn off notifications').click(); B(page, 'Yes, turn them off').click()
    time.sleep(1.5)
    # Meanwhile, someone else turns 555555 back on and 444444 off.
    ev(page, "() => { window.NOTIF['555555'] = true; window.NOTIF['444444'] = false; }")
    check(wait_done(page, 120), 'Notify stale: run ends')
    lg = log_text(page); print(lg)
    check('444444: already off' in lg, 'Notify stale: a job someone turned off meanwhile is left alone')
    check('555555: turned off' in lg and ev(page, "() => window.NOTIF['555555']") is False, 'Notify stale: a job someone turned back on meanwhile is turned off (not reported "already off")')
    check(errors == [], 'Notify stale: no page errors: %s' % errors)
    page.close()

    # =================== 🏢 Business Unit ===================
    # Stop while it's still reading
    page, errors = fresh(b, BOARD)
    open_tool(page, 'Business Unit')
    type_jobs(page, '111111 222222 666666 901001 901002 901003')
    ev(page, "() => { window.API_DELAY = 3000; window.apiCalls = 0; }")
    B(page, 'Check jobs').click()
    time.sleep(0.6)
    took = stop_quickly(page)
    calls = ev(page, "() => window.apiCalls")
    check(took < 1.5, 'Units: Stop during reading takes effect at once (%.1fs)' % took)
    time.sleep(3.5)
    check(ev(page, "() => window.apiCalls") == calls and calls <= 4, 'Units: no more reads after Stop (%d made)' % calls)
    check(not ev(page, "() => (window.editOpened || []).length"), 'Units: no Edit pages opened after Stop')
    check(errors == [], 'Units: no page errors: %s' % errors)
    page.close()

    # Signed out
    page, errors = fresh(b, BOARD)
    open_tool(page, 'Business Unit')
    type_jobs(page, '901001 901002')
    ev(page, "() => { window.API_401 = true; }")
    B(page, 'Change to Mendenhall Branch').click(); B(page, 'Yes, change them').click()
    check(wait_done(page, 60), 'Units signed out: run ends')
    t = T(page)
    check('signed you out' in t, 'Units signed out: says ServiceTitan signed you out')
    check(not ev(page, "() => (window.editOpened || []).length") and not ev(page, "() => window.saves.length"), 'Units signed out: nothing opened or saved')
    check(errors == [], 'Units signed out: no page errors: %s' % errors)
    page.close()

    # Slow: reads time out (no answer in 15 s); it gives up reading and opens the jobs instead
    page, errors = fresh(b, BOARD)
    open_tool(page, 'Business Unit')
    type_jobs(page, '111111 222222 666666 901001 901002')
    ev(page, "() => { window.API_DELAY = 60000; window.apiCalls = 0; }")
    t0 = time.time()
    B(page, 'Check jobs').click()
    check(wait_done(page, 120), 'Units slow: run ends')
    took = time.time() - t0
    lg = log_text(page); print(lg)
    calls = ev(page, "() => window.apiCalls")
    check(calls <= 4, 'Units slow: stopped asking once reads timed out (%d reads)' % calls)
    check(took < 40, 'Units slow: finished in %.0fs' % took)
    check(lg.count('would change to Mendenhall Branch') == 4 and '666666: already Mendenhall Branch' in lg, 'Units slow: every job still checked, on its page')
    check(errors == [], 'Units slow: no page errors: %s' % errors)
    page.close()

    # The board changes during a real run
    page, errors = fresh(b, BOARD)
    open_tool(page, 'Business Unit')
    type_jobs(page, '901001 901002 901003 666666')
    B(page, 'Change to Mendenhall Branch').click(); B(page, 'Yes, change them').click()
    time.sleep(1.5)
    ev(page, "() => { DB[666666].bu = 591422337; }")   # someone moves 666666 to Gulfport meanwhile
    check(wait_done(page, 120), 'Units stale: run ends')
    lg = log_text(page); print(lg)
    check('#666666: Gulfport Branch → Mendenhall Branch' in lg and ev(page, "() => buName(666666)") == 'Mendenhall Branch', 'Units stale: a job moved off the branch meanwhile is changed (not reported "already")')
    check(errors == [], 'Units stale: no page errors: %s' % errors)
    page.close()

    # =================== 📱 Customer Texts ===================
    def texts_ready(page):
        open_tool(page, 'Customer Texts')
        B(page, 'Load holds').click()
        page.wait_for_function("() => /Loaded \\d+ hold/.test(document.getElementById('st-toolbox').innerText)", timeout=20000)
        page.locator('#st-toolbox label:visible', has_text='Quote (10)').first.locator('input').check()
    def review(page, wait_for='Will text|Nobody to text|signed you out'):
        page.locator('#st-toolbox button:visible').filter(has_text=re.compile(r'Review and send to|Start \(type only\)')).first.click()
        page.wait_for_function("re => new RegExp(re).test(document.getElementById('st-toolbox').innerText)", arg=wait_for, timeout=60000)
        return T(page)

    # Cancel while it's checking customers: no more requests after that
    page, errors = fresh(b, TEXTS)
    texts_ready(page)
    pick_mode(page, 'Auto-send')
    ev(page, "() => { window.API_DELAY = 1500; }")
    page.locator('#st-toolbox button:visible').filter(has_text=re.compile(r'Review and send to|Start \(type only\)')).first.click()
    time.sleep(1.0)
    B(page, 'Cancel').click()
    calls = ev(page, "() => window.apiCalls")
    time.sleep(4)
    more = ev(page, "() => window.apiCalls") - calls
    check(more == 0, 'Texts: Cancel stops the checking (%d requests after Cancel)' % more)
    ev(page, "() => { window.API_DELAY = 60; }")
    t = review(page)
    check('Will text 5 numbers' in t, 'Texts: checking again afterwards gives the full answer')
    check(errors == [], 'Texts cancel: no page errors: %s' % errors)
    page.close()

    # Signed out while checking
    page, errors = fresh(b, TEXTS)
    texts_ready(page)
    ev(page, "() => { window.API_401 = true; }")
    t = review(page)
    check('signed you out' in t, 'Texts signed out: the check says ServiceTitan signed you out')
    check(not B(page, 'Send').count() and not B(page, 'Start').count(), 'Texts signed out: no way to send')
    check(not ev(page, "() => window.chatOpened.length"), 'Texts signed out: no conversations opened')
    B(page, 'Cancel').click()
    B(page, 'Reload').click()
    try:
        page.wait_for_function("() => /Hold list/.test(document.getElementById('st-toolbox').innerText) && /signed you out/.test(document.getElementById('st-toolbox').innerText)", timeout=15000)
        ok = True
    except Exception:
        ok = False
    check(ok, 'Texts signed out: loading the Hold list says so too')
    check(errors == [], 'Texts signed out: no page errors: %s' % errors)
    page.close()

    # ServiceTitan keeps failing on job data: it stops asking, and says who wasn't checked
    page, errors = fresh(b, TEXTS)
    texts_ready(page)
    ev(page, "() => { window.JOB_API_DOWN = true; window.apiLog = []; }")
    t = review(page)
    jobReads = ev(page, "() => window.apiLog.filter(u => u.indexOf('/Job/Index') === 0).length")
    check(jobReads <= 4, 'Texts failing: stopped asking after a few failures (%d job reads)' % jobReads)
    check('Nobody to text' in t and 'ServiceTitan' in t, 'Texts failing: nobody texted, and it says why')
    check(errors == [], 'Texts failing: no page errors: %s' % errors)
    page.close()

    # A hold that's been booked: skipped when checking, and right before its text
    page, errors = fresh(b, TEXTS)
    texts_ready(page)
    pick_mode(page, 'Auto-send')
    ev(page, "() => { JOB_STATUS[5009] = 'Scheduled'; }")   # booked after the Hold list was loaded
    t = review(page)
    print(t)
    check('Gus Ray' in t.split('Skipping')[1] and 'no longer on hold' in t, 'Texts stale: a hold booked since loading is skipped when checking')
    check('Will text 4 numbers' in t, 'Texts stale: 4 to text')
    ev(page, "() => { JOB_STATUS[5012] = 'Scheduled'; }")   # booked while the confirm screen is up
    page.fill('#st-ct-confirm-count', '4')
    B(page, 'Send 4 texts').click()
    check(wait_done(page, 120), 'Texts stale: run ends')
    lg = log_text(page); print(lg)
    nums = [x[0] for x in ev(page, "() => window.SENT")]
    check('Jon Poe' in lg and lg.count('no longer on hold') >= 2 and '6015550012' not in nums, 'Texts stale: a hold booked after checking is skipped right before its text')
    check('6015550009' not in nums and '5045550001' in nums, 'Texts stale: the others still texted')
    check(errors == [], 'Texts stale: no page errors: %s' % errors)
    page.close()

    # Signed out in the middle of texting: stops before the next one
    page, errors = fresh(b, TEXTS)
    texts_ready(page)
    pick_mode(page, 'Auto-send')
    t = review(page)
    page.fill('#st-ct-confirm-count', '5')
    B(page, 'Send 5 texts').click()
    page.wait_for_function("() => window.SENT.length >= 1", timeout=60000)
    ev(page, "() => { window.API_401 = true; }")
    opened = ev(page, "() => window.chatOpened.length")
    check(wait_done(page, 60), 'Texts signed out mid-run: run ends')
    lg = log_text(page); print(lg)
    check('signed you out' in T(page), 'Texts signed out mid-run: says ServiceTitan signed you out')
    check(ev(page, "() => window.chatOpened.length") == opened and len(ev(page, "() => window.SENT")) == 1, 'Texts signed out mid-run: no more conversations opened or texts sent')
    check(errors == [], 'Texts signed out mid-run: no page errors: %s' % errors)
    page.close()

    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
