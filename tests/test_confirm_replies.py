import sys, time, pathlib, json, re
from playwright.sync_api import sync_playwright

# ✅ Confirm Appt folder and 📥 Check replies (new in 1.6.4): customers who answer C (or yes, OK,
# 👍...) to a confirm text get their appointments on the board's day confirmed; anything else is
# listed for you to read. Replies to other folders' texts are never read as a confirmation.
HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_texts.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

CONFIRM = "Hey, this is Andrew with AirSouth Cooling, Heating, Plumbing, and Electrical. I'm reaching out to remind you of your appointment you have with us tomorrow. If you have any questions, please call (601) 847-9941. Reply 'C' to confirm. Thank you!"
BOSS = CONFIRM.replace('Andrew', 'Jeff')
OUTREACH = 'Hey, this is Andrew with AirSouth Cooling, Heating, Plumbing and Electrical. Cooler weather is on the way, so here is a friendly reminder to switch your thermostat to heat and let it run for a few minutes before the first cold night. Reply STOP to opt out.'
# Board: Kim Wu 6001 + 7102 (unassigned), Lou Ng 6002, Mo Day 6003, Pia Lane 7101 (unassigned).
# 6004 and 7103 are canceled, 6005 is yesterday's. Appointment ids are job + 100000.
KIM, LOU, MO, PIA = '6015550020', '6015550021', '6015550022', '6015550031'

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first

# The Confirm button (not a section header that also says "confirm").
def CB(page, text):
    return page.locator('#st-toolbox button:visible').filter(has_text=re.compile('^' + re.escape(text))).first

def panel_text(page):
    return page.locator('#st-toolbox').inner_text()

# The report as text: the notes, then each section's title and one line per customer card
# (folded sections too), the parts of a card joined by " | ".
def log_text(page):
    return page.evaluate("""() => {
      const box = document.querySelector('#st-toolbox .st-cust-section') ? document.querySelector('#st-toolbox .st-cust-section').parentElement : null;
      if (!box) return '';
      return Array.from(box.children).map(ch => {
        if (!ch.classList.contains('st-cust-section')) return ch.textContent.trim();
        const cards = Array.from(ch.querySelectorAll('.st-cust-card')).map(c => '• ' + Array.from(c.querySelectorAll(':scope > div')).map(d => d.textContent.trim()).join(' | '));
        return ch.getAttribute('data-title') + '\\n' + cards.join('\\n');
      }).join('\\n\\n'); }""")

def open_board(page, saved=None, added=None, confirm=None):
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("([s, a, c]) => { localStorage.clear(); if (s) localStorage.setItem('stCtFolders', s); if (a) localStorage.setItem('stCtAddedFolders', a); if (c) localStorage.setItem('stCtConfirmFolders', c); Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); }", [saved, added, confirm])
    page.evaluate(TOOLBOX)
    B(page, 'Customer Texts').click()

def chats(page, d):
    page.evaluate("d => { Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); Object.assign(window.CHATS, d); }", d)

def msg(body, out=False, hours=1.0, **kw):
    import datetime
    m = {'Body': body, 'CreatedOn': (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=hours)).strftime('%Y-%m-%dT%H:%M:%S.000Z')}
    m['IsOutbound' if out else 'IsInbound'] = True
    m.update(kw)
    return m

def run_check(page):
    B(page, 'Check replies').click()
    page.wait_for_function("() => /Checked \\d+ customer|Couldn't|signed you out/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    return log_text(page)

def section(log, title):
    if title not in log: return ''
    return log.split(title, 1)[1].split('\n\n')[0]

def confirmed(page):
    return page.evaluate("() => Object.keys(window.CONFIRMED).filter(k => window.CONFIRMED[k]).map(Number).sort()")

def finish_confirm(page):
    page.wait_for_function("() => /^(Done|Stopped|⚠️)/m.test(Array.from(document.querySelectorAll('#st-toolbox div')).map(d => d.textContent).join('\\n')) && !Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))", timeout=30000)

def back(page):
    if B(page, '← Back').count(): B(page, '← Back').click()

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    # ---- The folder ----
    open_board(page)
    t = panel_text(page)
    check('✅ Confirm Appt' in t, 'Confirm Appt is a default folder')
    check(not B(page, 'Check replies').is_visible(), 'Check replies is hidden on other folders')
    B(page, '✅ Confirm Appt').click()
    t = panel_text(page)
    check(B(page, 'Check replies').is_visible(), 'Check replies shows on Confirm Appt')
    check('Customers confirm by replying C' in t, 'the folder says replies of C confirm')
    check('Skips anyone who got this same message today.' in t, 'Confirm Appt rule: same message, today')
    check(page.locator('#st-toolbox label:visible', has_text='Jobs I pick').locator('input').is_checked(), 'Confirm Appt uses Jobs I pick (for ＋ Everyone on the board)')
    folders = json.loads(page.evaluate("() => localStorage.getItem('stCtFolders') || 'null'") or 'null')
    # The starter message, as the first customer will see it.
    B(page, 'Everyone on the board').click()
    page.wait_for_function("() => /Added \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    B(page, 'Start (type only)').click()
    page.wait_for_function("() => /Will text|Nobody to text/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    t = panel_text(page)
    check(CONFIRM in t, 'starter message is the exact Confirm Appt text, signed Andrew')
    B(page, 'Cancel').click()
    B(page, 'Clear').click()

    # Edit folders: Confirm Appt ticked, OutReach not; unticking hides Check replies.
    B(page, 'Edit folders').click()
    boxes = page.locator('#st-toolbox label:visible', has_text='Customers confirm by replying C')
    names = page.locator('#st-toolbox input[placeholder="Folder name"]:visible').evaluate_all("l => l.map(i => i.value)")
    ticks = boxes.evaluate_all("l => l.map(x => x.querySelector('input').checked)")
    check(dict(zip(names, ticks)) == {'⏸️ Holds': False, '🚚 Tech Updates': False, '📅 Reschedule': False, '✅ Confirm Appt': True, '📣 OutReach': False}, 'only Confirm Appt is ticked: %s' % dict(zip(names, ticks)))
    boxes.nth(names.index('✅ Confirm Appt')).locator('input').uncheck()
    B(page, 'Save').click()
    check(not B(page, 'Check replies').is_visible(), 'unticked: Check replies hidden')
    B(page, 'Edit folders').click()
    page.locator('#st-toolbox input[placeholder="Folder name"]:visible').nth(names.index('📣 OutReach')).fill('📣 OutReach 2')
    page.locator('#st-toolbox label:visible', has_text='Customers confirm by replying C').nth(names.index('📣 OutReach')).locator('input').check()
    B(page, 'Save').click()
    B(page, '📣 OutReach 2').click()
    check(B(page, 'Check replies').is_visible(), 'any folder can be ticked (and a renamed folder keeps it)')
    B(page, 'Edit folders').click()
    B(page, 'Reset to original').click()
    B(page, 'Save').click()
    B(page, '✅ Confirm Appt').click()
    check(B(page, 'Check replies').is_visible(), 'Reset to original ticks Confirm Appt again')
    page.evaluate("() => window.__stToolbox.close()")

    # Someone who already saved folders gets Confirm Appt once, ticked.
    OLD = json.dumps([{'name': '⏸️ Holds', 'days': 7, 'same': False, 'msgs': [['Hold', 'x']]}, {'name': '📣 OutReach', 'days': 30, 'same': True, 'msgs': [['Heat', OUTREACH]]}])
    open_board(page, OLD, json.dumps(['📣 OutReach']))
    t = panel_text(page)
    check('✅ Confirm Appt' in t, 'saved folders get Confirm Appt added')
    B(page, '✅ Confirm Appt').click()
    check(B(page, 'Check replies').is_visible(), '...and it confirms by C')
    page.evaluate("() => window.__stToolbox.close()")

    # ---- Checking replies ----
    open_board(page)
    B(page, '✅ Confirm Appt').click()
    chats(page, {
        KIM: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('C', hours=2)]},
        LOU: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('Can he come after 2?', hours=2)]},
        MO: {'unread': False, 'msgs': [msg(CONFIRM, True, 3)]},
        PIA: {'unread': True, 'msgs': [msg(BOSS, True, 3), msg('Yes 👍 thanks', hours=1)]},
    })
    page.evaluate("() => { window.CONFIRM_POSTS.length = 0; }")
    log = run_check(page); print(log)
    yes = section(log, '✅ Answered yes')
    check('Kim Wu' in yes and '#6001, #7102' in yes and 'will confirm 3 appointments' in log, 'Kim (C, two jobs) and Pia (yes 👍 to the boss\'s text) will be confirmed')
    check('Pia Lane' in yes, 'a confirm text sent by someone else (the boss) counts')
    check('Lou Ng' in section(log, '⚠️ Needs a look') and 'Can he come after 2?' in log, 'Lou asked a question: needs a look, with what he said')
    check('Mo Day' in section(log, '💤 No reply yet'), 'Mo: no reply yet')
    check('Oz Tate' not in log and 'Quin Hart' not in log, 'canceled appointments left out')
    check(page.evaluate("() => window.CONFIRM_POSTS.length") == 0, 'nothing confirmed by the check alone')
    check(page.evaluate("() => window.CHATS['6015550031'].unread") is True, 'reading Pia\'s unread reply left it unread')
    check(CB(page, 'Confirm 3 appointments').is_visible(), 'Confirm button says how many')
    CB(page, 'Confirm 3 appointments').click()
    finish_confirm(page)
    log = log_text(page); print(log)
    check(confirmed(page) == [106001, 107101, 107102], 'confirmed exactly Kim\'s two and Pia\'s: %s' % confirmed(page))
    posts = page.evaluate("() => window.CONFIRM_POSTS")
    check(all(set(x.keys()) == {'jobAppointmentId', 'isConfirmed'} and x['isConfirmed'] is True for x in posts) and len(posts) == 3, 'the request is { jobAppointmentId, isConfirmed: true }: %s' % posts)
    check('3 appointments confirmed' in panel_text(page), 'summary says 3 confirmed')
    check('Lou Ng' in section(log, '⚠️ Needs a look') and 'Mo Day' in section(log, '💤 No reply yet'), 'final report keeps needs-a-look and no-reply lists')
    conf = section(log, '✅ Confirmed')
    check('Kim Wu' in conf and '#6001, #7102' in conf and conf.count('• ') == 2, 'Confirmed: one card per customer, Kim\'s two jobs together')
    check(page.locator('#st-toolbox .st-cust-card:visible').filter(has_text='Kim Wu').count() == 1, 'Confirmed is open, with Kim\'s card showing')

    # Again: already confirmed now.
    back(page)
    log = run_check(page)
    check('Kim Wu' in section(log, '☑️ Answered yes, already confirmed') and CB(page, 'Confirm ').count() == 0, 'second check: already confirmed, nothing to do')
    back(page)

    # STOP, a yes then a question, a C to a different folder's text, a failed confirm text.
    page.evaluate("() => { Object.keys(window.CONFIRMED).forEach(k => delete window.CONFIRMED[k]); }")
    chats(page, {
        KIM: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('C', hours=2), msg('Actually can we move it?', hours=1)]},
        LOU: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('STOP', hours=2)]},
        MO: {'unread': False, 'msgs': [msg(OUTREACH, True, 3), msg('C', hours=2)]},
        PIA: {'unread': False, 'msgs': [msg(CONFIRM, True, 3, SmsSendErrorCode=21610)]},
    })
    log = run_check(page); print(log)
    look = section(log, '⚠️ Needs a look')
    check('Kim Wu' in look and 'They replied: | C | Actually can we move it?' in look, 'C then a question: needs a look (both replies shown)')
    check('Lou Ng' in look and 'Replied STOP / Cancel' in look, 'STOP: needs a look, never confirmed')
    check('Mo Day' in section(log, '📭 Not texted'), 'a C to an OutReach text is ignored (not texted with a confirm text)')
    mo = page.locator('#st-toolbox .st-cust-card').filter(has_text='Mo Day').first
    check(not mo.is_visible() and page.locator('#st-toolbox .st-cust-card:visible').filter(has_text='Kim Wu').count() == 1, 'Not texted starts folded; Needs a look starts open')
    page.locator('#st-toolbox button:visible', has_text='📭 Not texted').first.click()
    check(mo.is_visible() and '(601) 555-0022' in mo.inner_text() and 'No confirm text since' in mo.inner_text(), 'opening Not texted shows Mo\'s card, number and why')
    page.locator('#st-toolbox button:visible', has_text='📭 Not texted').first.click()
    check(not mo.is_visible(), 'and it folds shut again')
    check('Pia Lane' in look and 'didn\'t go through' in look, 'a confirm text that failed: needs a look')
    check(CB(page, 'Confirm ').count() == 0, 'nothing to confirm')
    back(page)

    # An old confirm text (more than 3 days before the day) doesn't count.
    chats(page, {KIM: {'unread': False, 'msgs': [msg(CONFIRM, True, 24 * 5), msg('C', hours=24 * 5 - 1)]}})
    log = run_check(page)
    check('Kim Wu' in section(log, '📭 Not texted'), 'a confirm text from 5 days ago doesn\'t count')
    back(page)

    # Which confirm texts count: one sent on the last weekday before the board's day (or later).
    # Just before that day starts: an earlier appointment's text, so a C to it doesn't count.
    def at_edge(minutes):
        return page.evaluate('''m => { const t = new Date(); t.setHours(0, 0, 0, 0); const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1);
          while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1); return new Date(d.getTime() + m * 60000).toISOString(); }''', minutes)
    chats(page, {
        KIM: {'unread': False, 'msgs': [{'Body': CONFIRM, 'IsOutbound': True, 'CreatedOn': at_edge(-30)}, {'Body': 'C', 'IsInbound': True, 'CreatedOn': at_edge(-20)}]},
        MO: {'unread': False, 'msgs': [{'Body': CONFIRM, 'IsOutbound': True, 'CreatedOn': at_edge(30)}, {'Body': 'C', 'IsInbound': True, 'CreatedOn': at_edge(40)}]},
    })
    log = run_check(page)
    check('Kim Wu' in section(log, '📭 Not texted') and 'Mo Day' in section(log, '✅ Answered yes'), 'a text from before the last weekday before the day doesn\'t count; one sent on it does')
    back(page)

    # Someone reading the reply between the check and Confirm isn't a new message.
    # An appointment moved to another day after the check isn't confirmed.
    chats(page, {
        KIM: {'unread': True, 'msgs': [msg(CONFIRM, True, 3), msg('C', hours=2)]},
        MO: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('Yes', hours=2)]},
    })
    page.evaluate("() => { Object.keys(window.CONFIRMED).forEach(k => delete window.CONFIRMED[k]); }")
    log = run_check(page)
    check('will confirm 3 appointments' in log, 'Kim (two) and Mo to confirm')
    page.evaluate("() => { window.CHATS['6015550020'].unread = false; window.APPT_START[106003] = new Date(Date.now() + 3 * 86400000).toISOString(); }")
    CB(page, 'Confirm 3 appointments').click()
    finish_confirm(page)
    log = log_text(page); print(log)
    check(106001 in confirmed(page) and 107102 in confirmed(page), 'Kim confirmed even though her reply was read in the meantime')
    check(106003 not in confirmed(page) and 'moved to' in section(log, '⚠️ Needs a look'), 'Mo\'s appointment moved to another day: not confirmed, listed')
    back(page)
    page.evaluate("() => { window.APPT_START = {}; Object.keys(window.CONFIRMED).forEach(k => delete window.CONFIRMED[k]); }")

    # A new message after the check: not confirmed. A confirm that doesn't stick: needs a look.
    # An appointment that's Done: not confirmed. Board already showing confirmed: skipped.
    chats(page, {
        KIM: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('c', hours=2)]},
        LOU: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('Confirmed.', hours=2)]},
        MO: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('ok', hours=2)]},
        PIA: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('Liked “Hey, this is Andrew…”', hours=2)]},
    })
    page.evaluate("() => { window.CONFIRM_POSTS.length = 0; window.CONFIRM_IGNORE[106003] = true; window.APPT_STATUS[107101] = 4; }")
    log = run_check(page)
    check('will confirm 5 appointments' in log, 'c, Confirmed., ok and an iPhone 👍 reaction all count as yes')
    page.evaluate("n => window.CHATS[n].msgs.push({ Body: 'wait what time?', IsInbound: true, CreatedOn: new Date().toISOString() })", KIM)
    CB(page, 'Confirm 5 appointments').click()
    finish_confirm(page)
    log = log_text(page); print(log)
    look = section(log, '⚠️ Needs a look')
    check('Kim Wu' in look and 'new message came in' in look and 106001 not in confirmed(page) and 107102 not in confirmed(page), 'a reply that came in after the check stops Kim\'s confirm')
    check('#6003' in look and 'didn\'t keep it confirmed' in look, 'a confirm that doesn\'t stick is reported')
    check('#7101' in look and 'done' in look and 107101 not in confirmed(page), 'a Done appointment is not confirmed')
    check(confirmed(page) == [106002], 'only Lou confirmed: %s' % confirmed(page))
    back(page)
    page.evaluate("() => { window.CONFIRM_IGNORE = {}; window.APPT_STATUS = {}; }")

    # Reply wording: what counts as yes, and what you read yourself.
    YES = ['C', 'c.', ' C ', 'CC', 'Yes', 'yes ma’am', 'Yep!', 'OK 👍', 'Okay thank you', '👍', '✅', 'Confirmed, thanks!', 'confirm', 'Sounds good', "We'll be there"]
    NO = ['No', 'C?', 'Can you call me', 'Cancel', 'Who is this', 'C but can he come after 2', 'reschedule please', '😡', 'Questioned “Hey…”', 'yes but late']
    def kind_of(reply):
        page.evaluate("() => { Object.keys(window.CONFIRMED).forEach(k => delete window.CONFIRMED[k]); }")
        chats(page, {MO: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg(reply, hours=2)]}})
        lg = run_check(page)
        back(page)
        return 'yes' if 'Mo Day' in section(lg, '✅ Answered yes') else 'look' if 'Mo Day' in section(lg, '⚠️ Needs a look') else '?'
    bad_yes = [r for r in YES if kind_of(r) != 'yes']
    check(not bad_yes, 'counted as yes: ' + ', '.join(YES) + ('  MISSED: %s' % bad_yes if bad_yes else ''))
    bad_no = [r for r in NO if kind_of(r) != 'look']
    check(not bad_no, 'left for you to read: ' + ', '.join(NO) + ('  WRONG: %s' % bad_no if bad_no else ''))

    # Jobs picked: only those are checked.
    chats(page, {KIM: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('C', hours=2)]}, MO: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg('C', hours=2)]}})
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '6003 9999')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').filter(has_not_text='folder').first.click()
    log = run_check(page)
    check('Mo Day' in log and 'Kim Wu' not in log and 'not on' in log and '#9999' in log, 'with jobs picked, only those are checked (and a job not on the day is listed)')
    back(page)
    B(page, 'Clear').click()

    # ServiceTitan marks a conversation read when its messages are read: the others stay unread.
    chats(page, {
        KIM: {'unread': True, 'msgs': [msg(CONFIRM, True, 3), msg('C', hours=2)]},
        LOU: {'unread': True, 'msgs': [msg(CONFIRM, True, 3), msg('C', hours=2)]},
        MO: {'unread': True, 'msgs': [msg(CONFIRM, True, 3), msg('C', hours=2)]},
    })
    page.evaluate("() => { window.MARK_READ_ON_FETCH = true; }")
    log = run_check(page); print(log)
    unread_left = page.evaluate("() => ['6015550020','6015550021','6015550022'].filter(n => window.CHATS[n].unread).length")
    check(unread_left == 2 and 'marked a conversation read' in log and log.lower().count('has an unread message') == 2, 'only one conversation turned read; the other two left unread and listed')
    page.evaluate("() => { window.MARK_READ_ON_FETCH = false; }")
    back(page)

    # The Needs a look cards: what they said in full, the whole number, and copy / open buttons.
    LONG = 'Good morning! I will be at work until 3 but my husband will be home after noon, can your guy call him at the number on file before coming out?'
    chats(page, {LOU: {'unread': False, 'msgs': [msg(CONFIRM, True, 3), msg(LONG, hours=2)]}})
    page.evaluate('''() => { window.CLIP = []; window.OPENED = [];
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async t => { window.CLIP.push(t); } } });
      window.open = u => { window.OPENED.push(u); return null; }; }''')
    run_check(page)
    card = page.locator('#st-toolbox .st-cust-card:visible').filter(has_text='Lou Ng').first
    ct = card.inner_text()
    print(ct)
    check(LONG in ct, 'the whole reply is shown, not cut short')
    check('(601) 555-0021' in ct and '#6002' in ct, 'the full phone number and job number are on the card')
    card.locator('button', has_text='Name').click()
    card.locator('button', has_text='Phone').click()
    page.wait_for_function("() => window.CLIP.length >= 2", timeout=5000)
    check(page.evaluate("() => window.CLIP") == ['Lou Ng', '(601) 555-0021'], 'Copy name and Copy phone copy just that: %s' % page.evaluate("() => window.CLIP"))
    check('✓ Copied' in card.inner_text(), 'the button says Copied')
    card.locator('button', has_text='Open chat').click()
    check(page.evaluate("() => window.OPENED.length === 1 && /#\\/ChatCenter\\/6015550021$/.test(window.OPENED[0])"), 'Open chat opens their conversation in a new tab')
    page.evaluate("() => { window.CLIP = []; }")
    B(page, 'Copy results').click()
    page.wait_for_function("() => window.CLIP.length >= 1", timeout=5000)
    check('Needs a look (1)' in page.evaluate("() => window.CLIP[0]") and LONG in page.evaluate("() => window.CLIP[0]"), 'Copy results includes Needs a look with the full reply')
    back(page)

    # Signed out during the check: nothing confirmed.
    page.evaluate("() => { window.API_401 = true; }")
    B(page, 'Check replies').click()
    page.wait_for_function("() => /signed you out/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    check('Nothing was confirmed' in panel_text(page) or 'signed you out' in panel_text(page), 'signed out: says so, nothing confirmed')
    page.evaluate("() => { window.API_401 = false; }")
    back(page)

    check(not errors, 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails))
sys.exit(1 if fails else 0)
