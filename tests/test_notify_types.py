"""🔕 Job Notifications → 🗂️ By job type (2.3).

Each job type can be set to 🔔 on, 🔕 off or — left alone (saved in this browser). The section lists the
job types on the board's day with how many jobs each has; ＋ adds a type's jobs to the list. ⚙️ Apply
puts every job of a type that's set on the list and turns each one off or on to match, in one run, after
a confirm. Jobs on the list that don't match their type's setting are marked ⚠️, and ⚙️ Match job types
does the same for the list as it is.

Runs on tests/board.html?full (the fake board's whole day, with job types and job pages)."""
import sys, time, pathlib, json
from playwright.sync_api import sync_playwright
import fastclock

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, t): return page.locator('#st-toolbox button:visible', has_text=t).first
def T(page): return page.locator('#st-toolbox').inner_text()
def busy(page): return page.evaluate("() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))")
def wait_done(page, t=120):
    time.sleep(0.5); end = time.time() + t
    while time.time() < end:
        if not busy(page): return True
        fastclock.skip(page)
    return False
def types(page):
    return page.evaluate("() => Array.from(document.querySelectorAll('#st-notify-types .st-notify-type')).map(r => [r.getAttribute('data-type'), r.children[1].textContent, (r.querySelector('[data-rule].on') || {}).getAttribute ? r.querySelector('[data-rule].on').getAttribute('data-rule') : null])")
def rule(page, name, v):
    page.locator('#st-notify-types .st-notify-type[data-type="%s"] [data-rule="%s"]' % (name, v)).click()
def status(page):
    return page.evaluate("() => { const b = Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /Check$/.test(b.textContent)); return b ? b.parentElement.innerText : ''; }")
def wait_read(page, t=15):
    end = time.time() + t
    while time.time() < end:
        s = status(page)
        if s and 'reading' not in s and '⏳' not in s: return s
        time.sleep(0.15)
    return status(page)
def notif(page, j): return page.evaluate("(j) => window.NOTIF[j]", str(j))

M = ['111111', '333333', '555555', '777777', '901001', '930001']
R = ['222222', '444444', '666666', '888888', '912345', '901002']
SETUP = """() => {
  window.TYPES = {}; %s.forEach(j => TYPES[j] = 'Maintenance'); %s.forEach(j => TYPES[j] = 'Repair'); TYPES[930002] = 'Install';
  window.NOTIF = {}; %s.concat(%s, ['930002']).forEach(j => NOTIF[j] = true); NOTIF['222222'] = false;
}""" % (json.dumps([int(x) for x in M]), json.dumps([int(x) for x in R]), json.dumps(M), json.dumps(R))

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    fastclock.install(page)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '?full#/DispatchBoard'); page.reload(); page.wait_for_selector('a.appointment')
    page.evaluate("() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '2.3'); }")
    page.evaluate(SETUP)
    page.evaluate("() => NB.render()")
    page.evaluate(TOOLBOX)
    B(page, 'Job Notifications').click()
    page.wait_for_function("() => /\\(\\d+ jobs?\\)/.test(document.getElementById('st-notify-tech').textContent)", timeout=10000)

    # ================= The job types on the board's day =================
    check('🗂️ By job type' in page.inner_text('#st-notify-types-head'), 'a 🗂️ By job type section, folded')
    page.click('#st-notify-types-head')
    page.wait_for_function("() => document.querySelectorAll('#st-notify-types .st-notify-type').length >= 3", timeout=10000)
    ty = types(page)
    check(ty[:3] == [['Maintenance', '6', ''], ['Repair', '6', ''], ['Install', '1', '']], 'each type with how many jobs it has (timeline and Unassigned), most first, each left alone to start (%s)' % ty)

    # ================= Set them: saved =================
    rule(page, 'Maintenance', 'off')
    rule(page, 'Repair', 'on')
    saved = page.evaluate("() => JSON.parse(localStorage.getItem('stNotifyTypes'))")
    check(saved == {'Maintenance': 'off', 'Repair': 'on'}, 'Maintenance 🔕 off and Repair 🔔 on, saved in this browser (%s)' % saved)
    check('(2 types set)' in page.inner_text('#st-notify-types-head'), 'the section says how many types are set')
    check('Apply to 12 jobs' in page.inner_text('#st-notify-apply'), '⚙️ Apply counts the jobs of those types (%r)' % page.inner_text('#st-notify-apply'))

    # ================= ⚙️ Apply: one run, each job its own way =================
    page.click('#st-notify-apply')
    page.wait_for_function("() => /Match your job type settings/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    t = T(page)
    check('Match your job type settings on 12 jobs' in t and '#930002' not in t, 'it asks first: 12 jobs, the Install job (left alone) not on the list')
    check(page.evaluate("() => window.opened.length") == 0 and all(notif(page, j) for j in M), 'nothing changed before Yes')
    B(page, 'Yes, apply them').click()
    check(wait_done(page), 'the run finishes')
    t = T(page)
    check(all(notif(page, j) is False for j in M), 'every Maintenance job is off now (%s)' % [notif(page, j) for j in M])
    check(notif(page, '222222') is True and all(notif(page, j) is True for j in R), 'the Repair job that was off is on, and the rest stay on')
    check(notif(page, '930002') is True, 'the Install job (left alone) wasn\'t touched')
    secs = page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox .st-cust-section')).map(s => s.getAttribute('data-title'))")
    check(any('Turned off' in (x or '') for x in secs) and any('Turned on' in (x or '') for x in secs) and any('Already on' in (x or '') for x in secs), 'the cards show both ways: turned off, turned on, already on (%s)' % secs)
    check(errors == [], 'apply: no page errors: %s' % errors)

    # ================= ⚠️ A job not as its type is set, and ⚙️ Match job types =================
    page.evaluate("() => { window.NOTIF['111111'] = true; }")
    B(page, 'Clear').click()
    page.locator('#st-notify-types .st-notify-type[data-type="Maintenance"] button', has_text='＋').click()
    s = wait_read(page)
    row = page.evaluate("() => { const r = Array.from(document.querySelectorAll('#st-toolbox b')).find(b => b.textContent === '#111111'); return r ? r.parentElement.textContent : ''; }")
    check('6 jobs picked' in T(page) or 'Added 6 jobs' in T(page), '＋ adds the type\'s jobs to the list')
    check(row.startswith('⚠️🔔'), 'the job turned back on is marked ⚠️ (%r)' % row)
    check('⚠️ 1 not as their job type is set' in s and page.is_visible('#st-notify-match') and '(1)' in page.inner_text('#st-notify-match'), 'the list says 1 isn\'t as its type is set, with ⚙️ Match job types (1) (%r)' % s)
    page.click('#st-notify-match')
    page.wait_for_function("() => /Turn OFF 1 job/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    check('5 jobs are already as set' in T(page), 'the confirm says the other 5 are already as set')
    B(page, 'Yes, apply them').click()
    check(wait_done(page), 'the match run finishes')
    check(notif(page, '111111') is False and page.evaluate("() => window.opened.filter(x => /111111/.test(x)).length") <= 2, '111111 is off again, and only it was opened')

    # ================= — leaves a type alone =================
    rule(page, 'Repair', '')
    check(page.evaluate("() => JSON.parse(localStorage.getItem('stNotifyTypes'))") == {'Maintenance': 'off'}, '— takes the setting off (Repair left alone now)')
    check(errors == [], 'no page errors: %s' % errors)
    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
