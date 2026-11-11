"""🔀 Move Jobs → 📅 Move picked jobs to another day (same techs), on the fake Dispatch board
(board_moves.html): jobs picked across several techs (a shared one too) go to another day at the
same times and lengths, on exactly the techs they have; no assign or unassign is sent; refusals,
a job not on the board's day, booked on the new day, a Done job, and ↩ Put back."""
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
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return (b && b.offsetParent) || /Couldn't check|signed you out|Nothing to do|has no jobs|isn't on the board|Pick another day|has passed|Pick the day/.test(document.getElementById('st-toolbox').innerText); }", timeout=20000)
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

def clear_jobs(page):
    if B(page, 'Clear').count(): B(page, 'Clear').click()
def type_jobs(page, nums):
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='All').filter(has_not_text='note').first.click()

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
    check('Move picked jobs to another day' in T(page), 'the new way is listed')
    mode(page, 'Move picked jobs to another day')
    check(page.locator('#st-move-day').is_visible(), 'Day is shown')
    check(page.locator('#st-toolbox input:visible[placeholder^="Or type job"]').count() == 1, 'the job list to pick from is shown')
    check(not page.locator('#st-move-day-from').is_visible() and not page.locator('#st-move-day-to').is_visible() and not page.locator('#st-move-to').is_visible(), 'no tech lists (each job keeps its techs)')
    check(ev(page, "() => document.getElementById('st-move-day').value") == ymd(tomorrow), 'Day starts as the day after the board\'s')
    check(B(page, 'Review').is_disabled(), 'Review waits for a picked job')

    # ---- Refusals ----
    type_jobs(page, '7001')
    set_day(page, today)
    review(page)
    check('Pick another day' in T(page), 'the board\'s own day is refused')
    set_day(page, today - datetime.timedelta(days=1))
    review(page)
    check('has passed' in T(page), 'a day that has passed is refused')
    check(snapshot(page) == start and not calls(page), 'nothing changed by the refusals')

    # ---- Jobs on three techs (Jack, Blake, Jack + Andrew), a Done one and one on another day ----
    clear_jobs(page)
    type_jobs(page, '7001, 7003, 7004, 7005, 7006, 7008')
    set_day(page, day2)
    review(page)
    rt = review_text(page)
    check('picked jobs to' in rt and '(same techs)' in rt, 'the review says it: ' + rt.splitlines()[0])
    for c in ('Amy Lee', 'Carl Diaz', 'Dana Fox', 'Eve Hall'):
        check(c in rt, c + ' is in the review')
    check('Fay Moss' in rt and 'Done' in rt, 'the Done job is left alone')
    check('#7008' in rt and 'not on the board' in rt, 'a job not on the board\'s day is left alone, saying so')
    check('on it too' not in rt and 'Other techs' not in rt, 'no "other techs" warning: everyone on a job goes with it')
    check('keeps its time, its length and everyone on it' in rt, 'the review says techs and times stay')
    check(go_text(page) == 'Move 4 jobs', 'Go moves the 4: ' + go_text(page))
    before = {a: appt(page, a) for a in (9001, 9003, 9004, 9005, 9006, 9008)}
    check(go(page), 'the run finished')
    for a in (9001, 9003, 9004, 9005):
        y, mo, d, hh, mi = local(page, a)
        x = appt(page, a)
        check(datetime.date(y, mo, d) == day2, '#%d is on %s now (%s)' % (a, day2, datetime.date(y, mo, d)))
        check(x['e'] - x['s'] == before[a]['e'] - before[a]['s'], '#%d keeps its length' % a)
        check(x['techs'] == before[a]['techs'], '#%d keeps its techs %s' % (a, x['techs']))
    for a, h in ((9001, 8), (9003, 13), (9004, 13), (9005, 8)):
        check(local(page, a)[3:] == [h, 0], '#%d keeps its clock time %d:00' % (a, h))
    check(appt(page, 9006) == before[9006] and appt(page, 9008) == before[9008], 'the Done job and the other day\'s job didn\'t move')
    check(not [c for c in calls(page) if c[0] != 'time'], 'no assign or unassign sent: %s' % [c for c in calls(page) if c[0] != 'time'])
    puts = ev(page, "() => window.timePuts.map(p => p.body)")
    check(len(puts) == 4 and all(p_['technicianIdsToAdd'] == [] and p_['technicianIdsToRemove'] == [] for p_ in puts), 'four new times, techs left alone')
    check('4 done' in T(page), 'done: 4')
    check('Put back (4)' in T(page), 'Put back can undo the 4')
    put_back(page)
    for a in (9001, 9003, 9004, 9005):
        check(appt(page, a) == before[a], '#%d put back exactly' % a)
    check(snapshot(page) == start, 'the whole board is as it started')

    # ---- Booked on the new day: Jack has Hal Fry tomorrow 9-11 ----
    ev(page, "() => { window.calls = []; window.timePuts = []; window.BOOKED_BY_SCHEDULE = true; }")
    clear_jobs(page)
    type_jobs(page, '7001, 7003')
    set_day(page, tomorrow)
    review(page)
    rt = review_text(page)
    check('Already booked' in rt and 'Amy Lee' in rt.split('Already booked')[1], 'Amy Lee 8-10 overlaps Jack\'s job tomorrow: booked')
    check(go_text(page) == 'Move 1 job', 'unticked booked job stays: ' + go_text(page))
    check(go(page), 'run finished')
    check(local(page, 9003)[2] == tomorrow.day and local(page, 9001)[2] == today.day, 'only Carl Diaz moved')
    put_back(page)
    ev(page, "() => { window.BOOKED_BY_SCHEDULE = false; }")
    check(snapshot(page) == start, 'put back')

    # ---- The tech's whole-day way is still there ----
    mode(page, "Move a tech's day")
    check(page.locator('#st-move-day-from').is_visible() and not page.locator('#st-toolbox input:visible[placeholder^="Or type job"]').count(), 'Move a tech\'s day still shows From and no job list')

    check(not errors, 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails) if fails else '\nall passed')
sys.exit(1 if fails else 0)
