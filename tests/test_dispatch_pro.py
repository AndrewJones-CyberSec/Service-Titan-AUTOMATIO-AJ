"""🔕 Job Notifications → ⚡ Dispatch Pro (2.7).

The tool's top row picks the switch: 🔔 Job Notifications or ⚡ Dispatch Pro. With ⚡, the same list
shows each job's Dispatch Pro setting (read from the job's data, IsSmartDispatchEnabled, no pages
opened), and the buttons turn Dispatch Pro off or on through the switch in its own widget (a shadow
root) right below Job Notifications on the job page. The choice is remembered. A login without the
permission gets a disabled switch: nothing is clicked, the run stops at the first job and says so.
A done job (no switch) isn't opened. 🔔 and ⚡ keep separate readings and job type settings.

Runs on tests/board.html (fake job pages with both switches)."""
import sys, time, pathlib
from playwright.sync_api import sync_playwright
import fastclock

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board.html').as_uri()
fails = []
def check(c, w):
    print(('PASS ' if c else 'FAIL ') + w)
    if not c: fails.append(w)
def B(page, t): return page.locator('#st-toolbox button:visible', has_text=t).first
def T(page): return page.locator('#st-toolbox').inner_text()
def busy(page): return page.evaluate("() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))")
def wait_done(page, t=120):
    time.sleep(0.5); end = time.time() + t
    while time.time() < end:
        if not busy(page): return True
        fastclock.skip(page)
    return False
def status(page): return page.evaluate("() => { const b = Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /Check$/.test(b.textContent)); return b ? b.parentElement.innerText : ''; }")
def wait_read(page, want, t=15):
    end = time.time() + t
    while time.time() < end:
        s = status(page)
        if want in s and 'reading' not in s and '⏳' not in s: return s
        time.sleep(0.15)
    return status(page)
def btn_text(page, start): return page.evaluate("(s) => { const b = Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && b.textContent.indexOf(s) === 0); return b ? b.textContent + (b.disabled ? ' [disabled]' : '') : ''; }", start)
def sections(page): return page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox .st-cust-section')).map(s => s.getAttribute('data-title'))")
def add_typed(page, nums):
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='All').filter(has_not_text='note').first.click()
def pro(page, j): return page.evaluate("(j) => !!(window.PRO || {})[j]", str(j))
def kind(page): return page.evaluate("() => (document.querySelector('#st-switch-kind button.on') || {}).textContent || ''")

JOBS = ['111111', '222222', '333333', '444444']

with sync_playwright() as p:
    b = p.chromium.launch(); page = b.new_page(viewport={'width': 1400, 'height': 900}); fastclock.install(page)
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard'); page.wait_for_selector('a.appointment')
    page.evaluate("() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '9.9'); window.PRO = { '111111': true, '333333': true }; window.NOTIF = { '111111': true, '222222': true, '333333': false, '444444': true }; }")
    page.evaluate(TOOLBOX)
    B(page, 'Job Notifications').click()

    # ---- The switch row: 🔔 to start ----
    check(page.is_visible('#st-switch-kind'), 'a row to pick the switch at the top of the tool')
    check('Job Notifications' in kind(page), '🔔 Job Notifications is picked to start (%r)' % kind(page))
    add_typed(page, ' '.join(JOBS))
    s = wait_read(page, '🔔 3 on')
    check('🔔 3 on · 🔕 1 off' in s, 'notifications read as before: 3 on, 1 off (%r)' % s)

    # ---- ⚡ Dispatch Pro: the same list, its own readings ----
    page.click('#st-switch-kind [data-switch="pro"]')
    s = wait_read(page, '⚡ 2 on')
    check('⚡ 2 on · ⭕ 2 off' in s, 'with ⚡, the list shows Dispatch Pro: 2 on, 2 off (%r)' % s)
    check(page.evaluate("() => (window.indexOpened || []).length") == 0, 'read from the job data, no job pages opened')
    check(btn_text(page, '⭕ Turn off').startswith('⭕ Turn off (2)') and btn_text(page, '⚡ Turn on').startswith('⚡ Turn on (2)'), 'the buttons count what they would change (%r, %r)' % (btn_text(page, '⭕ Turn off'), btn_text(page, '⚡ Turn on')))
    check(page.evaluate("() => localStorage.getItem('stSwitchKind')") == 'pro', 'the choice is saved in this browser')

    # ---- Turn Dispatch Pro on: only the jobs that are off are opened ----
    B(page, '⚡ Turn on').click()
    page.wait_for_function("() => /Turn ON Dispatch Pro on 2 jobs/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    check('Dispatch Pro can schedule and move those jobs again.' in T(page), 'the confirm says what turning it on means')
    check(page.evaluate("() => (window.proClicks || []).length") == 0, 'nothing clicked before Yes')
    B(page, 'Yes, turn them on').click()
    check(wait_done(page), 'the run finishes')
    check(all(pro(page, j) for j in JOBS), 'every job has Dispatch Pro on now (%s)' % [pro(page, j) for j in JOBS])
    clicks = page.evaluate("() => window.proClicks || []")
    check(sorted(clicks) == ['222222', '444444'], 'only the two that were off were clicked (%s)' % clicks)
    check(page.evaluate("() => window.NOTIF") == {'111111': True, '222222': True, '333333': False, '444444': True}, 'Job Notifications weren\'t touched')
    sec = sections(page)
    check(any('⚡ Turned on (2)' in (x or '') for x in sec) and any('⚡ Already on (2)' in (x or '') for x in sec), 'cards: ⚡ Turned on (2), ⚡ Already on (2) (%s)' % sec)
    check('⚡ 4 on' in status(page), 'the list shows them all on afterwards')

    # ---- Turn off ----
    B(page, '⭕ Turn off').click()
    B(page, 'Yes, turn them off').click()
    check(wait_done(page), 'the turn-off run finishes')
    check(not any(pro(page, j) for j in JOBS), 'Dispatch Pro is off on all four (%s)' % [pro(page, j) for j in JOBS])

    # ---- Back to 🔔: its own readings again ----
    page.click('#st-switch-kind [data-switch="notify"]')
    s = wait_read(page, '🔔 3 on')
    check('🔔 3 on · 🔕 1 off' in s, 'back on 🔔, the list shows notifications again (%r)' % s)
    page.click('#st-switch-kind [data-switch="pro"]')
    wait_read(page, '⭕ 4 off')

    # ---- No permission: the switch is grayed out ----
    page.evaluate("() => { window.PRO_LOCKED = true; window.proClicks = []; window.indexOpened = []; }")
    B(page, '⚡ Turn on').click()
    B(page, 'Yes, turn them on').click()
    check(wait_done(page), 'the no-permission run ends')
    t = T(page)
    check(page.evaluate("() => window.proClicks.length") == 0 and not any(pro(page, j) for j in JOBS), 'a disabled switch is never clicked, nothing changed')
    check(page.evaluate("() => window.indexOpened.length") == 1, 'it stops at the first job instead of opening the rest (%s)' % page.evaluate("() => window.indexOpened"))
    check("doesn't have permission to change Dispatch Pro" in t, 'it says the login has no permission to change Dispatch Pro')
    check(not page.locator('#st-toolbox button:visible', has_text='Try the problem jobs again').count(), 'no "try again" for a permission problem')

    # ---- A done job: not opened ----
    page.evaluate("() => { window.PRO_LOCKED = false; window.PRO_DONE = { '111111': true }; window.indexOpened = []; window.proClicks = []; }")
    page.evaluate("() => { const a = window.__stToolbox; }")
    B(page, 'Clear').click()
    add_typed(page, '111111')
    wait_read(page, '⭕ 1 off')
    B(page, '⚡ Turn on').click()
    B(page, 'Yes, turn them on').click()
    check(wait_done(page), 'the done-job run ends')
    # The fake board doesn't mark 111111 done, so it's opened and its missing switch reported.
    check(page.evaluate("() => window.proClicks.length") == 0 and not pro(page, '111111'), 'a job with no Dispatch Pro switch isn\'t changed')
    check('COULD NOT FIND SWITCH' in T(page) or 'Problems' in ' '.join(x or '' for x in sections(page)), 'it shows as a problem card')

    # ---- The choice is remembered when the Toolbox opens again ----
    page.evaluate("() => window.__stToolbox.close()")
    page.evaluate(TOOLBOX)
    # It opens on the tool it was left on (Job Notifications).
    page.wait_for_selector('#st-switch-kind', state='visible', timeout=10000)
    check('Dispatch Pro' in kind(page), '⚡ is still picked after closing and opening the Toolbox (%r)' % kind(page))
    check(errors == [], 'no page errors: %s' % errors)
    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
