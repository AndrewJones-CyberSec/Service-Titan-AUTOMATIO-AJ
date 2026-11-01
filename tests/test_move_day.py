"""🔀 Move Jobs → 📅 Move a tech's day to another day, on the fake Dispatch board (board_moves.html):
every open job of one tech on the day the board shows goes to another day at the same times, on
the same tech or another one; the arrival window checked on the first job; booked, skills, shared
jobs, Done jobs, refusals, a job changed since the review, a time that won't take, and ↩ Put back."""
import sys, time, pathlib, json, datetime
from playwright.sync_api import sync_playwright
import fastclock

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_moves.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first
def T(page):
    return page.locator('#st-toolbox').inner_text()
def ev(page, js):
    return page.evaluate(js)
def log(page):
    return ev(page, "() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")
def busy(page):
    return ev(page, "() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))")
def wait_done(page, t=60):
    time.sleep(0.4); end = time.time() + t
    while time.time() < end:
        if not busy(page): return True
        fastclock.skip(page)
    return False
def review(page):
    B(page, 'Review').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return (b && b.offsetParent) || /Couldn't check|signed you out|Nothing to do|has no jobs|Pick another day|has passed|Pick the day/.test(document.getElementById('st-toolbox').innerText); }", timeout=20000)
    time.sleep(0.2)
    return T(page)
def review_text(page):
    return ev(page, "() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent ? b.closest('div').parentElement.innerText : ''; }")
def go_text(page):
    return ev(page, "() => document.getElementById('st-move-go').textContent")
def go(page):
    page.click('#st-move-go')
    return wait_done(page)
def tick(page, kind):
    page.check('#st-toolbox input.st-move-tick-' + kind)
def mode(page, label):
    page.locator('#st-toolbox label:visible', has_text=label).first.locator('input').check()
def day_from(page, tech):
    page.select_option('#st-move-day-from', str(tech))
def day_to(page, tech):
    page.select_option('#st-move-day-to', str(tech) if tech else '')
def ymd(d):
    return d.strftime('%Y-%m-%d')
def set_day(page, d):
    page.fill('#st-move-day', ymd(d))
def appt(page, a):
    return ev(page, "() => { const x = APPTS[%d]; return { techs: x.techs.slice().sort((a, b) => a - b), s: x.s.getTime(), e: x.e.getTime(), ws: x.ws ? new Date(x.ws).getTime() : null }; }" % a)
def local(page, a):
    """[y, m, d, h, min] of an appointment's start, in the page's time."""
    return ev(page, "() => { const d = APPTS[%d].s; return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]; }" % a)
def calls(page):
    return ev(page, "() => window.calls.slice()")
def snapshot(page):
    return ev(page, "() => JSON.stringify(Object.keys(APPTS).map(k => [k, APPTS[k].techs.slice().sort((a, b) => a - b), APPTS[k].s.getTime(), APPTS[k].e.getTime(), APPTS[k].ws ? new Date(APPTS[k].ws).getTime() : null]))")
def put_back(page):
    B(page, 'Put back').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=20000)
    time.sleep(0.2)
    for k in ('status', 'booked', 'shared', 'window', 'skills'):
        if page.locator('#st-toolbox input.st-move-tick-' + k).count(): tick(page, k)
    return go(page)
def page_today(page):
    y, m, d = ev(page, "() => { const d = new Date(); return [d.getFullYear(), d.getMonth() + 1, d.getDate()]; }")
    return datetime.date(y, m, d)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1100})
    fastclock.install(page)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate(TOOLBOX)
    B(page, 'Move Jobs').click()
    page.wait_for_function("() => document.querySelectorAll('#st-move-to option').length > 1", timeout=10000)
    today = page_today(page)
    tomorrow, day2 = today + datetime.timedelta(days=1), today + datetime.timedelta(days=2)
    start = snapshot(page)

    # ---- The mode and its controls ----
    check("Move a tech's day to another day" in T(page), 'the new way is listed')
    mode(page, "Move a tech's day")
    check(page.locator('#st-move-day-from').is_visible() and page.locator('#st-move-day-to').is_visible() and page.locator('#st-move-day').is_visible(), 'From, Day and To are shown')
    check(not page.locator('#st-move-to').is_visible() and not page.locator('#st-move-a').is_visible(), 'the other ways\' tech lists are hidden')
    check(not page.locator('#st-toolbox input:visible[placeholder^="Or type job"]').count(), 'no job list to pick from (it\'s the tech\'s whole day)')
    check(ev(page, "() => document.getElementById('st-move-day').value") == ymd(tomorrow), 'Day starts as the day after the board\'s: %s' % ev(page, "() => document.getElementById('st-move-day').value"))
    to_opts = ev(page, "() => Array.from(document.querySelectorAll('#st-move-day-to option')).map(o => o.textContent)")
    check(to_opts[0] == 'Same tech' and 'Blake W' in to_opts, 'To starts with Same tech: %s' % to_opts)

    # ---- Refusals ----
    day_from(page, 101)
    set_day(page, today)
    review(page)
    check('Pick another day' in T(page), 'the board\'s own day is refused')
    set_day(page, today - datetime.timedelta(days=1))
    review(page)
    check('has passed' in T(page), 'a day that has passed is refused')
    day_from(page, 104); set_day(page, day2)
    review(page)
    check('Dana K has no jobs on' in T(page), 'a tech with no jobs: says so')
    check(snapshot(page) == start and not calls(page), 'nothing changed by the refusals')

    # ---- Jack W's day to the day after tomorrow, same tech ----
    day_from(page, 101); day_to(page, None); set_day(page, day2)
    review(page)
    rt = review_text(page)
    check("Jack W's day to" in rt, 'the review says whose day and where: ' + rt.splitlines()[0])
    check('Amy Lee' in rt and 'Bob Smith' in rt and 'Dana Fox' in rt, 'Jack\'s three open jobs are in the review')
    check('Fay Moss' in rt and 'Done' in rt, 'the Done job is left alone')
    check('Hal Fry' not in rt, 'a job on another day isn\'t part of it')
    check('Andrew J is on it too' in rt, 'a job Andrew J shares is marked: it moves for him too')
    check(go_text(page) == 'Move 2 jobs', 'Go moves the 2 clean jobs until the shared one is ticked: ' + go_text(page))
    tick(page, 'shared')
    check(go_text(page) == 'Move 3 jobs', 'ticked: 3 jobs')
    before = {a: appt(page, a) for a in (9001, 9002, 9004, 9006)}
    check(go(page), 'the run finished')
    L = log(page)
    for a, h in ((9001, 8), (9002, 10), (9004, 13)):
        y, mo, d, hh, mi = local(page, a)
        check(datetime.date(y, mo, d) == day2 and (hh, mi) == (h, 0), '#%d is on %s at %d:00 (now %s %d:%02d)' % (a, day2, h, datetime.date(y, mo, d), hh, mi))
        x = appt(page, a)
        check(x['e'] - x['s'] == before[a]['e'] - before[a]['s'], '#%d keeps its length' % a)
        check(x['techs'] == before[a]['techs'], '#%d keeps its techs %s' % (a, x['techs']))
    check(appt(page, 9006) == before[9006], 'the Done job didn\'t move')
    check(not [c for c in calls(page) if c[0] != 'time'], 'same tech: no assign or unassign sent')
    puts = ev(page, "() => window.timePuts.map(p => p.body)")
    check(len(puts) == 3 and all(p_['technicianIdsToAdd'] == [] and p_['technicianIdsToRemove'] == [] for p_ in puts), 'three new times, the board\'s own request, techs left alone')
    check('3 done' in T(page), 'done: 3: ' + T(page).splitlines()[0])
    check('Put back (3)' in T(page), 'Put back can undo the 3')
    check('Refreshed the board' in log(page), 'the board refreshed itself to show the moves')
    put_back(page)
    for a in (9001, 9002, 9004, 9006):
        check(appt(page, a) == before[a], '#%d put back exactly' % a)

    # ---- Jack W's day to tomorrow on Blake W ----
    ev(page, "() => { window.calls = []; window.timePuts = []; }")
    day_to(page, 102); set_day(page, tomorrow)
    review(page)
    rt = review_text(page)
    check("Jack W's day to" in rt and 'on Blake W' in rt, 'the review names the tech it goes to')
    check('Jack W → Blake W' in rt, 'each job: time and Jack W → Blake W')
    check("Blake W doesn't have Tank Water Heater Installs" in rt, 'a skill Blake doesn\'t have is a warning (Bob Smith)')
    check('Andrew J is on it too' in rt, 'Andrew J stays on Dana Fox, and it moves for him')
    tick(page, 'skills'); tick(page, 'shared')
    check(go_text(page) == 'Move 3 jobs', 'all ticked: ' + go_text(page))
    before = {a: appt(page, a) for a in (9001, 9002, 9004)}
    check(go(page), 'the run finished')
    for a, h, want in ((9001, 8, [102]), (9002, 10, [102]), (9004, 13, [103, 102])):
        y, mo, d, hh, mi = local(page, a)
        check(datetime.date(y, mo, d) == tomorrow and hh == h, '#%d is tomorrow at %d' % (a, h))
        check(sorted(appt(page, a)['techs']) == sorted(want), '#%d is on %s now: %s' % (a, want, appt(page, a)['techs']))
    c = calls(page)
    for a in (9001, 9002, 9004):
        mine = [k[0] for k in c if k[1] == a]
        check(mine == ['time', 'assign', 'unassign'], '#%d: time first, then Blake added, then Jack off: %s' % (a, mine))
    check('Hal Fry' not in log(page), 'Jack\'s job already on tomorrow wasn\'t touched')
    put_back(page)
    for a in (9001, 9002, 9004):
        check(appt(page, a) == before[a], '#%d put back exactly (time and techs): %s' % (a, appt(page, a)))
    check(snapshot(page) == start, 'the whole board is as it started')

    # ---- Booked on the new day ----
    ev(page, "() => { window.calls = []; window.timePuts = []; window.BOOKED_BY_SCHEDULE = true; }")
    day_to(page, None); set_day(page, tomorrow)
    review(page)
    rt = review_text(page)
    # Jack already has Hal Fry tomorrow 9-11: Amy Lee 8-10 and Bob Smith 10-12 overlap it.
    check('Already booked' in rt and 'Amy Lee' in rt.split('Already booked')[1] and 'Bob Smith' in rt.split('Already booked')[1], 'jobs that would overlap Jack\'s job already on tomorrow are marked booked')
    check('Dana Fox' not in rt.split('Already booked')[1].split('⏭️')[0].split('⚠️ Other techs')[0] if 'Already booked' in rt else False, 'Dana Fox at 1 PM isn\'t booked')
    tick(page, 'shared')
    check(go_text(page) == 'Move 1 job', 'unticked booked jobs stay: ' + go_text(page))
    check(go(page), 'run finished')
    check(local(page, 9004)[2] == tomorrow.day and local(page, 9001)[2] == today.day and local(page, 9002)[2] == today.day, 'only Dana Fox moved; the booked ones stayed')
    put_back(page)
    ev(page, "() => { window.BOOKED_BY_SCHEDULE = false; }")
    check(snapshot(page) == start, 'put back')

    # ---- Arrival windows: moved along with the first job, so the rest go ----
    ev(page, """() => { window.calls = []; window.timePuts = [];
      const at = (h) => { const d = new Date(APPTS[9001].s); d.setHours(h, 0, 0, 0); return d; };
      APPTS[9002].ws = at(8); APPTS[9002].we = at(12); APPTS[9004].ws = at(12); APPTS[9004].we = at(17); }""")
    start_w = snapshot(page)
    set_day(page, day2)
    review(page)
    rt = review_text(page)
    check('outside its arrival window' not in rt, 'a window compared by time of day on the new day: no false warning')
    check('goes first' in rt, 'the review says one job goes first for the window')
    tick(page, 'shared')
    check(go(page), 'run finished')
    order = [k[1] for k in calls(page) if k[0] == 'time']
    check(order[0] in (9002, 9004), 'a job with an arrival window went first: %s' % order)
    check(len(order) == 3, 'then the rest: %s' % order)
    ws = ev(page, "() => new Date(APPTS[9002].ws).getDate()")
    check(ws == day2.day, 'the window moved to the new day too')
    put_back(page)
    check(snapshot(page) == start_w, 'put back, windows too')

    # ---- Arrival window left on the old day: it stops after the first job ----
    ev(page, "() => { window.calls = []; window.timePuts = []; window.WINDOW_STAYS = true; }")
    review(page)
    tick(page, 'shared')
    check(go(page), 'run finished')
    order = [k[1] for k in calls(page) if k[0] == 'time']
    L = log(page)
    check(len(order) == 1, 'only the first job was moved: %s' % order)
    check('kept its arrival window on' in L and 'Stopped' in L and "weren't moved" in L, 'the log says the window stayed and why it stopped')
    check('Put back (1)' in T(page), 'Put back can undo that one job')
    put_back(page)
    ev(page, "() => { window.WINDOW_STAYS = false; }")
    check(snapshot(page) == start_w, 'put back exactly')
    ev(page, "() => { delete APPTS[9002].ws; delete APPTS[9002].we; delete APPTS[9004].ws; delete APPTS[9004].we; }")

    # ---- Windows already dated another day (Nov 1 2026: a job on Nov 2 with its window on Oct 22,
    # as after a drag on the board). Not the move's doing, so the run doesn't stop for it. ----
    ev(page, """() => { window.calls = []; window.timePuts = []; window.WINDOW_STAYS = true;
      const old = (h) => { const d = new Date(APPTS[9001].s); d.setDate(d.getDate() - 10); d.setHours(h, 0, 0, 0); return d; };
      APPTS[9002].ws = old(8); APPTS[9002].we = old(12); APPTS[9004].ws = old(12); APPTS[9004].we = old(17); }""")
    start_old = snapshot(page)
    day_to(page, None); set_day(page, day2)
    review(page)
    tick(page, 'shared')
    check(go(page), 'run finished')
    order = [k[1] for k in calls(page) if k[0] == 'time']
    L = log(page)
    check(len(order) == 3, 'windows already dated another day: all 3 moved, no stop: %s' % order)
    check('kept its arrival window' not in L and 'Stopped' not in L, 'no false window warning: ' + L[-300:])
    put_back(page)
    check(snapshot(page) == start_old, 'put back exactly')
    ev(page, "() => { window.WINDOW_STAYS = false; delete APPTS[9002].ws; delete APPTS[9002].we; delete APPTS[9004].ws; delete APPTS[9004].we; }")

    # ---- Changed since the review, a time that won't take, a lost answer ----
    ev(page, "() => { window.calls = []; window.timePuts = []; }")
    day_to(page, 102); set_day(page, tomorrow)
    review(page)
    tick(page, 'skills'); tick(page, 'shared')
    ev(page, "() => { APPTS[9001].s = new Date(APPTS[9001].s.getTime() + 3600000); APPTS[9001].e = new Date(APPTS[9001].e.getTime() + 3600000); window.TIME_FAIL[9002] = 'always'; window.TIME_LOST[9004] = 1; }")
    moved_9001 = appt(page, 9001)
    check(go(page), 'run finished')
    L = log(page)
    check('changed since the review' in L, 'a job whose time changed since the review is left alone')
    check(appt(page, 9001) == moved_9001, '... and not touched')
    check(appt(page, 9002)['techs'] == [101] and local(page, 9002)[2] == today.day, 'a time that won\'t take: nothing changed on it, Jack stays on')
    check(not [k for k in calls(page) if k[1] == 9002 and k[0] != 'time'], '... and its techs weren\'t touched')
    check(sorted(appt(page, 9004)['techs']) == [102, 103] and local(page, 9004)[2] == tomorrow.day, 'a lost answer: the Toolbox read the job, saw the time went through, and went on to the techs')
    check("answer got lost" in L, 'it says the answer got lost')
    put_back(page)
    ev(page, "() => { APPTS[9001].s = new Date(APPTS[9001].s.getTime() - 3600000); APPTS[9001].e = new Date(APPTS[9001].e.getTime() - 3600000); window.TIME_FAIL = {}; }")
    check(snapshot(page) == start, 'everything back as it started')

    # ---- Other ways still work as before ----
    mode(page, 'Move to a tech')
    check(page.locator('#st-move-to').is_visible() and not page.locator('#st-move-day').is_visible(), 'switching back hides the day controls')

    check(not errors, 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails) if fails else '\nall passed')
sys.exit(1 if fails else 0)
