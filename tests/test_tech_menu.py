"""💬 Tech Messages opening each tech's menu (2.0.2).

On Oct 29 2026 every send came back "their name on the board has no menu". The cause was timing:
when the board scrolls a tech's row into view it first draws a plain name with no menu (and without
the data-hover-popover-trigger mark the Toolbox looked for), and the real one about 1.5 seconds
later. The Toolbox looked a quarter second after scrolling. It now waits for the name's menu button,
then opens the menu the way a person would: a right-click, then a left click (both work), whichever
worked last first. If the menu never opens, the run stops at the first tech with the yellow bar
(not one skip per tech); if it opened for others, one tech without it is skipped.

Runs on tests/board_send.html (the fake new board with a fake message panel)."""
import sys, time, pathlib, json
from playwright.sync_api import sync_playwright
import fastclock

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_send.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first
def T(page):
    return page.locator('#st-toolbox').inner_text()
def log_text(page):
    return page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")
def running(page):
    return page.evaluate("() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))")
def wait_done(page, timeout=90):
    end = time.time() + timeout
    time.sleep(0.4)
    while time.time() < end:
        if not running(page): return True
        fastclock.skip(page)
    return False

def send_run(b, setup_js, techs=('1', '2')):
    """A fresh page with the board set up by setup_js, then an auto-send of Good Morning to techs."""
    page = b.new_page(viewport={'width': 1400, 'height': 900})
    fastclock.install(page)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    page.evaluate(setup_js)
    page.evaluate("() => NB.render()")
    page.evaluate("(sel) => { localStorage.clear(); localStorage.setItem('stSeenVersion', 'x'); localStorage.setItem('stMsgTeams', JSON.stringify({ 'Install HVAC': true, 'Leadership Team': false })); localStorage.setItem('stMsgSel', JSON.stringify(sel)); localStorage.setItem('stMsgMode', 'auto'); }", list(techs))
    page.evaluate(TOOLBOX)
    B(page, 'Tech Messages').click()
    page.wait_for_function("(n) => new RegExp('To: ' + n + ' tech').test(document.getElementById('st-toolbox').innerText)", arg=len(techs), timeout=8000)
    B(page, 'Review and send').click()
    page.fill('#st-msg-confirm-count', str(len(techs)))
    B(page, 'Send to %d' % len(techs)).click()
    done = wait_done(page)
    return page, errors, done

def sent(page):
    return [x[0] for x in page.evaluate("() => window.SENT.slice()")]
def bar(page):
    return page.evaluate("() => { const b = Array.from(document.querySelectorAll('#st-toolbox > .st-bar, #st-toolbox > div')).find(d => d.offsetParent && /Tech Messages/.test(d.textContent) && /Copy report|changed|can't|didn't/.test(d.textContent)); return b ? b.textContent : ''; }")

with sync_playwright() as p:
    b = p.chromium.launch()

    # ---- Today's board: no mark on the names; left click or right-click opens the menu ----
    page, errors, done = send_run(b, "() => {}")
    lg = log_text(page)
    check(done and sent(page) == ['Tech One', 'Tech Two'], 'Oct 29 board (no mark on names): both techs messaged (%s)' % sent(page))
    check('no menu' not in lg and "didn't open" not in lg, 'nobody skipped for having no menu')
    check(page.evaluate("() => window.menuBy") == 'right', 'the menu opened with a right-click first, as before')
    check(errors == [], 'no page errors: %s' % errors)
    page.close()

    # ---- Only a left click opens it ----
    page, errors, done = send_run(b, "() => { NB.cfg.menuOn = 'left'; }")
    check(done and sent(page) == ['Tech One', 'Tech Two'], 'left click only: both techs messaged (%s)' % sent(page))
    check(page.evaluate("() => window.menuBy") == 'left', 'it found the left click')
    check(errors == [], 'left click only: no page errors: %s' % errors)
    page.close()

    # ---- The Oct 27 board: marked names, right-click only ----
    page, errors, done = send_run(b, "() => { NB.cfg.menuOn = 'right'; NB.cfg.popoverMark = true; }")
    check(done and sent(page) == ['Tech One', 'Tech Two'], 'Oct 27 board (marked names, right-click): both techs messaged (%s)' % sent(page))
    page.close()

    # ---- The menu's items lose their data-cy labels: found by their words ----
    page, errors, done = send_run(b, "() => { NB.cfg.menuWords = true; }")
    check(done and sent(page) == ['Tech One', 'Tech Two'], 'menu items without labels: Send Message found by its words (%s)' % sent(page))
    page.close()

    # ---- One tech has no menu, after the menu opened for another: just that one is skipped ----
    page, errors, done = send_run(b, "() => { const f = NB.cfg.techs; NB.cfg.techs = () => f().map(t => t.id === 2 ? Object.assign(t, { noMenu: true }) : t); }")
    lg = log_text(page)
    check(done and sent(page) == ['Tech One'], 'one tech without a menu: the other is still messaged (%s)' % sent(page))
    check("Tech Two: skipped: their menu didn't open" in lg, 'that tech is skipped, with why')
    page.close()

    # ---- Like the real board on Oct 29: after a scroll, names show without their menu for 1.5 s ----
    many = "() => { window.TEAMS = [['Install HVAC', [[1, 'Tech One'], [2, 'Tech Two'], [4, 'Tech Four'], [5, 'Tech Five'], [6, 'Tech Six'], [7, 'Tech Seven'], [8, 'Tech Eight']]], ['Leadership Team', [[3, 'Boss Man']]]]; NB.cfg.virtual = 3; NB.cfg.hydrateMs = 1500; NB.readyAt = 0; }"
    page, errors, done = send_run(b, many, techs=('1', '8', '5'))
    lg = log_text(page)
    check(done and sent(page) == ['Tech One', 'Tech Eight', 'Tech Five'], 'menus that load a moment after scrolling: everyone messaged, far down the list too (%s)' % sent(page))
    check("didn't open" not in lg and 'no menu' not in lg, 'nobody skipped while their menu was still loading')
    check(errors == [], 'menus loading after a scroll: no page errors: %s' % errors)
    page.close()

    # ---- The menu stays open after Send Message (like the real one): closed after each tech ----
    page, errors, done = send_run(b, "() => {}")
    check(done and page.evaluate("() => NB.host.shadowRoot.querySelectorAll('[role=menu]').length") == 0, 'no tech menu left open after the run')
    page.close()

    # ---- Something covers the message box for a moment (the panel still coming in): it waits ----
    page, errors, done = send_run(b, "() => { NB.cfg.cover = 1200; }")
    check(done and sent(page) == ['Tech One', 'Tech Two'], 'message box covered for a moment: it waits, then sends (%s)' % sent(page))
    page.close()

    # ---- Covered the whole time: skipped, and the log says what covers it ----
    page, errors, done = send_run(b, "() => { NB.cfg.cover = 'always'; }")
    lg = log_text(page)
    check(done and sent(page) == [], 'message box covered the whole time: nothing sent')
    check('something is covering the message box (div[test-cover])' in lg, 'the log says what covers it')
    page.close()

    # ---- The menu never opens: stop at the first tech with the yellow bar, not a skip per tech ----
    page, errors, done = send_run(b, "() => { NB.cfg.menu = false; }")
    lg = log_text(page); yb = bar(page)
    print(lg); print(yb)
    check(done and sent(page) == [], 'menu never opens: nothing sent')
    check('Tech Two' not in lg, 'it stopped at the first tech (no skip for each tech)')
    check("menu didn't open" in yb or "menu didn't open" in lg, 'it says the tech menu didn\'t open (%s)' % (yb or lg)[:120])
    check(errors == [], 'menu never opens: no page errors: %s' % errors)
    page.close()
    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
