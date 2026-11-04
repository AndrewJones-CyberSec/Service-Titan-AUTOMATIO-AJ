"""🧠 Toolbox AI (Beta), 2.4.

🔎 Explain a job (typed, or picked on the board): what's going on (why a hold is waiting, the price, who
has to say yes, the calls that didn't reach them, texts, a call-back day, the customer's other jobs) and
what to watch out for. It never opens an unread conversation, and never changes anything.
📞 Call script for a hold: filled in with the customer's and your name, the job, the last tech out; the
kind of hold decides it (talking it over, waiting on parts, away...); "How did the call go?" is saved,
and the approach that books the most is picked next time.
⏸️ Holds to call: best first, leaving out "do not call" and 🚫 holds.
📚 Memory: months of schedules read into IndexedDB; Learn again reads only new and recent days, keeps
one record per appointment, drops one taken off a recent day. Holds that leave the Hold list are found
booked or lost. 📥 A CSV report is added once (the same file again adds nothing). 🗑️ Forget everything.
Without IndexedDB it still explains jobs.

Runs on tests/board_ai.html (the fake new board for today, with the Hold list, notes, texts and months
of past schedules).
"""
import sys, pathlib, re, datetime
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_ai.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def ev(page, js, arg=None):
    return page.evaluate(js, arg) if arg is not None else page.evaluate(js)
def start(b, setup=None):
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    ev(page, "() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '9.9'); }")
    if setup: ev(page, setup)
    page.evaluate(TOOLBOX)
    page.locator('#st-toolbox .st-tile', has_text='Toolbox AI').click()
    page.wait_for_selector('#st-ai-go')
    return page, errors
def explain(page, job):
    page.fill('#st-ai-input', str(job))
    page.click('#st-ai-go')
    page.wait_for_function("() => !document.getElementById('st-ai-go').disabled", timeout=30000)
def msg(page):
    return page.inner_text('#st-ai-msg')
def story(page):
    return page.inner_text('#st-ai-out .st-ai-story') if page.locator('#st-ai-out .st-ai-story').count() else ''
def script(page):
    return page.inner_text('#st-ai-out .st-ai-script') if page.locator('#st-ai-out .st-ai-script').count() else ''
def topics(page):
    return ev(page, "() => Array.from(document.querySelectorAll('#st-ai-out .st-ai-chips [data-topic]')).map(c => c.getAttribute('data-topic'))")
def open_mem(page):
    if not page.is_visible('#st-ai-mem'): page.click('#st-ai-mem-head')
def learn(page, months):
    open_mem(page)
    page.select_option('#st-ai-months', str(months))
    page.click('#st-ai-learn')
    page.wait_for_function("() => !document.getElementById('st-ai-learn').disabled && /✓|⚠️|Stopped/.test(document.getElementById('st-ai-mem-msg').textContent)", timeout=60000)
    return page.inner_text('#st-ai-mem-msg')
def holds(page):
    page.click('#st-ai-holds-go')
    page.wait_for_function("() => !document.getElementById('st-ai-holds-go').disabled", timeout=30000)
    return ev(page, "() => Array.from(document.querySelectorAll('#st-ai-holds-out .st-ai-hold')).map(r => r.getAttribute('data-job'))")
# Everything in one of the AI's stores (the page reads its own IndexedDB).
IDB = """store => new Promise(res => { const r = indexedDB.open('stToolboxAI'); r.onsuccess = () => { const d = r.result;
  if (!d.objectStoreNames.contains(store)) { d.close(); return res([]); }
  const q = d.transaction(store, 'readonly').objectStore(store).getAll(); q.onsuccess = () => { res(q.result); d.close(); }; }; r.onerror = () => res(null); })"""
def idb(page, store):
    return ev(page, IDB, store)
def morning_now():
    return datetime.datetime.now().hour < 12

with sync_playwright() as p:
    b = p.chromium.launch()

    # ================= The tool, and a hold explained =================
    page, errors = start(b)
    check(page.inner_text('#st-toolbox').startswith('🧠 Toolbox AI (Beta)'), 'the tile opens 🧠 Toolbox AI (Beta)')
    check(page.is_visible('#st-toolbox .st-ai-beta') and 'never changes a job' in page.inner_text('#st-toolbox .st-ai-beta'), 'it says it\'s Beta and never changes anything by itself')
    explain(page, 8101)
    s = story(page)
    check('⏸️ On hold.' in s and 'created' in s, 'Mary\'s hold: on hold, and when the job was created')
    check('thinking over the $8,900 price' in s and 'talk it over with their husband' in s, 'why it\'s waiting: the $8,900 price, and her husband has a say (%r)' % s[:400])
    check('Called 2 times without reaching them' in s and 'all in the morning' in s, 'the two calls that didn\'t reach her, both in the morning')
    check('Our last text was 2 days ago, and they haven\'t replied' in s, 'our last text (the automatic reminder doesn\'t count) and no reply')
    t = topics(page)
    check(all(k in t for k in ['decide', 'price', 'quote', 'noanswer', 'member', 'access', 'urgent']), 'chips: talking it over, price, quote, hard to reach, club member (its tag), the dog (a customer note), AC not cooling (%s)' % t)
    sc = script(page)
    check('Call script: Talking it over' in sc, 'the script is for a hold being talked over')
    check('Hi Mary, this is Andy with AirSouth.' in sc, 'opener: her first name, yours (from your ServiceTitan login) and the company')
    check('Did you get a chance to talk it over with your husband?' in sc and 'the estimate for your new system' in sc, 'why you\'re calling: the estimate for her new system, and her husband')
    check('"I need to talk to my husband first."' in sc and '"It\'s too much."' in sc, 'answers ready for "my husband" and "too much"')
    check('call back at (601) 847-9941' in sc, 'the voicemail has the number to call back')
    check(ev(page, "() => document.querySelector('#st-ai-out .st-ai-angles button.on').getAttribute('data-angle')") == 'talked', 'the usual approach first (nothing learned yet)')
    nx = msg(page)
    check(('Try another time of day' in nx) if morning_now() else ('Call to book it' in nx), 'next step fits the time of day (%r)' % nx)
    check(ev(page, "() => (window.WRITES || []).length") == 0, 'nothing was changed in ServiceTitan')

    # Unread texts stay unread.
    explain(page, 8105)
    check('unread text' in msg(page) and 'unread text reply' in story(page), 'Eve has an unread reply: read it first')
    check(ev(page, "() => window.msgReads['6015550105'] || 0") == 0, 'her conversation wasn\'t read (it stays unread)')
    # Do not call.
    explain(page, 8104)
    check(msg(page).startswith('🚫 Don\'t call') and script(page) == '', 'Dee\'s summary says do NOT call: no script, it says not to call')
    # Waiting on parts.
    explain(page, 8102)
    check('Check the part is in' in msg(page) and 'make sure the part has come in' in script(page), 'Bob\'s tank is on back order: check the part first')
    check('The part we were waiting on is in' in script(page) and 'Ask for Bob' not in story(page), 'the parts script, and no "ask for" the customer himself')
    check('Last talked with them' in story(page), 'the note "Spoke with Bob" counts as reaching him')
    # Away until a day.
    explain(page, 8103)
    in5 = ev(page, "() => { const d = window.IN5; return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }")
    check('Wait: they asked to hear from us after' in msg(page) and in5 in msg(page) and 'in 5 days' in msg(page), 'Cara is out of town until %s: wait (%r)' % (in5, msg(page)))
    check('away until ' + in5 in story(page) and 'Call script: Away for a while' in script(page), 'away until that day, and the away script')
    # Not found.
    explain(page, 99999)
    check('Couldn\'t find job #99999' in msg(page) and not page.is_visible('#st-ai-out'), 'a job number that isn\'t anywhere says so')
    # A job somewhere else (not on the board or a list): its appointments and job panel.
    explain(page, 8201)
    check('Gus Gone' in page.inner_text('#st-ai-out') and '✅ Done' in story(page) and 'with Mike' in story(page) and 'It\'s done' in msg(page), 'a done job from another day: its customer, tech and status')

    # A job picked on the board.
    page.click('#st-ai-pick')
    ev(page, "() => NB.q('[data-job-appointment-id=\"9801\"]').click()")
    page.wait_for_function("() => document.getElementById('st-ai-input').value === '8001' && !document.getElementById('st-ai-go').disabled && document.getElementById('st-ai-out').style.display !== 'none'", timeout=30000)
    s = story(page)
    check('Scheduled for' in s and 'with Mike' in s and 'Furnace making a loud noise' in s, 'Ann\'s job, clicked on the board: scheduled with Mike, and its summary')
    check('urgent' in topics(page) and 'vulnerable' in topics(page) and script(page) == '', 'no heat and an elderly customer flagged; no call script (it isn\'t a hold)')
    check(ev(page, "() => Array.from(NB.host.shadowRoot.querySelectorAll('style')).some(s => /8001|9801/.test(s.textContent))"), 'the job is outlined on the board')
    check(not errors, 'no page errors (%s)' % errors[:2])

    # ================= 📚 Memory: learning, without copying anything twice =================
    expect3 = ev(page, """() => { const t = new Date(); t.setHours(0, 0, 0, 0); const from = new Date(t.getFullYear(), t.getMonth() - 3, t.getDate()), until = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 30);
      return PAST.filter(a => new Date(a.start) >= from && new Date(a.start) < until).length; }""")
    m = learn(page, 3)
    calls1 = ev(page, "() => NB.pastCalls || 0")
    a1 = idb(page, 'appts')
    check(m.startswith('✓ Read') and len(a1) == expect3, 'Learn (3 months): every appointment in those months and the next 30 days (%d of %d): %r' % (len(a1), expect3, m))
    mary = [x for x in a1 if x['a'] == '70001']
    check(mary and mary[0]['c'] == '90101' and mary[0]['cn'] == 'Mary Smith' and mary[0]['techs'] == ['302'] and mary[0]['tn'].startswith('Quote'), 'kept: the customer, the tech and the job type (%s)' % (mary[:1],))
    check(not any('phone' in k.lower() or 'street' in k.lower() for x in a1 for k in x), 'no phone numbers or street addresses kept')
    m = learn(page, 3)
    calls2 = ev(page, "() => NB.pastCalls || 0")
    a2 = idb(page, 'appts')
    check(len(a2) == len(a1), 'Learn again: nothing kept twice (%d, then %d)' % (len(a1), len(a2)))
    check(0 < calls2 - calls1 < calls1 / 2 and 'already knew weren\'t read again' in m, 'Learn again only reads the new and recent days (%d requests, then %d): %r' % (calls1, calls2 - calls1, m))
    # Taken off a recent day: gone. Taken off an old day: kept (that day isn't read again).
    ev(page, "() => { PAST.splice(PAST.findIndex(a => a.id === 70900), 1); PAST.splice(PAST.findIndex(a => a.id === 70901), 1); }")
    learn(page, 3)
    ids = set(x['a'] for x in idb(page, 'appts'))
    check('70900' not in ids and '70901' in ids, 'an appointment gone from 6 days ago is dropped; one from 40 days ago (settled) stays')
    # Further back: only the older months are read.
    before = ev(page, "() => NB.pastCalls || 0")
    m = learn(page, 12)
    ids = set(x['a'] for x in idb(page, 'appts'))
    check('70002' in ids and '70004' in ids and '70005' in ids, 'Learn 1 year: the older months are added (200, 300 and 100 days ago)')
    days = idb(page, 'days')
    check(len(days) >= 365 and len([d for d in days if d['final']]) >= 340, 'each day is marked read (%d), the settled ones final' % len(days))
    mt = page.inner_text('#st-ai-mem-text')
    check(re.search(r'\d+ appointments for \d+ customers', mt) is not None and 'Last learned today' in mt, 'the memory says what it knows (%r)' % mt[:160])
    check('Memory: ' in page.inner_text('#st-ai-mem-head') and 'learned today' in page.inner_text('#st-ai-mem-head'), 'the memory heading says how much and when')
    explain(page, 8101)
    s, sc = story(page), script(page)
    check('2 other jobs' in s and 'canceled' in s and 'Last tech out: Jake' in s, 'after learning: Mary\'s other jobs, and Jake made the quote (%r)' % s)
    check('Jake was out there on' in sc and 'try to get Jake back out' in sc, 'the offer names Jake, who was out there')
    explain(page, 8001)
    check('Usually Mike (2 visits)' in story(page), 'Ann\'s usual tech, from her past jobs (Old Otto, who left, did one)')

    # ================= ⏸️ Holds to call, and which holds got booked =================
    order = holds(page)
    check(order[:1] == ['8106'] and '8104' not in order and order.index('8103') == len(order) - 1, 'Holds to call: Fay (ready, high priority) first, Cara (wait) last, Dee (do not call) left out (%s)' % order)
    check('left out: the summary says not to call' in page.inner_text('#st-ai-holds-out'), 'it says a hold was left out for "do not call"')
    h = {x['j']: x for x in idb(page, 'holds')}
    check(len(h) == 6 and all(not x.get('out') for x in h.values()) and 'back order' in h['8102']['sum'], 'every hold is watched (with its summary)')
    page.locator('#st-ai-holds-out .st-ai-hold[data-job="8106"] .st-ai-hold-explain').click()
    page.wait_for_function("() => !document.getElementById('st-ai-go').disabled && document.getElementById('st-ai-out').style.display !== 'none'", timeout=30000)
    check('They texted' in msg(page) and 'Tuesday works' in story(page) and 'ready' in topics(page), '🧠 on Fay: answer her text first ("Yes please, Tuesday works"), she\'s ready')
    page.click('#st-ai-out .st-ai-back')
    check(page.is_visible('#st-ai-holds-out') and not page.is_visible('#st-ai-out') and page.locator('#st-ai-holds-out .st-ai-hold').count() == len(order), '← Holds to call goes back to the list')
    ev(page, """() => { HOLDS.splice(HOLDS.findIndex(x => x[1] === 8106), 1); HOLDS.splice(HOLDS.findIndex(x => x[1] === 8102), 1);
      const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0);
      JOB_APPTS[8106] = [{ id: 9906, status: 0, start: t.toISOString() }]; JOB_APPTS[8102] = [{ id: 9902, status: 5, start: t.toISOString() }]; }""")
    holds(page)
    h = {x['j']: x for x in idb(page, 'holds')}
    check(h['8106'].get('out') == 'booked' and h['8102'].get('out') == 'lost' and not h['8101'].get('out'), 'off the Hold list: Fay\'s got booked, Bob\'s canceled (lost), Mary\'s still on hold')

    # ================= 📞 How did the call go? The AI learns which approach books =================
    explain(page, 8101)
    page.click('#st-ai-out .st-ai-angles [data-angle=together]')
    check('set up a time when you\'re both home' in script(page), 'another approach: "both of you there"')
    page.click('#st-ai-out .st-ai-how [data-out=booked]')
    page.wait_for_selector('#st-ai-out .st-ai-after :text("Saved")')
    allc = idb(page, 'calls')
    c = [x for x in allc if x['out'] != 'shown']
    check(any(x['out'] == 'shown' and x['j'] == '8101' and x['angle'] == 'together' for x in allc), 'the approach shown is noted (not as a call)')
    check(len(c) == 1 and c[0]['sit'] == 'decide' and c[0]['angle'] == 'together' and c[0]['out'] == 'booked' and c[0]['by'] == 'Andy', 'saved: a talking-it-over hold, that approach, booked, by Andy')
    explain(page, 8101)
    check(ev(page, "() => document.querySelector('#st-ai-out .st-ai-angles button.on').getAttribute('data-angle')") == 'together', 'next time, the approach that booked is picked')
    check('This approach booked 1 of 1' in script(page) and 'Already called today' in msg(page), 'it says how that approach did, and that she was called today')
    # Not interested → not suggested again.
    explain(page, 8105)
    page.click('#st-ai-out .st-ai-how [data-out=no]')
    page.locator('#st-ai-out .st-ai-after button', has_text='Stop suggesting').click()
    order = holds(page)
    check('8105' not in order and 'marked 🚫 in Tech Router' in page.inner_text('#st-ai-holds-out'), 'a hold marked 🚫 after "not interested" isn\'t on the list any more')
    check(ev(page, "() => Object.keys(JSON.parse(localStorage.getItem('stRouterSkipHolds') || '{}'))") == ['8105'], 'it\'s on Tech Router\'s 🚫 list too')

    # ================= 📥 Outside data: a CSV report =================
    rows = ['Jobs report,,,,,,,,,', 'Job #,Customer Name,Customer ID,Job Type,Job Status,Hold Reason,Job Summary,Created Date,Completed Date,Jobs Total,Phone']
    for i in range(30):
        central = i < 15
        booked = (i % 5 != 0) if central else (i % 5 == 0)
        rows.append('%d,Rep Customer %d,%d,%s,%s,%s,"%s",10/%d/2025,%s,$%s,601-555-12%02d' % (
            500000 + i, i, 80000 + i, 'Quote - HVAC - Central Home System' if central else 'Quote - Generator', 'Completed' if booked else 'Canceled',
            'Financing' if central else 'Price too high', 'Waiting on financing, then install' if central else 'Too expensive, shopping around', 1 + i % 28,
            '11/%d/2025' % (1 + i % 28) if booked else '', '8,%03d.00' % i, i))
    rows.append('6001,Mary Smith,90101,Install - HVAC,Completed,,"New system, ""18 SEER"", two zones",3/2/2024,3/9/2024,"$8,200.00",601-555-0101')
    rows.append(',No Number,1,Service,Completed,,,,,,')
    csv = '\n'.join(rows).encode()
    open_mem(page)
    page.set_input_files('#st-ai-csv', files=[{'name': 'jobs.csv', 'mimeType': 'text/csv', 'buffer': csv}])
    page.wait_for_function("() => /jobs.csv:/.test(document.getElementById('st-ai-mem-msg').textContent)", timeout=15000)
    m1 = page.inner_text('#st-ai-mem-msg')
    check('31 jobs' in m1 and '31 new, 0 updated, 0 already known' in m1 and '1 row without a job number' in m1, 'the report is added: 31 jobs, the title row above the header skipped, a row without a job number left out (%r)' % m1)
    page.set_input_files('#st-ai-csv', files=[{'name': 'jobs.csv', 'mimeType': 'text/csv', 'buffer': csv}])
    page.wait_for_function("() => /already known/.test(document.getElementById('st-ai-mem-msg').textContent) && /0 new/.test(document.getElementById('st-ai-mem-msg').textContent)", timeout=15000)
    check('0 new, 0 updated, 31 already known' in page.inner_text('#st-ai-mem-msg'), 'the same report again adds nothing')
    j = {x['j']: x for x in idb(page, 'jobs')}
    check(j['6001']['sum'] == 'New system, "18 SEER", two zones' and j['6001']['total'] == 8200 and j['6001']['c'] == '90101', 'quotes, commas and money read right')
    check('555-12' not in str(j) and '555-0101' not in str(j), 'phone numbers in the report aren\'t kept')
    explain(page, 8101)
    s = story(page)
    check('3 other jobs' in s, 'Mary\'s install from the report is one of her other jobs (%r)' % s)
    check('🔮 Chance it books: about' in s and '📊 Quote - HVAC - Central Home System:' in s, 'with the report\'s holds, it gives a chance this one books, and how holds like it went')
    holds(page)
    check('🔮' in page.inner_text('#st-ai-holds-out') and 'Chances are learned from' in page.inner_text('#st-ai-holds-out'), 'Holds to call shows the chances too')

    # ================= ⚙️ Settings =================
    page.click('#st-toolbox button:has-text("⚙️ Call script")')
    page.fill('#st-ai-settings input[data-key=stAiName]', 'Sam')
    page.dispatch_event('#st-ai-settings input[data-key=stAiName]', 'change')
    page.check('#st-ai-settings input[data-key=stAiFinance]')
    explain(page, 8101)
    check('this is Sam with AirSouth' in script(page) and 'We do offer financing' in script(page), 'your name and "we offer financing" from ⚙️ go into the script')

    # ================= 🗑️ Forget everything =================
    open_mem(page)
    page.click('#st-ai-forget')
    page.click('#st-toolbox button:has-text("Yes, forget it all")')
    page.wait_for_function("() => /Forgotten/.test(document.getElementById('st-ai-mem-msg').textContent)", timeout=15000)
    page.wait_for_function("() => /nothing learned yet/.test(document.getElementById('st-ai-mem-head').textContent)", timeout=15000)
    check(len(idb(page, 'appts')) == 0 and len(idb(page, 'calls')) == 0, 'everything it learned is gone')
    check(ev(page, "() => (window.WRITES || []).length") == 0, 'nothing was ever changed in ServiceTitan')
    check(not errors, 'no page errors (%s)' % errors[:2])

    # The reading, for other tools.
    r = ev(page, "() => { const r = window.__stToolbox.read('Customer will call us back next week. Not interested in the $12,500 system.', new Date(2026, 10, 2)); return [r.topics.map(t => t.key), r.amounts.map(a => a.n), r.when && r.when.at.getDate()]; }")
    check('callback' in r[0] and 'lost' in r[0] and r[1] == [12500] and r[2] == 9, 'window.__stToolbox.read: a call back next week, not interested, $12,500 (%s)' % r)
    # Opening the Toolbox again comes back to the AI.
    ev(page, "() => window.__stToolbox.close()")
    page.wait_for_function("() => !window.__stToolbox && !document.getElementById('st-toolbox')", timeout=5000)
    page.evaluate(TOOLBOX)
    check(page.inner_text('#st-toolbox').startswith('🧠 Toolbox AI (Beta)'), 'closed and opened again, it comes back to the AI')
    check(not errors, 'no page errors after closing (%s)' % errors[:2])
    page.close()

    # ================= 👎 Teaching it, crediting calls on their own, the best time to call =================
    page, errors = start(b, """() => {
      HOLDS.push([9907, 8107, 'Gil General', 90107, 'Service - HVAC', 31, 'Customer called about the system. Do not solicit.', 5, 'Normal', []]);
      HOLDS.push([9908, 8108, 'Hal Husband', 90108, 'Quote - Water Heater', 13, 'Needs to talk it over with his wife.', 7, 'Normal', []]);
      HOLDS.push([9909, 8109, 'Ivy Refund', 90109, 'Repair - Plumbing - Drain', 22, 'Customer is waiting on tax refund before booking.', 8, 'Normal', []]);
      HOLDS.push([9910, 8110, 'Joe Refund', 90110, 'Repair - Plumbing - Drain', 22, 'Same as before: waiting on TAX refund.', 2, 'Normal', []]);
      HOLDS.push([9911, 8111, 'Kim Kind', 90111, 'Service - HVAC', 31, 'Customer called about the system.', 3, 'Normal', []]);
    }""")
    explain(page, 8101)
    page.click('#st-ai-out .st-ai-teach-open')
    check(page.is_visible('#st-ai-out .st-ai-teach'), '👎 Something\'s wrong? opens Teach it')
    page.click('#st-ai-out .st-ai-teach-not[data-topic=urgent]')
    page.fill('#st-ai-out .st-ai-teach-not-phrase', 'not cooling upstairs')
    page.click('#st-ai-out .st-ai-teach-not-save')
    page.wait_for_function("() => /Learned/.test((document.getElementById('st-ai-teach-msg') || {}).textContent || '')", timeout=10000)
    check('urgent' not in topics(page) and 'decide' in topics(page), '✕ on "no heat or AC": taught that "not cooling upstairs" isn\'t urgent, and it\'s gone (%s)' % topics(page))
    check('doesn\'t mean No heat or AC' in page.inner_text('#st-ai-teach-msg'), 'it says what it learned (%r)' % page.inner_text('#st-ai-teach-msg'))
    check('💛 Show you care' not in script(page), 'the script follows: no "show you care" line now')
    explain(page, 8101)
    check('urgent' not in topics(page), 'the lesson stays (explained again)')
    # A phrase it missed.
    explain(page, 8109)
    check('price' not in topics(page) and 'Book the hold' in script(page), 'Ivy is waiting on a tax refund: it doesn\'t know that yet')
    page.click('#st-ai-out .st-ai-teach-open')
    page.select_option('#st-ai-teach-sen', index=0)
    page.select_option('#st-ai-teach-topic', 'price')
    page.fill('#st-ai-teach-phrase', 'waiting refund')
    page.click('#st-ai-teach-save')
    check('aren\'t in that sentence' in page.inner_text('#st-ai-teach-msg') and 'price' not in topics(page), 'words that aren\'t side by side in the sentence are refused')
    page.fill('#st-ai-teach-phrase', 'waiting on tax refund')
    page.click('#st-ai-teach-save')
    page.wait_for_function("() => /Learned/.test((document.getElementById('st-ai-teach-msg') || {}).textContent || '')", timeout=10000)
    check('price' in topics(page) and 'Call script: Thinking it over' in script(page), 'taught: "waiting on tax refund" means thinking over the price, and the script follows')
    check('📖' in page.inner_text('#st-ai-out .st-ai-chips'), 'the chip says you taught it that')
    explain(page, 8110)
    check('price' in topics(page), 'and another job saying "waiting on TAX refund" is read the same way')
    # Don't call, taught: the AI and Tech Router both leave it out.
    explain(page, 8107)
    check('Don\'t call' not in msg(page), 'Gil\'s summary says "Do not solicit": not read as don\'t call yet')
    page.click('#st-ai-out .st-ai-teach-open')
    sens = ev(page, "() => Array.from(document.querySelectorAll('#st-ai-teach-sen option')).map(o => o.textContent)")
    page.select_option('#st-ai-teach-sen', index=[i for i, t in enumerate(sens) if 'solicit' in t][0])
    page.select_option('#st-ai-teach-topic', 'nocall')
    page.fill('#st-ai-teach-phrase', 'do not solicit')
    page.click('#st-ai-teach-save')
    page.wait_for_function("() => /Learned/.test((document.getElementById('st-ai-teach-msg') || {}).textContent || '')", timeout=10000)
    check(msg(page).startswith('🚫 Don\'t call') and script(page) == '', 'taught "do not solicit" means don\'t call: no script now')
    order = holds(page)
    check('8107' not in order, 'and ⏸️ Holds to call (Tech Router\'s reading) leaves Gil out (%s)' % order)
    lessons = ev(page, "() => JSON.parse(localStorage.getItem('stAiTaught'))")
    check(len(lessons) == 3 and {(l['topic'], l['not']) for l in lessons} == {('urgent', True), ('price', False), ('nocall', False)}, 'three lessons saved in this browser')
    # ↩ takes one back.
    explain(page, 8101)
    page.click('#st-ai-out .st-ai-teach-open')
    page.click('#st-ai-out .st-ai-lessons button')
    lid = [l['id'] for l in lessons if l['topic'] == 'urgent'][0]
    page.click('#st-ai-out .st-ai-lesson[data-id="%s"] button' % lid)
    page.wait_for_function("() => /Forgotten/.test((document.getElementById('st-ai-teach-msg') || {}).textContent || '')", timeout=10000)
    check('urgent' in topics(page) and len(ev(page, "() => JSON.parse(localStorage.getItem('stAiTaught'))")) == 2, '↩ forgets a lesson: no heat or AC is back')

    # Credit on their own: Eve's hold is booked after you were shown "Checking in" (nobody tapped anything).
    explain(page, 8105)
    page.click('#st-ai-out .st-ai-angles [data-angle=checkin]')
    # Hal's: you said "call back later", then it got booked.
    explain(page, 8108)
    page.click('#st-ai-out .st-ai-how [data-out=later]')
    page.wait_for_selector('#st-ai-out .st-ai-after :text("Saved")')
    holds(page)
    ev(page, """() => { const t = new Date(); t.setDate(t.getDate() + 2); t.setHours(9, 0, 0, 0);
      [8105, 8108].forEach(j => { HOLDS.splice(HOLDS.findIndex(x => x[1] === j), 1); JOB_APPTS[j] = [{ id: j + 1800, status: 0, start: t.toISOString() }]; }); }""")
    holds(page)
    h = {x['j']: x for x in idb(page, 'holds')}
    check(h['8105'].get('out') == 'booked' and h['8108'].get('out') == 'booked', 'Eve\'s and Hal\'s holds were booked')
    explain(page, 8101)
    check(ev(page, "() => document.querySelector('#st-ai-out .st-ai-angles button.on').getAttribute('data-angle')") == 'talked' and 'This approach booked 1 of 1' in script(page) and 'counted on its own' in script(page),
          'Hal\'s "call back later" turned into a booking: Did you talk it over? booked 1 of 1, counted on its own (%r)' % script(page)[:300])
    explain(page, 8104)   # do not call: no script, so nothing is shown
    explain(page, 8103)
    explain(page, 8102)
    # Another plain hold (Kim's): "Checking in" booked Eve's, so it's picked.
    explain(page, 8111)
    check(ev(page, "() => document.querySelector('#st-ai-out .st-ai-angles button.on').getAttribute('data-angle')") == 'checkin' and 'counted on its own' in script(page),
          'Eve got booked after you were shown "Checking in" (no tap): it\'s picked for the next plain hold')
    check(len([x for x in idb(page, 'calls') if x['out'] != 'shown']) == 1, 'scripts shown aren\'t counted as calls (one call logged)')

    # The best time to call: when customers pick up, and when this one did.
    ev(page, """() => new Promise(res => { const r = indexedDB.open('stToolboxAI'); r.onsuccess = () => { const d = r.result, t = d.transaction('calls', 'readwrite'), st = t.objectStore('calls'), at = Date.now() - 3 * 86400000;
      for (let i = 0; i < 10; i++) st.put({ j: '1', sit: 'zz', angle: 'x', out: i < 9 ? 'later' : 'vm', hour: 16, at });
      for (let i = 0; i < 8; i++) st.put({ j: '2', sit: 'zz', angle: 'x', out: i < 1 ? 'later' : 'vm', hour: 9, at });
      t.oncomplete = () => { d.close(); res(); }; }; })""")
    explain(page, 8102)
    s = story(page)
    # (Hal's "call back later", above, counts too: at this hour.)
    check(re.search(r'Customers pick up most in the afternoon \(3–6\): (9 of 10|10 of 11) calls; mornings (1 of 8|2 of 9)', s) is not None, 'from the calls logged: customers pick up most in the afternoon (%r)' % s)
    check('They picked up in the middle of the day (12–3) last time' in s, 'Bob picked up in the middle of the day last time ("Spoke with Bob" at 2 PM)')
    nx = msg(page)
    check('Check the part is in' in nx, 'the next step for Bob is still the part (%r)' % nx)
    order = holds(page)
    check('Customers pick up most in the afternoon' in page.inner_text('#st-ai-holds-out .st-ai-pickup'), '⏸️ Holds to call says when customers pick up')
    explain(page, 8101)
    nx = msg(page)
    now_h = datetime.datetime.now().hour
    if now_h < 12:
        check('Try in the afternoon (3–6): customers pick up most then (9 of 10 calls)' in nx, 'Mary\'s morning calls didn\'t reach her: try in the afternoon (%r)' % nx)
    else:
        check('Call to book it' in nx, 'no call has missed Mary at this time of day: call (%r)' % nx)
    check(not errors, 'no page errors (%s)' % errors[:2])
    page.close()

    # ================= ⏸️ Holds to call: 📍 areas, 🔎 filters, 📌 saved filters =================
    page, errors = start(b)
    def rows(page):
        return ev(page, "() => Array.from(document.querySelectorAll('#st-ai-holds-out .st-ai-hold')).map(r => r.getAttribute('data-job'))")
    def tap(page, sel):
        page.click(sel)
        page.wait_for_timeout(50)
    order = holds(page)
    check(order == ['8106', '8101', '8102', '8105', '8103'] and page.is_visible('#st-ai-filter-all') and page.is_visible('#st-ai-filter-go'), 'Holds to call has All holds and 🔎 Filter above the list (%s)' % order)
    tap(page, '#st-ai-filter-go')
    check(page.is_visible('#st-ai-filter') and page.is_visible('#st-ai-area-new'), '🔎 Filter opens, with ＋ New area')
    # 🔴 Red: Mendenhall (written MENDENHALL on one hold and Mendenhall on another: the same city).
    tap(page, '#st-ai-area-new')
    page.fill('#st-ai-area-name', 'Red')
    page.select_option('#st-ai-area-color', 'red')
    check(ev(page, "() => Array.from(document.querySelectorAll('#st-ai-holds-out .st-ai-area-edit input[data-city]')).map(c => c.getAttribute('data-city')).join(',')") == 'florence,magee,mendenhall,pinola', 'the cities on the Hold list to pick from (one Mendenhall)')
    page.check('#st-ai-holds-out .st-ai-area-edit input[data-city="mendenhall"]')
    tap(page, '#st-ai-area-save')
    check('🔴 Red (2)' in page.inner_text('#st-ai-filter [data-area="Red"]') and 'Red saved' in msg(page), 'area 🔴 Red saved, with its 2 holds')
    tap(page, '#st-ai-filter [data-area="Red"]')
    check(rows(page) == ['8102', '8105'] and '2 of 5 holds' in page.inner_text('#st-ai-filter-count'), 'only Red\'s holds: Bob and Eve (%s)' % rows(page))
    check(ev(page, "() => document.querySelectorAll('#st-ai-holds-out .st-ai-hold [data-area]').length") == 2, 'each shows its 🔴 Red chip')
    # 🟡 Yellow: a zip code typed in.
    tap(page, '#st-ai-area-new')
    page.fill('#st-ai-area-name', 'Yellow')
    page.select_option('#st-ai-area-color', 'yellow')
    page.fill('#st-ai-area-more', '39073')
    tap(page, '#st-ai-area-save')
    tap(page, '#st-ai-filter [data-area="Yellow"]')
    check(rows(page) == ['8102', '8105', '8103'], 'Red or Yellow: Bob, Eve and Cara (the zip code typed in) (%s)' % rows(page))
    # Job types, a whole family.
    tap(page, '#st-ai-filter-clear')
    tap(page, '#st-ai-filter [data-fam="Quote"]')
    check(rows(page) == ['8106', '8101', '8103'], 'every Quote: Fay, Mary, Cara (%s)' % rows(page))
    tap(page, '#st-ai-filter [data-area="Red"]')
    check(rows(page) == [] and 'No holds match' in page.inner_text('#st-ai-holds-out') and 'No holds match' in msg(page), 'Red and Quotes together: none, and it says so')
    # What it's waiting on, tags, priority, age.
    tap(page, '#st-ai-filter-clear')
    tap(page, '#st-ai-filter [data-kind="parts"]')
    check(rows(page) == ['8102'], 'waiting on parts: Bob (%s)' % rows(page))
    tap(page, '#st-ai-filter-clear')
    tap(page, '#st-ai-filter [data-tag="RED ZONE"]')
    check(rows(page) == ['8102', '8105'], 'the tag RED ZONE: Bob and Eve (%s)' % rows(page))
    check(ev(page, "() => getComputedStyle(document.querySelector('#st-ai-filter [data-tag=\"Total Care Club Member\"]')).backgroundColor") == 'rgb(214, 245, 214)', 'tags show in their ServiceTitan colors')
    tap(page, '#st-ai-filter-clear')
    tap(page, '#st-ai-filter [data-prio="1"]')
    check(rows(page) == ['8106'], 'high or urgent only: Fay (%s)' % rows(page))
    tap(page, '#st-ai-filter-clear')
    tap(page, '#st-ai-filter [data-age="mid"]')
    check(rows(page) == ['8101', '8102', '8103'], '1 to 4 weeks old: Mary, Bob, Cara (%s)' % rows(page))
    # 📌 Saved filters.
    tap(page, '#st-ai-filter-clear')
    tap(page, '#st-ai-filter [data-area="Red"]')
    page.fill('#st-ai-view-name', 'Red area')
    tap(page, '#st-ai-view-save')
    check(page.locator('#st-ai-holds-out .st-ai-view[data-view="Red area"]').count() == 1, '📌 Red area saved as a button above the list')
    tap(page, '#st-ai-filter-all')
    check(len(rows(page)) == 5, 'All holds: every one again')
    tap(page, '#st-ai-holds-out .st-ai-view[data-view="Red area"]')
    check(rows(page) == ['8102', '8105'], 'one click on 📌 Red area: Red\'s holds')
    explain(page, 8102)
    check(page.locator('#st-ai-out .st-ai-head .st-ai-areas [data-area]').count() == 1 and '🔴 Red' in page.inner_text('#st-ai-out .st-ai-head'), 'Bob\'s write-up shows he\'s in 🔴 Red')
    # Kept: closed and opened again.
    ev(page, "() => window.__stToolbox.close()")
    page.wait_for_function("() => !document.getElementById('st-toolbox')", timeout=5000)
    page.evaluate(TOOLBOX)
    holds(page)
    check(rows(page) == ['8102', '8105'] and '2 of 5 holds' in page.inner_text('#st-ai-filter-count') and page.locator('#st-ai-holds-out .st-ai-view[data-view="Red area"]').count() == 1, 'opened again: the filter in use, the saved filter and the areas are kept')
    # Changing an area changes the filters that use it; deleting one leaves the rest.
    tap(page, '#st-ai-filter-go')
    tap(page, '#st-ai-filter [data-area-edit="Red"]')
    page.fill('#st-ai-area-more', 'Magee')
    tap(page, '#st-ai-area-save')
    check(rows(page) == ['8101', '8102', '8105'], 'Magee added to Red: Mary is in it too (Dee, in Magee, still says not to call) (%s)' % rows(page))
    tap(page, '#st-ai-filter [data-area-edit="Yellow"]')
    tap(page, '#st-ai-area-delete')
    check(page.locator('#st-ai-filter [data-area="Yellow"]').count() == 0 and rows(page) == ['8101', '8102', '8105'], 'Yellow deleted; Red still filters')
    check(ev(page, "() => (window.WRITES || []).length") == 0 and not errors, 'nothing changed in ServiceTitan, no page errors (%s)' % errors[:2])
    page.close()

    # ================= No IndexedDB (a private window, blocked site data) =================
    page, errors = start(b, "() => { Object.defineProperty(window, 'indexedDB', { configurable: true, get() { throw new Error('blocked'); } }); }")
    explain(page, 8101)
    check('thinking over the $8,900 price' in story(page) and 'Hi Mary' in script(page), 'without IndexedDB it still explains a hold and gives its script')
    check('memory is off' in page.inner_text('#st-ai-out'), 'and says its memory is off')
    open_mem(page)
    page.wait_for_function("() => /off in this browser/.test(document.getElementById('st-ai-mem-head').textContent)", timeout=5000)
    check(page.is_disabled('#st-ai-learn'), 'Learn can\'t be pressed')
    order = holds(page)
    check(order[:1] == ['8106'], 'Holds to call still works (%s)' % order)
    check(not errors, 'no page errors (%s)' % errors[:2])
    page.close()

    # ================= The Hold list can't be read =================
    page, errors = start(b, "() => { window.HOLD_DOWN = true; }")
    holds(page)
    check('Couldn\'t read the Hold list' in msg(page), 'the Hold list down: it says so')
    explain(page, 8001)
    check('Scheduled for' in story(page), 'a job on the board is still explained')
    check(not errors, 'no page errors (%s)' % errors[:2])
    page.close()
    b.close()

print('\n%d failed' % len(fails) if fails else '\nAll passed')
sys.exit(1 if fails else 0)
