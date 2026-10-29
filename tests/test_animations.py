"""The 2.0.1 animations: the Toolbox fades in and out, tools and the menu slide in, folding shrinks
smoothly, the bars drop in and loading buttons spin. They never get in the way: closing frees the
name at once (a new Toolbox can open straight away), folding takes effect at once, and with the
computer set to reduce motion nothing moves at all."""
import sys, time, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

def B(page, text):
    return page.locator('#st-toolbox button:visible', has_text=text).first
def ev(page, js, arg=None):
    return page.evaluate(js, arg) if arg is not None else page.evaluate(js)
def anim(page, js_el):
    return ev(page, "() => { const e = " + js_el + "; return e ? getComputedStyle(e).animationName : null; }")
def visible_view(page):
    return "Array.from(document.querySelectorAll('#st-toolbox > .st-view')).find(v => v.style.display !== 'none')"
def open_tool(page, name):
    if B(page, '← Menu').count(): B(page, '← Menu').click()
    page.locator('#st-toolbox .st-tile', has_text=name).first.click()

def start(browser, motion):
    page = browser.new_page(viewport={'width': 1300, 'height': 900}, reduced_motion=motion)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '?full#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    ev(page, "() => { localStorage.clear(); window.FULL = true; NB.render(); }")
    page.evaluate(TOOLBOX)
    return page, errors

with sync_playwright() as p:
    b = p.chromium.launch()

    # ================= Animations on =================
    page, errors = start(b, 'no-preference')
    check(anim(page, "document.getElementById('st-toolbox')") == 'st-tb-open', 'the Toolbox fades in when it opens')
    check(anim(page, visible_view(page)) == 'st-tb-left', 'the menu slides in from the left')
    open_tool(page, 'Job Notifications')
    check(anim(page, visible_view(page)) == 'st-tb-right', 'a tool slides in from the right')
    # Folding: takes effect at once, and the height animates.
    page.locator('#st-toolbox .st-head button', has_text='–').click()
    check(ev(page, "() => document.getElementById('st-toolbox').classList.contains('st-min')"), 'folding takes effect at once')
    check(ev(page, "() => document.getElementById('st-toolbox').getAnimations().length") >= 1, 'folding shrinks smoothly')
    time.sleep(0.3)
    h = ev(page, "() => Math.round(document.getElementById('st-toolbox').getBoundingClientRect().height)")
    check(h < 60, 'folded down to the title bar (%d px)' % h)
    page.locator('#st-toolbox .st-head button').first.click()
    check(not ev(page, "() => document.getElementById('st-toolbox').classList.contains('st-min')"), 'opening back up takes effect at once')
    time.sleep(0.3)
    check(ev(page, "() => document.getElementById('st-toolbox').getBoundingClientRect().height") > 150, 'and grows back')
    check(ev(page, "() => document.getElementById('st-toolbox').style.height") == '', 'no height left stuck on it')
    # The loading spinner on ＋ Whole board.
    ev(page, "() => { window.BOARD_DELAY = 700; }")
    B(page, 'Whole board').click()
    time.sleep(0.25)
    busy = ev(page, "() => { const b = Array.from(document.querySelectorAll('#st-toolbox button')).find(b => /Loading…/.test(b.textContent)); return b ? [b.classList.contains('st-busy'), getComputedStyle(b, '::before').animationName] : null; }")
    check(busy == [True, 'st-tb-spin'], 'loading: the button spins (%s)' % busy)
    page.wait_for_function("() => /Added \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=15000)
    check(ev(page, "() => document.querySelectorAll('#st-toolbox .st-busy').length") == 0, 'done loading: no spinner left')
    check(B(page, 'Whole board').count() == 1, 'the button says ＋ Whole board again')
    ev(page, "() => { window.BOARD_DELAY = 20; }")
    # The yellow/green bar drops in.
    if B(page, '← Menu').count(): B(page, '← Menu').click()
    B(page, 'Check').click()
    page.wait_for_function("() => Array.from(document.querySelectorAll('#st-toolbox > .st-bar')).some(b => b.style.display !== 'none')", timeout=20000)
    check(anim(page, "Array.from(document.querySelectorAll('#st-toolbox > .st-bar')).find(b => b.style.display !== 'none')") == 'st-tb-drop', 'the Check bar drops in')
    # Closing: the name is free at once, the old one fades and goes, a new one can open straight away.
    ev(page, "() => window.__stToolbox.close()")
    check(page.locator('#st-toolbox').count() == 0 and not ev(page, "() => !!window.__stToolbox"), 'closing: gone at once for everything else')
    check(page.locator('#st-toolbox-bye').count() == 1, 'closing: the old Toolbox fades out')
    check(ev(page, "() => getComputedStyle(document.getElementById('st-toolbox-bye')).pointerEvents") == 'none', 'closing: the fading one can\'t be clicked')
    check(ev(page, "() => document.getElementById('st-toolbox-bye').querySelectorAll('[id]').length") == 0, 'closing: nothing inside the fading one can be found by its name')
    check(ev(page, "() => getComputedStyle(document.getElementById('st-toolbox-bye')).backgroundColor") == 'rgb(255, 255, 255)', 'closing: it keeps its look while it fades')
    page.evaluate(TOOLBOX)
    check(page.locator('#st-toolbox').count() == 1 and ev(page, "() => !!window.__stToolbox"), 'opening again right away works')
    time.sleep(0.8)
    check(page.locator('#st-toolbox-bye').count() == 0, 'the old one is gone after its fade')
    check(ev(page, "() => document.querySelectorAll('style#st-toolbox-style').length") == 1, 'one set of Toolbox styles left')
    check(B(page, 'Check').count() == 1 and anim(page, "document.getElementById('st-toolbox')") == 'st-tb-open', 'the new one works and has its look')
    # Nothing animates on the board itself.
    check(ev(page, "() => { const h = NB.host; return h ? Array.from(h.shadowRoot.querySelectorAll('style')).filter(s => /st-tb-/.test(s.textContent)).length : -1; }") == 0, 'no animations on the board')
    check(errors == [], 'no page errors: %s' % errors)
    page.close()

    # ================= Computer set to reduce motion =================
    page, errors = start(b, 'reduce')
    check(anim(page, "document.getElementById('st-toolbox')") == 'none', 'reduce motion: no fade in')
    open_tool(page, 'Job Notifications')
    check(anim(page, visible_view(page)) == 'none', 'reduce motion: tools don\'t slide')
    page.locator('#st-toolbox .st-head button', has_text='–').click()
    check(ev(page, "() => document.getElementById('st-toolbox').getAnimations().length") == 0, 'reduce motion: folding snaps')
    page.locator('#st-toolbox .st-head button').first.click()
    ev(page, "() => { window.BOARD_DELAY = 700; }")
    B(page, 'Whole board').click()
    time.sleep(0.25)
    sp = ev(page, "() => { const b = Array.from(document.querySelectorAll('#st-toolbox button')).find(b => /Loading…/.test(b.textContent)); return b ? getComputedStyle(b, '::before').animationName : null; }")
    check(sp in ('none', None), 'reduce motion: no spinning (%s)' % sp)
    page.wait_for_function("() => /Added \\d+ job/.test(document.getElementById('st-toolbox').innerText)", timeout=15000)
    ev(page, "() => window.__stToolbox.close()")
    check(page.locator('#st-toolbox').count() == 0 and page.locator('#st-toolbox-bye').count() == 0, 'reduce motion: closing removes it at once')
    check(ev(page, "() => document.querySelectorAll('style#st-toolbox-style').length") == 0, 'reduce motion: its styles go too')
    check(errors == [], 'reduce motion: no page errors: %s' % errors)
    b.close()
print('\n%d FAILED' % len(fails) if fails else '\nALL PASSED')
for f in fails: print(' - ' + f)
sys.exit(1 if fails else 0)
