"""🔍 Job Review (Beta), 2.7.

A completed job typed in: what it checks by itself (completed, tech notes, invoice $0.00 or the
Requested funds tag, pictures, estimates, already reviewed), 📷 Photo review or 📋 PC review (guessed
from the job), the reviewer's name on the tag, the note (clean, or what was found, with the estimate
task), 💬 the Teams message for Kyle, ❔ for what it couldn't read (never a pass), and the note typed
into the job record's "Leave a note..." box (never saved by the Toolbox).

Runs on tests/board_ai.html with ServiceTitan's job requests answered by a stand-in (window.REVIEW).
"""
import sys, pathlib, json
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_ai.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

COPY = "() => { window.COPIED = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: t => { window.COPIED.push(t); return Promise.resolve(); } } }); }"
# Job data by job number. rec null: the job record can't be read (no permission).
JOBS = {
    '501': {  # a clean install: done, notes, $0, pictures, a dismissed estimate
        'appts': [{'id': 9001, 'status': 4}], 'tags': ['8-12 Complete'], 'bu': 'Mendenhall Branch',
        'notes': ['Installed 3 ton unit, serial in pictures.'],
        'rec': {'JobTypeName': 'Install', 'Invoice': {'Balance': 0, 'Total': 8000}, 'Attachments': [{'FileName': 'a.jpg'}, {'FileName': 'b.jpg'}], 'Estimates': [{'Status': 'Dismissed'}]}},
    '502': {  # balance owed, no Requested funds tag, an open estimate, no notes
        'appts': [{'id': 9002, 'status': 4}], 'tags': [], 'bu': 'Mendenhall Branch', 'notes': [],
        'rec': {'JobTypeName': 'Service', 'Invoice': {'Balance': 125.5}, 'Attachments': [{'FileName': 'x.jpg'}], 'Estimates': [{'Status': 'Open'}]}},
    '503': {  # balance owed but funds requested
        'appts': [{'id': 9003, 'status': 4}], 'tags': ['Requested funds', 'KYLE REVIEWED'], 'bu': 'Mendenhall Branch', 'notes': ['done'],
        'rec': {'JobTypeName': 'Install', 'Invoice': {'Balance': 15000}, 'Attachments': [{'FileName': 'x.jpg'}], 'Estimates': []}},
    '504': {  # a quote, job record not readable, not completed
        'appts': [{'id': 9004, 'status': 0}], 'tags': [], 'bu': 'Sales - Quote', 'notes': ['Quoted 2 options'], 'rec': None},
}
STUB = """jobs => {
  window.REVIEW = jobs;
  const orig = window.fetch.bind(window);
  const ok = v => Promise.resolve(new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  window.fetch = (url, o) => {
    const u = String(url), id = (/[?&](?:jobId|ownerId|id)=(\\d+)/.exec(u) || [])[1];
    const J = id && jobs[id];
    if (/GetJobAppointments/.test(u) && J) return ok(J.appts);
    if (/GetJobOverviewData/.test(u) && J) return ok({ jobSummary: '', skills: [], jobTags: J.tags.map(n => ({ name: n })), otherTags: [], businessUnit: { id: 1, name: J.bu } });
    if (/\\/app\\/api\\/notes\\/Find/.test(u) && J) return ok({ pinnedNotes: [], notes: J.notes.map((t, i) => ({ id: i + 1, text: t, createdOn: '2026-11-14T16:00:00' })) });
    if (/\\/Job\\/Index\\//.test(u) && J) return J.rec ? ok(J.rec) : Promise.resolve(new Response('', { status: 403 }));
    if (/\\/app\\/api\\/data\\/user/.test(u)) return ok({ id: 1 });
    return orig(url, o);
  };
  // A stand-in job record: the History section's "Leave a note..." box, shown on #/Job/Index/<n>.
  const page = () => {
    let r = document.getElementById('fake-record');
    const m = /#\\/Job\\/Index\\/(\\d+)/.exec(location.hash);
    if (!m) { if (r) r.remove(); return; }
    if (!r) { r = document.createElement('div'); r.id = 'fake-record'; r.innerHTML = '<h2>History</h2><textarea id="fake-note" placeholder="Leave a note..."></textarea>'; document.body.appendChild(r); }
  };
  window.addEventListener('hashchange', () => setTimeout(page, 300));
}"""

def start(b, name='Andrew'):
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    page.evaluate("n => { localStorage.clear(); localStorage.setItem('stSeenVersion', '9.9'); localStorage.setItem('stExpOpen', '1'); if (n) localStorage.setItem('stReviewName', n); }", name)
    page.evaluate(COPY)
    page.evaluate(STUB, JOBS)
    page.evaluate(TOOLBOX)
    page.locator('#st-toolbox .st-tile', has_text='Job Review').click()
    page.wait_for_selector('#st-rv-go')
    return page, errors

def review(page, job):
    page.fill('#st-rv-job', str(job))
    page.click('#st-rv-go')
    page.wait_for_function("() => document.getElementById('st-rv-go').textContent.indexOf('Reading') < 0", timeout=20000)
    page.wait_for_timeout(100)
def text(page):
    return page.inner_text('#st-toolbox')
def note(page):
    return page.input_value('#st-rv-note')
def tick(page, label):
    page.locator('#st-toolbox label', has_text=label).locator('input').click()

with sync_playwright() as p:
    b = p.chromium.launch()

    # In the menu, under 🧪 Experimental tools, marked Beta.
    page, errors = start(b)
    check(page.locator('#st-exp .st-tile', has_text='Job Review').count() == 1, 'Job Review is under Experimental tools')
    check('BETA' in page.inner_text('#st-exp'), 'it is marked Beta')
    check('ANDREW REVIEWED' in text(page), 'the tag uses the reviewer\'s name')

    # A clean job.
    review(page, 501)
    t = text(page)
    check('Job completed Every visit is Done' in t, 'completed is read from the visits')
    check('Invoice paid Balance $0.00' in t, '$0.00 balance passes')
    check('Tech left notes 1 note' in t, 'the tech\'s note is found')
    check('Pictures on the job 2 pictures' in t, 'pictures are counted')
    check('1 estimate' in t and 'open' not in t.split('Estimates')[1].split('\n')[0], 'a dismissed estimate isn\'t open')
    check('Installed 3 ton unit' in t, 'the notes are shown to read')
    check('Finish your checks' in t, 'not passed until the reviewer checks the pictures and notes')
    check(note(page) == 'Job reviewed, no action needed.', 'the clean note')
    check(not page.locator('#st-rv-kyle').is_visible(), 'no Teams message when nothing is wrong')
    tick(page, 'Pictures can be read'); tick(page, 'Notes read and make sense')
    check('✅ Passes.' in text(page), 'passes once both are checked')
    page.locator('#st-toolbox button', has_text='Mary Beth').click()
    check(note(page) == 'Job reviewed, no action needed. Open estimate, tasked Mary Beth.', 'the estimate task goes in the note')

    # Typing the note into the job record (opens it, never saves).
    page.click('#st-rv-put')
    page.wait_for_function("() => /typed in|Couldn/.test(document.getElementById('st-toolbox').innerText)", timeout=25000)
    check('#/Job/Index/501' in page.url, 'it opens the job record')
    check(page.input_value('#fake-note') == 'Job reviewed, no action needed. Open estimate, tasked Mary Beth.', 'the note is typed into Leave a note...')
    check('Check it, then save it' in text(page), 'it says to check and save')

    # 🏷️ Copy tag.
    page.locator('#st-toolbox button', has_text='Copy tag').click()
    page.wait_for_timeout(100)
    check(page.evaluate("() => window.COPIED.slice(-1)[0]") == 'ANDREW REVIEWED', 'the tag is copied')
    check(errors == [], 'no page errors (clean job): ' + '; '.join(errors))
    page.close()

    # Balance owed with no Requested funds tag, no notes, an open estimate.
    page, errors = start(b)
    review(page, 502)
    t = text(page)
    check('Balance $125.50 and no Requested funds tag' in t, 'a balance without the tag fails')
    check('No notes on the job' in t, 'no notes fails')
    check('1 open' in t and 'Open estimate' in t, 'an open estimate is pointed out')
    check('Failed' in t, 'it says the review failed')
    check(note(page).startswith('Job review, found invoice balance of $125.50 with no funds requested; no tech notes.'), 'the note says what was found: ' + note(page))
    check(note(page).endswith('Sent to Kyle. Job review complete.'), 'the failed note ends like Kyle\'s')
    tick(page, 'Follow-up job not booked')
    check('follow-up job not booked' in note(page), 'a ticked problem goes in the note')
    check(page.locator('#st-rv-kyle').is_visible(), 'Copy Teams message for Kyle shows')
    page.click('#st-rv-kyle'); page.wait_for_timeout(100)
    m = page.evaluate("() => window.COPIED.slice(-1)[0]")
    check('job #502' in m and '- no tech notes' in m and '- follow-up job not booked' in m and 'Andrew' in m, 'the Teams message lists the problems')
    page.fill('#st-rv-note', 'Job review, found no follow up job booked for start up. Job is now booked. Job review complete.')
    tick(page, 'Pictures can be read')
    check(note(page).startswith('Job review, found no follow up'), 'a note you changed isn\'t rewritten')
    check(errors == [], 'no page errors (failed job): ' + '; '.join(errors))
    page.close()

    # Funds requested, already reviewed.
    page, errors = start(b)
    review(page, 503)
    t = text(page)
    check('Balance $15000.00, but it has the Requested funds tag' in t, 'a balance with Requested funds passes')
    check('Already reviewed Has KYLE REVIEWED' in t, 'an already reviewed job says so')
    check(errors == [], 'no page errors (funds requested)')
    page.close()

    # A quote: PC review guessed; the job record can't be read; not completed.
    page, errors = start(b)
    review(page, 504)
    t = text(page)
    check('Sold?' in t and 'Pictures can be read' not in t, 'a quote gets the PC review (no pictures)')
    check('Not every visit is Done' in t, 'not completed fails')
    check('❔ Invoice paid' in t.replace('\n', ' ') or ('❔' in t and 'Couldn\'t read the balance' in t), 'an unreadable balance is ❔, not a pass')
    check('Pictures on the job' not in t, 'no picture check in a PC review')
    page.locator('#st-toolbox button', has_text='Photo review').click()
    check('Pictures can be read' in text(page) and 'Couldn\'t find the pictures' in text(page), 'switching to a photo review adds the picture checks')
    check(errors == [], 'no page errors (quote)')
    page.close()

    # No name yet: asks for it first.
    page, errors = start(b, name='')
    review(page, 501)
    check('Type your first name first' in text(page), 'asks for the reviewer\'s name first')
    page.close()

    b.close()

print('\n' + ('ALL PASSED' if not fails else str(len(fails)) + ' FAILED'))
sys.exit(1 if fails else 0)
