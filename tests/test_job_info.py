"""📋 Quick Job Info, 2.5 (it replaced 🧠 Toolbox AI).

A job looked up (typed, picked on the board with 🖱️, which is on by itself and stays on, or opened from
the ⏸️ Holds tab): a card with what to do next, the watch-outs (🚫 don't call, 📵 hard to reach from the
call log, ☎️ they called us, 💬 texts back, 🗓️ another job booked, 🔥, 🧓 from a tag…), the hold or
appointment, address (Google Maps) and phones, the whole summary, the notes, and the customer's history
read from their customer page's data (other jobs, calls, club, lifetime total, equipment). Buttons open
📱 Customer Texts, 🔀 Move Jobs and 🧭 Tech Router with the job; 📋 Copy job info copies it all. Unread
conversations stay unread; nothing is ever changed.
⏸️ Holds: best first, "do not call" and 🚫 holds left out, each hold's call log read for 📵 / ☎️; holds that
leave the list are found booked or lost from the customer's job list. 🔎 Filter, 📍 areas, 📌 saved
filters (shared with 📱 Customer Texts). 📥 A CSV report teaches the 🔮 chances. 👎 Teaching phrases
(and Tech Router uses the "don't call" ones). 🗑️ Forget. Without IndexedDB it still works.

Runs on tests/board_ai.html (the fake new board for today, with the Hold list, notes, texts, past
schedules and each customer's jobs, calls, memberships and equipment).
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
# Copies land in window.COPIED (the page's clipboard, stood in for).
COPY = "() => { window.COPIED = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: t => { window.COPIED.push(t); return Promise.resolve(); } } }); }"
def start(b, setup=None):
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    ev(page, "() => { localStorage.clear(); localStorage.setItem('stSeenVersion', '9.9'); }")
    ev(page, COPY)
    if setup: ev(page, setup)
    page.evaluate(TOOLBOX)
    page.locator('#st-toolbox .st-tile', has_text='Quick Job Info').click()
    page.wait_for_selector('#st-ai-go')
    return page, errors
def explain(page, job):
    page.click('#st-ai-tab-job')
    page.fill('#st-ai-input', str(job))
    page.click('#st-ai-go')
    page.wait_for_function("() => !document.getElementById('st-ai-go').disabled", timeout=30000)
def msg(page):
    return page.inner_text('#st-ai-msg')
def nxt(page):
    return page.inner_text('#st-ai-out .st-ai-next') if page.locator('#st-ai-out .st-ai-next').count() else ''
def sec(page, cls):
    return page.inner_text('#st-ai-out .' + cls) if page.locator('#st-ai-out .' + cls).count() else ''
def story(page):
    return sec(page, 'st-ai-story')
def card(page):
    return page.inner_text('#st-ai-out') if page.is_visible('#st-ai-out') else ''
def topics(page):
    return ev(page, "() => Array.from(document.querySelectorAll('#st-ai-out .st-ai-chips [data-topic]')).map(c => c.getAttribute('data-topic'))")
def open_mem(page):
    if not page.is_visible('#st-ai-mem'): page.click('#st-ai-mem-head')
def holds(page):
    page.click('#st-ai-holds-go')
    page.wait_for_function("() => !/Reading the Hold list/.test(document.getElementById('st-ai-msg').textContent)", timeout=30000)
    return ev(page, "() => Array.from(document.querySelectorAll('#st-ai-holds-out .st-ai-hold')).map(r => r.getAttribute('data-job'))")
def hold_topics(page, job):
    return ev(page, "j => Array.from(document.querySelectorAll('#st-ai-holds-out .st-ai-hold[data-job=\"' + j + '\"] [data-topic]')).map(c => c.getAttribute('data-topic'))", str(job))
IDB = """store => new Promise(res => { const r = indexedDB.open('stToolboxAI'); r.onsuccess = () => { const d = r.result;
  if (!d.objectStoreNames.contains(store)) { d.close(); return res([]); }
  const q = d.transaction(store, 'readonly').objectStore(store).getAll(); q.onsuccess = () => { res(q.result); d.close(); }; }; r.onerror = () => res(null); })"""
def idb(page, store):
    return ev(page, IDB, store)
def morning_now():
    return datetime.datetime.now().hour < 12

with sync_playwright() as p:
    b = p.chromium.launch()

    # ================= A hold, everything about it =================
    page, errors = start(b)
    check(page.inner_text('#st-toolbox').startswith('📋 Quick Job Info'), 'the tile opens 📋 Quick Job Info')
    check(page.inner_text('#st-ai-pick') == '🖱️ On' and 'Click any job on the board' in msg(page), '🖱️ picking is on by itself on the board')
    explain(page, 8101)
    h = sec(page, 'st-ai-head')
    check('#8101 Mary Smith' in h and 'Quote - HVAC - Central Home System' in h and 'Mendenhall Branch' in h and '⏸️ Hold' in h and 'Total Care Club Member' in h, 'the top: job, customer, type, branch, on hold, its tag (%r)' % h)
    check(nxt(page).startswith('🗓️ They already have Install - HVAC - Standard booked for') and '#7999' in nxt(page), 'what to do next: she already has an install booked, so check the hold is still needed (%r)' % nxt(page))
    check(msg(page) == '', 'the message line stays empty while a card shows (no repeat of the banner)')
    t = topics(page)
    check(all(k in t for k in ['hard', 'booked', 'decide', 'price', 'quote', 'member', 'access', 'urgent', 'vulnerable']) and t.count('hard') == 1 and 'noanswer' not in t,
          'chips: 📵 hard to reach (once), another job booked, talking it over, price, quote, club member, the dog, AC not cooling, elderly (her customer tag) (%s)' % t)
    s = story(page)
    check('thinking over the $8,900 price' in s and 'talk it over with their husband' in s, 'why it\'s waiting: the $8,900 price, and her husband has a say')
    check('3 tries without reaching them since we last spoke' in s and 'all in the morning' in s, 'from the call log: 3 short calls since the last real talk, all in the morning (%r)' % s)
    check('Our last text was 2 days ago, and they haven\'t replied' in s, 'our last text (the automatic reminder doesn\'t count) and no reply')
    ap = sec(page, 'st-ai-appt')
    check('Hold reason: Customer thinking it over' in ap and 'Last tech out: Jake' in ap and 'Campaign: Google' in ap, 'the hold: its reason, Jake (the quote visit), the campaign (%r)' % ap)
    ct = sec(page, 'st-ai-contact')
    check('9901 Oak Ave, Magee, MS 39111' in ct and '(601) 555-0101' in ct and 'mobile' in ct, 'address and her mobile number')
    check('google.com/maps' in ev(page, "() => document.querySelector('#st-ai-out .st-ai-contact a').href"), 'the address opens Google Maps')
    check('AC not cooling upstairs. Went over replacement options.' in sec(page, 'st-ai-summary'), 'the whole summary')
    notes = ev(page, "() => Array.from(document.querySelectorAll('#st-ai-out .st-ai-note')).map(n => n.textContent)")
    check(len(notes) == 4 and 'Called, no answer' in notes[0] and 'Dog in the back yard' in notes[3], 'all 4 notes, newest first (%s)' % [n[:30] for n in notes])
    cu = sec(page, 'st-ai-customer')
    check('$4,120.50 lifetime' in cu and '4 jobs in all' in cu and '1 canceled' in cu, 'the customer: jobs in all, lifetime total, canceled ones (%r)' % cu)
    check('Club: Total Care Club Monthly' in cu and 'Old Club' not in cu, 'her active club (not the old, ended one)')
    check('Trane XR14 AC' in cu and '12 years old' in cu, 'the equipment there, and how old it is')
    if page.inner_text('#st-ai-out .st-ai-past button').startswith('▸'): page.click('#st-ai-out .st-ai-past button')
    past = sec(page, 'st-ai-past')
    check(page.inner_text('#st-ai-out .st-ai-past button').startswith('▾'), 'three other jobs or fewer show open')
    check('#7999 Install - HVAC - Standard · Scheduled · Jake' in past and '#7102 Service - HVAC · Canceled' in past and '#8101' not in past, 'her other jobs, from her customer page\'s list (%r)' % past)
    reads = ev(page, "() => window.custReads || []")
    check(all(x in reads for x in ['searchJobs:90101', 'searchCalls:90101', 'searchMemberships:90101']), 'her history is read by itself, nothing to press (%s)' % reads)
    page.click('#st-ai-out .st-ai-calls button')
    check(page.inner_text('#st-ai-out .st-ai-calls').count('likely no answer') == 3, 'the calls, the short ones marked likely no answer')
    page.click('#st-ai-out .st-ai-copy')
    page.wait_for_function("() => window.COPIED.length", timeout=5000)
    cp = ev(page, "() => window.COPIED[0]")
    check(cp.startswith('#8101 Mary Smith — Quote - HVAC') and 'Address: 9901 Oak Ave' in cp and 'Phone: (601) 555-0101 (mobile)' in cp and 'Watch out:' in cp and 'Next:' in cp, '📋 Copy job info copies the card as plain text (%r)' % cp[:300])
    check(ev(page, "() => (window.WRITES || []).length") == 0, 'nothing was changed in ServiceTitan')

    # Without the other booked job: hard to reach, so try another time of day (or call).
    ev(page, "() => { delete EXTRA_JOBS[90101]; }")
    explain(page, 8101)
    n = nxt(page)
    check(('Try another time of day' in n) if morning_now() else ('Call to book it' in n), 'next step fits the time of day (%r)' % n)
    ev(page, "() => { const d = new Date(); d.setMinutes(d.getMinutes() - 30); CALLS[90101].push({ createdOn: d.toISOString(), duration: 18, direction: 1, agentName: 'Andy D' }); }")
    explain(page, 8101)
    check(nxt(page).startswith('📞 Already called today'), 'a call to her earlier today: try another day (%r)' % nxt(page))

    # Unread texts stay unread.
    explain(page, 8105)
    check('unread text' in nxt(page) and 'unread text reply' in story(page), 'Eve has an unread reply: read it first')
    check(ev(page, "() => window.msgReads['6015550105'] || 0") == 0, 'her conversation wasn\'t read (it stays unread)')
    explain(page, 8104)
    check(nxt(page).startswith('🚫 Don\'t call'), 'Dee\'s summary says do NOT call')
    explain(page, 8102)
    check('Check the part is in' in nxt(page) and 'Last spoke with them' in story(page) and 'hard' not in topics(page), 'Bob: check the part first; we spoke 4 days ago (a 5-minute call), not hard to reach')
    explain(page, 8103)
    in5 = ev(page, "() => window.IN5.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })")
    check('Wait: they asked to hear from us after' in nxt(page) and in5 in nxt(page), 'Cara is out of town until %s: wait' % in5)
    explain(page, 8106)
    check('They texted' in nxt(page) and 'called' in topics(page) and 'texts' in topics(page) and 'They called us yesterday' in story(page), 'Fay: answer her text; she called us yesterday and texts back (%s)' % topics(page))
    explain(page, 99999)
    check('Couldn\'t find job #99999' in msg(page) and not page.is_visible('#st-ai-out'), 'a job number that isn\'t anywhere says so')
    explain(page, 8201)
    check('Gus Gone' in card(page) and '✅ Done' in story(page) and 'with Mike' in story(page) and 'Total: $189' in sec(page, 'st-ai-appt'), 'a done job from another day: customer, tech, status, total')

    # Picked on the board: 🖱️ stays on, so one job then the next.
    ev(page, "() => NB.q('[data-job-appointment-id=\"9801\"]').click()")
    page.wait_for_function("() => document.getElementById('st-ai-input').value === '8001' && !document.getElementById('st-ai-go').disabled && document.getElementById('st-ai-out').style.display !== 'none'", timeout=30000)
    s = story(page)
    check('Scheduled for' in s and 'with Mike' in s and 'Furnace making a loud noise' in sec(page, 'st-ai-summary'), 'Ann\'s job, clicked on the board: scheduled with Mike, and its summary')
    check('urgent' in topics(page) and 'vulnerable' in topics(page) and page.inner_text('#st-ai-pick') == '🖱️ On', 'no heat and elderly flagged, and 🖱️ is still on for the next click')
    check('Usually Mike' in sec(page, 'st-ai-customer') and '$980 lifetime' in sec(page, 'st-ai-customer'), 'Ann usually gets Mike')
    check(ev(page, "() => Array.from(NB.host.shadowRoot.querySelectorAll('style')).some(s => /8001|9801/.test(s.textContent))"), 'the job is outlined on the board')
    # The buttons open the other tools with the job.
    page.click('#st-ai-out .st-ai-act-move')
    check(page.inner_text('#st-toolbox').startswith('🔀 Move Jobs') and '#8001' in page.inner_text('#st-toolbox'), '🔀 Move opens Move Jobs with #8001 picked')
    page.locator('#st-toolbox button:visible', has_text='← Menu').first.click()
    page.locator('#st-toolbox .st-tile', has_text='Quick Job Info').click()
    check(page.is_visible('#st-ai-out') and '#8001' in sec(page, 'st-ai-head'), 'back in Quick Job Info, the card is still there')
    page.click('#st-ai-out .st-ai-act-text')
    check(page.inner_text('#st-toolbox').startswith('📱 Customer Texts') and '#8001' in page.inner_text('#st-toolbox'), '📱 Text opens Customer Texts with #8001 picked (nothing sent)')
    page.locator('#st-toolbox button:visible', has_text='← Menu').first.click()
    page.locator('#st-toolbox .st-tile', has_text='Quick Job Info').click()
    explain(page, 8301)
    check(nxt(page).startswith('🎯 It needs a tech') and page.locator('#st-ai-out .st-ai-act-place').count() == 1, 'an Unassigned job: it needs a tech, and 🎯 Place is there')
    page.click('#st-ai-out .st-ai-act-place')
    check(page.inner_text('#st-toolbox').startswith('🧭 Tech Router'), '🎯 Place opens Tech Router')
    check(ev(page, "() => (window.WRITES || []).length") == 0 and ev(page, "() => (window.SENT || []).length") == 0, 'nothing changed, nothing sent')
    check(not errors, 'no page errors (%s)' % errors[:2])
    page.close()

    # ================= The customer page's data can't be read =================
    page, errors = start(b, "() => { window.CUST_DOWN = true; }")
    explain(page, 8101)
    check('thinking over the $8,900 price' in story(page) and all(x in card(page) for x in ['Couldn\'t read', 'their other jobs', 'their calls', 'their memberships', 'what they\'ve paid us']), 'still shows the hold, and says what it couldn\'t read')
    check('2 tries without reaching them' in story(page) and 'hard' not in topics(page), 'the notes still count the 2 calls that didn\'t reach her')
    check(not errors, 'no page errors (%s)' % errors[:2])
    page.close()

    # ================= ⏸️ Holds, and which holds got booked =================
    page, errors = start(b)
    order = holds(page)
    check(order == ['8106', '8101', '8102', '8105', '8103'], 'Holds: Fay (ready, high priority) first, Cara (wait) last, Dee (do not call) left out (%s)' % order)
    check('left out: the summary says not to call' in page.inner_text('#st-ai-holds-out') and not page.is_visible('#st-ai-out') and not page.is_visible('#st-ai-input'), 'it says a hold was left out; the job card and number box are hidden on this tab')
    page.wait_for_function("() => document.querySelector('#st-ai-holds-out .st-ai-hold[data-job=\"8101\"] [data-topic=hard]')", timeout=10000)
    check(hold_topics(page, 8101) == ['hard'] and hold_topics(page, 8106) == ['called'], 'each hold\'s call log: Mary 📵 hard to reach, Fay ☎️ called us (%s %s)' % (hold_topics(page, 8101), hold_topics(page, 8106)))
    w = {x['j']: x for x in idb(page, 'holds')}
    check(len(w) == 6 and all(not x.get('out') for x in w.values()) and 'back order' in w['8102']['sum'], 'every hold is watched (with its summary)')
    page.locator('#st-ai-holds-out .st-ai-hold[data-job="8106"] .st-ai-hold-explain').click()
    page.wait_for_function("() => document.querySelector('#st-ai-out .st-ai-next')", timeout=30000)
    check('They texted' in nxt(page) and 'Tuesday works' in story(page), '📋 Info on Fay: answer her text first')
    page.click('#st-ai-out .st-ai-back')
    check(page.is_visible('#st-ai-holds-out') and not page.is_visible('#st-ai-out') and page.locator('#st-ai-holds-out .st-ai-hold').count() == len(order), '← Holds goes back to the list')
    page.click('#st-ai-tab-job')
    check(page.is_visible('#st-ai-out') and page.is_visible('#st-ai-input') and not page.is_visible('#st-ai-holds-out'), '📋 Job shows Fay\'s card again')
    ev(page, """() => { HOLDS.splice(HOLDS.findIndex(x => x[1] === 8106), 1); HOLDS.splice(HOLDS.findIndex(x => x[1] === 8102), 1);
      EXTRA_JOBS[90106] = [{ id: 8106, type: 'Quote - HVAC - Central Home System', days: 1, status: 0 }];
      EXTRA_JOBS[90102] = [{ id: 8102, type: 'Repair - Plumbing - Water Heater', days: 1, status: 5 }]; }""")
    holds(page)
    w = {x['j']: x for x in idb(page, 'holds')}
    check(w['8106'].get('out') == 'booked' and w['8102'].get('out') == 'lost' and not w['8101'].get('out'), 'off the Hold list, from their job lists: Fay\'s got booked, Bob\'s canceled (lost), Mary\'s still on hold')

    # ================= 📥 A CSV report: the 🔮 chances =================
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
    page.wait_for_timeout(300)
    check('⚙️ More' in page.inner_text('#st-ai-mem-head') and 'Holds watched: 6' in page.inner_text('#st-ai-mem-text') and page.locator('#st-ai-learn').count() == 0, '⚙️ More: holds watched, and no 📚 Learn button any more')
    page.set_input_files('#st-ai-csv', files=[{'name': 'jobs.csv', 'mimeType': 'text/csv', 'buffer': csv}])
    page.wait_for_function("() => /jobs.csv:/.test(document.getElementById('st-ai-mem-msg').textContent)", timeout=15000)
    m1 = page.inner_text('#st-ai-mem-msg')
    check('31 jobs' in m1 and '31 new, 0 updated, 0 already known' in m1 and '1 row without a job number' in m1, 'the report is added (%r)' % m1)
    page.set_input_files('#st-ai-csv', files=[{'name': 'jobs.csv', 'mimeType': 'text/csv', 'buffer': csv}])
    page.wait_for_function("() => /0 new/.test(document.getElementById('st-ai-mem-msg').textContent)", timeout=15000)
    check('0 new, 0 updated, 31 already known' in page.inner_text('#st-ai-mem-msg'), 'the same report again adds nothing')
    j = {x['j']: x for x in idb(page, 'jobs')}
    check(j['6001']['sum'] == 'New system, "18 SEER", two zones' and j['6001']['total'] == 8200 and '555-12' not in str(j), 'quotes, commas and money read right; phone numbers not kept')
    explain(page, 8101)
    s = story(page)
    check('🔮 Chance it books: about' in s and '📊 Quote - HVAC - Central Home System:' in s, 'with the report\'s holds, the chance this one books, and how holds like it went')
    holds(page)
    check('🔮' in page.inner_text('#st-ai-holds-out') and 'Chances are learned from' in page.inner_text('#st-ai-holds-out'), 'the Holds tab shows the chances too')
    # 🗑️ Forget.
    open_mem(page)
    page.click('#st-ai-forget')
    page.click('#st-toolbox button:has-text("Yes, forget it")')
    page.wait_for_function("() => /Forgotten/.test(document.getElementById('st-ai-mem-msg').textContent)", timeout=15000)
    check(len(idb(page, 'holds')) == 0 and len(idb(page, 'jobs')) == 0, 'forgotten: holds watched and reports gone')
    r = ev(page, "() => { const r = window.__stToolbox.read('Customer will call us back next week. Not interested in the $12,500 system.', new Date(2026, 10, 2)); return [r.topics.map(t => t.key), r.amounts.map(a => a.n), r.when && r.when.at.getDate()]; }")
    check('callback' in r[0] and 'lost' in r[0] and r[1] == [12500] and r[2] == 9, 'window.__stToolbox.read still reads text for other tools (%s)' % r)
    ev(page, "() => window.__stToolbox.close()")
    page.wait_for_function("() => !window.__stToolbox && !document.getElementById('st-toolbox')", timeout=5000)
    page.evaluate(TOOLBOX)
    check(page.inner_text('#st-toolbox').startswith('📋 Quick Job Info'), 'closed and opened again, it comes back to Quick Job Info')
    check(ev(page, "() => (window.WRITES || []).length") == 0 and not errors, 'nothing changed in ServiceTitan, no page errors (%s)' % errors[:2])
    page.close()

    # ================= 👎 Teaching it =================
    page, errors = start(b, """() => {
      HOLDS.push([9907, 8107, 'Gil General', 90107, 'Service - HVAC', 31, 'Customer called about the system. Do not solicit.', 5, 'Normal', []]);
      HOLDS.push([9909, 8109, 'Ivy Refund', 90109, 'Repair - Plumbing - Drain', 22, 'Customer is waiting on tax refund before booking.', 8, 'Normal', []]);
      HOLDS.push([9910, 8110, 'Joe Refund', 90110, 'Repair - Plumbing - Drain', 22, 'Same as before: waiting on TAX refund.', 2, 'Normal', []]);
    }""")
    explain(page, 8101)
    page.click('#st-ai-out .st-ai-teach-open')
    check(page.is_visible('#st-ai-out .st-ai-teach'), '👎 Read something wrong? opens Teach it')
    page.click('#st-ai-out .st-ai-teach-not[data-topic=urgent]')
    page.fill('#st-ai-out .st-ai-teach-not-phrase', 'not cooling upstairs')
    page.click('#st-ai-out .st-ai-teach-not-save')
    page.wait_for_function("() => /Learned/.test((document.getElementById('st-ai-teach-msg') || {}).textContent || '')", timeout=10000)
    check('urgent' not in topics(page) and 'decide' in topics(page), '✕ on "no heat or AC": "not cooling upstairs" isn\'t urgent, and the chip is gone (%s)' % topics(page))
    check(page.locator('#st-ai-out .st-ai-teach-not[data-topic=member]').count() == 0, 'the club chip (from her memberships, not her notes) isn\'t offered to teach')
    explain(page, 8101)
    check('urgent' not in topics(page), 'the lesson stays (looked up again)')
    explain(page, 8109)
    check('price' not in topics(page), 'Ivy is waiting on a tax refund: it doesn\'t know that yet')
    page.click('#st-ai-out .st-ai-teach-open')
    page.select_option('#st-ai-teach-sen', index=0)
    page.select_option('#st-ai-teach-topic', 'price')
    page.fill('#st-ai-teach-phrase', 'waiting refund')
    page.click('#st-ai-teach-save')
    check('aren\'t in that sentence' in page.inner_text('#st-ai-teach-msg') and 'price' not in topics(page), 'words that aren\'t side by side in the sentence are refused')
    page.fill('#st-ai-teach-phrase', 'waiting on tax refund')
    page.click('#st-ai-teach-save')
    page.wait_for_function("() => /Learned/.test((document.getElementById('st-ai-teach-msg') || {}).textContent || '')", timeout=10000)
    check('price' in topics(page) and '📖' in page.inner_text('#st-ai-out .st-ai-chips'), 'taught: "waiting on tax refund" means thinking over the price (📖 on the chip)')
    explain(page, 8110)
    check('price' in topics(page), 'and another job saying "waiting on TAX refund" is read the same way')
    explain(page, 8107)
    check(not nxt(page).startswith('🚫'), 'Gil\'s summary says "Do not solicit": not read as don\'t call yet')
    page.click('#st-ai-out .st-ai-teach-open')
    sens = ev(page, "() => Array.from(document.querySelectorAll('#st-ai-teach-sen option')).map(o => o.textContent)")
    page.select_option('#st-ai-teach-sen', index=[i for i, t in enumerate(sens) if 'solicit' in t][0])
    page.select_option('#st-ai-teach-topic', 'nocall')
    page.fill('#st-ai-teach-phrase', 'do not solicit')
    page.click('#st-ai-teach-save')
    page.wait_for_function("() => /Learned/.test((document.getElementById('st-ai-teach-msg') || {}).textContent || '')", timeout=10000)
    check(nxt(page).startswith('🚫 Don\'t call'), 'taught "do not solicit" means don\'t call')
    order = holds(page)
    check('8107' not in order, 'and the Holds tab (Tech Router\'s reading) leaves Gil out (%s)' % order)
    lessons = ev(page, "() => JSON.parse(localStorage.getItem('stAiTaught'))")
    check(len(lessons) == 3 and {(l['topic'], l['not']) for l in lessons} == {('urgent', True), ('price', False), ('nocall', False)}, 'three lessons saved in this browser')
    explain(page, 8101)
    page.click('#st-ai-out .st-ai-teach-open')
    page.click('#st-ai-out .st-ai-lessons button')
    lid = [l['id'] for l in lessons if l['topic'] == 'urgent'][0]
    page.click('#st-ai-out .st-ai-lesson[data-id="%s"] button' % lid)
    page.wait_for_function("() => /Forgotten/.test((document.getElementById('st-ai-teach-msg') || {}).textContent || '')", timeout=10000)
    check('urgent' in topics(page) and len(ev(page, "() => JSON.parse(localStorage.getItem('stAiTaught'))")) == 2, '↩ forgets a lesson: no heat or AC is back')
    check(not errors, 'no page errors (%s)' % errors[:2])
    page.close()

    # ================= ⏸️ Holds tab: 📍 areas, 🔎 filters, 📌 saved filters =================
    page, errors = start(b)
    def rows(page):
        return ev(page, "() => Array.from(document.querySelectorAll('#st-ai-holds-out .st-ai-hold')).map(r => r.getAttribute('data-job'))")
    def tap(page, sel):
        page.click(sel)
        page.wait_for_timeout(50)
    order = holds(page)
    check(order == ['8106', '8101', '8102', '8105', '8103'] and page.is_visible('#st-ai-filter-all') and page.is_visible('#st-ai-filter-go'), 'the Holds tab has All holds and 🔎 Filter above the list (%s)' % order)
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
    # 🗺️ State, 🗂️ hold reason, 📅 created between two dates.
    tap(page, '#st-ai-filter-clear')
    tap(page, '#st-ai-filter [data-state="AL"]')
    check(rows(page) == ['8103'] and '🗺️ AL' in page.inner_text('#st-ai-filter-count'), 'state AL: Cara (%s)' % rows(page))
    tap(page, '#st-ai-filter-clear')
    tap(page, '#st-ai-filter [data-reason="Waiting on parts"]')
    check(rows(page) == ['8102'], 'the Hold list\'s own hold reason, Waiting on parts: Bob (%s)' % rows(page))
    tap(page, '#st-ai-filter-clear')
    d13 = (datetime.date.today() - datetime.timedelta(days=13)).isoformat(); d5 = (datetime.date.today() - datetime.timedelta(days=5)).isoformat()
    page.fill('#st-ai-filter-from', d13)
    page.fill('#st-ai-filter-to', d5)
    page.wait_for_timeout(100)
    check(rows(page) == ['8102', '8103'] and '📅 created' in page.inner_text('#st-ai-filter-count'), 'created between 13 and 5 days ago: Bob (9 days) and Cara (12) (%s)' % rows(page))
    page.fill('#st-ai-filter-from', '')
    page.wait_for_timeout(100)
    check(rows(page) == ['8101', '8102', '8103'] and 'until' in page.inner_text('#st-ai-filter-count'), 'only an end date: created up to 5 days ago (Mary, Bob, Cara) (%s)' % rows(page))
    tap(page, '#st-ai-filter-nodates')
    check(len(rows(page)) == 5, '✕ Any date: every hold again')
    # A report's Hold Reason, for a hold the list gives none for.
    open_mem(page)
    page.set_input_files('#st-ai-csv', files=[{'name': 'holds.csv', 'mimeType': 'text/csv', 'buffer': b'Job #,Job Type,Job Status,Hold Reason\n8105,Service - HVAC,Hold,Customer request\n'}])
    page.wait_for_function("() => /holds.csv:/.test(document.getElementById('st-ai-mem-msg').textContent)", timeout=15000)
    holds(page)
    tap(page, '#st-ai-filter [data-reason="Customer request"]')
    check(rows(page) == ['8105'], 'a 📥 report\'s Hold Reason (Customer request) for Eve, whose hold the list gives none for (%s)' % rows(page))
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
    check(page.locator('#st-ai-out .st-ai-head .st-ai-areas [data-area]').count() == 1 and '🔴 Red' in page.inner_text('#st-ai-out .st-ai-head'), 'Bob\'s card shows he\'s in 🔴 Red')
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

    # ================= 📱 Customer Texts: the same 🔎 filter on its Hold list =================
    page, errors = start(b, "() => { localStorage.setItem('stAiAreas', JSON.stringify([{ id: 'a1', name: 'Red', color: 'red', cities: ['mendenhall'], zips: [] }])); }")
    page.locator('#st-toolbox button:visible', has_text='← Menu').first.click()
    page.locator('#st-toolbox .st-tile', has_text='Customer Texts').click()
    page.locator('#st-toolbox button:visible', has_text='Load holds').first.click()
    page.wait_for_function("() => /Loaded \\d+ hold/.test(document.getElementById('st-toolbox').innerText)", timeout=15000)
    for g in ['Quote (3)', 'Repair (1)', 'Service (2)']:
        page.locator('#st-toolbox label:visible', has_text=g).first.locator('input').check()
    line = lambda: page.inner_text('#st-toolbox .st-ct-ticked')
    check('6 holds ticked → 6 customers' in line() and page.is_visible('#st-ct-filter-go'), 'Customer Texts: 6 holds ticked, and 🔎 Filter under the kinds (%r)' % line())
    page.click('#st-ct-filter-go')
    check(page.is_visible('#st-ct-filter') and page.locator('#st-ct-filter [data-fam]').count() == 0, 'the filter opens (job types stay with the ticks above)')
    page.click('#st-ct-filter [data-area="Red"]')
    check('6 holds ticked, 2 in the filter (🔎 🔴 Red) → 2 customers' in line(), 'the area made in 📋 Quick Job Info works here: 2 customers in 🔴 Red (%r)' % line())
    check(page.locator('#st-toolbox button:visible', has_text='Start (type only)').first.inner_text().endswith('2 customers'), 'Start says 2 customers')
    page.click('#st-ct-filter-clear')
    page.click('#st-ct-filter [data-state="AL"]')
    check('1 in the filter (🔎 🗺️ AL) → 1 customer' in line(), 'state AL: 1 customer (%r)' % line())
    page.click('#st-ct-filter-clear')
    page.click('#st-ct-filter [data-reason="Waiting on parts"]')
    check('→ 1 customer' in line(), 'hold reason Waiting on parts: 1 customer (%r)' % line())
    page.click('#st-ct-filter-clear')
    page.fill('#st-ct-filter-from', d13)
    page.fill('#st-ct-filter-to', d5)
    page.wait_for_timeout(100)
    check('3 in the filter' in line() and '📅 created' in line(), 'created between 13 and 5 days ago: Bob, Cara and Dee (here Dee can be texted) (%r)' % line())
    page.fill('#st-ct-view-name', 'Last 2 weeks')
    page.click('#st-ct-view-save')
    check(page.locator('#st-toolbox .st-ct-view[data-view="Last 2 weeks"]').count() == 1, '📌 a saved filter in Customer Texts')
    page.click('#st-ct-filter-clear')
    page.click('#st-ct-filter [data-area="Red"]')
    page.locator('#st-toolbox button:visible', has_text='Start (type only)').first.click()
    page.wait_for_function("() => /Will text|Nobody to text/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    t = page.inner_text('#st-toolbox')
    check('Bob Jones' in t and 'Eve Unread' in t and 'Mary Smith' not in t and 'Fay Ready' not in t and 'Cara Late' not in t, 'Start checks only the filter\'s customers: Bob, and Eve (skipped: an unread reply)')
    check(ev(page, "() => JSON.parse(localStorage.getItem('stCtHoldFilter')).areas") == ['a1'] and ev(page, "() => JSON.parse(localStorage.getItem('stAiHoldFilter') || 'null')") is None, 'Customer Texts keeps its own filter (Quick Job Info\'s is untouched)')
    check(ev(page, "() => (window.SENT || []).length") == 0, 'nothing sent')
    check(not errors, 'no page errors (%s)' % errors[:2])
    page.close()

    # ================= No IndexedDB (a private window, blocked site data) =================
    page, errors = start(b, "() => { Object.defineProperty(window, 'indexedDB', { configurable: true, get() { throw new Error('blocked'); } }); }")
    explain(page, 8101)
    check('thinking over the $8,900 price' in story(page) and '$4,120.50 lifetime' in sec(page, 'st-ai-customer'), 'without IndexedDB it still shows everything')
    open_mem(page)
    page.wait_for_function("() => /nothing kept/.test(document.getElementById('st-ai-mem-head').textContent)", timeout=5000)
    check(page.is_disabled('#st-ai-csv-go'), 'and says nothing can be kept (📥 can\'t be pressed)')
    order = holds(page)
    check(order[:1] == ['8106'], 'the Holds tab still works (%s)' % order)
    check(not errors, 'no page errors (%s)' % errors[:2])
    page.close()

    # ================= The Hold list can't be read =================
    page, errors = start(b, "() => { window.HOLD_DOWN = true; }")
    holds(page)
    check('Couldn\'t read the Hold list' in msg(page), 'the Hold list down: it says so')
    explain(page, 8001)
    check('Scheduled for' in story(page), 'a job on the board still shows')
    check(not errors, 'no page errors (%s)' % errors[:2])
    page.close()
    b.close()

print('\n%d failed' % len(fails) if fails else '\nAll passed')
sys.exit(1 if fails else 0)
