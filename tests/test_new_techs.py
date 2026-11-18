"""👷 Techs kept up to date (2.7).

A new hire or someone who left shows up without reinstalling the bookmark or reopening the Toolbox:
the Toolbox checks the day's techs every few minutes (and when you come back to the tab), and when
someone was added or removed it reads the board fresh, presses the board's own 🔄 Refresh, says who
in the bar at the top, and takes anyone who left off Tech Messages' saved picks. Closing the
Toolbox puts the page's XMLHttpRequest back the way it was.

Runs on tests/board.html."""
import sys, time, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board.html').as_uri()
fails = []
def check(c, w):
    print(('PASS ' if c else 'FAIL ') + w)
    if not c: fails.append(w)
def B(page, t): return page.locator('#st-toolbox button:visible', has_text=t).first
def techs_in_list(page): return page.evaluate("() => document.getElementById('st-notify-tech').textContent")
def bar(page): return page.evaluate("() => { const b = Array.from(document.querySelectorAll('#st-toolbox div')).find(d => /Tech list updated/.test(d.textContent) && d.offsetParent); return b ? b.textContent : ''; }")

with sync_playwright() as p:
    b = p.chromium.launch(); page = b.new_page(viewport={'width': 1400, 'height': 900})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard'); page.wait_for_selector('a.appointment')
    page.evaluate("() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '9.9'); localStorage.setItem('stMsgSel', JSON.stringify(['1'])); }")
    xhr_before = page.evaluate("() => XMLHttpRequest.prototype.open.toString()")
    page.evaluate(TOOLBOX)
    B(page, 'Job Notifications').click()
    page.wait_for_function("() => /\\(\\d+ jobs?\\)/.test(document.getElementById('st-notify-tech').textContent)", timeout=10000)
    page.evaluate("() => window.__stToolbox.checkTechs()")
    time.sleep(1)
    check(bar(page) == '', 'no message when nothing changed')

    # ---- A new hire with jobs on the day ----
    page.evaluate("() => { window.EXTRA_TECHS = [{ id: 7, name: 'Nina New', team: 'Install HVAC', teamId: 1 }]; window.boardRefreshes = 0; }")
    refreshed = page.evaluate("""() => new Promise(res => { const h = Array.from(document.querySelectorAll('*')).find(e => /^SERVICETITAN-DISPATCH-CENTER/i.test(e.tagName)); const btn = h && h.shadowRoot && h.shadowRoot.querySelector('button[aria-label="Refresh"]'); if (!btn) return res(null); btn.addEventListener('click', () => { window.boardRefreshes++; }); res(true); })""")
    page.evaluate("() => window.__stToolbox.checkTechs()")
    page.wait_for_function("() => Array.from(document.querySelectorAll('#st-toolbox div')).some(d => /Tech list updated/.test(d.textContent) && d.offsetParent)", timeout=10000)
    t = bar(page)
    check('new: Nina New' in t, 'the bar says who was added (%r)' % t)
    if refreshed: check(page.evaluate("() => window.boardRefreshes") >= 1, 'the board\'s own Refresh was pressed so it shows them too')

    # ---- Someone left: off the list, and off Tech Messages' saved picks ----
    page.evaluate("() => { window.NO_TECH_ONE = true; }")
    page.evaluate("() => window.__stToolbox.checkTechs()")
    page.wait_for_function("() => Array.from(document.querySelectorAll('#st-toolbox div')).some(d => /no longer on the board: Tech One/.test(d.textContent) && d.offsetParent)", timeout=10000)
    check(True, 'the bar says who is no longer on the board')
    sel = page.evaluate("() => JSON.parse(localStorage.getItem('stMsgSel') || '[]')")
    check(sel == [], 'they\'re taken off Tech Messages\' saved picks (%s)' % sel)
    page.locator('#st-notify-tech').hover()
    time.sleep(0.5)
    lst = techs_in_list(page)
    check('Tech One' not in lst, 'the tech list in the tool doesn\'t have them any more (%r)' % lst)

    # ---- Closing puts the page's XMLHttpRequest back ----
    page.evaluate("() => window.__stToolbox.close()")
    check(page.evaluate("() => XMLHttpRequest.prototype.open.toString()") == xhr_before, 'closing the Toolbox puts XMLHttpRequest back as it was')
    check(errors == [], 'no page errors: %s' % errors)
    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
