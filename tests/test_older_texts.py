import sys, pathlib, re
from playwright.sync_api import sync_playwright

# 📥 Check replies and confirm texts sent more than a day ahead: a text sent Saturday (or
# Thursday) asking about Monday's appointment counts for Monday, and a C to it still counts after
# a newer reminder went out and they only answered "already did" or "thanks". A text naming
# another weekday doesn't count. The board is set to the next Monday, so this works any day.
HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_texts.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

TMPL = "Hey, this is Andrew with AirSouth Cooling, Heating, Plumbing, and Electrical. I'm reaching out to remind you of your appointment you have with us {when}. If you have any questions, please call (601) 847-9941. Reply 'C' to confirm. Thank you!"
KIM, LOU, MO, PIA = '6015550020', '6015550021', '6015550022', '6015550031'
NAMES = {KIM: 'Kim Wu', LOU: 'Lou Ng', MO: 'Mo Day', PIA: 'Pia Lane'}

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first

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

def where(log, num):
    n = NAMES[num]
    for title in ['✅ Will confirm', '⚠️ Needs a look', '💤 No reply yet', '📭 Not texted', '☑️ Answered yes']:
        if n in section(log, title): return title
    return '?'

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("() => { localStorage.clear(); Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); }")
    page.evaluate(TOOLBOX)
    B(page, 'Customer Texts').click()
    B(page, '✅ Confirm Appt').click()
    # The board on the next Monday (1 to 7 days out).
    page.evaluate("() => { const d = new Date(); d.setHours(0, 0, 0, 0); do d.setDate(d.getDate() + 1); while (d.getDay() !== 1); window.MON = d; NB.setDay(d); }")
    mon_long = page.evaluate("() => window.MON.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })")
    st_date = page.evaluate("() => window.MON.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).replace(/,/g, '')")
    # A time n days from Monday (-2 = Saturday), h hours into the day.
    def at(n, h):
        return page.evaluate("([n, h]) => new Date(window.MON.getTime() + n * 86400000 + h * 3600000).toISOString()", [n, h])
    def out(body, n, h, **kw):
        return dict({'Body': body, 'IsOutbound': True, 'CreatedOn': at(n, h)}, **kw)
    def inn(body, n, h):
        return {'Body': body, 'IsInbound': True, 'CreatedOn': at(n, h)}
    sat = TMPL.replace('{when}', 'on ' + mon_long)       # the Toolbox's text sent Saturday for Monday
    sun = TMPL.replace('{when}', 'tomorrow')             # and again Sunday

    # Saturday's text, answered C on Saturday.
    chats(page, {
        KIM: {'unread': False, 'msgs': [out(sat, -2, 10), inn('C', -2, 11)]},
        LOU: {'unread': False, 'msgs': [out(sat, -2, 10), inn('C', -2, 11), out(sun, -1, 9)]},
        MO: {'unread': False, 'msgs': [out(sat, -2, 10), inn('C', -2, 11), out(sun, -1, 9), inn('I already confirmed', -1, 10)]},
        PIA: {'unread': False, 'msgs': [out(sat, -2, 10), inn('C', -2, 11), out(sun, -1, 9), inn('Thank you!', -1, 10)]},
    })
    log = check_text(page); print(log)
    check(where(log, KIM) == '✅ Will confirm', 'C to Saturday\'s text for Monday counts')
    check(where(log, LOU) == '✅ Will confirm', 'C to Saturday\'s text counts when Sunday\'s reminder got no answer')
    check(where(log, MO) == '✅ Will confirm', 'C Saturday, then "I already confirmed" to Sunday\'s reminder: confirmed')
    check(where(log, PIA) == '✅ Will confirm', 'C Saturday, then "Thank you!" to Sunday\'s reminder: confirmed')

    # Coworkers' own wording and ServiceTitan's reminder, sent days ahead.
    chats(page, {
        KIM: {'unread': False, 'msgs': [out('Hey this is Jasmin with Air South reminding you of your appointment Monday. Please reply "C" to confirm.', -4, 15), inn('c', -4, 16)]},
        LOU: {'unread': False, 'msgs': [out('Hey this is Jasmin with Air South reminding you of your appointment Saturday. Please reply "C" to confirm.', -3, 15), inn('C', -3, 16)]},
        MO: {'unread': False, 'msgs': [out(sat, -2, 10), inn('C', -2, 11), out(sun, -1, 9), inn('Can you come after 2?', -1, 10)]},
        PIA: {'unread': False, 'msgs': [out('AirSouth: Your appointment is scheduled for ' + st_date + ' between 8:00 AM and 12:00 PM. Reply \'C\' to confirm.', -2, 8, IsNotification=True), inn('C', -2, 9)]},
    })
    log = check_text(page); print(log)
    check(where(log, KIM) == '✅ Will confirm', 'a coworker\'s Thursday text that says "Monday" counts for Monday')
    check(where(log, LOU) == '📭 Not texted', 'Friday\'s text about a Saturday appointment doesn\'t count for Monday')
    check(where(log, MO) == '⚠️ Needs a look' and 'after 2' in section(log, '⚠️ Needs a look'), 'C Saturday, then a question Sunday: Needs a look, with what they said')
    check(where(log, PIA) == '✅ Will confirm', 'C to ServiceTitan\'s reminder sent Saturday counts')

    # More: "Already did", a later change of plans, and thanks with no C before it.
    chats(page, {
        KIM: {'unread': False, 'msgs': [out('Hi this is Jasmin with AirSouth, just reminding you of your appointment Monday. Reply C to confirm', -2, 14), inn('yes', -2, 15), out(sun, -1, 9), inn('C', -1, 10)]},
        LOU: {'unread': False, 'msgs': [out(sat, -2, 10), inn('C', -2, 11), out(sun, -1, 9), inn('Already did', -1, 10)]},
        MO: {'unread': False, 'msgs': [out(sat, -2, 10), out(sun, -1, 9), inn('Thanks', -1, 10)]},
        PIA: {'unread': False, 'msgs': [out(sat, -2, 10), inn('C', -2, 11), inn('Actually I need to reschedule', -1, 12)]},
    })
    log = check_text(page); print(log)
    check(where(log, KIM) == '✅ Will confirm', 'yes Saturday and C Sunday: confirmed')
    check(where(log, LOU) == '✅ Will confirm', 'C Saturday, then "Already did": confirmed')
    check(where(log, MO) == '⚠️ Needs a look', 'only "Thanks" with no C before it: Needs a look')
    check(where(log, PIA) == '⚠️ Needs a look' and 'reschedule' in section(log, '⚠️ Needs a look'), 'C Saturday, then "I need to reschedule": Needs a look')

    # Confirming: Saturday's C gets Monday's appointments confirmed.
    page.evaluate("() => { [106001, 107102].forEach(a => { window.APPT_START[a] = new Date(window.MON.getTime() + 9 * 3600000).toISOString(); }); }")
    chats(page, {
        KIM: {'unread': False, 'msgs': [out(sat, -2, 10), inn('C', -2, 11), out(sun, -1, 9), inn('Thanks', -1, 10)]},
    })
    B(page, 'Check replies').click()
    page.wait_for_function("() => /Checked \\d+ customer|Couldn't/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    page.locator('#st-toolbox button:visible').filter(has_text=re.compile('^Confirm 2 appointments')).first.click()
    page.wait_for_function("() => /^(Done|Stopped|⚠️)/m.test(Array.from(document.querySelectorAll('#st-toolbox div')).map(d => d.textContent).join('\\n')) && !Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))", timeout=30000)
    posts = page.evaluate("() => window.CONFIRM_POSTS.map(x => x.jobAppointmentId).sort()")
    check(posts == [106001, 107102], 'Kim Wu\'s Monday appointments get confirmed (%s)' % posts)

    check(not errors, 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails))
sys.exit(1 if fails else 0)
