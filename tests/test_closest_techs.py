"""🧭 Closest Techs on a fake Dispatch board: techs' homes and today's jobs, zip codes' middle points
from a fake US Census map service, and drive times from a fake Mapbox with a river that's slow to
cross (so the closest in a straight line isn't the closest by road)."""
import sys, time, pathlib, json, re
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_near.html').as_uri()
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
def names(page):
    return ev(page, "() => Array.from(document.querySelectorAll('#st-toolbox .st-near-card')).filter(c => c.offsetParent).map(c => c.children[0].children[1].textContent)")
def cards(page):
    return ev(page, "() => Array.from(document.querySelectorAll('#st-toolbox .st-near-card')).filter(c => c.offsetParent).map(c => c.innerText)")
def msg(page):
    return ev(page, "() => document.querySelector('#st-near-input').closest('div').previousElementSibling.textContent")
def settle(page, before_calls=None):
    # Wait until a look has finished (cards or a message that isn't "Finding" / "Getting").
    end = time.time() + 15
    time.sleep(0.2)
    while time.time() < end:
        m = msg(page)
        if not re.search(r'Finding|Getting drive times', m): break
        time.sleep(0.1)
    time.sleep(0.2)
def find_zip(page, z):
    page.select_option('#st-near-kind', 'zip')
    page.fill('#st-near-input', z)
    B(page, 'Find').click()
    settle(page)
def find_job(page, j):
    page.select_option('#st-near-kind', 'job')
    page.fill('#st-near-input', j)
    B(page, 'Find').click()
    settle(page)
def measure(page, which):
    page.locator('#st-toolbox input[name="st-near-from"][value="%s"]' % which).check()
    settle(page)
def team(page, name):
    page.select_option('#st-near-team', name)
    settle(page)

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 1000})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('.technician')
    page.evaluate(TOOLBOX)
    check(B(page, 'Closest Techs').count() == 1, 'menu has Closest Techs')
    B(page, 'Closest Techs').click()
    time.sleep(0.3)
    teams = ev(page, "() => Array.from(document.querySelectorAll('#st-near-team option')).map(o => o.textContent)")
    check(teams == ['Departments with jobs that day', 'Every department', 'Level 1 Service', 'Installers', 'Dispatch'], 'departments from the board, in its order: %s' % teams)
    check('nothing changes' in T(page), 'says it only reads')

    # ---- No drive-time key yet: straight-line guesses, and nothing sent to Mapbox ----
    check('Drive-time key: not added' in T(page), 'no drive-time key to start with')
    measure(page, 'home')
    find_zip(page, '39114')
    check(names(page)[0] == 'Ana R' and 'No drive-time key added' in T(page) and '~' in T(page), 'without a key: straight-line guesses, said plainly')
    check(ev(page, "() => window.mbCalls.length") == 0, 'nothing sent to Mapbox without a key')

    # ---- 🔑 Drive-time key: checked with Mapbox, saved in this browser ----
    B(page, 'Drive-time key').click()
    page.fill('#st-near-key', 'sk.secret.key')
    B(page, 'Save').click()
    check('secret key (sk.)' in T(page) and not ev(page, "() => localStorage.getItem('stNearKey')"), 'a secret key is refused')
    page.fill('#st-near-key', 'hello')
    B(page, 'Save').click()
    check("doesn't look like a Mapbox public key" in T(page), 'something that isn\'t a key is refused')
    ev(page, "() => { window.MB_DOWN = true; }")
    page.fill('#st-near-key', 'pk.test-user.test-key')
    B(page, 'Save').click()
    page.wait_for_function("() => !/Checking it/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    check("didn't accept it" in T(page) and not ev(page, "() => localStorage.getItem('stNearKey')"), 'a key Mapbox refuses is not saved')
    ev(page, "() => { window.MB_DOWN = false; }")
    B(page, 'Save').click()
    page.wait_for_function("() => /Saved\\. Drive times are on/.test(document.getElementById('st-toolbox').innerText)", timeout=10000)
    check(ev(page, "() => localStorage.getItem('stNearKey')") == 'pk.test-user.test-key' and 'Drive-time key: added' in T(page), 'a key Mapbox accepts is saved')
    settle(page)
    check(names(page) == ['Ben T', 'Fay H', 'Gus K'], 'saving the key looks again with drive times: %s' % names(page))
    ev(page, "() => { window.mbCalls = []; }")

    # ---- From home, a zip code: ranked by drive time, not straight line ----
    find_zip(page, '39114')
    n = names(page)
    print(cards(page))
    check(n == ['Ben T', 'Fay H', 'Gus K'], 'top 3 by drive time: %s' % n)
    check('Ana R' not in n, 'Ana (closest in a straight line, across the river) is not in the top 3')
    t = T(page)
    check('Closest to 39114' in t, 'says what it measured to')
    check('from home (Braxton)' in t and 'by road' in t, 'shows the town (BRAXTON tidied) and road miles')
    check(not re.search(r'Oak St|Pine Rd|Elm Dr|Cedar Ln|Ash St|Birch Ct|Main St|Secret Rd', t), 'no street address shown')
    check('Can\'t place 1 tech' in t and 'Eli G' in t, 'a tech with no home address is listed as can\'t place')
    check('Ivy N' not in t, 'inactive tech left out')
    check('Mapbox' in t and 'zip code' in t, 'says where drive times and places come from')
    B(page, 'Show more').click()
    n = names(page)
    check(n == ['Ben T', 'Fay H', 'Gus K', 'Cal M', 'Dee F', 'Ana R'], 'Show more: everyone placed, closest first, the Dispatch team (no jobs today) left out: %s' % n)
    check('from home (Florence)' in T(page), 'a home with no map point uses its zip code (town from the address, not the unit)')
    check(B(page, 'Show fewer').count() == 1, 'Show fewer offered')
    B(page, 'Show fewer').click()
    check(len(names(page)) == 3, 'back to 3')
    check(B(page, 'Assign').count() == 0, 'no Assign for a zip code')

    # ---- What was sent where ----
    mb = ev(page, "() => window.mbCalls")
    check(0 < len(mb) <= 10, 'at most 10 drive times asked for (%d)' % len(mb))
    coords_ok = all(re.search(r'driving-traffic/(-?\d+(\.\d{1,2})?),(-?\d+(\.\d{1,2})?);(-?\d+(\.\d{1,2})?),(-?\d+(\.\d{1,2})?)\?', c['url']) for c in mb)
    check(coords_ok, 'every point sent to Mapbox is rounded to 2 decimals (about half a mile)')
    check(all(c['credentials'] == 'omit' for c in mb), 'no cookies sent to Mapbox')
    zc = ev(page, "() => window.zctaCalls")
    sent = ' '.join(c['url'] for c in mb + zc)
    check(not re.search(r'Oak|Pine|Elm|Cedar|Ash|Birch|Main|Secret|Ana|Ben|Kay|Lin', sent), 'no names or streets in anything sent outside ServiceTitan')
    check(len(zc) == 1 and all(c['credentials'] == 'omit' for c in zc), 'zip codes looked up in one request, without cookies (%d)' % len(zc))
    saved = ev(page, "() => JSON.parse(localStorage.getItem('stZipPoints') || '{}')")
    check('39114' in saved and '39073' in saved, 'zip code points saved in this browser')
    body = ev(page, "() => window.dataCalls[window.dataCalls.length - 1]")
    check(body['filter']['businessUnitIds'] == [1] and body['filter']['teamIds'] == [], "the board's branches, no team filter: %s" % body['filter'])

    # ---- The same zip again: nothing new looked up ----
    ev(page, "() => { window.zctaCalls = []; }")
    find_zip(page, '39114')
    check(ev(page, "() => window.zctaCalls.length") == 0, 'saved zip codes are not looked up again')
    team(page, '*')
    B(page, 'Show more').click()
    check('Hal L' in names(page) and 'every department' in T(page), 'Every department includes the Dispatch team: %s' % names(page))
    team(page, '')

    # ---- Where they are now ----
    measure(page, 'now')
    n = names(page)
    print(cards(page))
    check(n == ['Ben T', 'Gus K', 'Fay H'], 'now: top 3 by drive time: %s' % n)
    t = T(page)
    check('finished a job in Braxton' in t, 'a tech who finished a job is measured from it')
    check('on the way to a job in Pinola' in t, 'a Dispatched tech is measured from the job they\'re heading to')
    check('from home (Braxton)' in t, 'a tech with only a canceled job is measured from home')
    B(page, 'Show more').click()
    t = T(page)
    check('working a job in Magee' in t, 'a Working tech is measured from that job')
    check('Can\'t place' not in t, 'everyone placed (the tech with no home is working a job)')
    check('2 jobs today' in t, 'jobs today counted (canceled left out)')

    # ---- A department ----
    team(page, 'Installers')
    n = names(page)
    check(n == ['Fay H', 'Cal M', 'Dee F'], 'Installers only: %s' % n)
    check('· Installers' in T(page), 'says which department')
    check(ev(page, "() => localStorage.getItem('stNearTeam')") == 'Installers', 'department remembered')
    team(page, '')

    # ---- A job picked on the board ----
    B(page, 'Pick a job on the board').click()
    check('Picking' in T(page), 'picking on')
    page.click('tr.qa-job-8001 td >> nth=1')
    settle(page)
    check(ev(page, "() => window.opened.length") == 0, 'the click went to the Toolbox, not the board')
    t = T(page)
    print(cards(page))
    check('Closest to job #8001 Kay Lin (Magee 39111)' in t, 'job, customer and town in the heading')
    n = names(page)
    check(n[:2] == ['Eli G', 'Ana R'], 'the tech working in Magee, then the one living there: %s' % n)
    check('same zip code · working a job in Magee' in t, 'a tech in the job\'s own zip code says so (not "0.0 mi")')
    check('Pick a job on the board' in T(page), 'picking turns off after one job')
    css = ev(page, "() => Array.from(document.querySelectorAll('style')).map(s => s.textContent).join(' ')")
    check('qa-job-8001' in css, 'the job is highlighted on the board')
    check(B(page, 'Assign').count() == 1, 'Assign offered for a job')

    # ---- Directions ----
    page.locator('#st-toolbox .st-near-card:visible', has_text='Ana R').locator('button', has_text='Directions').click()
    o = ev(page, "() => window.opened.slice()")
    check(len(o) == 1 and o[0].startswith('https://www.google.com/maps/dir/?api=1') and 'origin=31.9,-89.75' in o[0] and '39111' in o[0], 'Directions opens Google Maps with a rounded start: %s' % o)
    ev(page, "() => { window.opened = []; }")

    # ---- Assign hands the job to Move Jobs ----
    page.locator('#st-toolbox .st-near-card:visible', has_text='Ana R').locator('button', has_text='Assign').click()
    time.sleep(0.5)
    t = T(page)
    check('Move Jobs' in t and 'Closest Techs: 1 job to Ana R' in t, 'Move Jobs opened with a note: %s' % t[:200])
    check(ev(page, "() => document.getElementById('st-move-to').value") == '201', 'To is Ana R')
    check(ev(page, "() => document.querySelector('input[name=st-move-mode][value=move]').checked"), 'Move to a tech chosen')
    check('#8001' in t, 'job 8001 picked')
    check(ev(page, "() => window.calls.length") == 0, 'nothing changed yet')
    B(page, 'Review').click()
    page.wait_for_function("() => { const b = document.getElementById('st-move-go'); return b && b.offsetParent; }", timeout=15000)
    t = T(page)
    check('Ana R' in t and 'Ready: 1 job' in t, 'Move Jobs review shows it')
    page.click('#st-move-go')
    page.wait_for_function("() => /Done:/.test(document.getElementById('st-toolbox').innerText)", timeout=20000)
    check(ev(page, "() => APPTS[9801].techs.slice()") == [201], 'job assigned to Ana R after Move')
    B(page, '← Menu').click()
    B(page, 'Closest Techs').click()
    time.sleep(0.3)

    # ---- A typed job that isn't on the board ----
    find_job(page, '8010')
    t = T(page)
    check('Closest to job #8010' in t and 'Florence 39073' in t, 'a job from another day is found from its job panel: %s' % t[:300])
    check('Secret Rd' not in t, 'still no street address')
    find_job(page, '8011')
    check('has no zip code' in msg(page), 'a job with no zip code says so: %s' % msg(page))
    find_job(page, '999999')
    check("Couldn't find job #999999" in msg(page), 'a job number that isn\'t there says so: %s' % msg(page))
    check(not ev(page, "() => /ServiceTitan may have changed/.test(document.getElementById('st-toolbox').innerText)"), 'no yellow bar for a mistyped job number')

    # ---- Zip codes it can't use ----
    page.select_option('#st-near-kind', 'zip')
    page.fill('#st-near-input', '3911')
    B(page, 'Find').click()
    check('5-digit zip' in msg(page), 'a short zip is caught')
    find_zip(page, '39999')
    check("isn't a zip code the US Census knows" in msg(page), 'an unknown zip says so: %s' % msg(page))
    ev(page, "() => { window.ZCTA_DOWN = true; localStorage.removeItem('stZipPoints'); }")
    find_zip(page, '39201')
    check("Couldn't look up where 39201 is" in msg(page), 'Census service down says so: %s' % msg(page))
    ev(page, "() => { window.ZCTA_DOWN = false; }")

    # ---- Mapbox down: straight-line guesses, said plainly ----
    measure(page, 'home')
    ev(page, "() => { window.MB_DOWN = true; }")
    find_zip(page, '39114')
    n = names(page)
    t = T(page)
    check(n[0] == 'Ana R', 'without drive times, straight line ranks (Ana first): %s' % n)
    check("Drive times aren't available right now" in t and '~' in t and 'straight line' in t, 'guesses marked ~ and explained')
    ev(page, "() => { window.MB_DOWN = false; window.MB_FAIL_FROM = '-89.9,32.05'; }")
    find_zip(page, '39114')
    t = T(page)
    check("1 drive time couldn't be had" in t, 'one missing drive time is called out')
    ev(page, "() => { window.MB_FAIL_FROM = null; }")

    # ---- The board on another day: everyone from home ----
    measure(page, 'now')
    ev(page, "() => { window.BOARD_TOMORROW = true; render(); }")
    time.sleep(0.3)
    find_zip(page, '39114')
    t = T(page)
    check('so everyone is measured from home' in t, 'another day: says everyone is measured from home')
    check('finished a job' not in t and 'working a job' not in t, 'no "now" places on another day')
    ev(page, "() => { window.BOARD_TOMORROW = false; render(); }")
    time.sleep(0.3)

    # ---- ServiceTitan's data in a shape it doesn't know ----
    ev(page, "() => { window.DISPATCH_DRIFT = true; }")
    find_zip(page, '39114')
    check("Couldn't find the closest techs" in msg(page), 'unknown board data stops with a message')
    check(ev(page, "() => /Closest Techs: can't read where the techs are/.test(document.getElementById('st-toolbox').innerText)"), 'and the yellow bar names the tool')
    ev(page, "() => { window.DISPATCH_DRIFT = false; }")
    find_zip(page, '39114')
    check(len(names(page)) == 3, 'works again once the data is readable')

    # ---- Removing the key ----
    B(page, 'Remove').click()
    check(not ev(page, "() => localStorage.getItem('stNearKey')") and 'Drive-time key: not added' in T(page), 'key removed')

    # ---- Leaving the tool ----
    B(page, '← Menu').click()
    css = ev(page, "() => Array.from(document.querySelectorAll('style')).map(s => s.textContent).join(' ')")
    check('qa-job-8001' not in css, 'highlight gone when the tool is closed')

    check(not errors, 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails))
sys.exit(1 if fails else 0)
