import sys, time, pathlib
from playwright.sync_api import sync_playwright
HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_notes.html').as_uri()
NOTE = 'Attempted to contact customer. No answer. Left voicemail requesting call back.'
fails = []
def check(c, w):
    print(('PASS ' if c else 'FAIL ') + w)
    if not c: fails.append(w)
def B(page, t): return page.locator('#st-toolbox button:visible', has_text=t).first
def T(page): return page.locator('#st-toolbox').inner_text()
def box(page): return page.evaluate("() => { const t = document.querySelector('.Drawer--open textarea'); return t ? t.value : null; }")
def wait_for(page, fn, secs):
    end = time.time() + secs
    while time.time() < end:
        if fn(): return True
        page.wait_for_timeout(100)
    return fn()

def fresh(page):
    page.goto('about:blank')
    page.goto(URL + '#/DispatchBoard'); page.wait_for_selector('.technician')
    page.evaluate("() => localStorage.clear()")
    page.evaluate(TOOLBOX)
    B(page, 'Notes').click()
    B(page, 'Updates').click()

with sync_playwright() as p:
    b = p.chromium.launch(); page = b.new_page(viewport={'width': 1400, 'height': 900})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))

    # 1. Note first, then the job (the note waits, then goes on as soon as the job is clicked).
    fresh(page)
    B(page, 'No Answer').click()
    check('Now click a job' in T(page), 'note first: waits for a job')
    page.click('a.appointment[data-job-id="7001"]')
    ok = wait_for(page, lambda: box(page) and NOTE in box(page), 12)
    check(ok, 'note first: note typed on the right customer')
    check(page.evaluate("() => location.hash") == '#/customer/5001', 'note first: opened customer 5001')
    check(0 not in page.evaluate("() => window.custOpened"), 'note first: never followed the blank #0 link')
    check('This Page Could Not Be Found' not in page.inner_text('#root'), 'note first: no "Page Could Not Be Found"')
    check('• Notes:' not in T(page), 'note first: no yellow warning for Notes')

    # 2. Job first, note picked while the job panel is still loading.
    fresh(page)
    page.click('a.appointment[data-job-id="7002"]')
    page.wait_for_timeout(150)
    check(page.evaluate("() => !!document.querySelector('.Drawer--open a[href=\"#/Customer/0\"]')"), 'job first: panel still shows the blank link')
    B(page, 'No Answer').click()
    ok = wait_for(page, lambda: box(page) and NOTE in box(page), 12)
    check(ok, 'job first: note typed after the job finished loading')
    check(page.evaluate("() => location.hash") == '#/customer/5002', 'job first: opened customer 5002')
    check(0 not in page.evaluate("() => window.custOpened"), 'job first: never followed the blank #0 link')
    check('• Notes:' not in T(page), 'job first: no yellow warning for Notes')

    # 3. Job fully loaded, then the note (the normal case still works).
    fresh(page)
    page.click('a.appointment[data-job-id="7001"]')
    page.wait_for_timeout(2000)
    check('Job selected' in T(page), 'loaded job: shows "Job selected"')
    B(page, 'No Answer').click()
    ok = wait_for(page, lambda: box(page) and NOTE in box(page), 12)
    check(ok and page.evaluate("() => location.hash") == '#/customer/5001', 'loaded job: note typed on customer 5001')

    # 4. A merged customer: ServiceTitan shows "Page Could Not Be Found". Say so, quickly, and
    #    don't blame a ServiceTitan change.
    fresh(page)
    page.click('a.appointment[data-job-id="7003"]')
    page.wait_for_timeout(2000)
    t0 = time.time()
    B(page, 'No Answer').click()
    ok = wait_for(page, lambda: 'couldn\'t open this customer' in T(page), 8)
    if not ok: print('    panel says: ' + T(page).replace('\n', ' | ')[:400])
    check(ok, 'merged customer: says ServiceTitan couldn\'t open the customer')
    check(time.time() - t0 < 6, 'merged customer: gives up within a few seconds (%.1fs)' % (time.time() - t0))
    check('• Notes:' not in T(page), 'merged customer: no yellow "ServiceTitan may have changed" warning')

    # 5. A job panel that's still loading doesn't trigger the "customer link" warning.
    fresh(page)
    page.evaluate("() => { window.DRAWER_DELAY = 2500; }")
    page.click('a.appointment[data-job-id="7001"]')
    page.wait_for_timeout(2000)
    check('Job loading' in T(page), 'slow job panel: shows "Job loading"')
    check('• Notes:' not in T(page), 'slow job panel: no yellow warning while it loads')
    page.wait_for_timeout(1500)
    check('Job selected' in T(page), 'slow job panel: "Job selected" once loaded')

    check(errors == [], 'no page errors: %s' % errors)
    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
