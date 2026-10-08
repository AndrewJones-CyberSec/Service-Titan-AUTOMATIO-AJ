import sys, time, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def wait_idle(page, timeout=90):
    end = time.time() + timeout
    while time.time() < end:
        if page.evaluate("() => { const p = document.getElementById('st-toolbox'); return p && !p.innerText.includes('Stopping') && /Done:|Stopped by|Wait for/.test(p.querySelector('#st-biz-branch').closest('div').parentElement.innerText) }"):
            return True
        time.sleep(0.3)
    return False

def log_text(page):
    return page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox pre')).map(p => p.textContent).join('\\n---\\n')")

def btn(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first

def run_and_wait(page, label, confirm=None, timeout=90):
    page.evaluate("() => { document.querySelectorAll('#st-toolbox pre').forEach(p => p.textContent = ''); }")
    btn(page, label).click()
    if confirm: btn(page, confirm).click()
    time.sleep(0.5)
    end = time.time() + timeout
    while time.time() < end:
        busy = page.evaluate("() => { const s = Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && b.textContent.startsWith('Stop')); return !!s; }")
        if not busy: return True
        time.sleep(0.3)
    return False

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate(TOOLBOX)
    check(page.locator('#st-toolbox').count() == 1, 'toolbox opens')
    check(btn(page, 'Business Unit').count() == 1, 'menu has Business Unit')
    btn(page, 'Business Unit').click()
    opts = page.evaluate("() => Array.from(document.querySelectorAll('#st-biz-branch option')).map(o => o.textContent)")
    check(opts == ['Greenville Branch', 'Gulfport Branch', 'Mendenhall Branch', 'Tupelo Branch'], 'only active branches listed: %s' % opts)
    check(page.evaluate("() => document.getElementById('st-biz-branch').value") == 'Mendenhall Branch', 'Mendenhall is the default')
    check(btn(page, 'Change to Mendenhall Branch').count() == 1, 'change button names the branch')
    check(btn(page, 'Check jobs').is_disabled(), 'check disabled with no jobs')

    # Picking on the board
    btn(page, 'Pick on board').click()
    for j in ['111111', '222222', '333333', '666666', '888888']:
        page.click('a.appointment[data-job-id="%s"]' % j)
    check(page.evaluate("() => window.opened.length") == 0, 'board clicks are captured while picking (job not opened)')
    page.click('a.appointment[data-job-id="222222"]')
    check('Took #222222 off' in page.locator('#st-toolbox').inner_text() and '4 jobs picked' in page.locator('#st-toolbox').inner_text(), 'second click takes a job off')
    page.click('a.appointment[data-job-id="222222"]')
    check('5 jobs picked' in page.locator('#st-toolbox').inner_text(), 'five jobs picked')
    outline = page.evaluate("() => getComputedStyle(document.querySelector('a.appointment[data-job-id=\"111111\"]')).outlineStyle")
    check(outline == 'solid', 'picked jobs are outlined on the board')
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '444444, 777777 12')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').first.click()
    txt = page.locator('#st-toolbox').inner_text()
    check('7 jobs picked' in txt, 'typed job numbers added (short number ignored)')
    check('Cust 111111' in txt, 'board label shown for picked job')

    # Check only
    before = page.evaluate("() => JSON.stringify(Object.keys(DB).map(j => buName(j)))")
    page.evaluate("() => { window.editOpened = []; }")
    t0 = time.time()
    check(run_and_wait(page, 'Check jobs'), 'check run finishes')
    secs = time.time() - t0
    check(page.evaluate("() => window.editOpened.length") == 0 and secs < 6, 'check run reads job data only: no pages opened, %.1fs' % secs)
    lg = log_text(page)
    print(lg)
    check(page.evaluate("() => window.saves.length") == 0, 'check run saved nothing')
    check(page.evaluate("() => JSON.stringify(Object.keys(DB).map(j => buName(j)))") == before, 'check run changed nothing')
    check('#111111: Gulfport Branch → would change to Mendenhall Branch' in lg, 'check reports current BU')
    check('#333333: locked' in lg, 'locked job reported')
    check('#666666: already Mendenhall Branch' in lg, 'already-on-branch reported')
    check(page.evaluate("() => location.hash").startswith('#/DispatchBoard'), 'back on the board after check')
    check(page.evaluate("() => window.opened.length") == 0, 'picking is off after the run started (no board opens)')

    # Change for real
    page.evaluate("() => { window.editOpened = []; }")
    check(run_and_wait(page, 'Change to Mendenhall Branch', 'Yes, change them', timeout=150), 'change run finishes')
    lg = log_text(page)
    print(lg)
    opened = page.evaluate("() => window.editOpened")
    check('333333' not in opened and '666666' not in opened, 'locked and already-on-branch jobs not opened: %s' % opened)
    check(opened.count('111111') == 1 and opened.count('222222') == 1, 'changed jobs confirmed from the job data, not re-opened')
    names = page.evaluate("() => ({a: buName(111111), b: buName(222222), c: buName(333333), d: buName(444444), e: buName(777777), f: buName(888888)})")
    print(names)
    check(names['a'] == 'Mendenhall Branch' and names['b'] == 'Mendenhall Branch', 'normal jobs changed')
    check(names['f'] == 'Mendenhall Branch', 'job whose page stays after Save is verified as changed')
    check(names['c'] == 'Tupelo Branch', 'locked job untouched')
    check('#444444: NOT SAVED: Summary is required.' in lg, 'validation error reported')
    check('#777777: NOT SAVED, still Commercial' in lg, 'silent failed save caught by re-opening')
    check('retry:' in lg, 'problem jobs retried once')
    check('Put back (3)' in page.locator('#st-toolbox').inner_text(), 'put back offered for 3 changed jobs')
    rem = page.locator('#st-toolbox').inner_text()
    check('#111111' not in rem.split('jobs picked')[1].split('Change to')[0] and '3 jobs picked' in rem, 'done jobs come off the list, problems stay')
    check(page.evaluate("() => location.hash").startswith('#/DispatchBoard'), 'back on the board after change')

    # Put back
    check(run_and_wait(page, 'Put back', 'Yes, put them back', timeout=120), 'put back finishes')
    print(log_text(page))
    names = page.evaluate("() => ({a: buName(111111), b: buName(222222), f: buName(888888)})")
    check(names == {'a': 'Gulfport Branch', 'b': 'HVAC - Service', 'f': 'Commercial'}, 'put back restored departments and branches: %s' % names)
    check(page.locator('#st-toolbox button', has_text='Put back').first.is_hidden(), 'put back hidden after undo')

    # Job data unreadable: falls back to opening each job, same results
    page.evaluate("() => { window.API_DOWN = true; window.editOpened = []; }")
    btn(page, 'Clear').click()
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '111111 333333 666666')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').first.click()
    check(run_and_wait(page, 'Check jobs'), 'check run with job data down finishes')
    lg = log_text(page); print(lg)
    check('#111111: Gulfport Branch → would change to Mendenhall Branch' in lg and '#333333: locked' in lg and '#666666: already Mendenhall Branch' in lg, 'fallback to pages gives the same answers')
    check(len(page.evaluate("() => window.editOpened")) == 3, 'fallback opened each job')
    page.evaluate("() => { window.API_DOWN = false; }")

    # Other branch
    page.select_option('#st-biz-branch', 'Tupelo Branch')
    check(btn(page, 'Change to Tupelo Branch').count() == 1, 'change button follows the picked branch')
    btn(page, 'Clear').click()
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '111111')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').first.click()
    check(run_and_wait(page, 'Change to Tupelo Branch', 'Yes, change them'), 'change to other branch finishes')
    check(page.evaluate("() => buName(111111)") == 'Tupelo Branch', 'other branch applied')

    # Pop-up after Save stops the run and leaves it on screen
    btn(page, 'Clear').click()
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '555555 222222')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').first.click()
    page.select_option('#st-biz-branch', 'Mendenhall Branch')
    check(run_and_wait(page, 'Change to Mendenhall Branch', 'Yes, change them'), 'popup run ends')
    lg = log_text(page)
    print(lg)
    check('ServiceTitan asked' in lg and 'Run stopped' in lg, 'popup stops the run')
    check(page.evaluate("() => buName(222222)") == 'HVAC - Service', 'jobs after the popup not touched')
    check(page.evaluate("() => location.hash").startswith('#/Job/Edit/555555'), 'popup left on screen for the person')
    page.evaluate("() => { location.hash = '#/DispatchBoard'; }")
    page.wait_for_selector('a.appointment')

    # Stop button and close-while-running
    btn(page, 'Clear').click()
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '901001 901002 901003 901004')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').first.click()
    btn(page, 'Change to Mendenhall Branch').click(); btn(page, 'Yes, change them').click()
    time.sleep(1.5)
    page.locator('#st-toolbox [data-act="close"]').click()
    check('Business Unit is still running' in page.locator('#st-toolbox').inner_text(), 'closing mid-run asks first')
    btn(page, 'Keep running').click()
    btn(page, 'Stop').click()
    end = time.time() + 60
    while time.time() < end and page.evaluate("() => { const s = Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && b.textContent.startsWith('Stop')); return !!s; }"):
        time.sleep(0.3)
    lg = log_text(page)
    print(lg)
    done = sum(1 for j in ['901001', '901002', '901003', '901004'] if page.evaluate("() => buName(%s)" % j) == 'Mendenhall Branch')
    check('Stopped.' in lg and done < 4, 'stop ends the run early (%d of 4 done)' % done)

    # Picking from the job list at the bottom (Hold / Unassigned)
    btn(page, 'Clear').click()
    btn(page, 'Pick on board').click()
    page.click('.job-list tr.qa-job-901003 a')
    page.click('.job-list tr.qa-job-901004 td')
    t = page.locator('#st-toolbox').inner_text()
    check('#901003' in t and 'Tray Cust 901003' in t and '2 jobs picked' in t, 'jobs picked from the bottom list, with customer')
    check(page.evaluate("() => window.opened.length") == 0, 'bottom-list clicks captured while picking (nothing opened)')
    bg = page.evaluate("() => getComputedStyle(document.querySelector('.job-list tr.qa-job-901003 > td')).backgroundColor")
    check(bg not in ('rgba(0, 0, 0, 0)', 'transparent'), 'picked rows highlighted in the list')
    page.click('.job-list tr.qa-job-901003 td')
    check('1 job picked' in page.locator('#st-toolbox').inner_text(), 'second click on a row takes it off')
    btn(page, 'Picking: ON').click()
    page.click('.job-list tr.qa-job-901003 td')
    check(page.evaluate("() => window.opened.length") == 1, 'rows open normally when not picking')
    page.evaluate("() => { window.opened = []; }")

    # Other tools still open
    page.locator('#st-toolbox [data-nav="menu"]').click()
    for t in ['Notes', 'Job Notifications', 'Tech Messages']:
        page.locator('#st-toolbox .st-card', has_text=t).click()
        check(page.locator('#st-toolbox').is_visible() and t in page.locator('#st-toolbox .st-title').inner_text(), t + ' view opens')
        page.locator('#st-toolbox [data-nav="menu"]').click()

    # Closing removes the board hook
    page.evaluate("() => window.__stToolbox.close()")
    check(page.locator('#st-toolbox').count() == 0, 'toolbox closes')
    page.click('a.appointment[data-job-id="111111"]')
    check(page.evaluate("() => window.opened.length") == 1, 'board clicks work normally after closing')
    check(errors == [], 'no page errors: %s' % errors)
    b.close()

    # Without Knockout on the page (fallback path)
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 900})
    page.goto(URL + '?noko#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate(TOOLBOX)
    btn(page, 'Business Unit').click()
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '111111 666666')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').first.click()
    check(run_and_wait(page, 'Change to Mendenhall Branch', 'Yes, change them'), 'no-knockout run finishes')
    lg = log_text(page); print(lg)
    check(page.evaluate("() => buName(111111)") == 'Mendenhall Branch', 'works without knockout')
    b.close()

print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
