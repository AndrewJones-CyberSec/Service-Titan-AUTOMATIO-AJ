import sys, pathlib, json, re, datetime
from playwright.sync_api import sync_playwright

# 📥 Check replies → ☎️ Talked with them today = confirmed (new in 2.7.1): a customer we spoke with
# on the phone today, or who texted us today, goes on the Will confirm list when their appointment
# starts within 24 hours, even without a C. Not when they said anything about canceling or another
# day. A short call of ours (no answer, a voicemail) or yesterday's call doesn't count.
HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_texts.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

SENT = "Hey, this is Andrew with AirSouth Cooling, Heating, Plumbing, and Electrical. I'm reaching out to remind you of your appointment you have with us. If you have any questions, please call (601) 847-9941. Reply 'C' to confirm. Thank you!"
# Board: Kim Wu 6001 + 7102 (unassigned), Lou Ng 6002, Mo Day 6003, Pia Lane 7101 (unassigned).
# Appointment ids are job + 100000. Board jobs start at 9 AM today; the Unassigned ones get 10 AM.
KIM, LOU, MO, PIA = '6015550020', '6015550021', '6015550022', '6015550031'

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first
def CB(page, text):
    return page.locator('#st-toolbox button:visible').filter(has_text=re.compile('^' + re.escape(text))).first

def log_text(page):
    return page.evaluate("""() => {
      const box = document.querySelector('#st-toolbox .st-cust-section') ? document.querySelector('#st-toolbox .st-cust-section').parentElement : null;
      if (!box) return '';
      return Array.from(box.children).map(ch => {
        if (!ch.classList.contains('st-cust-section')) return ch.textContent.trim();
        const cards = Array.from(ch.querySelectorAll('.st-cust-card')).map(c => '• ' + Array.from(c.querySelectorAll(':scope > div')).map(d => d.textContent.trim()).join(' | '));
        return ch.getAttribute('data-title') + '\\n' + cards.join('\\n');
      }).join('\\n\\n'); }""")

def section(log, title):
    if title not in log: return ''
    return log.split(title, 1)[1].split('\n\n')[0]

def ago(minutes):
    return (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=minutes)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
# Within today, whatever time the tests run: a few minutes ago, or (just after midnight) right now.
def today_ago(minutes):
    now = datetime.datetime.now()
    m = min(minutes, max(0, int((now - now.replace(hour=0, minute=0, second=0)).total_seconds() // 60) - 1))
    return ago(m)

def msg(body, out=False, minutes=5):
    m = {'Body': body, 'CreatedOn': today_ago(minutes)}
    m['IsOutbound' if out else 'IsInbound'] = True
    return m

def setup(page, spoke=None, chats=None, calls=None):
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("""([sp, ch, cl]) => { localStorage.clear(); if (sp != null) localStorage.setItem('stCtSpokeToday', sp);
      Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); Object.assign(window.CHATS, ch || {});
      window.CALLS = cl || {}; window.callLogReads = 0; window.CONFIRMED = {}; window.APPT_HOUR[7101] = 10; window.APPT_HOUR[7102] = 10; }""", [spoke, chats, calls])
    page.evaluate(TOOLBOX)
    B(page, 'Customer Texts').click()
    B(page, '✅ Confirm Appt').click()

def run_check(page):
    B(page, 'Check replies').click()
    page.wait_for_function("() => /Checked \\d+ customer|Couldn't|signed you out/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    return log_text(page)

def confirmed(page):
    return page.evaluate("() => Object.keys(window.CONFIRMED).filter(k => window.CONFIRMED[k]).map(Number).sort()")

def finish_confirm(page):
    page.wait_for_function("() => /^(Done|Stopped|⚠️)/m.test(Array.from(document.querySelectorAll('#st-toolbox div')).map(d => d.textContent).join('\\n')) && !Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))", timeout=30000)

def spoke_box(page):
    return page.locator('#st-toolbox label:visible', has_text='Talked with them today').locator('input')

CHATS = {
    # Lou: never got a confirm text, but we called him today for 3 minutes.
    LOU: {'unread': False, 'msgs': []},
    # Mo: got the confirm text, no reply; our call today was 30 seconds (no answer / voicemail).
    MO: {'unread': False, 'msgs': [msg(SENT, out=True, minutes=120)]},
    # Pia: no confirm text, but she texted us today.
    PIA: {'unread': False, 'msgs': [msg('Can the tech call me 30 min before he comes?', minutes=20)]},
    # Kim: confirm text, then "need to reschedule", and she called us.
    KIM: {'unread': False, 'msgs': [msg(SENT, out=True, minutes=120), msg('I need to reschedule please', minutes=60)]},
}
CALLS = {
    '21': [{'createdOn': today_ago(30), 'duration': 180, 'direction': 1}],
    '22': [{'createdOn': today_ago(40), 'duration': 30, 'direction': 1}],
    '20': [{'createdOn': today_ago(50), 'duration': 120, 'direction': 0}],
}

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    # ---- On by default ----
    setup(page, None, CHATS, CALLS)
    log = run_check(page)
    print(log)
    check(spoke_box(page).is_checked(), 'the choice is on to start')
    yes = section(log, '✅ Will confirm')
    check('Lou Ng' in yes and 'we called them' in yes and '(3 min)' in yes, 'Lou: our 3-minute call today puts him on Will confirm, saying how')
    check('Pia Lane' in yes and 'they texted at' in yes, 'Pia: her text today puts her on Will confirm')
    check('Mo Day' not in yes and 'Mo Day' in section(log, '💤 No reply yet'), 'Mo: a 30-second call of ours (no answer) doesn\'t count')
    look = section(log, '⚠️ Needs a look')
    check('Kim Wu' in look and 'canceling or another day' in look and 'Kim Wu' not in yes, 'Kim: talked today but said reschedule -> Needs a look')
    check('Will confirm 2 appointments' in log, 'two appointments to confirm (Lou\'s and Pia\'s)')
    check(confirmed(page) == [], 'nothing confirmed before Confirm')

    # ↩ Take off puts Lou back under Not texted.
    page.locator('#st-toolbox .st-cust-card', has_text='Lou Ng').locator('button', has_text='Take off').click()
    log = log_text(page)
    check('Lou Ng' in section(log, '📭 Not texted') and 'Lou Ng' not in section(log, '✅ Will confirm'), 'Take off: Lou goes back to Not texted')
    check('Will confirm 1 appointment' in log, '...one left to confirm')

    # Confirm: only Pia's.
    CB(page, 'Confirm 1 appointment').click()
    finish_confirm(page)
    check(confirmed(page) == [107101], 'Confirm confirms Pia\'s appointment only: %s' % confirmed(page))
    page.evaluate("() => window.__stToolbox.close()")

    # ---- Turning it off goes back to C replies only (and is remembered) ----
    setup(page, None, CHATS, CALLS)
    run_check(page)
    spoke_box(page).uncheck()
    page.wait_for_function("() => /Checked \\d+ customer/.test(document.getElementById('st-toolbox').innerText) && !/Will confirm [1-9]/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    log = log_text(page)
    check('Lou Ng' in section(log, '📭 Not texted') and 'Pia Lane' in section(log, '📭 Not texted'), 'off: Lou and Pia are Not texted again (it checks again by itself)')
    check(page.evaluate("() => localStorage.getItem('stCtSpokeToday')") == '0', 'off is remembered')
    page.evaluate("() => window.__stToolbox.close()")
    setup(page, '0', CHATS, CALLS)
    log = run_check(page)
    check(not spoke_box(page).is_checked() and page.evaluate('window.callLogReads') == 0, 'off: no call logs read')
    page.evaluate("() => window.__stToolbox.close()")

    # ---- Yesterday's call doesn't count; a call from them of 15s+ does ----
    y = (datetime.datetime.now() - datetime.timedelta(days=1)).replace(hour=15).astimezone(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    setup(page, None, {LOU: {'unread': False, 'msgs': []}, MO: {'unread': False, 'msgs': []}},
          {'21': [{'createdOn': y, 'duration': 600, 'direction': 1}], '22': [{'createdOn': today_ago(10), 'duration': 20, 'direction': 0}]})
    log = run_check(page)
    yes = section(log, '✅ Will confirm')
    check('Lou Ng' not in yes, 'a call yesterday doesn\'t count')
    check('Mo Day' in yes and 'they called us' in yes, 'a 20-second call from them counts')
    page.evaluate("() => window.__stToolbox.close()")

    # ---- A new message after the check: not confirmed ----
    setup(page, None, {PIA: {'unread': False, 'msgs': [msg('ok see you', minutes=20)]}}, {})
    log = run_check(page)
    check('Pia Lane' in section(log, '✅ Will confirm'), 'Pia on the list')
    page.evaluate("n => window.CHATS[n].msgs.push({ Body: 'actually can we move it', IsInbound: true, CreatedOn: new Date().toISOString() })", PIA)
    CB(page, 'Confirm 1 appointment').click()
    finish_confirm(page)
    log = log_text(page)
    check(confirmed(page) == [] and 'new message came in' in section(log, '⚠️ Needs a look'), 'a text after the check stops the confirm')
    page.evaluate("() => window.__stToolbox.close()")

    # ---- Call log can't be read: texts still count, and it says so ----
    setup(page, None, {PIA: {'unread': False, 'msgs': [msg('thanks', minutes=20)]}, LOU: {'unread': False, 'msgs': []}}, CALLS)
    page.evaluate('window.CALLS_DOWN = true')
    log = run_check(page)
    check('Pia Lane' in section(log, '✅ Will confirm') and 'Lou Ng' not in section(log, '✅ Will confirm'), 'call log down: Pia (text) still counts, Lou (call) doesn\'t')
    check("Couldn't read the call log" in log, '...and it says the call log couldn\'t be read')
    page.evaluate('window.CALLS_DOWN = false')
    page.evaluate("() => window.__stToolbox.close()")

    check(not errors, 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails) if fails else '\nALL PASS')
sys.exit(1 if fails else 0)
