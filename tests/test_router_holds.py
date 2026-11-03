"""🧭 Tech Router: holds not to call, and holds not to suggest again (2.3.2).

- 🚫 A customer whose job summary, or job, customer or location notes (any age), say not to call
  ("do not call", "doesn't want to receive calls from us", "remove from call list", "DNC") isn't
  suggested to call: their hold is left out of 📞 Fill a spot and 🗺️ Plan the day's ＋ Fit in holds, and
  🎯 Place a job says not to call instead of a day to book it. An Unassigned job on a later day (call to
  move it up) is left out the same way; one on that day's list (no call to assign it) stays, marked.
  A time to call ("do not call before 10am"), which number ("don't call the house phone") and "no call
  no show" don't count.
- 🚫 on a hold puts it on a don't-suggest list (saved in this browser): Fill a spot and Plan the day leave
  it out until ↩ takes it off (🚫 Holds not suggested, at the bottom of Tech Router).

Runs on tests/board_router.html (the fake new board for tomorrow)."""
import sys, time, pathlib, json, re
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_router.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def ev(page, js, arg=None):
    return page.evaluate(js, arg) if arg is not None else page.evaluate(js)
def start(b, setup=None, keep=None):
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    ev(page, "() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '2.3.2'); }")
    if keep: ev(page, "(v) => localStorage.setItem('stRouterSkipHolds', v)", json.dumps(keep))
    if setup: ev(page, setup); ev(page, "() => NB.render()")
    page.evaluate(TOOLBOX)
    page.locator('#st-toolbox .st-tile', has_text='Tech Router').click()
    page.wait_for_function("() => document.querySelectorAll('#st-router-tech option').length > 2", timeout=10000)
    return page, errors
def find(page, tech, ua=True):
    page.click('#st-toolbox [data-tab=fill]')
    if ua: page.check('#st-router-ua')
    else: page.uncheck('#st-router-ua')
    page.check('#st-router-hold')
    ev(page, "() => { document.getElementById('st-router-fill-out').style.display = 'none'; }")
    page.select_option('#st-router-tech', str(tech))
    page.click('#st-router-find')
    page.wait_for_function("() => !document.getElementById('st-router-find').disabled && (document.getElementById('st-router-fill-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=30000)
def names(page):
    """Every suggestion's customer, across every open time (each tab, Show more pressed)."""
    out = set()
    for i in range(page.locator('#st-router-fill-out .st-gap-chip').count()):
        page.locator('#st-router-fill-out .st-gap-chip').nth(i).click()
        more = page.locator('#st-router-fill-out button', has_text=re.compile(r'^Show \d+ more'))
        if more.count(): more.first.click()
        for n in ev(page, "() => Array.from(document.querySelectorAll('#st-router-fill-out .st-router-card')).map(c => c.querySelector('span').textContent.replace(/^\\d+\\. /, ''))"): out.add(n)
    return out
def card(page, name):
    return page.locator('#st-router-fill-out .st-router-card', has_text=name).first
def plan(page):
    page.click('#st-toolbox [data-tab=plan]')
    page.check('#st-plan-holds')
    ev(page, "() => { document.getElementById('st-plan-out').style.display = 'none'; }")
    page.click('#st-plan-go')
    page.wait_for_function("() => !document.getElementById('st-plan-go').disabled && (document.getElementById('st-plan-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=60000)
    if page.locator('#st-plan-all', has_text='Show every stop').count(): page.click('#st-plan-all')
    return page.inner_text('#st-plan-out')
def place(page, job):
    page.click('#st-toolbox [data-tab=place]')
    ev(page, "() => { document.getElementById('st-place-out').style.display = 'none'; }")
    page.fill('#st-place-input', str(job))
    page.click('#st-place-go')
    page.wait_for_function("() => !document.getElementById('st-place-go').disabled && (document.getElementById('st-place-out').style.display !== 'none' || /⚠️/.test(document.getElementById('st-router-msg').textContent))", timeout=30000)
    return ev(page, "() => { const v = document.querySelector('#st-place-out .st-place-verdict'); return v ? [v.getAttribute('data-kind'), v.innerText] : [null, '']; }")
def skips(page):
    return sorted(ev(page, "() => Object.keys(JSON.parse(localStorage.getItem('stRouterSkipHolds') || '{}'))"))

# Seven more quote holds near Hattiesburg (Dustin's kind of job), each with a note or summary.
HOLDS = """() => {
  const ago = d => new Date(Date.now() - d * 86400000).toISOString();
  const H = [[9211, 7211, 'DNC Summary'], [9212, 7212, 'DNC Customer'], [9213, 7213, 'DNC Old Location'], [9217, 7217, 'DNC Job Note'],
    [9214, 7214, 'Time Only'], [9215, 7215, 'Which Phone'], [9216, 7216, 'No Show']];
  H.forEach(([id, job, name], i) => LISTS.push(['hold', id, job, name, 11, [31.335 + i * 0.002, -89.295], -14 - i, 1.5, 'Normal', '60155502' + (10 + i), 20 + i]));
  window.ROW_NOTES = Object.assign(window.ROW_NOTES || {}, { 9211: '<p>Free quote follow-up.</p><p>Customer says do NOT call, text only.</p>', 9214: 'Do not call before 10am please' });
  window.NOTES = Object.assign(window.NOTES || {}, {
    59212: [{ text: "Customer doesn't want to receive calls from us anymore.", createdOn: ago(5) }],
    69213: [{ text: 'Remove from call list', createdOn: ago(400) }],
    7217: [{ text: 'DNC', createdOn: ago(30) }],
    59215: [{ text: "Don't call the house phone, use her cell.", createdOn: ago(3) }],
    59216: [{ text: 'No call no show last visit.', createdOn: ago(2) }]
  });
}"""

# Which sentences count as "don't call" (and which don't): the Toolbox's own check, run in a page.
YES = ["Customer doesn't want to receive calls from us anymore.", 'DNC', 'Remove from call list', 'Customer asked us to stop calling.', 'Please do not call this customer again',
       'DO NOT CALL - text only', 'Do not call at all', 'Customer said not to call', 'Does not want any calls', 'Put on the do not call list', 'Take them off our call list please',
       'Never call this number', 'no more calls', 'Doesnt want a call back', 'dont call', '<p>Free quote follow-up.</p><p>Customer says do NOT call, text only.</p>']
NO = ['Do not call before 10am please', "Don't call the house phone, use her cell.", 'No call no show last visit.', 'Do not call until after 3pm', 'dont call on Mondays',
      'Do not call in the morning', 'Please call before coming', 'Call customer when on the way', 'Customer called to reschedule', 'Do not call at 8, works nights', 'Called, no answer',
      'Do not call from 12 to 1']
SNIP = TOOLBOX[TOOLBOX.index("    const NO_CALL = ["):TOOLBOX.index("    const noCallFor = j =>")]

with sync_playwright() as p:
    b = p.chromium.launch()

    # ================= The sentences =================
    page = b.new_page()
    page.set_content('<p>check</p>')
    page.evaluate("(code) => { const norm = s => String(s == null ? '' : s).replace(/\\s+/g, ' ').trim(); window.noCallIn = new Function('norm', code + '; return noCallIn;')(norm); }", SNIP)
    missed = [x for x in YES if not page.evaluate('(t) => noCallIn(t)', x)]
    wrong = [x for x in NO if page.evaluate('(t) => noCallIn(t)', x)]
    check(not missed, 'every "don\'t call" sentence counts (%d of them; missed: %s)' % (len(YES), missed))
    check(not wrong, 'times to call, which number, "no call no show" and ordinary call notes don\'t (%d of them; wrongly counted: %s)' % (len(NO), wrong))
    check(page.evaluate('(t) => noCallIn(t)', YES[-1]) == 'Customer says do NOT call, text only.', 'the sentence comes back clean (one period, no HTML)')
    page.close()

    # ================= 📞 Fill a spot: holds whose notes say not to call are left out =================
    page, errors = start(b, HOLDS)
    find(page, 201, ua=False)
    got = names(page)
    check(not ({'DNC Summary', 'DNC Customer', 'DNC Old Location', 'DNC Job Note'} & got), 'holds whose summary or notes say not to call aren\'t suggested (%s)' % sorted(got))
    check({'Time Only', 'Which Phone', 'No Show', 'Holly Heater', 'Lee Turnover'} <= got, '"do not call before 10am", "don\'t call the house phone" and "no call no show" don\'t count: still suggested (%s)' % sorted(got))
    fo = page.inner_text('#st-router-fill-out')
    check('🚫 Left out: 4 jobs whose notes say not to call' in fo, 'it says how many were left out for not calling (%r)' % fo[-400:])
    page.locator('#st-router-fill-out .st-router-nocall button').click()
    nc = page.inner_text('#st-router-fill-out .st-router-nocall')
    check('#7211 DNC Summary: The job summary says: "Customer says do NOT call, text only."' in nc and 'A customer note from' in nc and 'A location note from' in nc and '"DNC"' in nc,
          'each with where it was said and what (an old location note too) (%r)' % nc)
    check(ev(page, 'window.WRITES') == [], 'nothing changed in ServiceTitan')
    check(errors == [], 'fill: no page errors: %s' % errors)

    # ================= 🚫 Don't suggest a hold again, and ↩ back =================
    card(page, 'Holly Heater').locator('.st-router-skip-btn').click()
    check(skips(page) == ['7201'] and 'Holly Heater' not in page.inner_text('#st-router-fill-out'), '🚫 on Holly Heater\'s card: on the list (saved), and off the suggestions')
    find(page, 201, ua=False)
    check('Holly Heater' not in names(page) and '1 hold on your don\'t-suggest list was left out' in page.inner_text('#st-router-fill-out'), 'Find again: Holly Heater isn\'t suggested, and it says one was left out for the list')
    head = page.inner_text('#st-router-skips-head')
    check('🚫 Holds not suggested (1)' in head, 'the list at the bottom: 🚫 Holds not suggested (1) (%r)' % head)
    page.click('#st-router-skips-head')
    row = page.inner_text('#st-router-skips .st-router-skip')
    check('#7201 Holly Heater' in row and 'since' in row, 'it lists Holly Heater, since when (%r)' % row)
    page.locator('#st-router-skips .st-router-skip button').click()
    check(skips(page) == [] and '(0)' in page.inner_text('#st-router-skips-head'), '↩ takes it off the list')
    find(page, 201, ua=False)
    check('Holly Heater' in names(page), 'Find again: Holly Heater is suggested again')
    check(errors == [], 'skip list: no page errors: %s' % errors)
    page.close()

    # ================= Unassigned: a later day's (to call) left out; that day's (no call) marked =================
    page, errors = start(b, "() => { window.ROW_NOTES = { 9106: 'Do not contact. Customer moved out of state.' }; window.NOTES = { 59101: [{ text: 'Please do not call this customer again', createdOn: new Date().toISOString() }] }; }")
    find(page, 201, ua=True)
    got = names(page)
    check('Gen Later' not in got, 'Gen Later (3 days out, a call to move it up; its summary says do not contact) isn\'t suggested (%s)' % sorted(got))
    nq = card(page, 'Near Quote').inner_text() if 'Near Quote' in got else ''
    check('🚫 notes: don\'t call' in nq, 'Near Quote (on that day\'s list, no call needed to assign it) stays, marked 🚫 (%r)' % nq[:300])
    page.close()

    # ================= 🗺️ Plan the day: ＋ Fit in holds =================
    page, errors = start(b)
    po = plan(page)
    check('Hold Spark' in page.inner_text('#st-plan-out .st-plan-route[data-tech="203"]'), 'as it is: Hold Spark is fitted into Eli\'s day')
    page.locator('#st-plan-out .st-plan-route[data-tech="203"] .st-router-skip-btn').click()
    check(skips(page) == ['7205'] and 'Won\'t be suggested again' in page.inner_text('#st-plan-out .st-plan-route[data-tech="203"]'), '🚫 on the hold\'s stop: on the list, and it says so')
    po = plan(page)
    holds = ev(page, "() => Array.from(document.querySelectorAll('#st-plan-out .st-plan-hold, #st-plan-out .st-plan-chip')).map(x => x.innerText).join('|')")
    check('Hold Spark' not in holds, 'plan again: Hold Spark isn\'t fitted in (%r)' % holds)
    check('1 hold on your don\'t-suggest list was left out' in po, 'it says one hold was left out for the list (%r)' % po[-300:])
    page.close()
    page, errors = start(b, "() => { window.NOTES = { 59205: [{ text: 'Customer asked us to stop calling.', createdOn: new Date().toISOString() }] }; }")
    po = plan(page)
    holds = ev(page, "() => Array.from(document.querySelectorAll('#st-plan-out .st-plan-hold')).map(x => x.innerText).join('|')")
    check('Hold Spark' not in holds, 'a hold whose customer asked us to stop calling isn\'t fitted in (%r)' % holds)
    check('🚫 1 hold not fitted in: their notes say not to call' in po, 'the plan says so (%r)' % po[-400:])
    check(errors == [], 'plan: no page errors: %s' % errors)
    page.close()

    # ================= 🎯 Place a job =================
    page, errors = start(b, HOLDS)
    k, v = place(page, 7212)
    check(k == 'nocall' and 'Don\'t call to book it' in v and 'doesn\'t want to receive calls from us' in v, 'a hold whose notes say not to call: "don\'t call to book it", with the note (%s: %r)' % (k, v))
    check('Days to book it' not in page.inner_text('#st-place-out'), 'no days to book it')
    k, v = place(page, 7201)
    check(k == 'book' and '🚫 Don\'t suggest this hold again' in v, 'a hold to book has 🚫 Don\'t suggest this hold again (%s)' % k)
    page.locator('#st-place-out .st-place-skip').click()
    v2 = page.inner_text('#st-place-out .st-place-verdict')
    check(skips(page) == ['7201'] and '↩ Suggest this hold again' in v2 and 'On your don\'t-suggest list' in v2, 'pressed: it\'s on the list, with ↩ to put it back')
    page.locator('#st-place-out .st-place-skip').click()
    check(skips(page) == [], '↩ takes it off')
    page.close()
    page, errors = start(b, "() => { window.NOTES = { 59101: [{ text: 'DO NOT CALL - text only', createdOn: new Date().toISOString() }] }; }")
    k, v = place(page, 7101)
    check(k == 'here' and '🚫 Notes: don\'t call.' in v, 'an Unassigned job (no call needed to assign it): still placed, with the 🚫 note (%s: %r)' % (k, v))
    check(errors == [], 'place: no page errors: %s' % errors)
    page.close()

    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
