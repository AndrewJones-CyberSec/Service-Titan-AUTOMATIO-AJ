"""The install page (index.html): the bookmark, the version and what's new read from toolbox.js,
the version history read from CHANGELOG.md, and the demo Toolbox in the hero (each tool, picking
jobs and techs on the sample board, Move Jobs moving a card and putting it back, fold, close and
open again, making it wider). Also: phone width with no sideways scrolling, dark mode, reduced
motion, and the page still readable with JavaScript off.

The page is served from this repo on a local web server, like GitHub Pages serves it.
SHOTS=<folder> saves screenshots there."""
import sys, os, re, time, pathlib, threading, functools, http.server
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
REPO = HERE.parent
SHOTS = os.environ.get('SHOTS')
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

src = (REPO / 'toolbox.js').read_text()
VERSION = re.search(r"VERSION\s*=\s*'([^']+)'", src).group(1)
NEWS = re.search(r"'" + re.escape(VERSION) + r"'\s*:\s*'((?:[^'\\]|\\.)*)'", src).group(1).replace("\\'", "'")
CHANGES = (REPO / 'CHANGELOG.md').read_text()
N_VERSIONS = len(re.findall(r'^## ', CHANGES, re.M))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(REPO)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/index.html' % srv.server_address[1]

def ev(page, js, arg=None):
    return page.evaluate(js, arg) if arg is not None else page.evaluate(js)
def P(page):
    return page.locator('#panel').inner_text()
def pbtn(page, text):
    return page.locator('#panel button:visible', has_text=text).first
def tool(page, name):
    if pbtn(page, '← Menu').count(): pbtn(page, '← Menu').click()
    page.locator('#panel .tile', has_text=name).click()
def job(page, j):
    page.locator('#board [data-job="%s"]' % j).click()
def lane_of(page, j):
    return ev(page, "(j) => document.querySelector('[data-job=\"' + j + '\"]').closest('[data-lane]').getAttribute('data-lane')", j)
def outlined(page, j):
    return ev(page, "(j) => document.querySelector('[data-job=\"' + j + '\"]').classList.contains('pk')", j)
def wide(page):
    return ev(page, "() => document.documentElement.scrollWidth > innerWidth + 1")
def shot(page, name, full=False, el=None):
    if SHOTS:
        pathlib.Path(SHOTS).mkdir(parents=True, exist_ok=True)
        (page.locator(el) if el else page).screenshot(path=os.path.join(SHOTS, name + '.png'), **({} if el else {'full_page': full}))

def page_for(b, **kw):
    page = b.new_page(**{'viewport': {'width': 1280, 'height': 860}, **kw})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route(re.compile(r'^https?://(fonts\.googleapis\.com|fonts\.gstatic\.com|raw\.githubusercontent\.com)/'), lambda r: r.abort())
    page.goto(URL)
    return page, errors

with sync_playwright() as p:
    b = p.chromium.launch()

    # ================= The page itself =================
    page, errors = page_for(b)
    page.wait_for_function("() => document.querySelectorAll('.ver').length > 0", timeout=10000)
    bm = ev(page, "() => document.getElementById('bm').getAttribute('href')")
    check(bm.startswith('javascript:') and '/toolbox.js' in bm, 'the bookmark loads toolbox.js from this site')
    check(ev(page, "() => document.getElementById('code').value") == bm, 'the copy-and-paste bookmark is the same one')
    check(ev(page, "() => [document.getElementById('ver').textContent, document.getElementById('p-ver').textContent, document.getElementById('latest-ver').textContent]") == ['v' + VERSION] * 3,
          'version from toolbox.js in the header, the demo and What\'s new (v%s)' % VERSION)
    check(ev(page, "() => document.getElementById('latest-text').textContent") == NEWS, 'the latest update is the Toolbox\'s own what\'s-new text')
    page.locator('#bm').click()
    check('Drag it up' in page.locator('#clickHint').inner_text(), 'clicking the bookmark says to drag it instead')

    # ---- Version history ----
    vers = ev(page, "() => Array.from(document.querySelectorAll('.ver')).map(d => [d.querySelector('.num').textContent, d.open, d.hidden])")
    check(len(vers) == N_VERSIONS, 'every version in the changelog is listed (%d)' % len(vers))
    check(vers[0][0] == VERSION and vers[0][1] and not vers[0][2], 'the newest (%s) is first and open' % vers[0][0])
    check(sum(1 for v in vers if not v[2]) == 6 and not any(v[1] for v in vers[1:]), 'six show to start with, only the newest open')
    gists = ev(page, "() => Array.from(document.querySelectorAll('.ver .gist')).map(g => g.textContent)")
    check(all(g and len(g) <= 90 for g in gists), 'each version has a short summary line')
    body = ev(page, "() => document.querySelector('.ver .ver-body').innerHTML")
    check('<b>' in body and '**' not in body and 'Tests:' not in body, 'notes formatted, test-only lines left out')
    check(ev(page, "() => Array.from(document.querySelectorAll('.ver-body')).every(b => !/<script|onerror=/i.test(b.innerHTML))"), 'nothing in the notes runs as code')
    page.locator('#more-versions').click()
    check(ev(page, "() => document.querySelectorAll('.ver[hidden]').length") == 0 and page.locator('#more-versions').count() == 0, 'Show all versions shows the rest')
    page.locator('.ver').nth(1).locator('summary').click()
    check(ev(page, "() => document.querySelectorAll('.ver')[1].open"), 'an older version opens with a click')
    shot(page, 'page_desktop', full=True)

    # ================= The demo =================
    check(ev(page, "() => document.querySelectorAll('#panel .tile').length") == 6, 'the demo menu has all six tools')
    page.locator('#board [data-job="j2"]').click()
    check('Open a tool first' in page.locator('#try').inner_text(), 'clicking a job on the menu says to open a tool first')
    shot(page, 'demo_menu', el='#shot')

    # 🔕 Job Notifications
    tool(page, 'Job Notifications')
    check(page.locator('#p-title').inner_text() == '🔕 Job Notifications', 'opens Job Notifications')
    check('3 jobs picked' in P(page) and all(outlined(page, j) for j in ('j2', 'j5', 'j8')), 'three jobs picked and outlined on the board')
    check(ev(page, "() => document.querySelector('[data-job=\"j8\"]').classList.contains('pk-off')"), 'a job with notifications off has a dashed outline')
    job(page, 'j3')
    check('4 jobs picked' in P(page) and outlined(page, 'j3'), 'clicking a job adds it')
    job(page, 'j3')
    check('3 jobs picked' in P(page) and not outlined(page, 'j3'), 'clicking it again takes it off')
    page.locator('#board [data-tech="t4"]').click()
    check('4 jobs picked' in P(page) and outlined(page, 'j7'), 'clicking a tech\'s name adds their day')
    shot(page, 'demo_notifications', el='#shot')
    pbtn(page, 'Turn off (3)').click()
    check('Turned off 3' in P(page) and 'Turn on (4)' in P(page), 'Turn off turns the on ones off')
    pbtn(page, 'Turn on (4)').click()
    check('Turned on 4' in P(page) and 'Turn off (4)' in P(page), 'Turn on turns them back on')

    # 💬 Tech Messages
    tool(page, 'Tech Messages')
    check(ev(page, "() => document.querySelector('[data-tech=\"t1\"]').classList.contains('pk')") and not outlined(page, 'j2'), 'Tech Messages highlights techs, not jobs')
    pbtn(page, 'Dispatched (1)').click()
    check('Blake W' in P(page), '＋ 🚚 Dispatched adds Blake W')
    page.locator('#board [data-tech="t3"]').click()
    check('Dana K' in P(page), 'clicking a tech\'s name adds them')
    pbtn(page, 'ETA').click()
    check("what's your ETA" in P(page), 'picking a message shows it')
    pbtn(page, 'Start (type only)').click()
    check('Typed to Jack W, Blake W and Dana K' in P(page), 'Start says who it typed to')

    # 🏢 Business Unit
    tool(page, 'Business Unit')
    pbtn(page, 'Check jobs').click()
    t = P(page)
    check('Hal Fry: Gulfport Branch → would change' in t and 'Kai Ruiz: already Mendenhall Branch' in t, 'Check jobs says what would change, nothing changed')
    pbtn(page, 'Change to Mendenhall Branch').click()
    check('1 job changed' in P(page) and 'Put back (1)' in P(page), 'Change changes it and offers Put back')
    pbtn(page, 'Put back (1)').click()
    check('Hal Fry: Gulfport Branch again' in P(page), 'Put back undoes it')
    page.select_option('#panel select', 'Tupelo Branch')
    check(pbtn(page, 'Change to Tupelo Branch').count() == 1, 'the button follows the branch picked')

    # 📱 Customer Texts
    tool(page, 'Customer Texts')
    check('appointment tomorrow' in P(page) and 'Reply C' in P(page), 'Confirm Appt shows its message with {when} filled in')
    pbtn(page, 'Everyone on the board').click()
    check('10 customers' in P(page) and outlined(page, 'j10'), '＋ Everyone on the board adds every job')
    pbtn(page, 'Review and send to 10').click()
    check('Will text 8 customers' in P(page) and 'already confirmed' in P(page), 'Review skips who\'s already confirmed')
    pbtn(page, 'Send 8 texts').click()
    check('Sent 8 texts' in P(page), 'Send says it sent them')
    pbtn(page, 'Check replies').click()
    check('6 confirmed' in P(page) and '2 need a look' in P(page), 'Check replies sorts the answers')
    pbtn(page, 'OutReach').click()
    check('Reply STOP to opt out' in P(page), 'each folder shows its own message')

    # 🔀 Move Jobs
    tool(page, 'Move Jobs')
    check(lane_of(page, 'j5') == 't2' and outlined(page, 'j5'), 'Fay Moss is picked, on Blake W')
    pbtn(page, 'Review').click()
    check('Fay Moss: Blake W → Dana K' in P(page), 'Review shows the move')
    pbtn(page, 'Go (1 job)').click()
    page.wait_for_function("() => /Put back \\(1\\)/.test(document.getElementById('panel').innerText)", timeout=5000)
    check(lane_of(page, 'j5') == 't3' and 'moved 1 job to Dana K' in P(page), 'Go moves the card to Dana K on the board')
    hal = ev(page, "() => { const a = document.querySelector('[data-job=\"j6\"]').getBoundingClientRect(), b = document.querySelector('[data-job=\"j5\"]').getBoundingClientRect(); return b.left >= a.right - 1; }")
    check(hal, 'it lands next to Hal Fry, not on top of him')
    covered = ev(page, "() => { const j = document.querySelector('[data-job=\"j5\"]').getBoundingClientRect(), p = document.getElementById('panel').getBoundingClientRect(); return Math.max(0, j.right - p.left) / j.width; }")
    check(covered < 0.35, 'the moved card stays mostly clear of the Toolbox (%d%% under it)' % round(covered * 100))
    shot(page, 'demo_moved', el='#shot')
    pbtn(page, 'Review').click()
    check('already on Dana K' in P(page), 'Review again: nothing to do')
    pbtn(page, 'Put back (1)').click()
    page.wait_for_function("() => /Put back 1 job/.test(document.getElementById('panel').innerText)", timeout=5000)
    check(lane_of(page, 'j5') == 't2' and ev(page, "() => document.querySelector('[data-job=\"j5\"]').style.left") == '30%', 'Put back moves it back to Blake W, same spot')
    pbtn(page, 'Swap').click()
    check('The demo does Move to a tech' in P(page), 'other modes say the demo only moves')

    # 📝 Notes
    tool(page, 'Notes')
    pbtn(page, 'Updates').click()
    pbtn(page, 'No Answer').click()
    check('Now click a job' in P(page), 'a note with no job: says to click a job')
    job(page, 'j4')
    check('Job selected' in P(page) and 'Eve Hall' in P(page) and outlined(page, 'j4'), 'clicking a job selects it')
    pbtn(page, 'No Answer').click()
    check('Typed “No Answer” on Eve Hall' in P(page), 'the note is typed on that job\'s customer')
    pbtn(page, '← Menu').click()
    check(page.locator('#p-title').inner_text() == '🧰 Toolbox' and not ev(page, "() => document.querySelectorAll('#board .pk').length"), '← Menu: back to the menu, highlights off')

    # Check, fold, close, open again
    pbtn(page, 'Check').click()
    check(ev(page, "() => getComputedStyle(document.getElementById('p-ok')).display") == 'block', '🩺 Check shows the green all-good bar')
    h0 = ev(page, "() => document.getElementById('panel').getBoundingClientRect().height")
    page.locator('#fold').click(); time.sleep(0.3)
    h1 = ev(page, "() => document.getElementById('panel').getBoundingClientRect().height")
    check(h1 < 50 < h0, 'the – button folds it to the title bar (%d → %d px)' % (h0, h1))
    page.locator('#fold').click(); time.sleep(0.3)
    check(ev(page, "() => document.getElementById('panel').getBoundingClientRect().height") > 300, 'and opens it back up')
    page.locator('#close').click(); time.sleep(0.3)
    check(ev(page, "() => document.getElementById('panel').hidden") and page.locator('#reopen').is_visible(), '✕ closes it, and a Toolbox button appears on the board')
    page.locator('#reopen').click(); time.sleep(0.4)
    check(not ev(page, "() => document.getElementById('panel').hidden") and page.locator('#p-title').inner_text() == '🧰 Toolbox', 'the button opens it again on the menu')

    # Wider by its left edge; double-click for the usual width
    box = page.locator('#grip').bounding_box()
    page.mouse.move(box['x'] + 3, box['y'] + 100); page.mouse.down(); page.mouse.move(box['x'] - 57, box['y'] + 100, steps=5); page.mouse.up()
    w = ev(page, "() => Math.round(document.getElementById('panel').getBoundingClientRect().width)")
    check(295 <= w <= 302, 'dragging the left edge makes it wider (%d px)' % w)
    page.locator('#grip').dblclick()
    check(ev(page, "() => Math.round(document.getElementById('panel').getBoundingClientRect().width)") == 240, 'double-click: the usual width')

    # "Try it in the demo" under a tool
    page.locator('.try-it[data-try="moves"]').click()
    check(page.locator('#p-title').inner_text() == '🔀 Move Jobs', 'Try it in the demo opens that tool')
    check(not wide(page), 'desktop: no sideways scrolling')
    check(errors == [], 'no page errors: %s' % errors)
    page.close()

    # ================= Phone, dark mode =================
    page, errors = page_for(b, viewport={'width': 390, 'height': 844}, color_scheme='dark')
    page.wait_for_function("() => document.querySelectorAll('.ver').length > 0", timeout=10000)
    time.sleep(1.2)
    check(not wide(page), 'phone: no sideways scrolling')
    r = ev(page, "() => { const p = document.getElementById('panel').getBoundingClientRect(), b = document.getElementById('board').getBoundingClientRect(); return [p.left >= 0, p.right <= innerWidth, p.top > b.top + b.height / 2]; }")
    check(r == [True, True, True], 'phone: the Toolbox sits under the board, on screen (%s)' % r)
    tool(page, 'Move Jobs')
    check(page.locator('#p-title').inner_text() == '🔀 Move Jobs', 'phone: tools open')
    check(ev(page, "() => getComputedStyle(document.body).backgroundColor") != 'rgb(244, 246, 249)', 'dark mode: the page is dark')
    shot(page, 'page_phone_dark', full=True)
    check(errors == [], 'phone: no page errors: %s' % errors)
    page.close()

    # ================= Reduced motion =================
    page, errors = page_for(b, reduced_motion='reduce')
    time.sleep(0.2)
    anims = ev(page, "() => [getComputedStyle(document.getElementById('board')).animationName, getComputedStyle(document.getElementById('panel')).animationName, getComputedStyle(document.getElementById('panel')).opacity]")
    check(anims == ['none', 'none', '1'], 'reduce motion: nothing animates on load, the Toolbox shows at once (%s)' % anims)
    tool(page, 'Move Jobs'); pbtn(page, 'Review').click(); pbtn(page, 'Go (1 job)').click()
    check(lane_of(page, 'j5') == 't3' and ev(page, "() => document.querySelector('[data-job=\"j5\"]').getAnimations().length") == 0, 'reduce motion: the move happens without sliding')
    check(errors == [], 'reduce motion: no page errors: %s' % errors)
    page.close()

    # ================= JavaScript off =================
    ctx = b.new_context(java_script_enabled=False, viewport={'width': 1280, 'height': 860})
    page = ctx.new_page()
    page.route(re.compile(r'^https?://(fonts\.googleapis\.com|fonts\.gstatic\.com)/'), lambda r: r.abort())
    page.goto(URL)
    vis = ev(page, "() => [getComputedStyle(document.getElementById('panel')).opacity, document.querySelectorAll('#panel .tile').length, getComputedStyle(document.querySelector('.try-it')).display, getComputedStyle(document.getElementById('try')).display]")
    check(vis == ['1', 6, 'none', 'none'], 'JavaScript off: the Toolbox picture shows, demo-only bits are hidden (%s)' % vis)
    check('changelog' in page.locator('#history').inner_text(), 'JavaScript off: version history links to the changelog')
    ctx.close()
    b.close()
srv.shutdown()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
