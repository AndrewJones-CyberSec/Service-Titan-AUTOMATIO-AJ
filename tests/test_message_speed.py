"""💬 Tech Messages, quicker on the new board (2.1.9).

The new board only draws the rows on screen, and every scroll draws its names again without their
menus for about 1.5 seconds (Oct 29 2026). Tech Messages used to center each tech's row on the
board before opening their menu, which nearly always scrolled, so most techs cost that 1.5 seconds
on top of the 1.2-second pause after each send. Now a name already showing isn't scrolled, one that
isn't is brought in near the top (so the techs after it are showing too), and the next tech is got
ready during the pause instead of after it. The pause itself is kept: the message panel still isn't
switched to the next tech until 1.2 seconds after a send.

Runs on tests/board_send.html (the fake new board with a fake message panel), on the real clock:
these checks time things, so run_all.py runs this suite on its own."""
import sys, time, pathlib, json
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_send.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first
def log_text(page):
    return page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")
def running(page):
    return page.evaluate("() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))")

# 12 techs on one team (and the boss on another), 6 rows showing, names without their menu for
# 1.5 seconds after any scroll: the real board as seen on Oct 29 2026.
TWELVE = ("() => { window.TEAMS = [['Install HVAC', Array.from({ length: 12 }, (x, i) => [i + 1, 'Tech ' + (i + 1)])], ['Leadership Team', [[99, 'Boss Man']]]];"
          " NB.cfg.virtual = 6; NB.cfg.hydrateMs = 1500; NB.readyAt = 0; %s }")

def start(b, setup_js, techs):
    """A fresh page, Good Morning picked for techs in Auto-send, ready to press Send."""
    page = b.new_page(viewport={'width': 1400, 'height': 900})
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
    # At each send: when (ms), and whether the Toolbox is over where the message panel ends up
    # (its place once it's done sliding in: offsetLeft leaves out the slide).
    page.evaluate("""() => {
      window.SENT_AT = []; window.OVER = []; NB.scrolls = 0;
      const push = window.SENT.push.bind(window.SENT);
      window.SENT.push = x => {
        window.SENT_AT.push(performance.now());
        const ac = NB.host.shadowRoot.querySelector('servicetitan-activity-center-test01');
        const col = ac.shadowRoot.querySelector('.col'), tb = document.getElementById('st-toolbox').getBoundingClientRect();
        window.OVER.push(tb.right > col.offsetLeft + 1 && tb.left < col.offsetLeft + col.offsetWidth);
        return push(x);
      };
    }""")
    return page, errors

def send(page, n, timeout=60):
    t0 = page.evaluate("() => performance.now()")
    B(page, 'Send to %d' % n).click()
    page.wait_for_function("() => !Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))", timeout=timeout * 1000)
    t1 = page.evaluate("() => performance.now()")
    at = page.evaluate("() => window.SENT_AT")
    gaps = [(y - x) / 1000 for x, y in zip(at, at[1:])]
    return (t1 - t0) / 1000, gaps

def sent(page):
    return [x[0] for x in page.evaluate("() => window.SENT.slice()")]

with sync_playwright() as p:
    b = p.chromium.launch()

    # ---- Five techs whose names are all showing: the board isn't scrolled at all ----
    page, errors = start(b, TWELVE % '', ['1', '2', '3', '4', '5'])
    secs, gaps = send(page, 5)
    print('5 showing: %.1f s, gaps %s, scrolls %s' % (secs, [round(g, 2) for g in gaps], page.evaluate("() => NB.scrolls")))
    check(sent(page) == ['Tech 1', 'Tech 2', 'Tech 3', 'Tech 4', 'Tech 5'], 'five techs showing: all messaged, in order (%s)' % sent(page))
    check(page.evaluate("() => NB.scrolls") == 0, 'names already showing: the board isn\'t scrolled (%s scrolls)' % page.evaluate("() => NB.scrolls"))
    # Before: 0.25 s to scroll each, 0.4 s for the panel and the 1.2 s pause, one after the other
    # (about 1.85 s a tech, 9.3 s for five), plus 1.5 s for each tech whose row was centered.
    check(secs < 7.0, 'five techs showing in under 7 s (%.1f s; about 12 s before)' % secs)
    check(gaps and min(gaps) >= 1.18, 'still 1.2 s or more between one send and the next (shortest %.2f s)' % (min(gaps) if gaps else 0))
    check(errors == [], 'no page errors: %s' % errors)
    page.close()

    # ---- Eight in a row on a scrolling board: one scroll, near the top, shows the rest ----
    page, errors = start(b, TWELVE % '', [str(i) for i in range(1, 9)])
    secs, gaps = send(page, 8)
    scrolls = page.evaluate("() => NB.scrolls")
    print('8 in a row: %.1f s, gaps %s, scrolls %s' % (secs, [round(g, 2) for g in gaps], scrolls))
    check(sent(page) == ['Tech %d' % i for i in range(1, 9)], 'eight in a row: all messaged, in order (%s)' % sent(page))
    check(scrolls <= 2, 'the board scrolled at most twice for eight techs (%s; once a tech before)' % scrolls)
    check(secs < 14.0, 'eight techs on a scrolling board in under 14 s (%.1f s; 21.5 s before)' % secs)
    check(gaps and min(gaps) >= 1.18, 'eight in a row: still 1.2 s or more between sends (shortest %.2f s)' % (min(gaps) if gaps else 0))
    check(errors == [], 'eight in a row: no page errors: %s' % errors)
    page.close()

    # ---- Picked far apart (down, then back up): each one found, each one messaged ----
    page, errors = start(b, TWELVE % '', ['12', '2', '9'])
    secs, gaps = send(page, 3)
    lg = log_text(page)
    check(sent(page) == ['Tech 12', 'Tech 2', 'Tech 9'], 'picked far apart: all messaged in the order picked (%s)' % sent(page))
    check("didn't open" not in lg and 'skipped' not in lg, 'nobody skipped while their menu was loading after a scroll')
    page.close()

    # ---- Stop during the pause after a send: nobody else is messaged, no other panel opened ----
    page, errors = start(b, TWELVE % '', ['1', '2', '3'])
    B(page, 'Send to 3').click()
    page.wait_for_function("() => window.SENT.length === 1", timeout=20000)
    B(page, 'Stop').click()
    page.wait_for_function("() => !Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))", timeout=20000)
    lg = log_text(page)
    check(sent(page) == ['Tech 1'], 'Stop during the pause: only the first tech messaged (%s)' % sent(page))
    check(page.evaluate("() => window.menuOpened") == 1, 'Stop during the pause: the next tech\'s message panel was never opened (%s)' % page.evaluate("() => window.menuOpened"))
    check('Stopped. 2 not messaged.' in lg, 'the log says 2 not messaged')
    page.close()

    # ---- The message panel slides in: the Toolbox waits for it to stop, then moves out of its way ----
    page, errors = start(b, TWELVE % 'NB.cfg.slideMs = 500;', ['1', '2', '3'])
    secs, gaps = send(page, 3)
    over = page.evaluate("() => window.OVER")
    check(sent(page) == ['Tech 1', 'Tech 2', 'Tech 3'], 'panel sliding in: all messaged (%s)' % sent(page))
    check(over == [False, False, False], 'panel sliding in: the Toolbox was out of its way at every send (%s)' % over)
    check(errors == [], 'panel sliding in: no page errors: %s' % errors)
    page.close()

    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
