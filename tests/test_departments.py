import sys, pathlib, json
from playwright.sync_api import sync_playwright

# 📱 Customer Texts: ＋ A department… adds the jobs of one team on the board (the team headers,
# like Level 1 Service or Installers) on the day it shows, or the whole Unassigned list.
# board_texts.html?teams: Level 1 Service (Paxton: 6001, 6003) and Installers (Ivan: 6003 with
# Paxton, 6002 only in the board's data, 6004 canceled). 6005 is yesterday's.
HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_texts.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

TODAY_TEXT = "Hey, this is Andrew with AirSouth Cooling, Heating, Plumbing, and Electrical. I'm reaching out to remind you of your appointment you have with us today. If you have any questions, please call (601) 847-9941. Reply 'C' to confirm. Thank you!"

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first

def panel_text(page):
    return page.locator('#st-toolbox').inner_text()

def dept(page):
    return page.locator('#st-toolbox select:visible').filter(has_text='A department').first

def options(page):
    dept(page).focus()
    return dept(page).evaluate("s => Array.from(s.options).map(o => o.textContent)")

def pick_dept(page, value):
    dept(page).select_option(value=value)
    page.wait_for_function("() => /Added \\d+ job|No jobs|Couldn't load/.test(document.getElementById('st-toolbox').innerText) && !/Loading/.test(document.getElementById('st-toolbox').innerText)", timeout=15000)
    return panel_text(page)

def open_board(page, query):
    page.goto(URL + query + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("() => { localStorage.clear(); Object.keys(window.CHATS).forEach(k => delete window.CHATS[k]); }")
    page.evaluate(TOOLBOX)
    B(page, 'Customer Texts').click()
    B(page, '✅ Confirm Appt').click()

def picked(page):
    t = panel_text(page)
    return sorted(j for j in ['6001', '6002', '6003', '6004', '6005', '7101', '7102', '7103'] if '#' + j in t)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    open_board(page, '?teams')
    o = options(page)
    print(o)
    check(o == ['＋ A department…', 'Level 1 Service  (2 jobs)', 'Installers  (2 jobs)', 'Unassigned list'],
          'the list has each team on the board in the board\'s order, its job count (canceled and other days left out), and the Unassigned list')

    t = pick_dept(page, 'Installers')
    check(picked(page) == ['6002', '6003'], 'Installers: their jobs, including one only in the board\'s data and a two-tech job (%s)' % picked(page))
    check("Added 2 jobs from Installers. That's 2 customers in the list" in t, 'says what it added and how many customers')
    t = pick_dept(page, 'Level 1 Service')
    check(picked(page) == ['6001', '6002', '6003'], 'another department adds to the list (%s)' % picked(page))
    check('Added 1 job from Level 1 Service (1 already picked)' in t, 'a job already on the list isn\'t added twice')
    B(page, 'Clear').click()
    t = pick_dept(page, '\u0001unassigned')
    check(picked(page) == ['7101', '7102'], 'Unassigned list: its jobs, canceled left out (%s)' % picked(page))
    check('from the Unassigned list' in t, 'says it was the Unassigned list')
    # 2.0: each tech's team comes with the board's data, so nothing has to be remembered, and the
    # team bars on the board (hidden by default on the new board) don't matter.
    check(page.evaluate("() => localStorage.getItem('stMsgTeamMap')") is None, 'teams come from the board\'s data (nothing remembered)')
    page.evaluate("() => NB.qa('.team-name').forEach(h => h.remove())")
    o = options(page)
    check('Level 1 Service  (2 jobs)' in o and 'Installers  (2 jobs)' in o, 'team names hidden on the board: the departments are still there (%s)' % o)

    # 📥 Check replies after texting one department: only the jobs on the list are checked.
    B(page, 'Clear').click()
    pick_dept(page, 'Installers')
    at = page.evaluate("() => { const t = new Date(); t.setHours(0, 1, 0, 0); return [t.toISOString(), new Date(t.getTime() + 60000).toISOString()]; }")
    page.evaluate("([d, txt]) => { ['6015550020', '6015550021', '6015550022'].forEach(n => { window.CHATS[n] = { unread: false, msgs: [{ Body: txt, IsOutbound: true, CreatedOn: d[0] }, { Body: 'C', IsInbound: true, CreatedOn: d[1] }] }; }); }", [at, TODAY_TEXT])
    B(page, 'Check replies').click()
    page.wait_for_function("() => /Checked \\d+ customer|Couldn't/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    t = panel_text(page)
    check('Lou Ng' in t and 'Mo Day' in t and 'Kim Wu' not in t, 'Check replies looks only at the department\'s customers')
    B(page, '← Back').click()
    page.evaluate("() => window.__stToolbox.close()")

    # The board laid out with one team: every job is in it (teams always come with the board's data now).
    open_board(page, '')
    o = options(page)
    check(o == ['＋ A department…', 'Install HVAC  (3 jobs)', 'Unassigned list'], 'one team on the board: one choice with all its jobs (%s)' % o)
    t = pick_dept(page, 'Install HVAC')
    check(picked(page) == ['6001', '6002', '6003'], 'it adds those jobs (%s)' % picked(page))
    # ＋ Everyone on the board works as before.
    B(page, 'Clear').click()
    B(page, 'Everyone on the board').click()
    page.wait_for_function("() => /Added \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    check('Added 5 jobs from the board (3 on the timeline, 2 unassigned, 2 canceled left out)' in panel_text(page), '＋ Everyone on the board unchanged')

    check(not errors, 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails))
sys.exit(1 if fails else 0)
