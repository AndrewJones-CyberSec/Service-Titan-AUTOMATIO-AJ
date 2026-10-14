"""🔀 Move Jobs safety: the cases from the October 2026 code review, each reproduced on the fake
board and checked fixed. The fake board answers like ServiceTitan did when checked live (Oct 2026):
the job panel's status is a number (0 = Scheduled, 4 = Done), the already-booked check only lists
booked techs, and it leaves out one appointment by its appointment id."""
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
def clear_jobs(page):
    if B(page, 'Clear').count(): B(page, 'Clear').click()
def type_jobs(page, nums):
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', nums)
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='All').filter(has_not_text='note').first.click()
def review(page, timeout=30000):
    B(page, 'Review').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return (b && b.offsetParent) || /Couldn't check|signed you out|Nothing to do|isn't on the board|exactly two|more than one visit|nothing to swap|Stopped checking/.test(document.getElementById('st-toolbox').innerText); }", timeout=timeout)
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
# Puts the fake board back the way it started, and clears every switch.
START = None
def restore(page):
    page.evaluate("(start) => { Object.keys(start).forEach(k => { Object.assign(APPTS[k], start[k], { s: new Date(start[k].s), e: new Date(start[k].e), techs: start[k].techs.slice() }); delete APPTS[k].boardStatus; delete APPTS[k].statusNum; }); "
             "BOOKED = {}; NONJOB = {}; ASSIGN_FAIL = {}; UNASSIGN_FAIL = {}; ASSIGN_IGNORE = {}; ASSIGN_LOST = {}; UNASSIGN_LOST = {}; "
             "BOOKED_BY_SCHEDULE = false; BOOKED_DRIFT = false; API_401 = false; APPT_401 = false; PERM_HANG = false; SIGNOUT_AFTER_ASSIGN = false; API_DELAY = 0; "
             "window.calls = []; localStorage.removeItem('stMoveUndo'); render(); }", START)
def open_moves(page):
    if ev(page, "() => !!window.__stToolbox"): page.evaluate("() => window.__stToolbox.close()")
    page.evaluate(TOOLBOX)
    if B(page, 'Move Jobs').count(): B(page, 'Move Jobs').click()
    page.wait_for_function("() => document.querySelectorAll('#st-move-to option').length > 1", timeout=10000)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    START = ev(page, "() => { const o = {}; Object.keys(APPTS).forEach(k => { o[k] = Object.assign({}, APPTS[k], { techs: APPTS[k].techs.slice(), s: APPTS[k].s.toISOString(), e: APPTS[k].e.toISOString() }); }); return o; }")
    open_moves(page)

    # ================= 1. A two-job swap is both jobs or neither =================
    mode(page, "Swap two jobs")
    # 7002 (Jack, needs Tank Water Heater Installs) <-> 7005 (Blake, who lacks it): only one side warns.
    clear_jobs(page); type_jobs(page, '7002 7005')
    t = review(page)
    check('Skill warning' in t and "Blake W doesn't have Tank Water Heater Installs" in t, '1: one side of the swap has a skill warning')
    check(not go_enabled(page) and go_text(page) == 'Tick the warning to swap', '1: the clean side alone can\'t be swapped: %s' % go_text(page))
    tick(page, 'skills')
    check(go_enabled(page) and go_text(page) == 'Swap them', '1: ticking the warning allows the whole swap')
    go(page)
    check(techs(page, 9002) == [102] and techs(page, 9005) == [101], '1: both sides swapped')
    restore(page)
    # One side left alone (Done): nothing is swapped.
    clear_jobs(page); type_jobs(page, '7006 7005')
    t = review(page)
    check('A swap needs both jobs' in t and not go_enabled(page) and go_text(page) == "Can't swap", '1: a Done job on one side means no swap at all')
    B(page, 'Cancel').click()
    # Second side fails: reported as half swapped, and Put back can undo the first.
    clear_jobs(page); type_jobs(page, '7002 7005')
    review(page); tick(page, 'skills')
    ev(page, "() => { ASSIGN_FAIL[9005] = 'always'; window.calls = []; }")
    go(page)
    lg = log(page); print(lg)
    check('Half swapped' in lg and techs(page, 9002) == [102] and techs(page, 9005) == [102], '1: a swap that fails on the second job says it\'s half swapped')
    check(B(page, 'Put back (1)').count() == 1, '1: Put back offered for the half that changed')
    ev(page, "() => { ASSIGN_FAIL = {}; }")
    B(page, 'Put back (1)').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=20000)
    go(page)
    check(techs(page, 9002) == [101] and techs(page, 9005) == [102], '1: Put back undoes the half swap')
    restore(page)
    # First side fails: the second is never started.
    clear_jobs(page); type_jobs(page, '7002 7005')
    review(page); tick(page, 'skills')
    ev(page, "() => { ASSIGN_FAIL[9002] = 'always'; window.calls = []; }")
    go(page)
    lg = log(page)
    check('nothing was swapped' in lg and not any(c[1] == 9005 for c in calls(page)) and techs(page, 9005) == [102], '1: first job fails, second never touched')
    restore(page)
    # A job changed after the review: nothing is swapped.
    clear_jobs(page); type_jobs(page, '7001 7005')
    review(page)
    ev(page, "() => { APPTS[9005].techs = [104]; window.calls = []; }")
    go(page)
    lg = log(page)
    check('Nothing swapped' in lg and 'changed since the review' in lg and calls(page) == [], '1: both jobs re-read before the swap; a change means nothing is swapped')
    restore(page)

    # ================= 2. A lost answer after ServiceTitan made the change =================
    mode(page, 'Move to a tech'); pick_to(page, 102)
    clear_jobs(page); type_jobs(page, '7001')
    review(page)
    ev(page, "() => { ASSIGN_LOST[9001] = 1; window.calls = []; }")
    go(page)
    lg = log(page); print(lg)
    check('answer got lost, but the change went through' in lg and techs(page, 9001) == [102], '2: lost answer on the add: reads back, sees it went through, finishes the move')
    check("Nothing changed" not in lg, '2: never says "Nothing changed" when it did change')
    B(page, 'Put back (1)').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=20000)
    go(page)
    check(techs(page, 9001) == [101], '2: Put back returns it to exactly where it started (Jack W only): %s' % techs(page, 9001))
    restore(page)
    # Lost answer on the remove.
    clear_jobs(page); type_jobs(page, '7001')
    review(page)
    ev(page, "() => { UNASSIGN_LOST[9001] = 1; window.calls = []; }")
    go(page)
    lg = log(page)
    check(techs(page, 9001) == [102] and 'answer got lost' in lg and 'retry' not in lg, '2: lost answer on the remove: confirmed by reading, no needless retry')
    B(page, 'Put back (1)').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=20000)
    go(page)
    check(techs(page, 9001) == [101], '2: Put back after a lost remove answer is exact')
    restore(page)
    # The retry of a half-done job keeps where it really started.
    clear_jobs(page); type_jobs(page, '7001')
    review(page)
    ev(page, "() => { UNASSIGN_FAIL[9001] = 1; window.calls = []; }")
    go(page)
    check(techs(page, 9001) == [102], '2: half-done job finished on the retry')
    B(page, 'Put back (1)').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=20000)
    go(page)
    check(techs(page, 9001) == [101], '2: Put back after a retry returns the original tech')
    restore(page)
    # Signed out right after a change: the change is still remembered for Put back.
    clear_jobs(page); type_jobs(page, '7001')
    review(page)
    ev(page, "() => { SIGNOUT_AFTER_ASSIGN = true; window.calls = []; }")
    go(page)
    lg = log(page); print(lg)
    check('signed you out' in lg and 'Put back can undo 1 job' in lg, '2: signed out mid-job: the job it changed is kept for Put back')
    ev(page, "() => { SIGNOUT_AFTER_ASSIGN = false; API_401 = false; }")
    B(page, 'Put back (1)').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=20000)
    t = T(page)
    check("couldn't confirm what it did" in t and not go_enabled(page), '2: an unconfirmed change is shown for you to check, not put back blindly')
    B(page, 'Cancel').click()
    restore(page)

    # ================= 3. Swaps check bookings too =================
    mode(page, "Swap two jobs")
    ev(page, "() => { BOOKED_BY_SCHEDULE = true; }")
    # 7001 (Jack 8-10) <-> 7005 (Blake 8-10): each is only "booked" by the job they're leaving.
    clear_jobs(page); type_jobs(page, '7001 7005')
    t = review(page)
    check('Already booked' not in t and go_enabled(page), '3: the job each tech is leaving doesn\'t count as booked')
    lb = ev(page, "() => window.lastBooked")
    check(lb['originalAppointmentId'] in (9001, 9005), '3: ServiceTitan is asked to leave out the job they\'re leaving: %s' % lb)
    B(page, 'Cancel').click()
    # Blake has time off then: that counts.
    ev(page, "() => { NONJOB[102] = true; }")
    t = review(page)
    check('Already booked' in t and 'Blake W has a non-job event then' in t and not go_enabled(page), '3: a non-job event (time off) is caught in a swap')
    B(page, 'Cancel').click()
    ev(page, "() => { NONJOB = {}; APPTS[9101].techs = [101]; render(); }")
    # Jack has another job at that time (Ivy Kim 9-11): that counts too.
    t = review(page)
    check('Already booked' in t and 'Jack W is already booked on another job then' in t, '3: another job at the same time is caught in a swap')
    B(page, 'Cancel').click()
    restore(page)
    # Time off added after the review: checked again right before, nothing swapped.
    clear_jobs(page); type_jobs(page, '7001 7005')
    review(page)
    ev(page, "() => { NONJOB[102] = true; window.calls = []; }")
    go(page)
    lg = log(page)
    check('since the review' in lg and 'nothing was swapped' in lg and calls(page) == [], '3: a booking made after the review stops the swap before anything changes')
    restore(page)
    # Swap whole day: Dana has time off, so taking Jack's jobs warns.
    mode(page, "Swap two techs")
    page.select_option('#st-move-a', '101'); page.select_option('#st-move-b', '104')
    ev(page, "() => { NONJOB[104] = true; }")
    t = review(page)
    check('Dana K has a non-job event then' in t and 'full swap' in t, '3: swap whole day checks bookings and says it won\'t be a full swap')
    B(page, 'Cancel').click()
    restore(page)

    # ================= 4. Stacking still catches a real booking =================
    mode(page, 'Move to a tech'); pick_to(page, 104)
    # Three jobs that all overlap: 9-11, 10-12, 10-13.
    ev(page, "() => { APPTS[9103].s = new Date(APPTS[9101].s); APPTS[9103].s.setHours(10); APPTS[9103].e = new Date(APPTS[9101].s); APPTS[9103].e.setHours(13); BOOKED_BY_SCHEDULE = true; render(); }")
    clear_jobs(page); type_jobs(page, '7101 7102 7103')
    t = review(page)
    check('3 of these overlap each other' in t and 'stacked' in t, '4: the review says the jobs will be stacked')
    go(page)
    lg = log(page)
    check(all(techs(page, a) == [104] for a in (9101, 9102, 9103)), '4: three overlapping jobs stack on Dana K')
    restore(page)
    ev(page, "() => { APPTS[9103].s = new Date(APPTS[9101].s); APPTS[9103].s.setHours(10); APPTS[9103].e = new Date(APPTS[9101].s); APPTS[9103].e.setHours(13); BOOKED_BY_SCHEDULE = true; render(); }")
    clear_jobs(page); type_jobs(page, '7101 7102 7103')
    review(page)
    # After the review, someone books Dana 12:30-1 on another job: only the 10-1 job overlaps it.
    ev(page, "() => { APPTS[9004].techs = [104]; APPTS[9004].s = new Date(APPTS[9101].s); APPTS[9004].s.setHours(12, 30); APPTS[9004].e = new Date(APPTS[9101].s); APPTS[9004].e.setHours(13); render(); window.calls = []; }")
    go(page)
    lg = log(page); print(lg)
    check(techs(page, 9101) == [104] and techs(page, 9102) == [104] and techs(page, 9103) == [], '4: the run\'s own jobs don\'t block, but a real new booking still does (3rd job left alone)')
    check('Dana K is already booked on another job then (since the review)' in lg, '4: and it says why')
    restore(page)
    # The reviewer's case: two overlapping jobs, a booking added between them.
    clear_jobs(page); type_jobs(page, '7101 7102')
    review(page)
    ev(page, "() => { window.__realAssign = true; }")
    page.evaluate("""() => { const f = window.fetch; window.fetch = async (url, opts) => { const r = await f(url, opts); if (String(url).indexOf('AssignTechnicians') > -1 && String(url).indexOf('Unassign') < 0) { BOOKED[104] = true; window.fetch = f; } return r; }; }""")
    go(page)
    check(techs(page, 9101) == [104] and techs(page, 9102) == [], '4: a booking made mid-run is caught even though the run\'s own job also overlaps')
    restore(page)

    # ================= 5. Fresh techs each review, and old reviews expire =================
    pick_to(page, 102)
    clear_jobs(page); type_jobs(page, '7002')
    t = review(page)
    check("Blake W doesn't have Tank Water Heater Installs" in t, '5: skill warning with the old skills')
    B(page, 'Cancel').click()
    ev(page, "() => { TECHS[1].skillIds = [1, 2]; }")
    t = review(page)
    check('Skill warning' not in t and go_enabled(page), '5: the next review uses the techs\' current skills')
    ev(page, "() => { window.__realNow = Date.now; const n = Date.now; Date.now = () => n() + 6 * 60 * 1000; window.calls = []; }")
    page.click('#st-move-go')
    time.sleep(0.5)
    ev(page, "() => { Date.now = window.__realNow; }")
    check('more than 5 minutes old' in T(page) and calls(page) == [] and techs(page, 9002) == [101], '5: a review over 5 minutes old has to be done again')
    ev(page, "() => { TECHS[1].skillIds = [1]; }")
    restore(page)

    # ================= 6. The sign-in check can't hang a review =================
    clear_jobs(page); type_jobs(page, '7001')
    ev(page, "() => { APPT_401 = true; PERM_HANG = true; }")
    t0 = time.time()
    t = review(page, timeout=30000)
    took = time.time() - t0
    check(took < 25 and "didn't answer whether you're still signed in" in t and 'signed you out' not in t, '6: a sign-in check that never answers gives up (%.0fs) and isn\'t taken as signed out' % took)
    check(ev(page, "() => !Array.from(document.querySelectorAll('#st-toolbox button')).find(b => /^Review/.test(b.textContent)).disabled"), '6: Review can be pressed again')
    ev(page, "() => { APPT_401 = false; PERM_HANG = false; }")
    # Stop checking during a slow review.
    ev(page, "() => { API_DELAY = 2500; }")
    B(page, 'Review').click()
    time.sleep(0.3)
    check(B(page, 'Stop checking').count() == 1, '6: Stop checking shown while a review runs')
    B(page, 'Stop checking').click()
    page.wait_for_function("() => /Stopped checking/.test(document.getElementById('st-toolbox').innerText)", timeout=20000)
    check(B(page, 'Stop checking').count() == 0 and calls(page) == [], '6: Stop checking ends the review, nothing changed')
    restore(page)

    # ================= 7. Answers in a shape the Toolbox doesn't know =================
    pick_to(page, 104)
    clear_jobs(page); type_jobs(page, '7001')
    ev(page, "() => { BOOKED_DRIFT = true; }")
    t = review(page)
    check("already-booked check came back in a shape the Toolbox doesn't know" in t and not go_enabled(page), '7: a renamed booked answer stops the job instead of reading as free')
    check("Move Jobs: the already-booked check came back in a shape" in T(page), '7: and shows it on the yellow warning bar')
    B(page, 'Cancel').click()
    ev(page, "() => { BOOKED_DRIFT = false; APPTS[9001].total = null; }")
    t = review(page)
    check('no job total' in t and not go_enabled(page), '7: a missing job total stops it (never read as $0)')
    B(page, 'Cancel').click()
    restore(page)
    # A free tech isn't in ServiceTitan's answer at all: still free (not an error).
    clear_jobs(page); type_jobs(page, '7001')
    t = review(page)
    check(go_enabled(page) and 'Already booked' not in t and "Couldn't check" not in t, '7: an empty booked answer (everyone free) is fine')
    B(page, 'Cancel').click()
    restore(page)

    # ================= Status numbers (seen live: 0 = Scheduled, 4 = Done) =================
    pick_to(page, 102)
    clear_jobs(page); type_jobs(page, '7006')
    t = review(page)
    check('appointment is Done, left alone' in t, 'status: a Done appointment (4) is left alone')
    B(page, 'Cancel').click()
    ev(page, "() => { APPTS[9001].status = 'Dispatched'; render(); }")
    clear_jobs(page); type_jobs(page, '7001')
    t = review(page)
    check('Not Scheduled' in t and "it's Dispatched, not Scheduled" in t and not go_enabled(page), 'status: a Dispatched job warns and needs a tick')
    tick(page, 'status')
    go(page)
    check(techs(page, 9001) == [102], 'status: moved after ticking')
    restore(page)
    # The board is behind: it still says Scheduled, but the fresh reading says Dispatched.
    ev(page, "() => { APPTS[9001].status = 'Dispatched'; APPTS[9001].boardStatus = 'Scheduled'; render(); }")
    clear_jobs(page); type_jobs(page, '7001')
    t = review(page)
    check("it's Dispatched, not Scheduled" in t and not go_enabled(page), 'status: a board still saying Scheduled doesn\'t hide a fresh Dispatched')
    B(page, 'Cancel').click()
    # Dispatched after the review, board still behind: checked again right before, left alone.
    ev(page, "() => { APPTS[9001].status = 'Scheduled'; render(); }")
    t = review(page)
    check(go_enabled(page) and 'Not Scheduled' not in t, 'status: Scheduled again, ready')
    ev(page, "() => { APPTS[9001].status = 'Dispatched'; APPTS[9001].boardStatus = 'Scheduled'; render(); window.calls = []; }")
    go(page)
    lg = log(page)
    check('is Dispatched now, not Scheduled' in lg and calls(page) == [] and techs(page, 9001) == [101], 'status: dispatched after the review is caught right before, nothing changed')
    restore(page)
    # Canceled (5) while the board still says Dispatched: left alone, never a tickable warning.
    ev(page, "() => { APPTS[9001].status = 'Canceled'; APPTS[9001].boardStatus = 'Dispatched'; render(); }")
    t = review(page)
    check('appointment is Canceled, left alone' in t and 'Not Scheduled' not in t and not go_enabled(page), 'status: Canceled is left alone even when the board still says Dispatched')
    B(page, 'Cancel').click()
    # Canceled after the review: left alone right before, even with the Not Scheduled warning ticked.
    ev(page, "() => { APPTS[9001].status = 'Working'; delete APPTS[9001].boardStatus; render(); }")
    t = review(page)
    check("it's Working, not Scheduled" in t, 'status: Working (2) warns')
    tick(page, 'status')
    ev(page, "() => { APPTS[9001].status = 'Canceled'; APPTS[9001].boardStatus = 'Working'; render(); window.calls = []; }")
    go(page)
    lg = log(page)
    check('appointment is Canceled, left alone' in lg and calls(page) == [] and techs(page, 9001) == [101], 'status: canceled after the review is left alone even with the warning ticked')
    restore(page)
    # Hold (3) warns like Dispatched.
    ev(page, "() => { APPTS[9001].status = 'Hold'; render(); }")
    t = review(page)
    check("it's Hold, not Scheduled" in t and not go_enabled(page), 'status: Hold (3) warns and needs a tick')
    B(page, 'Cancel').click()
    # A number the Toolbox doesn't know: left alone, even if the board says Scheduled.
    ev(page, "() => { APPTS[9001].statusNum = 7; render(); }")
    t = review(page)
    check("appointment has a status the Toolbox doesn't know (7), left alone" in t and not go_enabled(page), 'status: an unknown status number is left alone, not guessed')
    B(page, 'Cancel').click()
    restore(page)
    # The other way: the board says Dispatched but the fresh reading says Scheduled (0). The fresh one wins.
    ev(page, "() => { APPTS[9001].boardStatus = 'Dispatched'; render(); }")
    t = review(page)
    check(go_enabled(page) and 'Not Scheduled' not in t, 'status: the fresh Scheduled (0) wins over an older board word')
    B(page, 'Cancel').click()
    restore(page)

    # ================= Managed tech: an unknown tech isn't counted as managed =================
    # $500 job on a tech the tech list doesn't know (#999), adding Andrew J (not managed).
    mode(page, 'Add a tech'); pick_to(page, 103)
    ev(page, "() => { APPTS[9002].techs = [999]; render(); window.calls = []; }")
    clear_jobs(page); type_jobs(page, '7002')
    t = review(page)
    check("couldn't confirm a managed tech on this $500.00 job" in t and "isn't in the tech list" in t and not go_enabled(page) and calls(page) == [], 'managed: an unknown tech on a priced job is left alone, not assumed managed')
    B(page, 'Cancel').click()
    # A known managed tech on it is enough, even with an unknown tech too.
    ev(page, "() => { APPTS[9002].techs = [999, 101]; render(); }")
    t = review(page)
    check('+ Andrew J' in t and "couldn't confirm a managed tech" not in t and 'Left alone' not in t, 'managed: a known managed tech on the job is enough')
    B(page, 'Cancel').click()
    restore(page)
    mode(page, 'Move to a tech')

    # ================= Known limit: a job the board doesn't show, booked mid-run, in a 3-job stack =================
    pick_to(page, 104)
    three = "() => { APPTS[9103].s = new Date(APPTS[9101].s); APPTS[9103].s.setHours(10); APPTS[9103].e = new Date(APPTS[9101].s); APPTS[9103].e.setHours(13); BOOKED_BY_SCHEDULE = true; render(); window.calls = []; }"
    # Hidden from the board but already there at the review: ServiceTitan's check catches it (exact at review).
    ev(page, three); ev(page, "() => { BOOKED[104] = true; }")
    clear_jobs(page); type_jobs(page, '7101 7102 7103')
    t = review(page)
    check('Already booked at that time (3)' in t and not go_enabled(page), 'limit: a booking the board doesn\'t show is still caught at the review')
    B(page, 'Cancel').click()
    restore(page)
    # Added mid-run (after the 2nd job): for the 3rd job ServiceTitan can only leave out one of the run's
    # two overlapping jobs, and the board doesn't show the new one, so it can't be told apart. The 3rd
    # job goes through. Documented limit (treating it as booked would stop every 3-job stack).
    ev(page, three)
    clear_jobs(page); type_jobs(page, '7101 7102 7103')
    review(page)
    page.evaluate("""() => { const f = window.fetch; let n = 0; window.fetch = async (url, opts) => { const r = await f(url, opts); if (/\\/AssignTechnicians/.test(String(url)) && ++n === 2) { BOOKED[104] = true; window.fetch = f; } return r; }; }""")
    go(page)
    check(all(techs(page, a) == [104] for a in (9101, 9102, 9103)), 'limit (documented): a hidden job booked mid-run can\'t be told apart in a 3-job stack; the 3rd job goes on')
    restore(page)
    # Time off added mid-run is still caught in the same case (non-job events always count).
    ev(page, three)
    clear_jobs(page); type_jobs(page, '7101 7102 7103')
    review(page)
    page.evaluate("""() => { const f = window.fetch; let n = 0; window.fetch = async (url, opts) => { const r = await f(url, opts); if (/\\/AssignTechnicians/.test(String(url)) && ++n === 2) { NONJOB[104] = true; window.fetch = f; } return r; }; }""")
    go(page)
    lg = log(page)
    check(techs(page, 9103) == [] and 'Kim Wu: Dana K has a non-job event then' in lg and '(since the review)' in lg, 'limit: time off added mid-run is still caught in a 3-job stack')
    restore(page)

    # ================= Closing waits for the run to really stop =================
    pick_to(page, 104)
    clear_jobs(page); type_jobs(page, '7101 7102 7103')
    review(page)
    ev(page, "() => { API_DELAY = 600; }")
    page.click('#st-move-go')
    time.sleep(0.8)
    page.locator('#st-toolbox span', has_text='✕').first.click()
    B(page, 'Stop it and close').click()
    time.sleep(0.3)
    still = ev(page, "() => !!document.getElementById('st-toolbox')")
    page.wait_for_function("() => !document.getElementById('st-toolbox')", timeout=60000)
    check(still, 'close: the Toolbox stays until the run has stopped')
    check(ev(page, "() => window.__stToolbox === undefined"), 'close: then it closes')
    ev(page, "() => { API_DELAY = 0; }")

    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails))
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
