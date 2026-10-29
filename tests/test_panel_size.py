"""The Toolbox window: nothing inside it is wider than the window (no sideways scrolling, even with
a very long tag name in a list), and it can be made wider or narrower by dragging its left edge or
its bottom-right corner (remembered; double-click for the usual width)."""
import sys, time, pathlib
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
def ev(page, js, arg=None):
    return page.evaluate(js, arg) if arg is not None else page.evaluate(js)
# Every box in the Toolbox that is wider inside than it shows (one you'd scroll sideways).
WIDE = """() => Array.from(document.querySelectorAll('#st-toolbox *')).filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 2 &&
  /(auto|scroll)/.test(getComputedStyle(e).overflowX)).map(e => e.tagName + ' ' + e.clientWidth + '<' + e.scrollWidth)"""
def wide(page):
    return ev(page, WIDE)
def width(page):
    return round(ev(page, "() => document.getElementById('st-toolbox').getBoundingClientRect().width"))
def rect(page):
    return ev(page, "() => { const r = document.getElementById('st-toolbox').getBoundingClientRect(); return [r.left, r.right]; }")
def widest_list(page):
    return ev(page, "() => Math.max(0, ...Array.from(document.querySelectorAll('#st-toolbox select')).filter(s => s.offsetParent).map(s => s.getBoundingClientRect().width))")
def drag(page, sel, dx):
    box = page.locator(sel).bounding_box()
    x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    page.mouse.move(x, y); page.mouse.down()
    page.mouse.move(x + dx / 2, y, steps=4); page.mouse.move(x + dx, y, steps=4)
    page.mouse.up()
def move_by_title(page, dx, dy=0):
    box = page.locator('#st-toolbox .st-head').bounding_box()
    page.mouse.move(box['x'] + 60, box['y'] + 10); page.mouse.down()
    page.mouse.move(box['x'] + 60 + dx, box['y'] + 10 + dy, steps=5); page.mouse.up()
def open_tool(page, name):
    if B(page, '← Menu').count(): B(page, '← Menu').click()
    page.locator('#st-toolbox .st-tile', has_text=name).first.click()
    time.sleep(0.6)

LONG = 'Install HVAC - Quality Control Team - Follow Up Needed Before Final Inspection Scheduled'
with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1400, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    # One job gets a very long tag (＋ Jobs with a tag… lists tag names in full).
    ev(page, "(t) => { localStorage.clear(); const f = NB.cfg.appts; NB.cfg.appts = () => f().map((a, i) => i ? a : Object.assign(a, { tags: [{ name: t, color: '#e6d3f5' }] })); NB.render(); }", LONG)
    page.evaluate(TOOLBOX)
    check(width(page) == 340, 'the usual width to start with (%d)' % width(page))
    check(wide(page) == [], 'menu: nothing to scroll sideways: %s' % wide(page))

    # ---- Nothing wider than the window ----
    open_tool(page, 'Move Jobs')
    page.wait_for_function("() => document.querySelectorAll('#st-move-to option').length > 1", timeout=10000)
    page.wait_for_function("(t) => Array.from(document.querySelectorAll('#st-toolbox select option')).some(o => o.textContent.indexOf(t) > -1)", arg=LONG[:30], timeout=10000)
    check(wide(page) == [], 'Move Jobs with a very long tag name in a list: nothing to scroll sideways: %s' % wide(page))
    check(widest_list(page) <= 340, 'lists fit inside the window (%d px)' % widest_list(page))
    for name in ['Job Notifications', 'Customer Texts', 'Tech Messages', 'Business Unit', 'Notes', 'Tech Router']:
        open_tool(page, name)
        check(wide(page) == [], '%s: nothing to scroll sideways: %s' % (name, wide(page)))
    open_tool(page, 'Move Jobs')

    # ---- Wider: drag the left edge ----
    right0 = rect(page)[1]
    drag(page, '#st-toolbox .st-grip-l', -200)
    check(abs(width(page) - 540) <= 2, 'dragging the left edge 200 px makes it wider (%d)' % width(page))
    check(abs(rect(page)[1] - right0) <= 1, 'its right side stays put')
    check(ev(page, "() => localStorage.getItem('stWidth')") in ('539', '540', '541'), 'the width is remembered')
    check(widest_list(page) > 400, 'lists use the extra room (%d px)' % widest_list(page))
    check(wide(page) == [], 'wider: still nothing to scroll sideways')

    # ---- The bottom-right corner (moved left by its title bar first, so there's room) ----
    move_by_title(page, -400)
    check(abs(width(page) - 540) <= 1, 'moving it by its title bar keeps its width (%d)' % width(page))
    drag(page, '#st-toolbox .st-grip-r', 100)
    check(abs(width(page) - 640) <= 3, 'dragging the corner 100 px right: wider again (%d)' % width(page))
    drag(page, '#st-toolbox .st-grip-r', -1000)
    check(width(page) == 300, 'never narrower than 300 px (%d)' % width(page))
    check(wide(page) == [], 'narrowest: still nothing to scroll sideways: %s' % wide(page))
    drag(page, '#st-toolbox .st-grip-l', -3000)
    check(rect(page)[0] >= 0, 'never off the left of the screen')
    drag(page, '#st-toolbox .st-grip-r', 3000)
    check(width(page) == 900, 'never wider than 900 px (%d)' % width(page))
    check(rect(page)[1] <= 1400, 'never off the right of the screen')

    # ---- Double-click: the usual width ----
    page.locator('#st-toolbox .st-grip-l').dblclick()
    check(width(page) == 340 and not ev(page, "() => localStorage.getItem('stWidth')"), 'double-click: back to the usual width (%d)' % width(page))
    drag(page, '#st-toolbox .st-grip-l', -160)
    w = width(page)

    # ---- Remembered next time ----
    ev(page, "() => window.__stToolbox.close()")
    page.evaluate(TOOLBOX)
    check(abs(width(page) - w) <= 1, 'opened again: the width you gave it (%d / %d)' % (width(page), w))

    # ---- Folded: no grips ----
    page.locator('#st-toolbox .st-head button', has_text='–').click()
    check(not ev(page, "() => Array.from(document.querySelectorAll('#st-toolbox .st-grip')).some(g => g.offsetParent)"), 'folded: no grips')
    page.locator('#st-toolbox .st-head button').first.click()
    check(ev(page, "() => Array.from(document.querySelectorAll('#st-toolbox .st-grip')).filter(g => g.offsetParent).length") == 2, 'opened back up: both grips back')

    # ---- A smaller browser window: it stays inside ----
    page.set_viewport_size({'width': 420, 'height': 800})
    time.sleep(0.3)
    r = rect(page)
    check(r[0] >= 0 and r[1] <= 421, 'a smaller browser window: the Toolbox fits inside it (%s)' % r)
    check(errors == [], 'no page errors: %s' % errors)
    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
