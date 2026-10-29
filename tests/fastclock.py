"""Skipping ahead through waits the Toolbox makes on purpose.

Some test runs are slow by design: a save that never goes through makes Business Unit wait up to
20 seconds before calling it NOT SAVED, a ServiceTitan that never answers makes a tool wait out
its 15-second limit, a job that keeps failing is tried again after a pause. Waiting those out for
real was most of the test time. Instead, these tests move the page's clock ahead (Playwright's
page.clock), so those waits pass in a moment. The Toolbox itself is unchanged and sees the same
amount of time go by, only sooner; its timers still fire in the same order.

It's only used while waiting for runs that have no check on how long they take. Checks that time
something ("finished in under 12 s") keep using the real clock, and the clock runs at normal
speed the rest of the time.

    fastclock.install(page)            # right after new_page(), before goto()
    fastclock.skip(page)               # in a waiting loop, instead of time.sleep()
    fastclock.page_time(page)          # the page's own clock, for "it gave up after 15 s" checks
"""
import time

STEP_MS = 400   # how far the clock moves ahead each time round a waiting loop


def install(page):
    page.clock.install()


def skip(page, ms=STEP_MS):
    """Moves the page's clock ahead, firing every timer that comes due on the way, in order."""
    page.clock.run_for(ms)
    time.sleep(0.02)   # a moment for the page to draw what changed


def page_time(page):
    """The page's clock in seconds (it includes the time skipped ahead)."""
    return page.evaluate("() => Date.now()") / 1000.0
