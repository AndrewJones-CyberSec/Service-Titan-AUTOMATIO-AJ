"""🔀 Move Jobs on a fake Dispatch board whose job panel works like ServiceTitan's: assign and
unassign requests, the already-booked check, skills, managed techs and branches."""
import sys, time, pathlib, json
from playwright.sync_api import sync_playwright

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
        time.sleep(0.2)
    return False
def techs(page, appt):
    return ev(page, "() => APPTS[%d].techs.slice()" % appt)
def calls(page):
    return ev(page, "() => window.calls.slice()")
def mode(page, label):
    page.locator('#st-toolbox label:visible', has_text=label).first.locator('input').check()
def pick_to(page, tech_id):
    page.select_option('#st-move-to', str(tech_id))
def pick_from(page, tech_id):
    page.select_option('#st-move-from', str(tech_id) if tech_id else '')
def clear_jobs(page):
    if B(page, 'Clear').count(): B(page, 'Clear').click()
def type_jobs(page, nums):
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='All').filter(has_not_text='note').first.click()
def review(page):
    B(page, 'Review').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return (b && b.offsetParent) || /Couldn't check|signed you out|Nothing to do|isn't on the board|exactly two|more than one visit/.test(document.getElementById('st-toolbox').innerText); }", timeout=20000)
    time.sleep(0.2)
    return T(page)
def go_text(page):
    return ev(page, "() => document.getElementById('st-move-go').textContent")
def go_enabled(page):
    return ev(page, "() => !document.getElementById('st-move-go').disabled")
def go(page):
    page.click('#st-move-go')
    return wait_done(page)
def tick(page, kind):
    page.check('#st-toolbox input.st-move-tick-' + kind)
def reset(page, appt, ids):
    ev(page, "() => { APPTS[%d].techs = %s; window.calls = []; }" % (appt, json.dumps(ids)))

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate(TOOLBOX)
    check(B(page, 'Move Jobs').count() == 1, 'menu has Move Jobs')
    B(page, 'Move Jobs').click()
    page.wait_for_function("() => document.querySelectorAll('#st-move-to option').length > 1", timeout=10000)
    opts = ev(page, "() => Array.from(document.querySelectorAll('#st-move-to option')).map(o => o.textContent)")
    check(opts == ['Andrew J', 'Blake W', 'Dana K', 'Jack W'], 'tech list loaded A-Z, inactive techs left out: %s' % opts)
    check('Move to a tech' in T(page) and 'Swap two techs' in T(page), 'all five ways shown')
    check(ev(page, "() => document.querySelector('#st-toolbox button[disabled]') !== null"), 'Review disabled until jobs are picked')

    # ---- Move one job: the new tech is added BEFORE the old one comes off ----
    mode(page, 'Move to a tech')
    pick_to(page, 102)
    page.locator('#st-toolbox button:visible', has_text='Pick on board').first.click()
    page.click('a.appointment[data-id="9001"]')
    check(ev(page, "() => window.opened.length") == 0 and '1 job picked' in T(page), 'job picked by clicking it on the board (click captured)')
    t = review(page)
    print(t)
    check('Jack W → Blake W' in t and 'Ready: 1 job' in t, 'review shows the change')
    check(calls(page) == [], 'review changed nothing')
    check(go_text(page) == 'Move 1 job', 'go button counts jobs: %s' % go_text(page))
    check(go(page), 'move run finishes')
    print(log(page))
    check(techs(page, 9001) == [102], 'job now on Blake W only: %s' % techs(page, 9001))
    c = calls(page)
    check(c == [['assign', 9001, [102]], ['unassign', 9001, [101]]], 'added Blake first, then took Jack off: %s' % c)
    check('Done: 1 done' in T(page) and '0 jobs picked' in T(page), 'tally shown and the job came off the list')
    check(B(page, 'Put back (1)').count() == 1, 'Put back offered')
    check(B(page, 'Notifications for these 1 job').count() == 1, 'notifications handoff offered')

    # ---- Put back ----
    ev(page, "() => { window.calls = []; }")
    B(page, 'Put back').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=10000)
    t = T(page)
    check('Put back' in t and 'Blake W → Jack W' in t, 'put back reviewed first')
    check(go(page), 'put back finishes')
    check(techs(page, 9001) == [101], 'put back exactly: Jack W again')
    check(calls(page) == [['assign', 9001, [101]], ['unassign', 9001, [102]]], 'put back also adds first: %s' % calls(page))

    # ---- Skill warning: not done unless ticked ----
    check(B(page, 'Pick on board').count() == 1, 'picking turned off once the review started')
    clear_jobs(page)
    type_jobs(page, '7002')
    t = review(page)
    print(t)
    check("Skill warning" in t and "Blake W doesn't have Tank Water Heater Installs" in t, 'skill warning like ServiceTitan\'s')
    check(not go_enabled(page) and go_text(page) == 'Move 0 jobs', 'warned job not done unless ticked')
    tick(page, 'skills')
    check(go_enabled(page) and go_text(page) == 'Move 1 job', 'ticking the warning includes it')
    check(go(page), 'skill-warning move finishes')
    check(techs(page, 9002) == [102], 'moved after ticking')
    reset(page, 9002, [101])

    # ---- Already booked ----
    ev(page, "() => { BOOKED[104] = true; }")
    clear_jobs(page); type_jobs(page, '7001'); pick_to(page, 104)
    t = review(page)
    check('Already booked at that time' in t and 'Dana K is already booked' in t, 'booked warning shown')
    check(not go_enabled(page), 'booked job not done unless ticked')
    lb = ev(page, "() => window.lastBooked")
    check(lb['technicianIds'] == [104] and lb['originalAppointmentId'] == 7001, 'booked check asked the same way the job panel does: %s' % lb)
    B(page, 'Cancel').click()
    ev(page, "() => { BOOKED = {}; }")

    # ---- Managed tech rule (job with a price) ----
    clear_jobs(page); type_jobs(page, '7002'); pick_to(page, 103)
    t = review(page)
    print(t)
    check("ServiceTitan won't allow it: Andrew J isn't a managed tech, so the invoice must be $0 (it's $500.00)" in t and 'Left alone (1)' in t, "replacing the only managed tech on a priced job is refused, in ServiceTitan's words")
    check(calls(page) == [], 'nothing sent for it')
    B(page, 'Cancel').click()
    mode(page, 'Add a tech')
    t = review(page)
    check('+ Andrew J' in t and 'Left alone' not in t and "Andrew J doesn't have Tank Water Heater Installs" in t, 'adding an unmanaged helper next to a managed tech is allowed (skill warning still applies)')
    tick(page, 'skills')
    check(go(page), 'add run finishes')
    check(techs(page, 9002) == [101, 103], 'helper added, Jack kept: %s' % techs(page, 9002))
    reset(page, 9002, [101])

    # ---- Unassign: another branch's job warns (it would drop off this board) ----
    mode(page, 'Unassign')
    pick_from(page, None)
    clear_jobs(page); type_jobs(page, '7003')
    t = review(page)
    print(t)
    check('Would drop off your board' in t and "Gulfport Branch's Unassigned list" in t, 'other-branch warning on unassign')
    check(not go_enabled(page), 'not unassigned unless ticked')
    tick(page, 'branch')
    check(go(page), 'unassign finishes')
    check(techs(page, 9003) == [], 'unassigned after ticking')
    reset(page, 9003, [102])
    clear_jobs(page); type_jobs(page, '7001')
    t = review(page)
    check('Jack W (to Unassigned)' in t and 'Would drop off' not in t, 'own-branch unassign needs no tick')
    B(page, 'Cancel').click()

    # ---- Multi-tech job: move just one of them ----
    mode(page, 'Move to a tech')
    pick_to(page, 102); pick_from(page, 103)
    clear_jobs(page); type_jobs(page, '7004')
    t = review(page)
    check('Andrew J → Blake W' in t, 'from one tech on a two-tech job')
    check(go(page), 'multi-tech move finishes')
    check(sorted(techs(page, 9004)) == [101, 102], 'Jack kept, Andrew replaced by Blake: %s' % techs(page, 9004))
    reset(page, 9004, [101, 103])
    pick_from(page, None)
    check('0 jobs picked' in T(page), 'moved job came off the list')
    type_jobs(page, '7004')
    t = review(page)
    check('Jack W, Andrew J → Blake W' in t, '"anyone" replaces everyone on the job')
    B(page, 'Cancel').click()

    # ---- Done appointment, other day, unknown job ----
    clear_jobs(page); type_jobs(page, '7006 7008 123456')
    t = review(page)
    check('appointment is Done, left alone' in t, 'Done appointment left alone')
    check(t.count('not on the board for') == 2, 'jobs not on the day shown are listed, not touched')
    check(calls(page) == [], 'nothing sent')
    B(page, 'Cancel').click()

    # ---- All Unassigned onto one tech ----
    clear_jobs(page)
    pick_to(page, 101)
    B(page, 'All Unassigned').click()
    page.wait_for_function("() => /Added \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    check('3 jobs picked' in T(page) and 'Ivy Kim' in T(page), 'whole Unassigned list added with names')
    check(ev(page, "() => window.lastGetJobs.QueryFilter.BusinessUnitIds") == [1], "uses the board's branch filter")
    t = review(page)
    check('Ready: 3 jobs' in t and 'Ivy Kim' in t and t.count('Jack W') >= 3, 'three unassigned jobs ready for Jack')
    t0 = time.time()
    check(go(page), 'unassigned run finishes')
    secs = time.time() - t0
    check(all(techs(page, a) == [101] for a in (9101, 9102, 9103)), 'all three now on Jack W')
    check(all(c[0] == 'assign' for c in calls(page)), 'nothing to take off for unassigned jobs')
    check(secs < 8, 'quick: %.1fs for 3 jobs' % secs)
    # Hand them to Job Notifications
    B(page, 'Notifications for these 3 jobs').click()
    t = T(page)
    check('Job Notifications' in t and '3 jobs picked' in t and 'Added 3 jobs from Move Jobs' in t, 'Job Notifications opens with the moved jobs picked')
    page.locator('#st-toolbox button:visible', has_text='Menu').first.click()
    B(page, 'Move Jobs').click()
    for a in (9101, 9102, 9103): reset(page, a, [])

    # ---- Swap two jobs ----
    mode(page, "Swap two jobs")
    clear_jobs(page); type_jobs(page, '7001 7005')
    t = review(page)
    check('Jack W → Blake W' in t and 'Blake W → Jack W' in t and 'skip the already-booked check' in t, 'swap shows both sides')
    check(go_text(page) == 'Swap them', 'swap button')
    check(go(page), 'swap finishes')
    check(techs(page, 9001) == [102] and techs(page, 9005) == [101], 'techs traded')
    reset(page, 9001, [101]); reset(page, 9005, [102])
    clear_jobs(page); type_jobs(page, '7001')
    check(B(page, 'Review').is_disabled(), 'swap needs exactly two jobs (Review disabled with one)')
    check("Each one gets the other's tech" in T(page), 'swap explains what it does')
    # A third job can't be picked for a swap (on the board, typed, or the whole list)
    clear_jobs(page)
    B(page, 'Pick on board').click()
    page.click('a.appointment[data-id="9001"]')
    page.click('a.appointment[data-id="9003"]')
    page.click('a.appointment[data-id="9005"]')
    t = T(page)
    check('2 jobs picked' in t and 'Swap uses two jobs' in t, 'third job refused while swapping: picks stay at 2')
    check(ev(page, "() => window.opened.length") == 0, 'the refused click did not open the job either')
    type_jobs(page, '7002')
    check('2 jobs picked' in T(page), 'typed third job refused too')
    page.locator('#st-toolbox button:visible', has_text='All in the list').first.click()
    check('2 jobs picked' in T(page), 'whole list refused past two')
    page.locator('#st-toolbox button:visible', has_text='Picking: ON').first.click()
    # Switching into Swap with more than two picked says so
    mode(page, 'Move to a tech')
    type_jobs(page, '7002')
    check('3 jobs picked' in T(page), 'Move takes more than two')
    mode(page, "Swap two jobs")
    check('Swap uses two jobs, and 3 are picked' in T(page) and B(page, 'Review').is_disabled(), 'switching to Swap with 3 picked warns and blocks Review')
    # Two jobs on the same tech: nothing to swap
    clear_jobs(page); type_jobs(page, '7001 7002')
    ev(page, "() => { window.calls = []; }")
    B(page, 'Review').click()
    page.wait_for_function("() => /nothing to swap/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    check('Both jobs are on Jack W' in T(page) and calls(page) == [], 'same-tech swap explained, nothing sent')

    # ---- Swap two techs' whole day ----
    mode(page, "whole day")
    page.select_option('#st-move-a', '101'); page.select_option('#st-move-b', '102')
    t = review(page)
    print(t)
    rv = t.split('Cancel')[0]   # the review only, not the last run's results below it
    check(rv.count('Jack W → Blake W') == 3 and rv.count('Blake W → Jack W') == 2, "Jack's 3 open jobs and Blake's 2 trade places")
    check('Ready: 4 jobs' in t and "Bob Smith: Jack W → Blake W. Blake W doesn't have Tank Water Heater Installs" in t, 'skill check applies to swaps too')
    check('Done, left alone' in t, "Jack's Done job is left alone")
    check(go_text(page) == 'Swap 4 jobs', 'swap day button counts before ticking: %s' % go_text(page))
    tick(page, 'skills')
    check(go_text(page) == 'Swap 5 jobs', 'and after ticking: %s' % go_text(page))
    check(go(page), 'swap day finishes')
    check(techs(page, 9001) == [102] and techs(page, 9002) == [102] and sorted(techs(page, 9004)) == [102, 103], "Jack's jobs went to Blake (helper kept)")
    check(techs(page, 9003) == [101] and techs(page, 9005) == [101], "Blake's jobs went to Jack")
    check(techs(page, 9006) == [101] and techs(page, 9008) == [101], 'Done job and the other day untouched')
    # put the whole day back
    B(page, 'Put back (5)').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=10000)
    check(go(page), 'swap day put back finishes')
    check(techs(page, 9001) == [101] and techs(page, 9002) == [101] and sorted(techs(page, 9004)) == [101, 103] and techs(page, 9003) == [102] and techs(page, 9005) == [102], 'day put back exactly')

    # ---- Failures ----
    mode(page, 'Move to a tech'); pick_to(page, 102); pick_from(page, None)
    ev(page, "() => { ASSIGN_FAIL[9001] = 'always'; window.calls = []; }")
    clear_jobs(page); type_jobs(page, '7001')
    review(page)
    check(go(page), 'failing run finishes')
    lg = log(page); print(lg)
    check("couldn't add Blake W" in lg and 'Nothing changed' in lg and 'retry:' in lg, 'add failure reported and retried once')
    check(techs(page, 9001) == [101] and not any(c[0] == 'unassign' for c in calls(page)), 'old tech never taken off when the add fails')
    check('1 job picked' in T(page) and 'Needs a look: #7001' in lg, 'problem job stays picked')
    ev(page, "() => { ASSIGN_FAIL = {}; UNASSIGN_FAIL[9001] = 1; window.calls = []; }")
    review(page)
    check(go(page), 'partial run finishes')
    lg = log(page); print(lg)
    check("added Blake W but couldn't take off Jack W" in lg and 'retry: finished the change, now Blake W' in lg and techs(page, 9001) == [102], 'remove failed once, the retry finished just the remove')
    check(calls(page) == [['assign', 9001, [102]], ['unassign', 9001, [101]], ['unassign', 9001, [101]]], 'retry did not add twice: %s' % calls(page))
    check(B(page, 'Put back (1)').count() == 1, 'a partly-done job can still be put back')
    B(page, 'Put back').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=10000)
    go(page)
    check(techs(page, 9001) == [101], 'put back after a retry restores the original tech')
    # Half done and the retry fails too: Put back still knows where the job started
    ev(page, "() => { UNASSIGN_FAIL[9001] = 'always'; window.calls = []; }")
    clear_jobs(page); type_jobs(page, '7001')
    review(page); go(page)
    check(sorted(techs(page, 9001)) == [101, 102] and 'Needs a look: #7001' in log(page), 'stuck halfway: both techs on, flagged')
    ev(page, "() => { UNASSIGN_FAIL = {}; }")
    check(B(page, 'Put back (1)').count() == 1, 'Put back still offered for a job the retry could not finish')
    B(page, 'Put back').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=10000)
    go(page)
    check(techs(page, 9001) == [101], 'put back returns it to Jack only')
    # ServiceTitan says OK but doesn't change anything
    ev(page, "() => { ASSIGN_IGNORE[9001] = true; window.calls = []; }")
    clear_jobs(page); type_jobs(page, '7001')
    review(page); go(page)
    lg = log(page)
    check("ServiceTitan didn't add Blake W" in lg and techs(page, 9001) == [101] and not any(c[0] == 'unassign' for c in calls(page)), 'an add that did not stick is caught; old tech kept')
    ev(page, "() => { ASSIGN_IGNORE = {}; }")

    # ---- Someone changed the job after the review ----
    clear_jobs(page); type_jobs(page, '7001')
    review(page)
    ev(page, "() => { APPTS[9001].techs = [101, 104]; window.calls = []; }")
    go(page)
    lg = log(page); print(lg)
    check('changed since the review' in lg and calls(page) == [] and 'retry:' not in lg, 'a job changed since the review is left alone, not retried')
    reset(page, 9001, [101])

    # ---- The board hasn't redrawn ----
    ev(page, "() => { BOARD_LAG = true; }")
    clear_jobs(page); type_jobs(page, '7001')
    review(page); go(page)
    lg = log(page)
    check('Refreshed the board' in lg and "board hasn't caught up" not in lg and ev(page, "() => window.refreshes") == 1, 'board not redrawn: refreshes it with the board\'s own reload')
    check(ev(page, "() => !!document.querySelector('#team-timeline-row-102 a.appointment[data-job-id=\"7001\"]')"), 'after the refresh the board shows the job on the new tech')
    reset(page, 9001, [101]); ev(page, "() => { render(); window.refreshes = 0; }")
    # No reload on this board (ServiceTitan changed it): says to press F5
    ev(page, "() => { NO_REFRESH = true; render(); }")
    clear_jobs(page); type_jobs(page, '7001')
    review(page); go(page)
    check("board hasn't caught up" in log(page) and 'F5' in log(page), 'no board reload: says to press F5')
    # A board menu open: the board would skip its refresh, so don't call it
    ev(page, "() => { NO_REFRESH = false; render(); }")
    reset(page, 9001, [101]); ev(page, "() => { render(); window.refreshes = 0; const d = document.createElement('div'); d.className = 'trello-dropdown open'; d.id = 'fake-menu'; document.body.appendChild(d); }")
    clear_jobs(page); type_jobs(page, '7001')
    review(page); go(page)
    check(ev(page, "() => window.refreshes") == 0 and "board hasn't caught up" in log(page), 'a board menu open: no refresh, says to press F5')
    ev(page, "() => { document.getElementById('fake-menu').remove(); BOARD_LAG = false; }")
    reset(page, 9001, [101]); ev(page, "() => render()")

    # ---- Put back is kept when the Toolbox is closed and opened again ----
    clear_jobs(page); type_jobs(page, '7001')
    pick_to(page, 104)
    review(page); go(page)
    check(techs(page, 9001) == [104], 'moved for the saved Put back test')
    page.evaluate("() => window.__stToolbox.close()")
    page.evaluate(TOOLBOX)
    if B(page, 'Move Jobs').count(): B(page, 'Move Jobs').click()
    page.wait_for_function("() => document.querySelectorAll('#st-move-to option').length > 1", timeout=10000)
    mode(page, 'Move to a tech')
    check(B(page, 'Put back (1)').count() == 1, 'Put back still offered after closing and reopening the Toolbox')
    B(page, 'Put back (1)').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=20000)
    go(page)
    check(techs(page, 9001) == [101], 'saved Put back puts the job back')
    check(ev(page, "() => localStorage.getItem('stMoveUndo')") is None and B(page, 'Put back (').count() == 0, 'nothing left to put back afterwards')
    # A day old: not offered
    clear_jobs(page); type_jobs(page, '7001'); pick_to(page, 104)
    review(page); go(page)
    ev(page, "() => { const s = JSON.parse(localStorage.getItem('stMoveUndo')); s.at -= 25 * 3600 * 1000; localStorage.setItem('stMoveUndo', JSON.stringify(s)); }")
    page.evaluate("() => window.__stToolbox.close()")
    page.evaluate(TOOLBOX)
    if B(page, 'Move Jobs').count(): B(page, 'Move Jobs').click()
    page.wait_for_function("() => document.querySelectorAll('#st-move-to option').length > 1", timeout=10000)
    mode(page, 'Move to a tech')
    check(B(page, 'Put back (').count() == 0, 'a Put back over a day old is not offered')
    reset(page, 9001, [101]); ev(page, "() => { render(); localStorage.removeItem('stMoveUndo'); }")

    # ---- Stop mid-run ----
    for a in (9101, 9102, 9103): reset(page, a, [])
    clear_jobs(page); pick_to(page, 101)
    B(page, 'All Unassigned').click()
    page.wait_for_function("() => /Added \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    review(page)
    ev(page, "() => { window.API_DELAY = 400; }")
    page.click('#st-move-go')
    time.sleep(1.2)
    B(page, 'Stop').click()
    check(wait_done(page, 30), 'stopped run ends')
    done = sum(1 for a in (9101, 9102, 9103) if techs(page, a) == [101])
    check(1 <= done < 3 and 'Stopped.' in log(page), 'stop leaves the rest (%d of 3 done)' % done)
    ev(page, "() => { window.API_DELAY = 30; }")

    # ---- Stacking overlapping jobs on one tech: the run's own jobs don't count as "booked" ----
    for a in (9101, 9102, 9103): reset(page, a, [])
    ev(page, "() => { BOOKED_BY_SCHEDULE = true; window.calls = []; }")
    mode(page, 'Move to a tech'); pick_to(page, 104); pick_from(page, None)
    clear_jobs(page)
    B(page, 'All Unassigned').click()
    page.wait_for_function("() => /Added \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    t = review(page)
    check('Ready: 3 jobs' in t and 'Already booked' not in t, 'Dana K free when reviewed')
    check(go(page), 'stacking run finishes')
    lg = log(page); print(lg)
    check(all(techs(page, a) == [104] for a in (9101, 9102, 9103)) and 'booked' not in lg, "overlapping jobs all stacked on Dana K: the run's own jobs don't block the rest")
    # Someone else books her for real after the review: that job is still left alone
    for a in (9101, 9102, 9103): reset(page, a, [])
    ev(page, "() => { BOOKED_BY_SCHEDULE = false; }")
    clear_jobs(page)
    B(page, 'All Unassigned').click()
    page.wait_for_function("() => /Added \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    review(page)
    ev(page, "() => { BOOKED[104] = true; window.calls = []; }")
    go(page)
    lg = log(page); print(lg)
    check('Dana K got booked at that time since the review, left alone' in lg and calls(page) == [], 'a real booking since the review still stops it')
    ev(page, "() => { BOOKED = {}; }")
    for a in (9101, 9102, 9103): reset(page, a, [])

    # ---- Signed out ----
    clear_jobs(page); type_jobs(page, '7001')
    ev(page, "() => { API_401 = true; window.calls = []; }")
    t = review(page)
    check('signed you out' in t and calls(page) == [], 'signed out during review says so, nothing sent')
    ev(page, "() => { API_401 = false; }")

    # ---- Skills list unavailable: warns instead of guessing ----
    page.evaluate("() => window.__stToolbox.close()")
    ev(page, "() => { TECH_API_DOWN = true; App.Data.Technicians = TECHS.map(t => ({ Id: t.id, Name: t.name, Active: t.active, IsManagedTechnician: t.isManagedTechnician })); }")
    page.evaluate(TOOLBOX)
    if B(page, 'Move Jobs').count(): B(page, 'Move Jobs').click()
    page.wait_for_function("() => document.querySelectorAll('#st-move-to option').length > 1", timeout=10000)
    mode(page, 'Move to a tech'); pick_to(page, 102)
    clear_jobs(page); type_jobs(page, '7001')
    t = review(page)
    check("skills couldn't be checked for Blake W" in t and not go_enabled(page), 'no skill data: warns and needs a tick')
    B(page, 'Cancel').click()
    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails))
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
