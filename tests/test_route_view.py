"""👁️ Route View (2.8, Beta).

Under 🧪 Experimental tools. Ticking a tech opens a wide window of its own with their day left to right:
⏱️ Timeline (jobs on an hour ruler, in time order, two at the same time stacked) and ➡️ In order
(numbered stops with the time between them), several techs one under another, a Done job marked,
a shared job showing the other tech, ◀ ▶ another day and 📅 back, 🖱️ Pick on board (a tech's name or
one of their jobs), a job clicked opening 📋 Quick Job Info, picks remembered, the window kept when
another tool opens and removed when the Toolbox closes. Nothing is changed.

Runs on tests/board_moves.html (Jack W: 8-10, 10-12, 1-3 shared with Andrew J, 3-4 Done; Blake W: 8-10, 1-3)."""
import sys, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_moves.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first
def W(page):
    return page.evaluate("() => { const w = document.getElementById('st-rview'); return w && w.style.display !== 'none' && w.getClientRects().length ? w.innerText : ''; }")
def lane_jobs(page, tech):
    return page.evaluate("(t) => Array.from(document.querySelectorAll('#st-rview [data-rv-lane=\"' + t + '\"] .st-rview-card')).map(c => c.getAttribute('data-job'))", tech)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("() => { localStorage.clear(); localStorage.setItem('stSeenVersion', 'x'); }")
    page.evaluate(TOOLBOX)
    tb = page.locator('#st-toolbox').inner_text()
    check('Route View' not in page.locator('#st-toolbox').inner_text().split('Experimental')[0], 'Route View is under 🧪 Experimental tools, not with the finished tools')
    page.locator('#st-exp-head').click()
    B(page, 'Route View').click()
    check('👁️ Route View (Beta)' in page.locator('#st-toolbox').inner_text(), 'opens with Beta in its title')
    page.wait_for_function("() => document.querySelectorAll('#st-rview-list label[data-tech]').length >= 4", timeout=10000)
    names = page.evaluate("() => Array.from(document.querySelectorAll('#st-rview-list label[data-tech]')).map(l => l.innerText)")
    check(any('Jack W' in n and '4 jobs' in n for n in names), 'the list shows each tech with their job count (%s)' % names)
    check(W(page) == '', 'no window until a tech is picked')

    # ---- One tech: Jack W ----
    page.locator('#st-rview-list label[data-tech="101"] input').check()
    page.wait_for_function("() => document.querySelectorAll('#st-rview .st-rview-card').length > 0", timeout=10000)
    w = W(page)
    check('Jack W' in w and 'Amy Lee' in w and 'Bob Smith' in w, 'ticking Jack W opens the window with his jobs')
    check(lane_jobs(page, '101') == ['7001', '7002', '7004', '7006'], 'his jobs in time order, left to right (%s)' % lane_jobs(page, '101'))
    lefts = page.evaluate("() => Array.from(document.querySelectorAll('#st-rview [data-rv-lane=\"101\"] .st-rview-card')).map(c => c.getBoundingClientRect().left)")
    check(lefts == sorted(lefts) and len(set(lefts)) == 4, 'on the Timeline each one sits further right (%s)' % lefts)
    check('👥 Andrew' in w, 'the shared job names the other tech')
    check('✅' in page.evaluate("() => document.querySelector('#st-rview .st-rview-card[data-job=\"7006\"]').innerText"), 'the Done job is marked ✅')
    check('8 AM' in w and '5 PM' in w, 'an hour ruler')
    check('3 stops' in w or '4 stops' in w, 'his stops counted in the footer and name')
    hl = page.evaluate("() => { const s = Array.from(NB.host.shadowRoot.querySelectorAll('style')).map(x => x.textContent).join(''); return s.indexOf('data-technician-id=\"101\"') > -1; }")
    check(hl, 'he is outlined on the board')

    # ---- In order ----
    page.locator('#st-rview button[data-mode="order"]').click()
    w = W(page)
    check('1. ' in w and '4. ' in w, 'In order: numbered stops')
    gaps = page.evaluate("() => Array.from(document.querySelectorAll('#st-rview [data-rv-lane=\"101\"] .st-rview-gap')).map(g => g.innerText.replace(/\\s+/g, ' '))")
    check(any('back to back' in g for g in gaps) and any('1 hr open' in g for g in gaps), 'the time between stops: back to back, 1 hr open (%s)' % gaps)

    # ---- Several techs ----
    page.locator('#st-rview-list label[data-tech="102"] input').check()
    page.wait_for_function("() => document.querySelectorAll('#st-rview [data-rv-lane]').length === 2", timeout=5000)
    check(lane_jobs(page, '102') == ['7005', '7003'], 'a second tech: Blake W under Jack W, in his own row (%s)' % lane_jobs(page, '102'))
    order = page.evaluate("() => Array.from(document.querySelectorAll('#st-rview [data-rv-lane]')).map(l => l.getAttribute('data-rv-lane'))")
    check(order == ['101', '102'], 'rows in the board\'s order')
    page.locator('#st-rview button[data-mode="time"]').click()
    check(len(lane_jobs(page, '102')) == 2, 'both on the Timeline too')

    # ---- Another day ----
    page.locator('#st-rview button', has_text='▶').click()
    page.wait_for_function("() => /not the board/.test(document.getElementById('st-rview').innerText)", timeout=5000)
    check('Board\'s day' in W(page), 'the next day, with 📅 to go back')
    page.locator('#st-rview button', has_text="Board's day").click()
    page.wait_for_function("() => !/not the board/.test(document.getElementById('st-rview').innerText)", timeout=5000)
    check(lane_jobs(page, '101') == ['7001', '7002', '7004', '7006'], 'back on the board\'s day')

    # ---- Pick on board ----
    page.locator('#st-rview-list label[data-tech="102"] input').uncheck()
    B(page, 'Pick on board').click()
    page.locator('[data-cy^="ddb-technician-header-"][data-technician-id="104"]').first.click()
    page.wait_for_function("() => !!document.querySelector('#st-rview [data-rv-lane=\"104\"]')", timeout=5000)
    check(True, 'clicking Dana K\'s name on the board adds her')
    check(page.evaluate("() => window.opened.length") == 0, 'the board did not open anything')
    page.locator('[data-cy^="ddb-technician-header-"][data-technician-id="104"]').first.click()
    page.wait_for_function("() => !document.querySelector('#st-rview [data-rv-lane=\"104\"]')", timeout=5000)
    check(True, 'clicking again takes her off')
    page.locator('[data-cy="wdb-job-appt-card"][data-job-appointment-id="9003"]').first.click()
    page.wait_for_function("() => !!document.querySelector('#st-rview [data-rv-lane=\"102\"]')", timeout=5000)
    check(page.evaluate("() => window.opened.length") == 0, 'clicking one of Blake W\'s jobs adds him, and the job panel doesn\'t open')
    B(page, 'Picking: ON').click()
    check(page.evaluate("() => JSON.parse(localStorage.getItem('stRviewSel'))") == ['101', '102'], 'picks remembered in this browser')

    # ---- A job clicked: Quick Job Info ----
    page.locator('#st-rview .st-rview-card[data-job="7002"]').first.click()
    page.wait_for_function("() => /Quick Job Info/.test(document.getElementById('st-toolbox').innerText)", timeout=5000)
    check(page.evaluate("() => document.querySelector('#st-toolbox input[type=text]:not([style*=\"display: none\"])') !== null"), 'clicking a job opens 📋 Quick Job Info')
    check(W(page) != '', 'the window stays open while another tool is used')

    check(page.evaluate("() => window.calls.length") == 0, 'nothing was changed')
    page.evaluate("() => window.__stToolbox.close()")
    page.wait_for_timeout(700)
    check(page.evaluate("() => !document.getElementById('st-rview')"), 'closing the Toolbox removes the window')
    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails) if fails else '\nAll passed')
sys.exit(1 if fails else 0)
