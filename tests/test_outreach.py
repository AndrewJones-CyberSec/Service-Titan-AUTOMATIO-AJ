import sys, time, pathlib, json
from playwright.sync_api import sync_playwright
import fastclock

# 📣 OutReach folder (new in 1.6.1) and the faster run (the next customer's fresh look starts
# while the current text is being sent).
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

def review(page, label):
    B(page, label).click()
    page.wait_for_function("() => /Will text|Nobody to text/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    return panel_text(page)

def add_jobs(page, nums):
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').filter(has_not_text='folder').first.click()

def open_board(page, saved=None, added=None):
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("([s, a]) => { localStorage.clear(); if (s) localStorage.setItem('stCtFolders', s); if (a) localStorage.setItem('stCtAddedFolders', a); Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); }", [saved, added])
    page.evaluate(TOOLBOX)
    B(page, 'Customer Texts').click()

def folder_names(page):
    return [f['name'] for f in json.loads(page.evaluate("() => localStorage.getItem('stCtFolders') || '[]'"))]

def msg_calls(page, num):
    return page.evaluate("n => window.apiLog.filter(u => u.indexOf('/GrowthChatCenter/Messages?threadId=' + Number(n)) === 0).length", num)

def thread_calls(page, num):
    return page.evaluate("n => window.apiLog.filter(u => u.indexOf('/GrowthChatCenter/ChatThread?number=' + n) === 0).length", num)

OLD = json.dumps([
    {'name': '⏸️ Holds', 'days': 7, 'same': False, 'msgs': [['My hold text', 'Custom hold message from {dispatcher}']]},
    {'name': '🚚 Tech Updates', 'days': 1, 'same': True, 'msgs': [['Late', 'Running late']]},
    {'name': '📅 Reschedule', 'days': 1, 'same': True, 'msgs': [['Resched', 'Please call to reschedule']]}
])

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    fastclock.install(page)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    # A new person: OutReach is one of the default folders
    open_board(page)
    t = panel_text(page)
    check('📣 OutReach' in t, 'OutReach is a default folder')
    B(page, '📣 OutReach').click()
    t = panel_text(page)
    check('Skips anyone who got this same message in the last 30 days.' in t, 'OutReach rule: same message, 30 days')
    check(page.locator('#st-toolbox label:visible', has_text='Jobs I pick').locator('input').is_checked(), 'OutReach uses Jobs I pick (for ＋ Everyone on the board)')
    check('🔥 Heater reminder' in t, 'starter message: Heater reminder')
    added = json.loads(page.evaluate("() => localStorage.getItem('stCtAddedFolders') || '[]'"))
    check('📣 OutReach' in added, 'marked as offered, so deleting it later sticks')

    # Everyone on the board, then a real run with the starter message. Mo Day got a text 40 days
    # ago (so OutReach's 30-day rule doesn't skip him, but he has a conversation to read).
    page.evaluate("() => { window.CHATS['6015550022'] = { unread: false, msgs: [{ Body: 'old promo', IsOutbound: true, CreatedOn: new Date(Date.now() - 40 * 86400000).toISOString() }] }; }")
    B(page, 'Everyone on the board').click()
    page.wait_for_function("() => /Added \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    page.locator('#st-toolbox label:visible', has_text='Auto-send').locator('input').check()
    t = review(page, 'Review and send to 4 customers')
    msg = t.split('Message (as the first customer will see it):')[1].split('Numbers:')[0]
    check('Hey, this is Andrew with AirSouth' in msg and 'Reply STOP to opt out.' in msg, 'starter message filled in and ends with the opt-out line')
    check('601-' not in msg and 'call' not in msg.lower(), 'starter message has no phone number or "call us"')
    check('Will text 4 numbers' in t, 'everyone on the board will be texted: ' + t.split('Will text')[1][:30])
    # A STOP that arrives after the next customer's fresh look was taken is still caught, by the
    # open conversation's own check right before typing.
    page.fill('#st-ct-confirm-count', '4')
    mo_threads, mo_msgs = thread_calls(page, '6015550022'), msg_calls(page, '6015550022')
    B(page, 'Send 4 texts').click()
    page.wait_for_function("() => window.chatOpened.indexOf('6015550020') > -1", timeout=15000)
    page.evaluate("() => { window.CHATS['6015550021'] = { unread: false, msgs: [{ Body: 'STOP', IsInbound: true, CreatedOn: new Date().toISOString() }] }; }")
    check(wait_done(page, 120), 'OutReach run finishes')
    lg = log_text(page); print(lg)
    sent = page.evaluate("() => window.SENT.slice()")
    nums = [x[0] for x in sent]
    check(sorted(nums) == sorted(['6015550020', '6015550022', '6015550031']), 'three texted: %s' % nums)
    check('Lou Ng …0021: skipped: they replied STOP' in lg and '6015550021' not in nums, 'a STOP that arrives after the look-ahead is still caught at their turn')
    # Reads of Mo's conversation during the run: the full look ahead (conversation + messages), one
    # quick read at his turn (conversation only), and the delivery check after his text (both).
    check(thread_calls(page, '6015550022') - mo_threads == 3 and msg_calls(page, '6015550022') - mo_msgs == 2,
          "Mo's full look was taken ahead, and at his turn one quick read confirmed nothing changed (%d conversation reads, %d message reads)" % (thread_calls(page, '6015550022') - mo_threads, msg_calls(page, '6015550022') - mo_msgs))
    check(all(x[1].endswith('Reply STOP to opt out.') for x in sent), 'every OutReach text has the opt-out line')

    # Second time: everyone got it already (30-day rule)
    if B(page, '← Back').count(): B(page, '← Back').click()
    t = review(page, 'Review and send to 4 customers')
    check('Nobody to text' in t and t.count('got this message today') == 3, '30-day rule skips everyone who already got it')
    B(page, 'Cancel').click()

    # Type only: a look-ahead more than 15 seconds old (you took your time) is taken again
    B(page, 'Clear').click()
    B(page, '📅 Reschedule').click()
    page.evaluate("() => { Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); }")
    add_jobs(page, '6001 6003')
    page.locator('#st-toolbox label:visible', has_text='Type only').locator('input').check()
    review(page, 'Start (type only): 2 customers')
    n_before = thread_calls(page, '6015550022')
    B(page, 'Start').click()
    page.wait_for_function("() => /Typed to Kim Wu/.test(document.getElementById('st-toolbox').innerText)", timeout=15000)
    fastclock.skip(page, 16000)   # the person takes a while (16 s on the page's clock) before pressing Send
    page.click('.chat button[type=submit]')
    page.wait_for_function("() => /Typed to Mo Day/.test(document.getElementById('st-toolbox').innerText)", timeout=20000)
    check(thread_calls(page, '6015550022') - n_before == 2, 'stale look-ahead taken again (looked ahead once, then again at its turn)')
    page.click('.chat button[type=submit]')
    check(wait_done(page, 30), 'type-only run finishes')
    check(len(page.evaluate("() => window.SENT")) == 5, 'both typed texts sent by the person')
    page.evaluate("() => window.__stToolbox.close()")

    # Someone who already saved their own folders gets OutReach once, at the end
    open_board(page, OLD)
    names = folder_names(page)
    # (1.6.4 adds ✅ Confirm Appt the same way, after it.)
    check(names == ['⏸️ Holds', '🚚 Tech Updates', '📅 Reschedule', '📣 OutReach', '✅ Confirm Appt'], 'OutReach added to saved folders: %s' % names)
    saved = json.loads(page.evaluate("() => localStorage.getItem('stCtFolders')"))
    check(saved[0]['msgs'][0][0] == 'My hold text', 'their own messages are kept')
    page.evaluate("() => window.__stToolbox.close()")

    # ...and not again after they delete it
    left = json.dumps(json.loads(OLD))
    added = page.evaluate("() => localStorage.getItem('stCtAddedFolders')")
    open_board(page, left, added)
    check('📣 OutReach' not in folder_names(page) and B(page, '📣 OutReach').count() == 0, 'a deleted OutReach stays deleted')
    page.evaluate("() => window.__stToolbox.close()")

    # Someone who already made their own "Outreach" folder doesn't get a second one
    mine = json.loads(OLD) + [{'name': 'Outreach', 'days': 14, 'same': True, 'msgs': [['Mine', 'My outreach text']]}]
    open_board(page, json.dumps(mine))
    names = folder_names(page)
    check(names.count('Outreach') == 1 and '📣 OutReach' not in names, 'no duplicate when they already have an Outreach folder: %s' % names)
    page.evaluate("() => window.__stToolbox.close()")

    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
