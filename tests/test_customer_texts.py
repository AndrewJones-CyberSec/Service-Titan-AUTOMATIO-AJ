import sys, time, pathlib, json
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

def log_text(page):
    return page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")

def running(page):
    return page.evaluate("() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))")

def wait_done(page, timeout=120):
    end = time.time() + timeout
    time.sleep(0.4)
    while time.time() < end:
        if not running(page): return True
        time.sleep(0.3)
    return False

def panel_text(page):
    return page.locator('#st-toolbox').inner_text()

def tick_group(page, name):
    page.locator('#st-toolbox label:visible', has_text=name).first.locator('input').check()

def sent(page):
    return page.evaluate("() => window.SENT.slice()")

def back_to_main(page):
    if B(page, '← Back').count(): B(page, '← Back').click()

def review(page, label):
    """Clicks the start button and waits until every customer has been checked."""
    B(page, label).click()
    page.wait_for_function("() => /Will text|Nobody to text/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    return panel_text(page)

def add_jobs(page, nums):
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').filter(has_not_text='folder').first.click()

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate(TOOLBOX)
    check(B(page, 'Customer Texts').count() == 1, 'menu has Customer Texts')
    B(page, 'Customer Texts').click()
    t = panel_text(page)
    check('⏸️ Holds' in t and '🚚 Tech Updates' in t and '📅 Reschedule' in t, 'three folders')
    check('Texts are signed as Andrew.' in t, '{dispatcher} found from the login (Andrew)')
    check('Skips anyone who got any text from us in the last 7 days.' in t, 'Holds folder rule shown')

    # Load holds
    B(page, 'Load holds').click()
    page.wait_for_function("() => /Loaded \\d+ hold/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    t = panel_text(page)
    check('14 holds' in t, 'holds loaded and duplicate appointment removed')
    check(page.evaluate("() => JSON.stringify(window.lastGetJobs.QueryFilter.BusinessUnitIds)") == '[621842244]', "uses the board's Business Unit filter")
    check('Quote (10)' in t and 'Non Operational (2)' in t and 'Maintenance (2)' in t, 'groups with counts (Non - Operational merged)')
    tick_group(page, 'Quote (10)')
    tick_group(page, 'Non Operational (2)')
    t = panel_text(page)
    check('12 holds ticked → 11 customers' in t, 'ticked count and one text per customer: ' + t.split('ticked')[0][-30:])
    # expand a group shows each type
    page.locator('#st-toolbox button:visible', has_text='▸').first.click()
    check('Quote - Generator (3)' in panel_text(page), 'group expands to show job types')

    # Everyone is checked before anything is typed; the confirm screen shows the real count
    page.locator('#st-toolbox label:visible', has_text='Auto-send').locator('input').check()
    t0 = time.time()
    t = review(page, 'Review and send to 11 customers')
    check(time.time() - t0 < 8, 'checking 11 customers took %.1fs' % (time.time() - t0))
    print(t)
    check('"Hey, this is Andrew with AirSouth Cooling' in t, 'confirm shows filled-in message')
    check('Will text 5 numbers' in t and 'Skipping 6' in t, 'confirm shows who will be texted and who is skipped')
    for why in ['no mobile number', 'replied STOP', 'texted 3 days ago', 'unread reply', 'same number as another customer', 'blocked in ServiceTitan']:
        check(why in t, 'confirm lists skip reason: ' + why)
    check(page.evaluate("() => window.chatOpened.length") == 0, 'checking opened no conversations')
    page.fill('#st-ct-confirm-count', '11')
    B(page, 'Send 5 texts').click()
    check("That number doesn't match" in panel_text(page) and len(sent(page)) == 0, 'wrong count blocks sending')
    page.fill('#st-ct-confirm-count', '5')
    B(page, 'Send 5 texts').click()
    check(wait_done(page, 150), 'auto-send run finishes')
    lg = log_text(page)
    print(lg)
    s = sent(page)
    nums = [x[0] for x in s]
    opened = page.evaluate("() => window.chatOpened")
    check(sorted(opened) == sorted(['5045550001', '6015550102', '6015550009', '6015550010', '6015550012']), 'only conversations being texted were opened: %s' % opened)
    check('6015550006' not in opened, 'the unread conversation was never opened (stays unread)')
    check('5045550001' in nums, 'customer 1 texted')
    check('6015550102' in nums and '6015550002' not in nums, 'landline primary → texted their mobile instead')
    check('Amy Lee' in lg and 'no mobile number' in lg, 'landline-only customer skipped')
    check('replied STOP' in lg and '6015550004' not in nums, 'STOP reply skipped')
    check('texted 3 days ago' in lg and '6015550005' not in nums, '7-day rule skips recent text')
    check('unread reply' in lg and '6015550006' not in nums, 'unread reply skipped and listed')
    check('6015550009' in nums, 'automatic notifications do not count as texted')
    check('failed to send' in lg, 'failed send reported')
    check('same number as another customer in this run' in lg and nums.count('5045550001') == 1, 'shared number texted once')
    check('blocked in ServiceTitan' in lg and '6015550013' not in nums, 'blocked conversation skipped')
    check('6015550012' in nums and '6015550112' not in nums, 'only primary number by default')
    check(all(x[1].startswith('Hey, this is Andrew with AirSouth') for x in s), 'every text signed Andrew')
    check('Needs a look:' in lg, 'needs-a-look list')
    check(page.evaluate("() => location.hash").startswith('#/DispatchBoard'), 'back on the board after the run')
    n_before = len(s)

    # Second run: everyone just texted is skipped; the failed one is tried again
    back_to_main(page)
    t = review(page, 'Review and send to')
    check('Will text 1 number' in t and 'Hal Fry' in t.split('Will text')[1].split('Skipping')[0], 'second check: only the failed one will be texted')
    page.fill('#st-ct-confirm-count', '1')
    B(page, 'Send 1 text').click()
    check(wait_done(page, 150), 'second run finishes')
    lg = log_text(page); print(lg)
    s = sent(page)
    new = [x[0] for x in s[n_before:]]
    check(new == ['6015550010'], 'second run only retries the failed one: %s' % new)
    check(lg.count('texted today') >= 4, 'just-texted customers skipped as texted today')

    # A tech's text from his phone counts as a text from us; a customer's survey reply doesn't matter
    back_to_main(page)
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').locator('input').check()
    B(page, 'Clear').click()
    add_jobs(page, '5014')
    t = review(page, 'Review and send to 1 customer')
    check('Nobody to text' in t and 'Rae Moss …0014: texted 2 days ago' in t, "a tech's text counts toward the 7-day rule (like the Chat Center shows it)")
    B(page, 'Cancel').click()
    B(page, 'Clear').click()

    # Tech Updates: type only, pick on the board
    back_to_main(page)
    B(page, '🚚 Tech Updates').click()
    t = panel_text(page)
    check('Skips anyone who got this same message today.' in t, 'Tech Updates rule: same message today')
    check(page.locator('#st-toolbox input[type=radio][value]').count() >= 0, 'ok')
    page.locator('#st-toolbox label:visible', has_text='Type only').locator('input').check()
    B(page, 'Pick on board').click()
    page.click('a.appointment[data-job-id="6001"]')
    page.click('a.appointment[data-job-id="6002"]')
    check(page.evaluate("() => window.opened.length") == 0, 'board clicks captured while picking')
    check('2 jobs picked' in panel_text(page) and 'Kim Wu' in panel_text(page), 'picked jobs listed with customer')
    t = review(page, 'Start (type only)')
    check('Will text 1 number' in t and 'Lou Ng' in t.split('Skipping')[1], 'Lou (got it already today) skipped at the check')
    B(page, 'Start').click()
    page.wait_for_function("() => /Typed to Kim Wu/.test(document.getElementById('st-toolbox').innerText)", timeout=15000)
    check(page.evaluate("() => document.querySelector('textarea.cht-response-input').value").startswith('Hey, this is Andrew with Air South'), 'message typed into the chat box')
    page.click('.chat button[type=submit]')   # the person presses Send
    check(wait_done(page, 60), 'type-only run finishes after Send')
    lg = log_text(page); print(lg)
    check('Kim Wu' in lg and 'sent by you' in lg, 'noticed the person pressed Send')
    check('Lou Ng' in lg and 'got this message today' in lg, 'same message today skipped')

    # Picking from the Hold list at the bottom of the board
    back_to_main(page)
    B(page, 'Clear').click()
    B(page, 'Pick on board').click()
    page.click('.job-list tr.qa-job-5002 td')
    check(page.evaluate("() => window.opened.length") == 0, 'Hold-list row click captured while picking')
    check('#5002' in panel_text(page) and 'Bob Smith' in panel_text(page), 'Hold-list row picked with customer name')
    t = review(page, 'Start (type only)')
    check('Bob Smith …0102  (#5002)' in t, 'picked Hold-list job reaches the confirm list')
    B(page, 'Cancel').click()
    check(B(page, 'Pick on board').count() == 1, 'picking turned off when the run was set up')
    B(page, 'Clear').click()
    add_jobs(page, '6001')

    # Reschedule: type only, Skip clears the box
    B(page, '📅 Reschedule').click()
    check('1 job picked' in panel_text(page) or '2 jobs picked' in panel_text(page), 'picked list kept between folders')
    B(page, 'Clear').click()
    add_jobs(page, '6001')
    review(page, 'Start (type only)'); B(page, 'Start').click()
    page.wait_for_function("() => /Typed to Kim Wu/.test(document.getElementById('st-toolbox').innerText)", timeout=15000)
    B(page, 'Skip').click()
    check(wait_done(page, 30), 'skip run finishes')
    check('skipped by you (text cleared)' in log_text(page), 'skip logged')
    page.evaluate("() => { location.hash = '#/ChatCenter/6015550020'; }")
    page.wait_for_selector('textarea.cht-response-input')
    check(page.evaluate("() => document.querySelector('textarea.cht-response-input').value") == '', 'skipped text was cleared from the box')
    page.evaluate("() => { location.hash = '#/DispatchBoard'; }")
    page.wait_for_selector('a.appointment')

    # {tech} message added via the editor; job with no tech is skipped
    back_to_main(page)
    B(page, '🚚 Tech Updates').click()
    B(page, 'Edit messages').click()
    B(page, '+ Add a message').click()
    page.locator('#st-toolbox input:visible[placeholder^="Button name"]').last.fill('🚗 On the way')
    page.locator('#st-toolbox textarea[placeholder="Message text"]').last.fill('Hi {first}, this is {dispatcher}. {tech} is on the way!')
    B(page, 'Save').click()
    B(page, '🚗 On the way').click()
    B(page, 'Clear').click()
    add_jobs(page, '6003 6001')
    page.locator('#st-toolbox label:visible', has_text='Auto-send').locator('input').check()
    review(page, 'Review and send to 2 customers')
    page.fill('#st-ct-confirm-count', '1')
    B(page, 'Send 1 text').click()
    check(wait_done(page, 60), 'tech run finishes')
    lg = log_text(page); print(lg)
    check('no tech on the board for {tech}' in lg, 'job without a tech skipped for {tech}')
    check(sent(page)[-1] == ['6015550020', 'Hi Kim, this is Andrew. Paxton is on the way!'], 'fill-ins {first} {dispatcher} {tech}: %s' % sent(page)[-1])

    # Settings: every mobile + never-text list
    back_to_main(page)
    B(page, 'Settings').click()
    page.locator('#st-toolbox label:visible', has_text='Text every mobile number').locator('input').check()
    page.fill('#st-toolbox textarea[placeholder="One phone number per line"]', '(601) 555-0112')
    B(page, 'Save').click()
    B(page, '📅 Reschedule').click()
    B(page, 'Clear').click()
    add_jobs(page, '5012')
    review(page, 'Review and send to 1 customer')
    page.fill('#st-ct-confirm-count', '1')
    B(page, 'Send 1 text').click()
    check(wait_done(page, 60), 'all-mobiles run finishes')
    lg = log_text(page); print(lg)
    check('never-text list' in lg and '…0112' in lg, 'never-text number skipped')
    check(sent(page)[-1][0] == '6015550012', 'other mobile texted')

    # Edit folders: change the Holds rule
    back_to_main(page)
    B(page, 'Edit folders').click()
    page.locator('#st-toolbox input[type=number]').first.fill('0')
    B(page, 'Save').click()
    B(page, '⏸️ Holds').click()
    check('Never skips anyone.' in panel_text(page), 'folder rule edited')
    saved = json.loads(page.evaluate("() => localStorage.getItem('stCtFolders')"))
    check(saved[0]['days'] == 0 and len(saved[1]['msgs']) == 2, 'folders and messages saved in the browser')

    # Broken Chat Center → yellow bar and stop
    B(page, '📅 Reschedule').click()
    B(page, 'Clear').click()
    add_jobs(page, '7001 6001')
    review(page, 'Review and send to 2 customers')
    page.fill('#st-ct-confirm-count', '2')
    B(page, 'Send 2 texts').click()
    check(wait_done(page, 60), 'broken chat run ends')
    lg = log_text(page); print(lg)
    check("Chat Center didn't open" in lg and 'Stopped the run' in lg, 'missing chat box stops the run')
    check('ServiceTitan may have changed' in panel_text(page), 'yellow warning bar shown')

    # Stop + close while running
    back_to_main(page)
    B(page, '⏸️ Holds').click()
    page.evaluate("() => { Object.values(window.CHATS).forEach(c => { c.msgs = []; c.unread = false; c.fail = false; }); }")
    t = review(page, 'Review and send to')
    n = t.split('Will text ')[1].split(' ')[0]
    page.fill('#st-ct-confirm-count', n)
    B(page, 'Send ' + n + ' texts').click()
    time.sleep(2.5)
    page.locator('#st-toolbox span', has_text='✕').first.click()
    check('Customer Texts is still running' in panel_text(page), 'closing mid-run asks first')
    B(page, 'Keep running').click()
    B(page, 'Stop').click()
    check(wait_done(page, 30), 'stop ends the run')
    lg = log_text(page); print(lg)
    check('Stopped.' in lg, 'stopped early')

    # A text that only shows as failed a few seconds later is still caught
    back_to_main(page)
    B(page, '📅 Reschedule').click()
    B(page, 'Clear').click()
    add_jobs(page, '6001')
    page.evaluate("() => { window.CHATS['6015550020'] = { unread: false, lateFail: true, msgs: [] }; }")
    review(page, 'Review and send to 1 customer')
    page.fill('#st-ct-confirm-count', '1')
    B(page, 'Send 1 text').click()
    check(wait_done(page, 60), 'late-failure run finishes')
    lg = log_text(page); print(lg)
    check('Kim Wu …0020: sent' in lg and 'Kim Wu …0020: ServiceTitan says it failed to send' in lg, 'late failure found by the background check')
    check('Done: 1 problem.' in panel_text(page), 'summary counts it as a problem, not sent')
    page.evaluate("() => { window.CHATS['6015550020'].lateFail = false; }")

    # Chat data unreadable: the conversation's own page is checked instead
    back_to_main(page)
    B(page, '🚚 Tech Updates').click()
    B(page, '⏱️ Running late').click()
    B(page, 'Clear').click()
    add_jobs(page, '6002')
    page.evaluate("() => { window.CHAT_API_DOWN = true; window.CHATS['6015550021'] = { unread: false, msgs: [{ Body: 'Hey, this is Andrew with Air South Cooling and Heating. I am reaching out about your appointment. I wanted to update as I know your time is valuable. My expert has ran into a few delays, but is still scheduled to come out to see you. He will send you a text 30 minutes before his arrival. If you have any questions or concerns, please give me a call back at 601-847-9941. Thank you for being the best part of AirSouth!', IsOutbound: true, CreatedOn: new Date().toISOString() }] }; }")
    t = review(page, 'Review and send to 1 customer')
    check('checked on its page instead' in t, 'confirm says the page will be checked instead')
    page.fill('#st-ct-confirm-count', '1')
    B(page, 'Send 1 text').click()
    check(wait_done(page, 60), 'fallback run finishes')
    lg = log_text(page); print(lg)
    check('Lou Ng' in lg and 'got this message today' in lg, "the page's own check still skips a repeat")
    page.evaluate("() => { window.CHAT_API_DOWN = false; }")

    # Other tools still open, then close cleanly
    back_to_main(page)
    B(page, '← Menu').click()
    for t in ['Notes', 'Job Notifications', 'Tech Messages', 'Business Unit']:
        B(page, t).click()
        check(page.locator('#st-toolbox').is_visible(), t + ' opens')
        page.evaluate("() => { const b = Array.from(document.querySelectorAll('#st-toolbox button')).find(b => /Menu/.test(b.textContent) && b.offsetParent); if (b) b.click(); }")
    page.evaluate("() => window.__stToolbox.close()")
    page.click('a.appointment[data-job-id="6001"]')
    check(page.evaluate("() => window.opened.length") == 1, 'board clicks normal after closing')
    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
