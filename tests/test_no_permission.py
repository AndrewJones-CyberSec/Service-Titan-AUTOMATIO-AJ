"""📱 Customer Texts for a login that can't open job records (ServiceTitan answers 401 for
/Job/Index while the session is fine). Phone numbers come from the customer instead, and
it never says "signed out" for this."""
import sys, time, pathlib
from playwright.sync_api import sync_playwright

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
    page.wait_for_function("() => /Will text|Nobody to text|Couldn't check/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    return panel_text(page)

def job_reads(page):
    return page.evaluate("() => window.apiLog.filter(u => u.indexOf('/Job/Index/') === 0).length")

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("() => { window.JOB_NO_PERMISSION = true; }")
    page.evaluate(TOOLBOX)
    B(page, 'Customer Texts').click()

    # Holds: numbers come from each customer, the same people are texted and skipped as with job access
    B(page, 'Load holds').click()
    page.wait_for_function("() => /Loaded \\d+ hold/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    page.locator('#st-toolbox label:visible', has_text='Quote (10)').first.locator('input').check()
    page.locator('#st-toolbox label:visible', has_text='Non Operational (2)').first.locator('input').check()
    page.locator('#st-toolbox label:visible', has_text='Type only').locator('input').check()
    page.evaluate("() => { window.apiLog = []; }")
    t = review(page, 'Start (type only)')
    print(t)
    check('signed you out' not in t, 'no "signed out" while still signed in')
    check('Will text 5 numbers' in t and 'Skipping 6' in t, 'same people texted and skipped as with job access')
    check('no mobile number' in t and 'replied STOP' in t, 'skip reasons still work from the customer\'s numbers')
    check('6015550102' in t.replace('(', '').replace(') ', '').replace('-', '') or '…0102' in t, 'landline primary → their mobile, from the customer\'s numbers')
    check("can't open job records" in t, 'says the booked-since-loaded check is off')
    check(job_reads(page) <= 4, 'job records stop being asked for once one is refused (asked %d times for 11 customers)' % job_reads(page))
    check(page.evaluate("() => window.apiLog.filter(u => u.indexOf('/app/api/contact-methods/') === 0).length") >= 11, 'numbers read from each customer')
    B(page, 'Cancel').click()

    # A typed job number that isn't on the board has no customer to read: says why, no "signed out"
    if B(page, '← Back').count(): B(page, '← Back').click()
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').locator('input').check()
    B(page, 'Clear').click()
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '7001')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').filter(has_not_text='folder').first.click()
    t = review(page, 'Start (type only)')
    print(t)
    check('signed you out' not in t, 'typed job: no "signed out"')
    check("can't open job records" in t and 'Pick the job on the board' in t, 'typed job: explains it needs picking on the board')
    B(page, 'Cancel').click()

    # Really signed out: still says so
    B(page, 'Clear').click()
    B(page, 'Pick on board').click()
    page.click('a.appointment[data-job-id="6001"]')
    page.evaluate("() => { window.API_401 = true; }")
    t = review(page, 'Start (type only)')
    print(t)
    check('signed you out' in t, 'really signed out: still says ServiceTitan signed you out')
    check(len(page.evaluate("() => window.SENT")) == 0, 'nothing was sent')
    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails))
sys.exit(1 if fails else 0)
