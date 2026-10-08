"""The panel itself: tabs, Home, minimize, moving, resizing, staying on screen, ⋯ More,
the Customer Texts steps, and tabs locking while a tool runs."""
import sys, time, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, t): return page.locator('#st-toolbox button:visible', has_text=t).first
def T(page): return page.locator('#st-toolbox').inner_text()
def box(page, sel='#st-toolbox'): return page.locator(sel).bounding_box()
def ls(page, k): return page.evaluate("k => localStorage.getItem(k)", k)
def title(page): return page.locator('#st-toolbox .st-title').inner_text()
def active_tab(page): return page.evaluate("() => { const t = document.querySelector('#st-toolbox .st-tab.on'); return t ? t.getAttribute('data-nav') : null; }")
def on_screen(page):
    r = box(page); v = page.viewport_size
    return r['x'] >= 0 and r['y'] >= 0 and r['x'] + r['width'] <= v['width'] + 0.5 and r['y'] + r['height'] <= v['height'] + 0.5
def open_tb(page):
    page.evaluate(TOOLBOX)
    page.wait_for_selector('#st-toolbox')
    time.sleep(0.2)
def close_tb(page):
    page.locator('#st-toolbox [data-act="close"]').click()
def drag(page, sel, dx, dy):
    r = box(page, sel)
    x, y = r['x'] + r['width'] / 2, r['y'] + r['height'] / 2
    page.mouse.move(x, y); page.mouse.down()
    page.mouse.move(x + dx, y + dy, steps=8); page.mouse.up()
    time.sleep(0.15)
def running(page):
    return page.evaluate("() => !!Array.from(document.querySelectorAll('#st-toolbox button')).find(b => b.offsetParent && /^Stop/.test(b.textContent))")

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("() => localStorage.clear()")
    open_tb(page)

    # ---- Home and tabs ----
    check(page.locator('#st-toolbox .st-tab').count() == 5, 'five tool tabs')
    check(page.locator('#st-toolbox .st-card:visible').count() == 5, 'Home shows a card for each tool')
    check('Switch jobs to Mendenhall' in T(page) and 'Text customers about holds' in T(page), 'cards say what each tool does')
    check('Menu' not in T(page), 'no ← Menu buttons anywhere')
    r = box(page)
    check(abs(r['x'] + r['width'] - (1400 - 16)) < 2 and abs(r['y'] + r['height'] - (900 - 16)) < 2, 'starts in the bottom-right corner')
    check(abs(r['width'] - 300) < 1, 'normal width is 300px')
    home_bottom = r['y'] + r['height']
    for key, name in [('notes', 'Notes'), ('jobs', 'Job Notifications'), ('msgs', 'Tech Messages'), ('biz', 'Business Unit'), ('texts', 'Customer Texts')]:
        page.click('#st-toolbox .st-tab[data-nav="%s"]' % key)
        check(name in title(page) and active_tab(page) == key, 'tab opens ' + name)
    check(ls(page, 'stView') == 'texts', 'the open tool is remembered')
    r = box(page)
    check(abs(r['y'] + r['height'] - home_bottom) < 2 and r['height'] > 300, 'a taller tool grows upward from the bottom edge')
    page.locator('#st-toolbox [data-nav="menu"]').click()
    check('Toolbox' in title(page) and active_tab(page) is None and page.locator('#st-toolbox .st-card:visible').count() == 5, '⌂ goes back Home')
    page.locator('#st-toolbox .st-card', has_text='Business Unit').click()
    check('Business Unit' in title(page) and active_tab(page) == 'biz', 'a Home card opens its tool')
    tabs_fit = page.evaluate("() => { const t = document.querySelector('#st-toolbox .st-tabs'); return t.scrollWidth <= t.clientWidth; }")
    check(tabs_fit, 'tabs fit across the panel')

    # ---- Minimize ----
    before = box(page)
    page.click('#st-toolbox [data-act="min"]')
    r = box(page)
    check(r['height'] < 60 and not page.locator('#st-toolbox .st-body').is_visible() and not page.locator('#st-toolbox .st-tabs').is_visible(), 'minimize leaves just the title bar (%dpx)' % r['height'])
    check(ls(page, 'stMin') == '1' and on_screen(page), 'minimized state saved, still on screen')
    check(abs(r['y'] + r['height'] - (before['y'] + before['height'])) < 2, 'minimized bar stays at the bottom edge')
    page.click('#st-toolbox [data-act="min"]')
    check(page.locator('#st-toolbox .st-body').is_visible() and ls(page, 'stMin') == '0', 'restore brings it back')
    page.dblclick('#st-toolbox .st-title')
    check(not page.locator('#st-toolbox .st-body').is_visible(), 'double-clicking the title bar minimizes')
    page.dblclick('#st-toolbox .st-title')
    check(page.locator('#st-toolbox .st-body').is_visible(), 'double-clicking again restores')
    page.click('#st-toolbox [data-act="min"]')
    page.locator('#st-toolbox [data-nav="menu"]').click()
    check(page.locator('#st-toolbox .st-body').is_visible() and page.locator('#st-toolbox .st-card:visible').count() == 5, '⌂ while minimized opens Home')

    # ---- Moving ----
    r0 = box(page)
    drag(page, '#st-toolbox .st-title', 60 - r0['x'], 40 - r0['y'])
    r = box(page)
    check(abs(r['x'] - 60) < 3 and abs(r['y'] - 40) < 3, 'drag the title bar to move it (%d,%d)' % (r['x'], r['y']))
    check(ls(page, 'stDock') == 't' and ls(page, 'stPos').startswith('6'), 'near the top: hangs from the top edge')
    page.click('#st-toolbox .st-tab[data-nav="texts"]')
    r2 = box(page)
    check(abs(r2['y'] - r['y']) < 2 and r2['height'] > r['height'], 'hung from the top, a taller tool grows downward')
    page.click('#st-toolbox .st-tab[data-nav="biz"]')
    drag(page, '#st-toolbox .st-title', 3000, 3000)
    check(on_screen(page), 'dragging past the corner keeps it on screen')
    check((ls(page, 'stDock') or '').startswith('b:'), 'near the bottom: hangs from the bottom edge')
    drag(page, '#st-toolbox .st-title', -3000, -3000)
    check(on_screen(page) and box(page)['x'] >= 7, 'dragging past the top-left keeps it on screen')

    # ---- Resizing ----
    page.click('#st-toolbox .st-tab[data-nav="notes"]')
    r0 = box(page)
    drag(page, '#st-toolbox .st-grip', 120, 200)
    r = box(page)
    check(abs(r['width'] - (r0['width'] + 120)) < 3 and abs(r['height'] - (r0['height'] + 200)) < 3, 'drag the corner to resize (%dx%d)' % (r['width'], r['height']))
    w, h = r['width'], r['height']
    check(ls(page, 'stSize') == '%d,%d' % (round(w), round(h)), 'size saved')
    page.click('#st-toolbox .st-tab[data-nav="biz"]')
    check(abs(box(page)['height'] - h) < 2, 'resized height kept on every tool')
    drag(page, '#st-toolbox .st-grip', -800, -800)
    r = box(page)
    check(abs(r['width'] - 260) < 2 and abs(r['height'] - 160) < 2, 'can\'t shrink below 260 x 160')
    page.dblclick('#st-toolbox .st-grip')
    r = box(page)
    check(abs(r['width'] - 300) < 1 and not ls(page, 'stSize'), 'double-clicking the corner goes back to the normal size')

    # ---- Long screens scroll inside; a small window keeps it on screen ----
    page.click('#st-toolbox .st-tab[data-nav="texts"]')
    page.set_viewport_size({'width': 700, 'height': 420})
    time.sleep(0.3)
    check(on_screen(page), 'still fully on screen after the window shrinks')
    scrolls = page.evaluate("() => { const b = document.querySelector('#st-toolbox .st-body'); return b.scrollHeight > b.clientHeight; }")
    check(scrolls, 'a long screen scrolls inside the panel')
    page.set_viewport_size({'width': 1400, 'height': 900})
    time.sleep(0.2)

    # ---- Remembered on reopen ----
    drag(page, '#st-toolbox .st-title', 400, 0)
    drag(page, '#st-toolbox .st-grip', 40, 0)
    page.click('#st-toolbox [data-act="min"]')
    before = box(page)
    close_tb(page)
    check(page.locator('#st-toolbox').count() == 0 and page.evaluate("() => !window.__stToolbox"), 'closes')
    open_tb(page)
    r = box(page)
    check(abs(r['x'] - before['x']) < 2 and abs(r['y'] - before['y']) < 2 and abs(r['width'] - before['width']) < 2, 'reopens where it was, same size')
    check(not page.locator('#st-toolbox .st-body').is_visible() and 'Customer Texts' in title(page), 'reopens minimized, on the same tool')
    page.click('#st-toolbox [data-act="min"]')
    page.dblclick('#st-toolbox .st-grip')

    # ---- Customer Texts steps ----
    how = page.locator('#st-toolbox [data-sec="how"]')
    check(how.get_attribute('aria-expanded') == 'false' and 'Type only' in how.inner_text(), '③ How starts folded, showing the choice')
    check(not page.locator('#st-toolbox label:visible', has_text='Auto-send').count(), 'folded step hides its controls')
    how.click()
    check(page.locator('#st-toolbox label:visible', has_text='Auto-send').count() == 1, 'opening ③ How shows the choices')
    page.locator('#st-toolbox [data-sec="msg"]').click()
    msg = page.locator('#st-toolbox [data-sec="msg"]').inner_text()
    check('⏸️ Holds' in msg and 'Free quote' in msg, 'folded ① Message sums up the folder and message: ' + msg.replace('\n', ' '))
    page.locator('#st-toolbox [data-sec="who"]').click()
    who = page.locator('#st-toolbox [data-sec="who"]').inner_text()
    check('Hold list' in who and '0 customers' in who, 'folded ② Who sums up who: ' + who.replace('\n', ' '))
    check(B(page, 'Load holds').count() == 0, 'folded ② Who hides its controls')
    close_tb(page); open_tb(page)
    exp = page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox [data-sec]')).map(s => s.getAttribute('aria-expanded')).join()")
    check(exp == 'false,false,true', 'folded steps remembered: ' + exp)
    for s in ['msg', 'who']: page.locator('#st-toolbox [data-sec="%s"]' % s).click()

    # ---- ⋯ More ----
    check(B(page, 'Edit folders').count() == 0 and B(page, '⋯ More').count() == 1, 'less-used buttons start behind ⋯ More')
    B(page, '⋯ More').click()
    check(all(B(page, t).count() == 1 for t in ['Edit messages', 'Edit folders', 'Settings']), '⋯ More shows Edit messages, Edit folders, Settings')
    B(page, 'Settings').click()
    check('Your name' in T(page) or 'name' in T(page).lower(), 'Settings opens from ⋯ More')
    B(page, 'Cancel').click()
    check(B(page, '⋯ More').count() == 1 and B(page, 'Edit folders').count() == 0, 'More folds back up after use')

    # ---- Tabs lock while a tool runs ----
    page.click('#st-toolbox .st-tab[data-nav="biz"]')
    page.fill('#st-toolbox input:visible[placeholder^="Or type job"]', '901001 901002 901003 901004')
    page.locator('#st-toolbox button:visible', has_text='Add').filter(has_not_text='note').first.click()
    B(page, 'Change to Mendenhall Branch').click()
    B(page, 'Yes, change them').click()
    time.sleep(1)
    locked = page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox .st-tab')).map(t => t.getAttribute('data-nav') + ':' + t.disabled).join()")
    check(locked == 'notes:true,jobs:true,msgs:true,biz:false,texts:true', 'other tabs locked during a run: ' + locked)
    check(page.locator('#st-toolbox [data-nav="menu"]').is_disabled(), '⌂ locked during a run')
    check(page.locator('#st-toolbox .st-run').is_visible(), '● Running shows in the title bar')
    page.locator('#st-toolbox .st-tab[data-nav="notes"]').click(force=True)
    check('Business Unit' in title(page), 'a locked tab does nothing')
    page.click('#st-toolbox [data-act="min"]')
    check(page.locator('#st-toolbox .st-run').is_visible(), '● Running still shows while minimized')
    page.click('#st-toolbox [data-act="min"]')
    B(page, 'Stop').click()
    end = time.time() + 60
    while time.time() < end and running(page): time.sleep(0.3)
    time.sleep(0.6)
    unlocked = page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox .st-tab')).every(t => !t.disabled)")
    check(unlocked and not page.locator('#st-toolbox .st-run').is_visible(), 'tabs unlock when the run ends')
    page.evaluate("() => { location.hash = '#/DispatchBoard'; }")
    page.wait_for_selector('a.appointment')

    # ---- A place saved by the older version ----
    close_tb(page)
    page.evaluate("() => { localStorage.setItem('stPos', '50,760'); localStorage.removeItem('stDock'); localStorage.setItem('stView', 'menu'); }")
    open_tb(page)
    r = box(page)
    check(on_screen(page) and abs(r['x'] - 50) < 2, 'an old saved place still works')
    check((ls(page, 'stDock') or '').startswith('b:'), 'an old place near the bottom now hangs from the bottom')

    close_tb(page)
    check(errors == [], 'no page errors: %s' % errors)
    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
