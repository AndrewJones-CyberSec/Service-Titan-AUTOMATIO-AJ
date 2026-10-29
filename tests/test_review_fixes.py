import sys, time, pathlib, json
from playwright.sync_api import sync_playwright
import fastclock

# Fixes from the Oct 21 2026 code review (1.6.3):
#   - 🛡️ / 🚫 safety lists changed in another tab count in this one (Tech Messages and Customer
#     Texts read them again before the list, Start, Settings and each person).
#   - Customer Texts runs don't add a Back-button step per text.
#   - Tech Messages puts the Toolbox back where it was after sliding it aside for the message panel.
#   - Job and tech clicks only ever count job / tech numbers.
#   - A STOP and a START with the same time are read in message-number order.
# "Another tab" is simulated by writing to localStorage directly, which is exactly what the other
# tab does (both tabs share it).
HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
SEND_URL = (HERE / 'board_send.html').as_uri()
TEXTS_URL = (HERE / 'board_texts.html').as_uri()
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

def wait_done(page, timeout=120, fast=True):
    """Waits for a run to end, skipping ahead through its deliberate waits (fastclock). None of the
    runs waited for here has a check on how long it takes; pass fast=False for one that does."""
    end = time.time() + timeout
    time.sleep(0.4)
    while time.time() < end:
        if not running(page): return True
        if fast: fastclock.skip(page)
        else: time.sleep(0.3)
    return False

def other_tab(page, key, value):
    page.evaluate("([k, v]) => localStorage.setItem(k, v)", [key, json.dumps(value)])

def panel_style(page):
    return page.evaluate("() => { const p = document.getElementById('st-toolbox'); return [p.style.left, p.style.right]; }")

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 900})
    fastclock.install(page)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    # ================= 💬 Tech Messages =================
    page.goto(SEND_URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    page.evaluate("() => { localStorage.clear(); localStorage.setItem('stMsgTeams', JSON.stringify({ 'Install HVAC': true, 'Leadership Team': false })); localStorage.setItem('stMsgSel', JSON.stringify(['1', '2'])); localStorage.setItem('stMsgMode', 'auto'); }")
    page.evaluate(TOOLBOX)
    B(page, 'Tech Messages').click()
    page.wait_for_function("() => /To: 2 techs/.test(document.getElementById('st-toolbox').innerText)", timeout=5000)
    check('To: 2 techs' in T(page), 'both techs picked to start with')
    home_style = panel_style(page)

    # Blocked in another tab after the review: skipped at their turn, nothing sent to them.
    B(page, 'Review and send').click()
    check('Tech One' in T(page) and 'Tech Two' in T(page), 'review lists both techs')
    other_tab(page, 'stMsgNever', {'2': 'Tech Two'})
    page.evaluate("() => { const p = document.getElementById('st-toolbox'); window.__lefts = []; new MutationObserver(() => window.__lefts.push(p.style.left)).observe(p, { attributes: true, attributeFilter: ['style'] }); }")
    page.fill('#st-msg-confirm-count', '2')
    B(page, 'Send to 2').click()
    check(wait_done(page, 60), 'Tech Messages run finishes')
    lg = log_text(page); print(lg)
    sent = page.evaluate("() => window.SENT.slice()")
    check([x[0] for x in sent] == ['Tech One'], 'only Tech One messaged: %s' % sent)
    check('Tech Two: skipped: blocked by your 🛡️ settings' in lg, 'Tech Two (blocked in another tab after the review) skipped at their turn')

    # The panel slid aside for the message panel during the run, and is back where it was now.
    moved = page.evaluate("() => window.__lefts.some(l => l && l !== '')")
    check(moved, 'the panel was moved aside during the run (dodge)')
    check(panel_style(page) == home_style, 'panel back where it was after the run: %s (was %s)' % (panel_style(page), home_style))

    # The main list reflects the other tab's change, and 🛡️ starts from what's saved now.
    B(page, '← Back').click()
    check('To: 1 tech' in T(page) and 'Tech One' in T(page), 'main list drops Tech Two (blocked in another tab)')
    other_tab(page, 'stMsgNever', {'2': 'Tech Two', '1': 'Tech One'})
    B(page, '🛡️ Who can be messaged').click()
    t = T(page)
    check('🚫 Tech One' in t and '🚫 Tech Two' in t, '🛡️ shows people blocked in another tab')
    B(page, 'Save').click()
    saved = json.loads(page.evaluate("() => localStorage.getItem('stMsgNever')"))
    check(sorted(saved.keys()) == ['1', '2'], 'saving 🛡️ here keeps the other tab\'s blocks: %s' % saved)
    check('nobody picked yet' in T(page) or 'To: nobody' in T(page) or 'To: 0' in T(page), 'with both blocked, nobody is left to message')

    # A team unticked in another tab after the review: everyone on it is skipped.
    other_tab(page, 'stMsgNever', {})
    page.evaluate("() => window.__stToolbox.close()")
    page.evaluate("() => { localStorage.setItem('stMsgSel', JSON.stringify(['1', '2'])); localStorage.removeItem('stView'); }")
    page.evaluate(TOOLBOX)
    B(page, 'Tech Messages').click()
    page.wait_for_function("() => /To: 2 techs/.test(document.getElementById('st-toolbox').innerText)", timeout=5000)
    check('To: 2 techs' in T(page), 'both techs picked again')
    B(page, 'Review and send').click()
    other_tab(page, 'stMsgTeams', {'Install HVAC': False, 'Leadership Team': False})
    n0 = len(page.evaluate("() => window.SENT"))
    page.fill('#st-msg-confirm-count', '2')
    B(page, 'Send to 2').click()
    check(wait_done(page, 60), 'second run finishes')
    lg = log_text(page)
    check(len(page.evaluate("() => window.SENT")) == n0, 'nothing sent once the team was unticked in another tab')
    check(lg.count('skipped: blocked by your 🛡️ settings') == 2, 'both techs skipped by the other tab\'s team change')

    # Dragging the panel during a run: it stays where you put it.
    other_tab(page, 'stMsgTeams', {'Install HVAC': True, 'Leadership Team': False})
    page.evaluate("() => window.__stToolbox.close()")
    page.evaluate("() => { localStorage.removeItem('stPos'); localStorage.removeItem('stView'); localStorage.setItem('stMsgSel', JSON.stringify(['1', '2'])); }")
    page.evaluate(TOOLBOX)
    B(page, 'Tech Messages').click()
    B(page, 'Review and send').click()
    page.fill('#st-msg-confirm-count', '2')
    n0 = len(page.evaluate("() => window.SENT"))
    B(page, 'Send to 2').click()
    page.wait_for_function("n => window.SENT.length > n", arg=n0, timeout=20000)
    hb = page.locator('#st-toolbox > div').first.bounding_box()
    page.mouse.move(hb['x'] + 40, hb['y'] + 10); page.mouse.down()
    page.mouse.move(hb['x'] - 60, hb['y'] + 120, steps=5); page.mouse.up()
    dragged_to = page.evaluate("() => localStorage.getItem('stPos')")
    check(wait_done(page, 60), 'third run finishes')
    check(dragged_to is not None and panel_style(page)[1] == 'auto', 'dragged during the run: not moved back to the old spot (%s, saved %s)' % (panel_style(page), dragged_to))
    page.evaluate("() => window.__stToolbox.close()")

    # Tech IDs that aren't numbers are ignored when picking on the board.
    page.evaluate("() => { localStorage.setItem('stMsgSel', '[]'); localStorage.removeItem('stView'); localStorage.removeItem('stPos'); const t = document.createElement('div'); t.className = 'technician'; t.id = 'weird'; t.setAttribute('data-technician-id', '1\"],*{x:y}'); t.innerHTML = '<span class=\"name\">Weird Tech</span>'; document.getElementById('root').appendChild(t); }")
    page.evaluate(TOOLBOX)
    B(page, 'Tech Messages').click()
    B(page, 'Pick on board').click()
    page.click('#weird .name')
    check('Weird Tech' not in T(page) and 'nobody picked yet' in T(page), 'a tech whose ID isn\'t a number is not picked')
    page.click('#team-technician-1 .name')
    check('To: 1 tech' in T(page), 'normal tech still picks')
    page.evaluate("() => window.__stToolbox.close()")

    # ================= 📱 Customer Texts =================
    def open_texts():
        page.goto(TEXTS_URL + '#/DispatchBoard')
        page.wait_for_selector('a.appointment')
        page.evaluate("() => { localStorage.clear(); Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); window.SENT.length = 0; }")
        page.evaluate(TOOLBOX)
        B(page, 'Customer Texts').click()

    def add_jobs(nums):
        page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
        page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').filter(has_not_text='folder').first.click()

    def review(label):
        B(page, label).click()
        page.wait_for_function("() => /Will text|Nobody to text/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
        return T(page)

    open_texts()
    B(page, '📅 Reschedule').click()
    add_jobs('6001 6002 6003')   # Kim Wu …0020, Lou Ng …0021, Mo Day …0022
    page.locator('#st-toolbox label:visible', has_text='Auto-send').locator('input').check()

    # Blocked in another tab before the review: the review skips them.
    other_tab(page, 'stCtNever', ['6015550021'])
    t = review('Review and send to 3 customers')
    check('Will text 2 numbers' in t and 'Lou Ng …0021: on your 🚫 never-text list' in t, 'review uses the never-text list saved in another tab')
    B(page, 'Cancel').click()

    # Blocked in another tab after the review: skipped at their turn.
    other_tab(page, 'stCtNever', [])
    t = review('Review and send to 3 customers')
    check('Will text 3 numbers' in t, 'all three will be texted once unblocked')
    other_tab(page, 'stCtNever', ['6015550022'])
    hist0 = page.evaluate("() => history.length")
    page.fill('#st-ct-confirm-count', '3')
    B(page, 'Send 3 texts').click()
    check(wait_done(page, 90), 'Customer Texts run finishes')
    lg = log_text(page); print(lg)
    nums = [x[0] for x in page.evaluate("() => window.SENT.slice()")]
    check(sorted(nums) == ['6015550020', '6015550021'], 'Mo Day not texted: %s' % nums)
    check('Mo Day …0022: skipped: on your 🚫 never-text list' in lg, 'Mo Day (blocked in another tab after the review) skipped at their turn')
    check(page.evaluate("() => window.chatOpened.indexOf('6015550022')") == -1, "Mo Day's conversation was never opened")

    # No Back-button step per text, and back on the board at the end.
    check(page.evaluate("() => history.length") == hist0, 'the run added no Back-button steps (%d before, %d after)' % (hist0, page.evaluate("() => history.length")))
    check(page.evaluate("() => location.hash").startswith('#/widget-app/dispatch-center'), 'back on the board after the run')

    # ⚙️ Settings starts from what's saved now, so saving doesn't undo the other tab.
    B(page, '← Back').click()
    other_tab(page, 'stCtNever', ['6015550022', '6015550031'])
    B(page, '⚙️ Settings').click()
    val = page.locator('#st-toolbox textarea:visible').last.input_value()
    check('(601) 555-0031' in val and '(601) 555-0022' in val, '⚙️ Settings shows numbers blocked in another tab')
    B(page, 'Save').click()
    check(sorted(json.loads(page.evaluate("() => localStorage.getItem('stCtNever')"))) == ['6015550022', '6015550031'], 'saving Settings keeps them')
    page.evaluate("() => window.__stToolbox.close()")

    # STOP and START with the same time: read in message-number order, not list order.
    same = '2026-10-20T15:00:00.000Z'
    open_texts()
    B(page, '📅 Reschedule').click()
    page.evaluate("t => { window.CHATS['6015550020'] = { unread: false, msgs: [{ Body: 'STOP', IsInbound: true, CreatedOn: t, SmsId: 2 }, { Body: 'START', IsInbound: true, CreatedOn: t, SmsId: 1 }] }; }", same)
    add_jobs('6001')
    page.locator('#st-toolbox label:visible', has_text='Auto-send').locator('input').check()
    t = review('Review and send to 1 customer')
    check('Kim Wu …0020: they replied STOP' in t, 'START then STOP (by message number) at the same time: opted out')
    B(page, 'Cancel').click()
    page.evaluate("t => { window.CHATS['6015550020'] = { unread: false, msgs: [{ Body: 'START', IsInbound: true, CreatedOn: t, SmsId: 2 }, { Body: 'STOP', IsInbound: true, CreatedOn: t, SmsId: 1 }] }; }", same)
    t = review('Review and send to 1 customer')
    check('Will text 1 number' in t, 'STOP then START (by message number) at the same time: opted back in')
    B(page, 'Cancel').click()

    # Job IDs that aren't numbers are ignored when picking on the board.
    page.evaluate("() => { const a = document.createElement('a'); a.className = 'appointment'; a.id = 'weird'; a.setAttribute('data-job-id', '1\"],*{x:y}'); a.textContent = 'Weird job'; document.getElementById('root').appendChild(a); }")
    B(page, 'Clear').click()
    B(page, 'Pick on board').click()
    page.click('#weird')
    check('Added #' not in T(page), 'a job whose ID isn\'t a number is not picked')
    css = page.evaluate("() => Array.from(document.querySelectorAll('style')).map(s => s.textContent).join(' ')")
    check('x:y' not in css, 'nothing from a bad job ID gets into the page\'s CSS')
    page.click('a.appointment[data-job-id="6002"]')
    check('Added #6002' in T(page), 'normal job still picks')
    page.evaluate("() => window.__stToolbox.close()")

    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
