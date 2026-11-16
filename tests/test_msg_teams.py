import sys, time, pathlib, json
from playwright.sync_api import sync_playwright

# 💬 Tech Messages → 👥 Choose techs (2.6, Nov 2026): a service team that wasn't there when 🛡️ was
# set up was hidden with only a count to say so ("doesn't show the service techs"). Now Choose techs
# says which teams are hidden and why, with 🛡️ Allow teams… to fix it; a team renamed for a new
# lead keeps its setting (by its id); ticking (no team) works; and techs the board's Teams filter
# hides are named, since a tech has to be on the board to be messaged.
HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_techs.html').as_uri()
fails = []
def check(c, w):
    print(('PASS ' if c else 'FAIL ') + w)
    if not c: fails.append(w)
def B(page, t): return page.locator('#st-toolbox button:visible', has_text=t).first
def T(page): return page.locator('#st-toolbox').inner_text()
def hidden(page): return page.locator('#st-msg-hidden').inner_text() if page.locator('#st-msg-hidden').is_visible() else ''
def listed(page): return page.locator('#st-toolbox .st-scroll:visible, #st-toolbox div:visible').first and page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox label')).filter(l => l.offsetParent).map(l => l.textContent.trim())")

# Install HVAC (1, 2) and Leadership (3) when 🛡️ was set up; Level 1 Service (4, 5, 6) came later.
SETUP = [['Install HVAC', [[1, 'Tech One'], [2, 'Tech Two']]], ['Leadership Team', [[3, 'Boss Man']]]]
LATER = SETUP + [['Level 1 Service - Mike T.', [[4, 'Sam Serv'], [5, 'Ann Serv'], [6, 'Lee Serv']]]]

def open_board(page, teams, extra_js=''):
    page.goto('about:blank')
    page.add_init_script("([t, x]) => {}")
    page.goto(URL + '?t=' + str(time.time()) + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    page.evaluate("([t, x]) => { window.TEAMS = t; eval(x); localStorage.setItem('stSeenVersion', 'x'); }", [teams, extra_js])
    page.evaluate("() => { location.hash = '#/x'; }"); time.sleep(0.2)
    page.evaluate("() => { location.hash = '#/DispatchBoard'; }")
    page.wait_for_selector('.technician')
    time.sleep(0.3)

def open_msgs(page):
    page.evaluate(TOOLBOX)
    time.sleep(0.3)
    if B(page, 'Tech Messages').count(): B(page, 'Tech Messages').click()   # (it reopens the last tool used)

def start(page, rules=None, ids=None):
    page.evaluate("([r, i]) => { localStorage.clear(); localStorage.setItem('stSeenVersion', 'x'); if (r) localStorage.setItem('stMsgTeams', JSON.stringify(r)); if (i) localStorage.setItem('stMsgTeamIds', JSON.stringify(i)); }", [rules, ids])
    open_msgs(page)

with sync_playwright() as p:
    b = p.chromium.launch(); page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))

    # ---- The boss's bug: a service team added after 🛡️ was set up ----
    open_board(page, SETUP)
    start(page)
    B(page, 'Who can be messaged').click()
    page.wait_for_function("() => /First-time setup/.test(document.getElementById('st-toolbox').innerText)", timeout=8000)
    B(page, 'Save').click()   # first-time setup with the board as it was: Install ticked, Leadership not
    rules = json.loads(page.evaluate("() => localStorage.getItem('stMsgTeams')"))
    check(rules == {'Install HVAC': True, 'Leadership Team': False}, 'first setup: %s' % rules)
    check(json.loads(page.evaluate("() => localStorage.getItem('stMsgTeamIds')")) == {'1': True, '2': False}, "each team's id saved with its setting")
    page.evaluate("() => window.__stToolbox.close()")
    open_board(page, LATER)
    open_msgs(page)
    B(page, '👥 Choose techs').click()
    page.wait_for_function("() => /picked/.test(document.getElementById('st-toolbox').innerText)")
    time.sleep(0.5)
    h = hidden(page)
    print(h)
    check('Not set up in 🛡️ yet' in h and 'Level 1 Service - Mike T. (3)' in h, 'Choose techs says the service team is hidden because it isn\'t set up yet')
    check('Blocked teams: Leadership Team (1)' in h, 'and names the blocked team')
    check(B(page, '🛡️ Allow teams…').count() == 1, 'with a button to fix it')
    B(page, '🛡️ Allow teams…').click()
    t = T(page)
    check('🆕 Level 1 Service - Mike T. (3)' in t, 'the 🛡️ screen marks the service team as new')
    check(not page.locator('#st-toolbox label:visible', has_text='Level 1 Service').locator('input').is_checked(), 'a new team still starts blocked (a safety rule)')
    page.locator('#st-toolbox label:visible', has_text='Level 1 Service').locator('input').check()
    B(page, 'Save').click()
    B(page, '👥 Choose techs').click()
    time.sleep(0.4)
    t = T(page)
    check('Sam Serv' in t and 'Ann Serv' in t and 'Lee Serv' in t, 'the service techs show once their team is allowed')
    check('Not set up in 🛡️ yet' not in hidden(page), 'and nothing says they\'re hidden')
    B(page, 'Done').click()
    page.evaluate("() => window.__stToolbox.close()")

    # ---- A team renamed for a new lead keeps its setting ----
    renamed = SETUP + [['Level 1 Service - Joe B.', [[4, 'Sam Serv'], [5, 'Ann Serv'], [6, 'Lee Serv']]]]
    ids = json.loads(page.evaluate("() => localStorage.getItem('stMsgTeamIds')"))
    check(ids.get('3') is True, 'the service team\'s id is saved as allowed: %s' % ids)
    open_board(page, renamed)
    open_msgs(page)
    B(page, '👥 Choose techs').click()
    time.sleep(0.5)
    t = T(page)
    check('Sam Serv' in t and 'Level 1 Service - Joe B.' in t and 'Not set up' not in hidden(page), 'renamed (same team id): still allowed')
    B(page, 'Done').click()
    B(page, 'Who can be messaged').click()
    check('🆕 Level 1 Service - Joe B.' not in T(page) and page.locator('#st-toolbox label:visible', has_text='Joe B.').locator('input').is_checked(), 'and the 🛡️ screen has it ticked, not new')
    B(page, 'Cancel').click()
    page.evaluate("() => window.__stToolbox.close()")

    # ---- (no team): ticking it works; unticked, the reason says so ----
    noteam = SETUP + [['', [[7, 'Pat Solo']]]]
    open_board(page, noteam, "window.TEAMS[2].push(null)")
    page.evaluate("() => { window.__noTeam = true; }")
    start(page, {'Install HVAC': True, 'Leadership Team': False, '(no team)': True})
    B(page, '👥 Choose techs').click()
    page.locator('#st-toolbox label:visible', has_text='Only show techs with jobs').locator('input').uncheck()
    time.sleep(0.4)
    check('Pat Solo' in T(page), '(no team) ticked: a tech with no team can be picked')
    B(page, 'Done').click()
    page.evaluate("() => window.__stToolbox.close()")
    start(page, {'Install HVAC': True, 'Leadership Team': False, '(no team)': False})
    B(page, 'Pick on board').click()
    page.click('#team-technician-7 .name')
    check('techs with no team are blocked' in T(page), 'unticked: clicking them says techs with no team are blocked')
    page.evaluate("() => window.__stToolbox.close()")

    # ---- Techs the board's Teams filter hides ----
    open_board(page, LATER)
    page.evaluate("() => { const k = Object.keys(sessionStorage).find(x => /SHARED_DISPATCH_FILTERS/.test(x)); const v = JSON.parse(sessionStorage.getItem(k)); v.selectedTeamIds = ['1', '2']; sessionStorage.setItem(k, JSON.stringify(v)); }")
    start(page, {'Install HVAC': True, 'Leadership Team': False, 'Level 1 Service - Mike T.': True})
    B(page, '👥 Choose techs').click()
    page.wait_for_function("() => /Not on the board/.test(document.getElementById('st-toolbox').innerText)", timeout=8000)
    h = hidden(page)
    print(h)
    check('Not on the board' in h and 'Level 1 Service - Mike T. (3)' in h and 'Clear that filter' in h, "techs the board's Teams filter hides are named, with what to do")
    calls = page.evaluate("() => NB.resourceCalls.map(c => c.teamIds)")
    check([] in calls and [1, 2] in calls, 'read once with the filter (the board) and once without: %s' % calls)
    check('Sam Serv' not in page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox label')).filter(l => l.offsetParent).map(l => l.textContent).join('|')"), "they aren't offered to pick (they can't be messaged off the board)")

    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
