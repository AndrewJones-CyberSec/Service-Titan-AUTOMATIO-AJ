"""📖 Guide and ❔ Help (2.9).

The title bar's button says 📖 Guide on the menu and ❔ Help in a tool. Nothing starts by itself: a new
user sees a small "New here?" line on the menu (gone once the tour has been opened, or with ✕).
📖 Guide: a tour that lights up each part of the Toolbox with a card beside it (Next, Back, ✕, Esc,
← →), opens 🧪 Experimental tools for its steps, and ends with Done. ❔ Help in each tool: what it does,
its steps, ▶ Walk me through it (every step lights up a real control, not the whole tool), 📖 Toolbox
tour; it closes again with the button or by leaving the tool. Going to another tool ends a walk-through.
Closing the Toolbox removes everything. Nothing on the board is changed.

Runs on tests/board_moves.html."""
import sys, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
TOOLBOX = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / 'toolbox.js').read_text()
URL = (HERE / 'board_moves.html').as_uri()
fails = []
def check(cond, what):
    print(('PASS ' if cond else 'FAIL ') + what)
    if not cond: fails.append(what)

TOOLS = [('notes', 'Notes'), ('jobs', 'Job Notifications'), ('msgs', 'Tech Messages'), ('biz', 'Business Unit'), ('texts', 'Customer Texts'),
         ('moves', 'Move Jobs'), ('router', 'Tech Router'), ('ai', 'Quick Job Info'), ('rview', 'Route View')]
# Steps that point at the whole tool on purpose (1-based).
WHOLE = {('notes', 2), ('router', 3)}

def card(page):
    return page.evaluate("() => { const c = document.getElementById('st-guide'); return c && c.style.display !== 'none' ? c.innerText : ''; }")
def ring(page):
    return page.evaluate("() => { const r = document.getElementById('st-guide-ring'); if (!r || r.style.display === 'none') return null; const b = r.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }")
def view_h(page):
    return page.evaluate("() => { const v = Array.from(document.querySelectorAll('#st-toolbox > .st-view')).find(v => v.style.display !== 'none'); return v.getBoundingClientRect().height; }")
def gbtn(page):
    return page.locator('#st-guide-btn')

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1500, 'height': 950})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL + '#/DispatchBoard')
    page.wait_for_selector('a.appointment')
    page.evaluate("() => { localStorage.clear(); localStorage.setItem('stSeenVersion', 'x'); }")
    page.evaluate(TOOLBOX)
    page.wait_for_timeout(500)
    check(gbtn(page).inner_text() == '📖 Guide', 'the title bar has 📖 Guide on the menu')
    check(card(page) == '', 'no tour starts by itself')
    check(page.locator('#st-guide-hint').is_visible() and 'New here' in page.locator('#st-guide-hint').inner_text(), 'a new user sees a small "New here?" line')

    # ---- 📖 The tour ----
    gbtn(page).click()
    c = card(page)
    check('1 of 16' in c and 'Welcome' in c, 'Guide starts the tour at step 1 of 16 (%r)' % c[:60])
    check(not page.locator('#st-guide-hint').is_visible(), 'the "New here?" line goes once the tour is opened')
    check(page.locator('#st-guide-back').evaluate("b => getComputedStyle(b).visibility") == 'hidden', 'no Back on the first step')
    seen, small = [], 0
    for n in range(16):
        c = card(page)
        seen.append(c.split('\n')[1] if '\n' in c else c)
        r = ring(page)
        if n in (3, 4, 9, 10, 11, 12, 14, 15) and r and r[3] < 120: small += 1
        if n < 15: page.locator('#st-guide-next').click()
    check(small == 8, 'tiles, 🧪, 🩺 Check and the Guide button each get their own spotlight (%d of 8)' % small)
    check(page.locator('.st-tile[data-tool="rview"]').is_visible(), 'the tour opened 🧪 Experimental tools for its steps')
    check(page.locator('#st-guide-next').inner_text().startswith('Done'), 'the last step says Done')
    page.locator('#st-guide-back').click()
    check('15 of 16' in card(page), 'Back goes back a step')
    page.keyboard.press('ArrowRight')
    check('16 of 16' in card(page), '→ goes forward')
    page.locator('#st-guide-next').click()
    check(card(page) == '' and ring(page) is None, 'Done ends the tour')
    check(page.evaluate("() => localStorage.getItem('stGuideSeen')") == '1', 'remembered as seen')
    gbtn(page).click()
    page.keyboard.press('Escape')
    check(card(page) == '', 'Esc leaves the tour')
    gbtn(page).click(); page.locator('#st-guide-next').click()
    page.locator('#st-guide button', has_text='✕').click()
    check(card(page) == '', '✕ leaves the tour')

    # ---- ❔ Help and the walk-through in every tool ----
    page.evaluate("() => localStorage.setItem('stExpOpen', '1')")
    for key, name in TOOLS:
        page.evaluate("(k) => { const b = Array.from(document.querySelectorAll('#st-toolbox button')).find(x => /← Menu/.test(x.textContent) && x.getClientRects().length); if (b) b.click(); }", key)
        if not page.locator('.st-tile[data-tool="%s"]' % key).is_visible(): page.locator('#st-exp-head').click()
        page.locator('.st-tile[data-tool="%s"]' % key).click()
        page.wait_for_timeout(300)
        check(gbtn(page).inner_text() == '❔ Help', '%s: the button says ❔ Help' % name)
        gbtn(page).click()
        h = page.locator('#st-help').inner_text() if page.locator('#st-help').is_visible() else ''
        check(name in h and 'how to use it' in h and '1.' not in h[:0], '%s: Help explains it (%r)' % (name, h[:50]))
        check(page.locator('#st-help li').count() >= 3, '%s: Help has its steps' % name)
        page.locator('#st-help-walk').click()
        c = card(page)
        total = int(c.split(' of ')[1].split('\n')[0]) if ' of ' in c else 0
        check(name in c.split('·')[0] and total >= 3, '%s: ▶ Walk me through it starts its own walk-through (%r)' % (name, c[:40]))
        vh = view_h(page)
        whole = []
        for n in range(1, total + 1):
            r = ring(page)
            if (key, n) not in WHOLE and (not r or r[3] > vh * 0.8): whole.append(n)
            if n < total: page.locator('#st-guide-next').click()
        check(not whole, '%s: every step lights up its own control (whole tool on steps %s)' % (name, whole))
        page.locator('#st-guide-next').click()
        check(card(page) == '', '%s: Done ends it' % name)

    # Help toggles, and goes when leaving the tool.
    gbtn(page).click()
    check(page.locator('#st-help').is_visible(), 'Help opens')
    gbtn(page).click()
    check(not page.locator('#st-help').is_visible(), 'pressing it again closes Help')
    gbtn(page).click()
    page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox button')).find(x => /← Menu/.test(x.textContent) && x.getClientRects().length)?.click()")
    page.wait_for_timeout(200)
    check(not page.locator('#st-help').is_visible() and gbtn(page).inner_text() == '📖 Guide', 'back on the menu: Help gone, the button says 📖 Guide')
    # 📖 Toolbox tour from inside Help.
    page.locator('.st-tile[data-tool="moves"]').click()
    gbtn(page).click()
    page.locator('#st-help button', has_text='Toolbox tour').click()
    check('1 of 16' in card(page) and page.locator('.st-tile[data-tool="notes"]').is_visible(), '📖 Toolbox tour from Help goes to the menu tour')
    # Going somewhere else ends a tool walk-through.
    page.keyboard.press('Escape')
    page.locator('.st-tile[data-tool="moves"]').click()
    gbtn(page).click(); page.locator('#st-help-walk').click()
    page.evaluate("() => Array.from(document.querySelectorAll('#st-toolbox button')).find(x => /← Menu/.test(x.textContent) && x.getClientRects().length)?.click()")
    page.wait_for_timeout(200)
    check(card(page) == '', 'leaving the tool ends its walk-through')

    check(page.evaluate("() => window.calls.length") == 0, 'nothing on the board was changed')
    gbtn(page).click()
    page.evaluate("() => window.__stToolbox.close()")
    page.wait_for_timeout(700)
    check(page.evaluate("() => !document.getElementById('st-guide') && !document.getElementById('st-guide-ring')"), 'closing the Toolbox removes the tour')
    check(errors == [], 'no page errors: %s' % errors)
    b.close()

print('\n%d failed' % len(fails) if fails else '\nAll passed')
sys.exit(1 if fails else 0)
