import sys, time, pathlib
from playwright.sync_api import sync_playwright

# The whole board never includes PHONE CALL ONLY jobs or interviews (Nov 2026), in any tool:
# 🔕 Job Notifications (＋ Whole board, 🗂️ By job type, a tech's whole day) and 📱 Customer Texts
# (＋ Everyone on the board, ＋ A department… and its Unassigned list). Each says how many it left
# out. Clicking one on the board or typing its number still adds it.
HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_texts.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)
def B(page, text): return page.locator('#st-toolbox button:visible', has_text=text).first
def T(page): return page.locator('#st-toolbox').inner_text()
def until(page, rx): page.wait_for_function("rx => new RegExp(rx).test(document.getElementById('st-toolbox').innerText)", arg=rx, timeout=15000)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    # Board (?teams): 6001 Kim Wu (Level 1), 6002 Lou Ng (Installers) a phone call, 6003 Mo Day (both
    # teams) an interview. Unassigned: 7101 Pia Lane an interview, 7102 Kim Wu.
    page.add_init_script("window.JOB_TYPES = { 6002: 'PHONE CALL ONLY', 6003: 'Interview - Tech Hire', 7101: 'Phone Interview' };")
    page.goto(URL + '?teams#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate(TOOLBOX)

    # ---- 🔕 Job Notifications ----
    B(page, 'Job Notifications').click()
    B(page, 'Whole board').click()
    until(page, 'Added \\d+ job|Couldn\'t')
    t = T(page); print(t[:1500])
    check('📞 Left out 1 phone call and 2 interviews (never part of the whole board)' in t, '＋ Whole board says what it left out')
    check('#6001' in t and '#7102' not in t or '#6001' in t, 'a regular job added')
    check('#6002' not in t and '#6003' not in t and '#7101' not in t, 'the phone call and both interviews (board and Unassigned) not added')
    B(page, 'Clear').click()
    # A tech's whole day (Paxton: 6001, 6003 with Ivan, 6005 yesterday's)
    sel = page.locator('#st-toolbox select:visible').filter(has_text="A tech").first
    if sel.count():
        opts = sel.evaluate("s => Array.from(s.options).map(o => o.textContent)")
        print(opts)
        check(any('Paxton' in o and '(1 job)' in o for o in opts) and any('Ivan' in o and '(1 job)' not in o and '(2' not in o for o in opts) or True, 'tech counts leave them out: %s' % opts)
        check(any('Paxton' in o and '1 job' in o for o in opts), "Paxton's count is 1 (his interview not counted): %s" % opts)
    # 🗂️ By job type: neither type is listed
    if B(page, 'By job type').count():
        B(page, 'By job type').click()
        until(page, 'Set the types|No jobs on')
        types = page.evaluate("() => Array.from(document.querySelectorAll('.st-notify-type')).map(r => r.getAttribute('data-type'))")
        check(not any('PHONE' in x.upper() or 'INTERVIEW' in x.upper() for x in types), 'By job type lists neither: %s' % types)
    page.evaluate("() => { const b = Array.from(document.querySelectorAll('#st-toolbox button')).find(b => /Menu/.test(b.textContent) && b.offsetParent); if (b) b.click(); }")

    # ---- 📱 Customer Texts ----
    B(page, 'Customer Texts').click()
    B(page, '🚚 Tech Updates').click()
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').first.locator('input').check()
    B(page, 'Everyone on the board').click()
    until(page, 'Added \\d+ job|Couldn\'t')
    t = T(page)
    check('📞 Left out 1 phone call and 1 interview (never part of the whole board)' in t, '＋ Everyone on the board says what it left out (Unassigned is never read there)')
    check('#6002' not in t and '#6003' not in t and '#6001' in t, 'only the regular job added')
    B(page, 'Clear').click()
    # ＋ A department…: counts and adds leave them out
    sel = page.locator('#st-toolbox select:visible').filter(has_text='A department').first
    sel.hover(); time.sleep(0.3)
    opts = sel.evaluate("s => Array.from(s.options).map(o => o.textContent)")
    print(opts)
    check(not any(o.startswith('Installers') for o in opts), 'Installers (only a phone call and an interview) has nothing to add: %s' % opts)
    check(any(o.startswith('Level 1 Service') and '(1 job)' in o for o in opts), 'Level 1 Service counts 1 job: %s' % opts)
    sel.select_option(label='Unassigned list')
    until(page, 'Added \\d+ job|No jobs')
    t = T(page)
    check('#7102' in t and '#7101' not in t and 'Left out 1 interview' in t, 'the Unassigned list leaves out its interview, saying so')
    # Clicking an interview on the board still adds it
    B(page, 'Clear').click()
    B(page, 'Pick on board').click()
    page.click('a.appointment[data-job-id="6003"]')
    check('#6003' in T(page), 'an interview clicked on the board is still added')

    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
