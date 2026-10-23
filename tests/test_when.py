import sys, time, pathlib, json, re, datetime
from playwright.sync_api import sync_playwright

# {when} (new in 1.6.5): "today", "tomorrow" or "on Friday, October 30", from the appointment's day
# on the board and today's date when the text goes out. 📥 Check replies: a confirm text that names
# a date counts for that date only. The 1.6.4 Confirm Appt message is updated once.
HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_texts.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

OLD = "Hey, this is {dispatcher} with AirSouth Cooling, Heating, Plumbing, and Electrical. I'm reaching out to remind you of your appointment you have with us tomorrow. If you have any questions, please call (601) 847-9941. Reply 'C' to confirm. Thank you!"
NEW = OLD.replace('with us tomorrow.', 'with us {when}.')
KIM, LOU, MO, PIA = '6015550020', '6015550021', '6015550022', '6015550031'

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first

def panel_text(page):
    return page.locator('#st-toolbox').inner_text()

def open_board(page, saved=None, flag=None):
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("([s, f]) => { localStorage.clear(); if (s) { localStorage.setItem('stCtFolders', s); localStorage.setItem('stCtAddedFolders', JSON.stringify(['📣 OutReach', '✅ Confirm Appt'])); } if (f) localStorage.setItem('stCtWhenUpdated', f); Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); }", [saved, flag])
    page.evaluate(TOOLBOX)
    B(page, 'Customer Texts').click()

def set_board_day(page, days):
    page.evaluate("n => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); document.querySelector('.job-list').__vm.Date(d); }", days)

def long_date(page, days):
    return page.evaluate("n => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }", days)

def review(page):
    B(page, 'Start (type only)').click()
    page.wait_for_function("() => /Will text|Nobody to text/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    t = panel_text(page)
    B(page, 'Cancel').click()
    return t

def everyone(page):
    if B(page, 'Clear').count(): B(page, 'Clear').click()
    B(page, 'Everyone on the board').click()
    page.wait_for_function("() => /Added \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)

def ago(h):
    return (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=h)).strftime('%Y-%m-%dT%H:%M:%S.000Z')

def chats(page, d):
    page.evaluate("d => { Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); Object.assign(window.CHATS, d); }", d)

def check_text(page):
    B(page, 'Check replies').click()
    page.wait_for_function("() => /Checked \\d+ customer|Couldn't/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    t = page.evaluate("""() => Array.from(document.querySelectorAll('#st-toolbox .st-cust-section')).map(s => s.getAttribute('data-title') + '\\n' +
        Array.from(s.querySelectorAll('.st-cust-card')).map(c => c.textContent).join('\\n')).join('\\n\\n')""")
    B(page, '← Back').click()
    return t

def section(log, title):
    return log.split(title, 1)[1].split('\n\n')[0] if title in log else ''

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    open_board(page)
    B(page, '✅ Confirm Appt').click()
    # The board on today, tomorrow, a week out, and yesterday.
    everyone(page)
    t = review(page)
    check('with us today.' in t, '{when} on today\'s board: "today"')
    set_board_day(page, 1); everyone(page)
    t = review(page)
    check('with us tomorrow.' in t, '{when} on tomorrow\'s board: "tomorrow"')
    set_board_day(page, 7); everyone(page)
    t = review(page)
    want = 'with us on ' + long_date(page, 7) + '.'
    check(want in t, '{when} a week out: the date (%s)' % want)
    set_board_day(page, -1); everyone(page)
    t = review(page)
    check('Nobody to text' in t and 'their appointment day has already passed' in t, 'a day that has passed: nobody texted, says why')
    set_board_day(page, 0)
    # A hold, typed by job number: its day isn't known, so it's skipped.
    B(page, 'Clear').click()
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '5002')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').filter(has_not_text='folder').first.click()
    t = review(page)
    check('no upcoming appointment for {when}' in t, 'a typed job with no upcoming appointment is skipped for {when}, with why')
    B(page, 'Clear').click()
    # A typed job from another day: its own appointment date is read.
    page.evaluate("() => { window.APPT_START[106005] = new Date(Date.now() + 3 * 86400000).toISOString(); }")
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '6005')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').filter(has_not_text='folder').first.click()
    t = review(page)
    want = 'with us on ' + long_date(page, 3) + '.'
    check(want in t, 'a job not on the board\'s day gets its own appointment date (%s)' % want)
    page.evaluate("() => { window.APPT_START = {}; }")
    B(page, 'Clear').click()
    # The Hold list: on hold, no appointment day.
    page.locator('#st-toolbox label:visible', has_text='Hold list').locator('input').check()
    B(page, 'Load holds').click()
    page.wait_for_function("() => /Loaded \\d+ hold/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    page.locator('#st-toolbox label:visible', has_text='Quote (').first.locator('input').check()
    t = review(page)
    check('on hold, so there' in t and 'Nobody to text' in t, 'holds are skipped for {when}')
    page.locator('#st-toolbox label:visible', has_text='Jobs I pick').locator('input').check()
    # Other messages don't need it, and {when} is in the hint.
    B(page, 'Edit messages').click()
    check('{when}' in panel_text(page) and 'tomorrow' in panel_text(page), 'Edit messages explains {when}')
    B(page, 'Cancel').click()
    page.evaluate("() => window.__stToolbox.close()")

    # The 1.6.4 message saved in someone's folders becomes the {when} one, once.
    saved = [{'name': '⏸️ Holds', 'days': 7, 'same': False, 'msgs': [['Hold', 'x']]},
             {'name': '✅ Confirm Appt', 'days': 1, 'same': True, 'msgs': [['📅 Confirm tomorrow', OLD], ['My own', OLD.replace('Thank you!', 'Thanks!')]]}]
    open_board(page, json.dumps(saved))
    f = json.loads(page.evaluate("() => localStorage.getItem('stCtFolders')"))
    msgs = [x for x in f if x['name'] == '✅ Confirm Appt'][0]['msgs']
    check(msgs[0] == ['📅 Confirm appointment', NEW], 'the unchanged 1.6.4 message is updated to {when}')
    check(msgs[1] == ['My own', OLD.replace('Thank you!', 'Thanks!')], 'a message you changed is left alone')
    page.evaluate("() => window.__stToolbox.close()")
    open_board(page, json.dumps(saved), '1')
    f = json.loads(page.evaluate("() => localStorage.getItem('stCtFolders')"))
    check([x for x in f if x['name'] == '✅ Confirm Appt'][0]['msgs'][0][1] == OLD, 'only once: put back to "tomorrow" by hand, it stays')
    page.evaluate("() => window.__stToolbox.close()")

    # 📥 Check replies: a text that names a date counts for that date only.
    open_board(page)
    B(page, '✅ Confirm Appt').click()
    today_long = long_date(page, 0)
    tmrw_long = long_date(page, 1)
    md = page.evaluate("() => { const d = new Date(); return (d.getMonth() + 1) + '/' + d.getDate(); }")
    ahead = NEW.replace('{dispatcher}', 'Andrew').replace('{when}', 'on ' + today_long)
    other = NEW.replace('{dispatcher}', 'Andrew').replace('{when}', 'on ' + tmrw_long)
    chats(page, {
        KIM: {'unread': False, 'msgs': [{'Body': ahead, 'IsOutbound': True, 'CreatedOn': ago(24 * 6)}, {'Body': 'C', 'IsInbound': True, 'CreatedOn': ago(24 * 6 - 1)}]},
        LOU: {'unread': False, 'msgs': [{'Body': other, 'IsOutbound': True, 'CreatedOn': ago(2)}, {'Body': 'C', 'IsInbound': True, 'CreatedOn': ago(1)}]},
        MO: {'unread': False, 'msgs': [{'Body': 'Reply C to confirm your ' + md + ' appointment with AirSouth', 'IsOutbound': True, 'CreatedOn': ago(24 * 5)}, {'Body': 'yes', 'IsInbound': True, 'CreatedOn': ago(24 * 5 - 1)}]},
        PIA: {'unread': False, 'msgs': [{'Body': NEW.replace('{dispatcher}', 'Jasmin').replace('{when}', 'today'), 'IsOutbound': True, 'CreatedOn': ago(1)}, {'Body': 'c', 'IsInbound': True, 'CreatedOn': ago(0.5)}]},
    })
    log = check_text(page); print(log)
    yes = section(log, '✅ Will confirm')
    check('Kim Wu' in yes, 'a reminder sent a week ahead that names today\'s date counts')
    check('Lou Ng' in section(log, '📭 Not texted'), 'a text naming another date doesn\'t count for this day')
    check('Mo Day' in yes, 'a date written as %s counts too' % md)
    check('Pia Lane' in yes, 'a {when} = "today" text sent this morning counts')
    check('no confirm text for' in log, 'Not texted says which day')
    # Texts without a date: "today" sent yesterday was about yesterday; "tomorrow" sent today is
    # about tomorrow. Neither counts for today. "tomorrow" sent yesterday does.
    chats(page, {
        KIM: {'unread': False, 'msgs': [{'Body': NEW.replace('{dispatcher}', 'Andrew').replace('{when}', 'today'), 'IsOutbound': True, 'CreatedOn': ago(24)}, {'Body': 'C', 'IsInbound': True, 'CreatedOn': ago(23)}]},
        LOU: {'unread': False, 'msgs': [{'Body': OLD.replace('{dispatcher}', 'Andrew'), 'IsOutbound': True, 'CreatedOn': ago(1)}, {'Body': 'C', 'IsInbound': True, 'CreatedOn': ago(0.5)}]},
        MO: {'unread': False, 'msgs': [{'Body': OLD.replace('{dispatcher}', 'Andrew'), 'IsOutbound': True, 'CreatedOn': ago(24)}, {'Body': 'C', 'IsInbound': True, 'CreatedOn': ago(23)}]},
    })
    log = check_text(page); print(log)
    nt = section(log, '📭 Not texted')
    check('Kim Wu' in nt, '"today" sent yesterday doesn\'t count for today')
    check('Lou Ng' in nt, '"tomorrow" sent today doesn\'t count for today')
    check('Mo Day' in section(log, '✅ Will confirm'), '"tomorrow" sent yesterday counts')

    check(not errors, 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails))
sys.exit(1 if fails else 0)
