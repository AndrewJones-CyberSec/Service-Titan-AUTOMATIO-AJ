import sys, time, pathlib, json, datetime
from playwright.sync_api import sync_playwright
import fastclock

# 📲 Offer times (2.6): a folder whose texts offer each customer on hold a couple of openings to
# reply 1 or 2 to. The openings are listed under 🗓️ Times to offer; each customer gets their own
# (a time of day their summary asks for, a day we're already in their town, no opening offered to
# too many at once), every text is shown and can be changed before it goes, and 📥 Check replies
# to offers lists who picked what. Nothing is booked by the Toolbox.
HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_texts.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first

def panel_text(page):
    return page.locator('#st-toolbox').inner_text()

def running(page):
    return page.evaluate("() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))")

def wait_done(page, timeout=120):
    end = time.time() + timeout
    time.sleep(0.4)
    while time.time() < end:
        if not running(page): return True
        fastclock.skip(page)
    return False

def sent(page):
    return page.evaluate("() => window.SENT.slice()")

def ledger(page):
    return json.loads(page.evaluate("() => localStorage.getItem('stCtOffers') || '[]'"))

def saved_slots(page):
    return json.loads(page.evaluate("() => localStorage.getItem('stCtOfferSlots') || '[]'"))

# The days offered, from the page's own clock (the tests skip it ahead).
def days(page):
    return page.evaluate("""() => { const p = n => String(n).padStart(2, '0'); const out = {};
      [2, 3, 5].forEach(n => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n);
        out[n] = { iso: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()),
          long: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          short: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          weekday: d.toLocaleDateString('en-US', { weekday: 'long' }), at9: new Date(d.getTime() + 9 * 3600000).toISOString(), at11: new Date(d.getTime() + 11 * 3600000).toISOString() }; });
      return out; }""")

def add_time(page, iso, win, spots):
    page.select_option('#st-ct-offer-day', iso)
    page.select_option('#st-ct-offer-win', win)
    page.fill('#st-ct-offer-spots', str(spots))
    B(page, '＋ Add').click()

# The review screen: one card per customer, as { job: { text, head, opts } }.
def cards(page):
    return page.evaluate("""() => { const out = {}; document.querySelectorAll('#st-ct-offer-cards .st-ct-offer').forEach(c => {
      const ta = c.querySelector('textarea'); out[c.getAttribute('data-job')] = { text: ta ? ta.value : null, all: c.innerText,
        opts: Array.from(c.querySelectorAll('select')).map(s => s.options[s.selectedIndex].textContent) }; }); return out; }""")

def card(page, job):
    return page.locator('#st-ct-offer-cards .st-ct-offer[data-job="%s"]' % job)

def review(page):
    page.locator('#st-toolbox button:visible', has_text='Review each text').first.click()
    page.wait_for_function("() => document.querySelectorAll('#st-ct-offer-cards .st-ct-offer').length > 0 || /Nobody to text|Couldn't check/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    return panel_text(page)

# The replies report as text (as in test_confirm_replies.py).
def report(page):
    return page.evaluate("""() => {
      const sec = document.querySelector('#st-toolbox .st-cust-section');
      if (!sec) return document.getElementById('st-toolbox').innerText;
      return Array.from(sec.parentElement.children).map(ch => {
        if (!ch.classList.contains('st-cust-section')) return ch.textContent.trim();
        const cards = Array.from(ch.querySelectorAll('.st-cust-card')).map(c => '• ' + Array.from(c.querySelectorAll(':scope > div')).map(d => d.textContent.trim()).join(' | '));
        return ch.getAttribute('data-title') + '\\n' + cards.join('\\n');
      }).join('\\n\\n'); }""")

def section(log, title):
    if title not in log: return ''
    return log.split(title, 1)[1].split('\n\n')[0]

def run_check(page):
    B(page, 'Check replies to offers').click()
    page.wait_for_function("() => /Checked \\d+ offer|signed you out/.test(document.getElementById('st-toolbox').innerText)", timeout=30000)
    return report(page)

def reply(page, num, body, unread=False):
    page.evaluate("([n, b, u]) => { const c = window.CHATS[n] || (window.CHATS[n] = { unread: false, msgs: [] }); c.msgs.push({ Body: b, IsInbound: true, CreatedOn: new Date(Date.now() + c.msgs.length).toISOString() }); if (u) c.unread = true; }", [num, body, unread])

def cust_card(page, name):
    return page.locator('#st-toolbox .st-cust-card', has_text=name).first

DEEDE, BOB, GUS, HAL, JON = '5045550001', '6015550102', '6015550009', '6015550010', '6015550012'

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    fastclock.install(page)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    D = {int(k): v for k, v in days(page).items()}
    # What the Hold list says about each hold, and where we already are on the days offered:
    # a job in Magee on day 3, one in Florence on day 5.
    page.evaluate("""([d3, d5]) => {
      window.HOLD_MORE = {
        5001: { City: 'MAGEE', Zip: '39111', Summary: 'Customer prefers afternoons. Wants new system.' },
        5002: { City: 'Mendenhall', Zip: '39114', Summary: 'Went out this morning to look. Not home until 2 most days.' },
        5009: { City: 'Florence', Zip: '39073', Summary: 'No mornings please, works nights.' },
        5012: { City: 'Magee', Zip: '39111' } };
      window.OTHER_DAYS = {};
      window.OTHER_DAYS[d3.iso] = { appts: [{ id: 9301, job: 9301, techs: [1], customer: 'Zed One', start: d3.at9, end: d3.at11, city: 'Magee', zip: '39111' }] };
      window.OTHER_DAYS[d5.iso] = { appts: [{ id: 9501, job: 9501, techs: [1], customer: 'Zed Two', start: d5.at9, end: d5.at11, city: 'Florence', zip: '39073' }] };
    }""", [D[3], D[5]])
    page.evaluate(TOOLBOX)

    # ---- Reading replies, time-of-day wishes and {about}: the pieces by themselves ----
    r = page.evaluate("""([d2, d3]) => { const o = window.__stToolbox.offers, two = [{ day: d2, win: '12-5' }, { day: d3, win: '8-12' }], same = [{ day: d2, win: '8-12' }, { day: d2, win: '12-5' }];
      const wd = iso => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
      const P = (b, opts) => { const x = o.pickIn(b, opts || two, Date.now()); return x ? (x.no ? 'no' : x.either ? 'either' : x.pick) : null; };
      const R = (list, opts) => { const x = o.readPick(list.map((b, i) => ({ Body: b, CreatedOn: new Date(Date.now() + i * 1000).toISOString(), SmsId: i })), opts || two); return x.kind + (x.kind === 'pick' ? ':' + x.pick : ':' + x.why); };
      const W = t => { const w = o.wishOf(t); return Array.from(w.want).join(',') + '/' + Array.from(w.avoid).join(','); };
      return {
        one: P('1'), two: P('2 please'), hash: P('#2'), option: P('Option 1 works'), opt_mid: P('lets do option 2'), first: P('The first one'), second: P('second works'), emoji: P('2 👍'),
        three: P('3'), time: P('2pm works'), clock: P('1:30 is better'), range: P('1 or 2?'), ten: P('10'),
        either: P('Either works'), any: P('any of those is fine'), no: P('No thanks'), neither: P('neither'), noprob: P('no problem'), nopref: P('No preference'),
        day1: P(wd(d2) + ' works'), day2: P('Can we do ' + wd(d3) + '?'), dayAbbr: P(wd(d3).slice(0, 3) + ' is good'), dayWrongPart: P(wd(d2) + ' morning instead?'),
        partOnly: P('the morning one'), sameDayPart: P(wd(d2) + ' afternoon', same), sameDay: P(wd(d2), same), other: P('What about next month?'), call: P('Call me'),
        r_pick: R(['2', 'Thanks!']), r_change: R(['1', 'actually 2']), r_more: R(['1', 'but can he come after 3?']), r_yes2: R(['Yes']), r_yes1: R(['Yes'], [two[0]]), r_no: R(['no thank you']), r_q: R(['How much is it?']),
        w_pref: W('Customer prefers afternoons.'), w_only: W('Mornings only'), w_not: W('No mornings please'), w_until: W('Not home until 2'), w_after5: W('gets off at 5'), w_work: W('call after work'),
        w_none: W('Went out this morning and quoted a new unit'), w_before: W('needs it before noon'), w_am: W('home after 9 am'),
        a_q: o.aboutOf('Quote - Water Heater'), a_hvac: o.aboutOf('Quote - HVAC - Central Home System'), a_non: o.aboutOf('Non - Operational - Commercial - AC - Under 12 Years Old'),
        a_maint: o.aboutOf('Maintenance - Summer - Residential - Under 12 Yrs'), a_none: o.aboutOf(''), a_other: o.aboutOf('Warranty Callback'), a_quote: o.aboutOf('Quote')
      }; }""", [D[2]['iso'], D[3]['iso']])
    print(r)
    check([r['one'], r['two'], r['hash'], r['option'], r['opt_mid'], r['first'], r['second'], r['emoji']] == [0, 1, 1, 0, 1, 0, 1, 1], 'a number, "#2", "option 1", "the first one" pick that time')
    check([r['three'], r['time'], r['clock'], r['range'], r['ten']] == [None] * 5, 'a number that wasn\'t offered, a time ("2pm", "1:30"), "1 or 2?" and "10" pick nothing')
    check(r['either'] == 'either' and r['any'] == 'either', '"either works" / "any of those is fine" is either')
    check(r['no'] == 'no' and r['neither'] == 'no' and r['noprob'] is None and r['nopref'] is None, '"no thanks" / "neither" is a no; "no problem" and "no preference" aren\'t')
    check([r['day1'], r['day2'], r['dayAbbr']] == [0, 1, 1], 'the day they name picks the time offered that day')
    check(r['dayWrongPart'] is None, 'the day offered but another time of day ("morning instead?") picks nothing')
    check(r['partOnly'] == 1 and r['sameDayPart'] == 1 and r['sameDay'] is None, '"the morning one" picks it; two times on one day need the time of day')
    check(r['other'] is None and r['call'] is None, 'anything else picks nothing')
    check(r['r_pick'] == 'pick:1' and r['r_change'] == 'pick:1', 'a pick stands after "Thanks!"; the last pick counts')
    check(r['r_more'] == 'look:replied' and r['r_q'] == 'look:replied', 'a pick followed by a question, or just a question, needs a look')
    check(r['r_yes2'] == 'look:said yes, but not which time' and r['r_yes1'] == 'pick:0', '"Yes" to two times needs a look; to one time it picks it')
    check(r['r_no'] == 'no:said no', '"no thank you" is a no')
    check([r['w_pref'], r['w_only'], r['w_not'], r['w_until'], r['w_after5'], r['w_work'], r['w_before']] == ['pm/', 'am/', '/am', 'pm/', 'eve/', 'eve/', 'am/'], 'time-of-day wishes read from a summary')
    check(r['w_none'] == '/' and r['w_am'] == '/', '"went out this morning" and "after 9 am" aren\'t wishes')
    check([r['a_q'], r['a_hvac'], r['a_non'], r['a_maint'], r['a_none'], r['a_other'], r['a_quote']] ==
          ['your water heater quote', 'your HVAC quote', 'your AC repair', 'your maintenance visit', 'your appointment', 'your appointment', 'your free quote'], '{about} from the job type: %s' % [r['a_q'], r['a_hvac'], r['a_non'], r['a_maint'], r['a_none'], r['a_other'], r['a_quote']])

    # ---- The folder ----
    B(page, 'Customer Texts').click()
    check('📲 Offer times' in panel_text(page), 'Offer times is a default folder')
    B(page, '📲 Offer times').click()
    t = panel_text(page)
    check('🗓️ Times to offer' in t and 'Add the openings you want filled' in t, 'the folder shows 🗓️ Times to offer, empty at first')
    check('Offers times: customers reply 1 or 2' in t and 'Skips anyone who got any text from us in the last 7 days.' in t, 'its rule and what it does are shown')
    check(page.locator('#st-toolbox label:visible', has_text='Hold list').locator('input').is_checked(), 'it uses the Hold list')
    check(page.locator('#st-toolbox button:visible', has_text='Check replies to offers').first.is_disabled(), 'Check replies to offers is off with no offers out')
    B(page, '⏸️ Holds').click()
    check(page.locator('#st-ct-offer-times').is_hidden() and B(page, 'Check replies to offers').count() == 0, 'other folders have no Times to offer')
    B(page, '📲 Offer times').click()

    # Openings: day 2 morning and afternoon, day 3 afternoon, day 5 morning; one spot each
    add_time(page, D[2]['iso'], '8-12', 1)
    add_time(page, D[2]['iso'], '12-5', 1)
    add_time(page, D[3]['iso'], '12-5', 1)
    add_time(page, D[5]['iso'], '8-12', 1)
    t = panel_text(page)
    check(page.locator('#st-ct-offer-times .st-ct-slot').count() == 4 and D[2]['short'] + ' · 8 AM–12 PM · 1 spot' in t and D[3]['short'] + ' · 12–5 PM · 1 spot' in t, 'four openings listed, in order')
    check([x['day'] + ' ' + x['win'] for x in saved_slots(page)] == [D[2]['iso'] + ' 8-12', D[2]['iso'] + ' 12-5', D[3]['iso'] + ' 12-5', D[5]['iso'] + ' 8-12'], 'saved in this browser')
    add_time(page, D[5]['iso'], '8-12', 2)
    check(D[5]['short'] + ' · 8 AM–12 PM · 3 spots' in panel_text(page), 'adding the same opening again adds its spots')
    page.locator('#st-ct-offer-times .st-ct-slot').nth(3).locator('button', has_text='−').click()
    page.locator('#st-ct-offer-times .st-ct-slot').nth(3).locator('button', has_text='−').click()
    check(D[5]['short'] + ' · 8 AM–12 PM · 1 spot' in panel_text(page), '− takes a spot off')

    # ---- Who: the Hold list ----
    B(page, 'Load holds').click()
    page.wait_for_function("() => /Loaded \\d+ hold/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    page.locator('#st-toolbox label:visible', has_text='Quote (10)').first.locator('input').check()
    page.locator('#st-toolbox label:visible', has_text='Auto-send').locator('input').check()
    check(B(page, 'Review each text: 9 customers').count() == 1, 'the button says every text is reviewed')
    t = review(page)
    print(t)
    C = cards(page)
    check(sorted(C.keys()) == ['5001', '5002', '5009', '5010', '5012'], 'one card per customer who will be texted: %s' % sorted(C.keys()))
    for why in ['replied STOP', 'unread reply', 'blocked in ServiceTitan', 'same number as another customer']:
        check(why in t, 'the usual skips still apply: ' + why)
    check(page.evaluate("() => window.chatOpened.length") == 0, 'nothing was opened to check')
    o2pm = '1 for %s between 12 and 5 PM, or 2 for %s between 12 and 5 PM' % (D[2]['long'], D[3]['long'])
    # Deede: Magee, prefers afternoons -> the two afternoons; we're in Magee on day 3, and it says so
    check(C['5001']['text'].startswith('Hi Deede, this is Andrew with AirSouth') and 'about your HVAC quote that we still have on hold' in C['5001']['text'], 'Deede: her name, your name and what the hold is: ' + C['5001']['text'][:120])
    check(o2pm + " (we'll already be in Magee that day). If none" in C['5001']['text'], 'Deede: both afternoons, and day 3 says we\'ll already be in Magee')
    check('Summary asks for afternoons' in C['5001']['all'] and 'Already in Magee ' + D[3]['short'] in C['5001']['all'], 'Deede: the card says why')
    # Bob: "not home until 2" -> afternoons; not in Mendenhall either day
    check(('reply ' + o2pm + '. If none') in C['5002']['text'] and 'already be in' not in C['5002']['text'], 'Bob: afternoons (not home until 2), nothing about his town: ' + C['5002']['text'][-200:])
    check('Hi Bob,' in C['5002']['text'] and 'your generator quote' in C['5002']['text'], 'Bob: his own name and job')
    # Gus: no mornings -> afternoons, though we're in Florence the morning of day 5
    check(o2pm in C['5009']['text'] and 'Summary asks for not mornings' in C['5009']['all'] and 'your water heater quote' in C['5009']['text'], 'Gus: no mornings kept to')
    # Hal and Jon: both afternoons are now out to 3 customers (1 spot x 3), so they get the mornings
    oam = '1 for %s between 8 AM and 12 PM, or 2 for %s between 8 AM and 12 PM' % (D[2]['long'], D[5]['long'])
    check(oam in C['5010']['text'] and oam in C['5012']['text'], 'Hal and Jon: the afternoons are out to 3 each, so they get the mornings')
    check(C['5010']['opts'] == [D[2]['short'] + ' · 8 AM–12 PM', D[5]['short'] + ' · 8 AM–12 PM'], 'the card shows the two times picked: %s' % C['5010']['opts'])
    check('Send 5 texts' in panel_text(page), 'five texts to send')

    # Change one person's words
    ta = card(page, '5002').locator('textarea')
    ta.fill(C['5002']['text'] + ' Tell Mary I said hello.')
    check('changed by you' in card(page, '5002').inner_text() and card(page, '5002').locator('button', has_text='↺ Written text').is_visible(), 'a text you change says so, with ↺')
    # Change one person's times: Hal gets only the first
    card(page, '5010').locator('select').nth(1).select_option('')
    C = cards(page)
    check(('reply 1 for %s between 8 AM and 12 PM. If none' % D[2]['long']) in C['5010']['text'], 'taking a time off writes the text again with one: ' + C['5010']['text'][-160:])
    # ...then give him day 3 afternoon instead
    card(page, '5010').locator('select').nth(1).select_option(D[3]['iso'] + '|12-5')
    C = cards(page)
    check(('1 for %s between 8 AM and 12 PM, or 2 for %s between 12 and 5 PM' % (D[2]['long'], D[3]['long'])) in C['5010']['text'], 'picking another time writes it in, in date order')
    check(' Tell Mary I said hello.' in cards(page)['5002']['text'], "another person's changed text is untouched")
    # Leave one out
    card(page, '5012').locator('button', has_text='✕ Leave out').click()
    check('Left out' in card(page, '5012').inner_text() and 'Send 4 texts' in panel_text(page), 'leaving someone out lowers the count')
    card(page, '5012').locator('button', has_text='Text them after all').click()
    check('Send 5 texts' in panel_text(page) and cards(page)['5012']['text'], 'and they can be put back')
    card(page, '5012').locator('button', has_text='✕ Leave out').click()
    page.fill('#st-ct-confirm-count', '5')
    B(page, 'Send 4 texts').click()
    check("That number doesn't match" in panel_text(page) and len(sent(page)) == 0, 'the count typed has to match what will go')
    page.fill('#st-ct-confirm-count', '4')
    B(page, 'Send 4 texts').click()
    check(wait_done(page, 150), 'the run finishes')
    lg = page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")
    print(lg)
    S = dict(sent(page))
    check(sorted(S.keys()) == sorted([DEEDE, BOB, GUS, HAL]), 'four customers texted, each once: %s' % sorted(S.keys()))
    check('Hi Deede,' in S[DEEDE] and 'already be in Magee' in S[DEEDE] and 'Hi Gus,' in S[GUS] and 'water heater' in S[GUS], 'each got their own text')
    check(S[BOB].endswith(' Tell Mary I said hello.'), 'Bob got the text as you changed it')
    check('Jon Poe' in lg and 'left out by you' in lg and JON not in S, 'the one left out is listed and not texted')
    check('{' not in ''.join(S.values()), 'no fill-in left unfilled')
    L = ledger(page)
    check(sorted(e['num'] for e in L) == sorted([DEEDE, BOB, GUS]), 'what was offered is kept for the three that went out (Hal\'s failed to send): %s' % [e['num'] for e in L])
    check([o['day'] + ' ' + o['win'] for o in next(e for e in L if e['num'] == DEEDE)['opts']] == [D[2]['iso'] + ' 12-5', D[3]['iso'] + ' 12-5'], "with each customer's times")
    B(page, '← Back').click()
    t = panel_text(page)
    check(D[2]['short'] + ' · 12–5 PM · 1 spot · out to 3' in t and 'Check replies to offers (3 out)' in t, 'the openings show how many they\'re out to')

    # ---- 📥 Check replies to offers ----
    reply(page, DEEDE, '2 please')
    reply(page, BOB, D[3]['weekday'] + ' works for me, thanks')
    lg = run_check(page)
    print(lg)
    pk = section(lg, '✅ Picked a time (2)')
    check('Deede Oubre' in pk and 'Picked 2: ' + D[3]['short'] + ' · 12–5 PM' in pk and '2 please' in pk, 'Deede answered 2: her second time')
    check('Bob Smith' in pk and pk.count('Picked 2: ' + D[3]['short']) == 2, 'Bob named the day: the time offered that day')
    check(pk.count('2 picked this time and it has 1 spot') == 2, 'more picks than spots is flagged on both')
    nr = section(lg, '💤 No reply yet (1)')
    check('Gus Ray' in nr and 'Offered today' in nr and '1: ' + D[2]['short'] in nr, 'Gus hasn\'t answered: listed with what he was offered')
    check('Nothing is booked from here' in panel_text(page), 'it says nothing is booked from here')
    check(len(sent(page)) == 4, 'checking sent nothing')

    # A reply that needs reading, set right by you; an unread reply stays unread
    B(page, '← Back').click()
    reply(page, GUS, 'Can he come Saturday at 3 instead?', unread=True)
    lg = run_check(page)
    print(lg)
    lk = section(lg, '⚠️ Needs a look (1)')
    check('Gus Ray' in lk and 'Can he come Saturday at 3 instead?' in lk and 'Offered 1: ' + D[2]['short'] in lk, 'Gus asked for something else: Needs a look, with his words and what he was offered')
    check(page.evaluate("n => window.CHATS[n].unread", GUS) is True, 'his unread conversation stays unread')
    cust_card(page, 'Gus Ray').locator('button', has_text='→ 1').click()
    lg = report(page)
    check('Gus Ray' in section(lg, '✅ Picked a time (3)') and 'Set by you: 1: ' + D[2]['short'] + ' · 12–5 PM' in lg, '→ 1 moves him to Picked a time')
    check(next(e for e in ledger(page) if e['num'] == GUS).get('pick') == 0, 'and it\'s remembered')
    cust_card(page, 'Gus Ray').locator('button', has_text='↩ Not picked').click()
    check('Gus Ray' in section(report(page), '⚠️ Needs a look (1)'), '↩ Not picked puts him back')
    cust_card(page, 'Gus Ray').locator('button', has_text='→ 1').click()

    # ✓ Booked: off the list, and a spot off that opening
    cust_card(page, 'Deede Oubre').locator('button', has_text='✓ Booked').click()
    lg = report(page)
    check('Deede Oubre' not in lg and sorted(e['num'] for e in ledger(page)) == sorted([BOB, GUS]), '✓ Booked takes Deede off the list')
    check(next(x for x in saved_slots(page) if x['day'] == D[3]['iso'])['spots'] == 0, 'and one spot off the time she picked')
    check('This time is no longer' not in lg, 'a full time is still a known time')
    B(page, '← Back').click()
    check(D[3]['short'] + ' · 12–5 PM · full' in panel_text(page), 'the opening shows as full')

    # A hold booked in ServiceTitan since leaves the list by itself; STOP is a no
    page.evaluate("() => { window.HOLD_GONE = { 5009: true }; }")
    reply(page, BOB, 'STOP')
    lg = run_check(page)
    print(lg)
    gone = section(lg, '📗 Off the Hold list (booked or closed) (1)')
    check('Gus Ray' in gone and 'one spot off ' + D[2]['short'] + ' · 12–5 PM' in gone, 'Gus was booked in ServiceTitan: off the list, and a spot off the time set for him')
    check('Bob Smith' in section(lg, '🚫 Said no or opted out (1)') and 'STOP' in lg, 'Bob replied STOP: Said no')
    check([e['num'] for e in ledger(page)] == [BOB], 'only Bob is still on the list')
    page.locator('#st-toolbox button:visible', has_text='Said no or opted out').click()   # the section is folded
    cust_card(page, 'Bob Smith').locator('button', has_text='🗑 Forget').click()
    check(ledger(page) == [], '🗑 Forget takes him off')
    B(page, '← Back').click()

    # ---- No opening left for someone: skipped, saying so ----
    page.evaluate("() => { Object.keys(window.CHATS).forEach(k => { if (['6015550102', '5045550001', '6015550009', '6015550010'].indexOf(k) > -1) delete window.CHATS[k]; }); window.HOLD_GONE = {}; window.SENT.length = 0; }")
    for i in range(3, -1, -1):
        page.locator('#st-ct-offer-times .st-ct-slot').nth(i).locator('button', has_text='✕').click()
    check(page.locator('#st-ct-offer-times .st-ct-slot').count() == 0 and page.locator('#st-toolbox button:visible', has_text='Review each text').first.is_disabled(), 'with no openings, nothing can be started')
    add_time(page, D[2]['iso'], '8-12', 1)
    page.select_option('#st-ct-offer-per', '2')
    B(page, '↻ Reload').click()
    page.wait_for_function("() => /Loaded \\d+ hold/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    t = review(page)
    C = cards(page)
    # Gus doesn't want mornings, but a morning is all there is: he's offered it, and the card says so
    check(sorted(C.keys()) == ['5001', '5002'], 'one spot offered to up to 2 customers: two cards: %s' % sorted(C.keys()))
    check('3 no opening left to offer them' in t and all(n in t.split('Skipping')[1] for n in ['Gus Ray', 'Hal Fry', 'Jon Poe']), 'the other three are skipped, saying why')
    check('no opening like that' in C['5001']['all'] and ('reply 1 for %s between 8 AM and 12 PM. If none' % D[2]['long']) in C['5001']['text'], 'Deede wanted an afternoon and there is none: offered the morning, and the card says so')
    B(page, 'Cancel').click()

    # ---- Type only: the text typed is that customer's own; pressing Send keeps the offer ----
    page.locator('#st-toolbox label:visible', has_text='Type only').locator('input').check()
    page.select_option('#st-ct-offer-n', '1')
    t = review(page)
    card(page, '5002').locator('button', has_text='✕ Leave out').click()
    B(page, 'Start').click()
    page.wait_for_function("() => /Typed to Deede Oubre/.test(document.getElementById('st-toolbox').innerText)", timeout=15000)
    typed = page.evaluate("() => document.querySelector('textarea.cht-response-input').value")
    check(typed.startswith('Hi Deede, this is Andrew') and ('reply 1 for %s between 8 AM and 12 PM.' % D[2]['long']) in typed, 'her own text is typed into the chat box')
    page.click('.chat button[type=submit]')
    check(wait_done(page, 60), 'type-only run finishes after Send')
    check([e['num'] for e in ledger(page)] == [DEEDE] and len(ledger(page)[0]['opts']) == 1, 'the offer is kept once you press Send')
    B(page, '← Back').click()
    reply(page, DEEDE, 'Yes that works')
    lg = run_check(page)
    check('Deede Oubre' in section(lg, '✅ Picked a time (1)') and 'Picked 1: ' + D[2]['short'] in lg, '"Yes" to one time picks it')
    B(page, '← Back').click()

    # ---- {options} only works in a folder that offers times; a folder can be made one ----
    page.evaluate("() => { const f = JSON.parse(localStorage.getItem('stCtFolders') || 'null'); }")
    B(page, '⏸️ Holds').click()
    B(page, '✏️ Edit messages').click()
    check('{options}' in panel_text(page) and '{about}' in panel_text(page), 'Edit messages explains {options} and {about}')
    page.locator('#st-toolbox textarea:visible').first.fill('Hi {first}, about {about}: reply {options}.')
    B(page, 'Save').click()
    check('only works in a folder that offers times' in panel_text(page), 'a message with {options} in another folder says it won\'t work there')
    B(page, '📁 Edit folders').click()
    box = page.locator('#st-toolbox label:visible', has_text='Offers times: customers reply 1 or 2')
    check(box.count() >= 5 and not box.first.locator('input').is_checked() and box.last.locator('input').is_checked(), 'Edit folders has the tick: on for Offer times, off for the others')
    box.first.locator('input').check()
    B(page, 'Save').click()
    B(page, '⏸️ Holds').click()
    t = panel_text(page)
    check('🗓️ Times to offer' in t and 'only works in a folder' not in t, 'ticked: the Holds folder offers times now')
    check(json.loads(page.evaluate("() => localStorage.getItem('stCtOfferFolders')")) == ['holds', 'offertimes'], 'saved')

    # A message without {options} in an offer folder
    B(page, '✏️ Edit messages').click()
    page.locator('#st-toolbox textarea:visible').first.fill('Hi {first}, call us.')
    B(page, 'Save').click()
    check('has no {options}' in panel_text(page), 'an offer folder\'s message without {options} says so')

    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
