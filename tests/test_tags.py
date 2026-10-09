import sys, time, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_texts.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first

def panel(page):
    return page.locator('#st-toolbox').inner_text()

SETUP = r"""
() => {
  // A tag list in the page data, like ServiceTitan keeps its other lists.
  window.App.Data.TagTypes = [
    { Id: 11, Name: '12-5 AFTERNOON', Color: '#f0a020', Active: true },
    { Id: 12, Name: '12-5 Update Completed', Color: '#5bc0de', Active: true },
    { Id: 13, Name: 'UPDATED ETA VIA PHONE', Color: '#2e7d32', Active: true },
    { Id: 14, Name: 'Permit Required', Color: 'red;background:url(x)', Active: true },
    { Id: 16, Name: 'Job Square #36', Color: '#ee0', Active: true },
    { Id: 21, Name: 'Rescheduled x1', Color: '#55f', Active: true },
    { Id: 22, Name: 'Rescheduled x2', Color: '#55f', Active: true },
    { Id: 23, Name: 'Rescheduled x3', Color: '#55f', Active: true },
    { Id: 31, Name: 'No Show x1', Color: '#a33', Active: true },
    { Id: 15, Name: 'Old Tag', Color: '#999', Active: false }
  ];
  // Job tags in the Edit Job data (ids only), and a customer tag that must be ignored.
  window.JOB_TAGS = { 6001: [11, 21], 6002: [11, 12, 23], 6003: [] };
  const prev = window.fetch;
  window.fetch = async (url, opts) => {
    const u = String(url);
    const m = /^\/Job\/Edit\/(\d+)/.exec(u);
    if (m) {
      window.editReads = (window.editReads || 0) + 1;
      if (!(m[1] in window.JOB_TAGS)) return new Response('{}', { status: 404 });
      return new Response(JSON.stringify({ Id: Number(m[1]), BusinessUnit: 'Mendenhall Branch', TagTypeIds: window.JOB_TAGS[m[1]], Customer: { TagTypeIds: [99] } }), { status: 200 });
    }
    return prev(url, opts);
  };
  window.SAVES = [];
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate(SETUP)
    page.evaluate(TOOLBOX)

    check(B(page, 'Tags (test)').count() == 1, 'menu has Tags (test)')
    B(page, 'Tags (test)').click()
    t = panel(page)
    check('Test copy' in t, 'test-copy note shown')
    check('All tags (9)' in t, 'loads 9 active tags from page data (inactive left out)')
    check('Old Tag' not in t, 'inactive tag hidden')
    check("from ServiceTitan's tag list (App.Data.TagTypes)" in t, 'source shown')
    bad_style = page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox span')).some(s => /url\\(/.test(s.getAttribute('style') || ''))")
    check(not bad_style, 'unsafe color value never reaches a style')

    # search
    page.fill('#st-toolbox input[type=search]', '12-5')
    t = panel(page)
    check('12-5 AFTERNOON' in t and '12-5 Update Completed' in t and 'Permit Required' not in t, 'search narrows the list')
    # choose two tags
    page.locator('#st-toolbox div', has_text='12-5 Update Completed').last.click()
    page.fill('#st-toolbox input[type=search]', 'eta')
    page.locator('#st-toolbox div', has_text='UPDATED ETA VIA PHONE').last.click()
    page.fill('#st-toolbox input[type=search]', '')
    t = panel(page)
    check('Tags (2 chosen)' in t, 'two tags chosen at once')
    # set 12-5 Update Completed to take off? No: choose 12-5 AFTERNOON to take off instead
    page.locator('#st-toolbox span[title^="Unchoose"]').first.click()
    page.fill('#st-toolbox input[type=search]', 'afternoon')
    page.locator('#st-toolbox div', has_text='12-5 AFTERNOON').last.click()
    page.fill('#st-toolbox input[type=search]', '')
    page.locator('#st-toolbox span[title^="Set to add"]').last.click()
    t = panel(page)
    check('➖' in t and '➕' in t, 'one tag set to take off, one to add')
    check('Rescheduled' in t and 'x1–x3' in t and 'No Show' in t, 'count-up families found')
    fams = page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox label')).filter(l => l.offsetParent).map(l => l.textContent)")
    check(not any('Job Square' in f for f in fams), 'Job Square #36 is not a count-up family: ' + str(fams))
    page.locator('#st-toolbox label', has_text='Rescheduled').locator('input').check()
    check(page.evaluate("() => JSON.parse(localStorage.getItem('stTagCounters'))") == ['rescheduled'], 'count-up choice remembered')

    # favorite
    page.locator('#st-toolbox span[title="Add to favorites"]').first.click()
    t = panel(page)
    check('⭐ Favorites' in t, 'favorites group appears')
    check(page.evaluate("() => JSON.parse(localStorage.getItem('stTagFavs')).length") == 1, 'favorite saved')

    # Add tags is off
    check(page.locator('#st-toolbox button:visible', has_text='Change tags').first.is_disabled(), 'Change tags is switched off')

    # pick jobs by typing (one unknown)
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '6001 6002 6003 7777')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='Change').first.click()
    check('4 jobs picked' in panel(page), 'jobs picked')
    B(page, 'Check jobs').click()
    page.wait_for_function("() => /Nothing was changed\\./.test(document.getElementById('st-toolbox').innerText)", timeout=20000)
    log = page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")
    check('now: 12-5 AFTERNOON, Rescheduled x1\n   would take off: 12-5 AFTERNOON, Rescheduled x1\n   would add: UPDATED ETA VIA PHONE, Rescheduled x2' in log, 'x1 -> x2 plus add and take off')
    check('would take off: 12-5 AFTERNOON\n   would add: UPDATED ETA VIA PHONE\n   ⚠️ no "Rescheduled x4" tag in ServiceTitan, so Rescheduled is left as it is' in log, 'x3 with no x4: left alone and said so')
    check('now: (no tags)\n   would add: UPDATED ETA VIA PHONE, Rescheduled x1' in log, 'no reschedule tag yet -> x1')
    check('#7777' in log and "couldn't read" in log, 'unknown job reported, not guessed')
    check('Read from: Edit Job data (TagTypeIds)' in log, 'reads the job tags field, not the customer one')
    check('Summary: 3 jobs would change' in log, 'summary')
    check(page.evaluate("() => JSON.parse(localStorage.getItem('stTagRecent')).length") == 2, 'recently used saved')
    # panel header stays on screen
    check(page.evaluate("() => document.querySelector('#st-toolbox').getBoundingClientRect().top >= 0"), 'panel header stays on screen')

    # Find tags report
    B(page, 'Find tags').click()
    page.wait_for_function("() => /tag report/.test(Array.from(document.querySelectorAll('#st-toolbox pre')).map(p => p.textContent).join(''))", timeout=10000)
    rep = page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")
    check('App.Data.TagTypes: list of 10' in rep, 'report names the tag list')
    check('TagTypeIds: list of 2 (numbers)' in rep, 'report names the job tags field')
    check('Deede' not in rep and 'Kim Wu' not in rep and '555' not in rep, 'no customer details in the report')

    # Recorder: a save-type request while on is noted with field names; off again afterwards
    B(page, 'Watch me add a tag').click()
    check(page.evaluate("() => window.fetch.toString().indexOf('note(') > -1"), 'recording is on')
    page.evaluate("""() => { const x = new XMLHttpRequest(); x.open('POST', '/Job/SaveTags/6001'); x.send(JSON.stringify({ JobId: 6001, CustomerName: 'Kim Wu', TagTypeIds: [11, 12] })); }""")
    time.sleep(0.3)
    B(page, 'Stop recording').click()
    time.sleep(0.3)
    rec = page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox pre')).filter(p => p.offsetParent).map(p => p.textContent).join('\\n')")
    check('POST /Job/SaveTags/<id>' in rec, 'recording notes the address with ids hidden')
    check('TagTypeIds = [11,12]' in rec and 'CustomerName' in rec and 'Kim Wu' not in rec, 'field names only, tag values kept, customer value hidden')
    check(page.evaluate("() => window.fetch.toString().indexOf('note(') < 0"), 'recording off: fetch put back')

    # close cleans up
    page.evaluate("() => document.querySelector('#st-toolbox span[title=Close]').click()")
    check(page.locator('#st-toolbox').count() == 0, 'closes')
    check(not errors, 'no page errors: ' + '; '.join(errors))
    b.close()
print('\n%d failed' % len(fails))
sys.exit(1 if fails else 0)
