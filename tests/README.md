# Tests

Automatic checks for the Toolbox. They load `toolbox.js` into fake copies of the Dispatch board,
Edit Job page and Chat Center, click through each tool, and check the results. Nothing here
touches ServiceTitan.

```
pip install playwright
playwright install chromium
python3 tests/run_all.py              # everything (about 3 minutes)
python3 tests/run_all.py moves texts  # only the suites with "moves" or "texts" in their name
python3 tests/run_all.py other.js     # test another copy of the Toolbox
```

**Why it's quick:** suites run two or three at a time, each in its own browser on its own fake
board; the two suites that time how fast the Toolbox is (`test_move_speed.py`,
`test_concurrency.py`) run afterwards with nothing else going. And runs that are slow on purpose
(a save that never goes through, ServiceTitan not answering, a job that keeps failing) skip ahead
on the page's clock instead of waiting it out for real (`fastclock.py`). The Toolbox sees the
same time go by, just sooner. Checks that time something use the real clock, or the page's own
clock when the point is "it gave up after 15 seconds".

| File | What it checks |
|---|---|
| `test_install_page.py` | The install page (index.html), served like GitHub Pages serves it: the bookmark, the version and latest update read from toolbox.js, the version history read from CHANGELOG.md, every tool in the demo Toolbox, picking on the sample board, Move Jobs moving a card and putting it back, fold, close and open again, wider by its edge; phone width, dark mode, reduce motion, JavaScript off |
| `fastclock.py` | Not a suite: the helper that skips ahead through deliberate waits (see above) |
| `test_notes.py` | 📝 Notes: note first or job first, a job panel still loading, a merged customer ("Page Could Not Be Found") |
| `test_business_unit.py` | 🏢 Business Unit: picking, check, change, put back, locked jobs, errors, pop-ups, Stop |
| `test_job_notifications.py` | 🔕 Job Notifications: one list (board, job list, typed, a tech from the list, a tech's name on the board, ＋ Whole board with jobs scrolled out of view, Unassigned, canceled and other days), each job's setting read as it's added (🔔 / 🔕 in the list, dashed on the board, no pages opened), buttons that count what they'd change, turning off and on (only the jobs that need it are opened), results as cards, a switch that won't stay on (⚠️ card, Open job, Try again), job data unreadable (❔, ↻ Check opens each job), no job-record access, scrolling, highlights |
| `test_tech_menu.py` | 💬 Tech Messages opening each tech's menu: names that get their menu a moment after the board scrolls to them (Oct 29 2026), left click or right-click, left click only, the Oct 27 board, menu items found by their words, one tech without a menu skipped, a menu that never opens stops the run at the first tech, menus closed after each tech, a message box covered for a moment (waits) or the whole time (skipped, saying what covers it) |
| `test_tech_messages.py` | 💬 Tech Messages: picking techs on the board, 🛡️ rules, highlights |
| `test_customer_texts.py` | 📱 Customer Texts: holds, filters, numbers, repeat rules, STOP, Type only, Auto-send, ＋ Everyone on the board |
| `test_outreach.py` | 📣 OutReach: a default folder, added once to saved folders (and not again after deleting it), its 30-day rule and opt-out line; the look-ahead at the next customer (one quick read at their turn, a STOP after the look-ahead is still caught, a stale one is taken again) |
| `test_no_permission.py` | 📱 Customer Texts for a login that can't open job records: numbers from the customer, never a false "signed out" |
| `test_move_jobs.py` | 🔀 Move Jobs: move, add, unassign, both swaps, skill / booked / managed-tech / other-branch warnings, failures and retries, a job changed after the review, Put back (and a saved Put back after reopening), the board refreshing itself, Stop, handing jobs to Job Notifications |
| `test_move_safety.py` | 🔀 Move Jobs safety (from the Oct 2026 review): swaps are both jobs or neither, lost answers and exact Put back, bookings in swaps and stacking, fresh techs and old reviews, a sign-in check that never answers, answers in an unknown shape, status numbers (a board that's behind can't hide a Dispatch), an unknown tech never counted as managed, a job your board's filters hide, booked mid-run in a 3-job stack (read from the day's full schedule), Put back's booked and status checks, an exact match before every change, closing during a run |
| `test_move_speed.py` | 🔀 Move Jobs three jobs at once (1.6.2): never more than three, each add confirmed before the old tech comes off, two visits of a job one after the other, one at a time after a problem, signed out with several jobs on their way, a whole-day swap and its exact Put back |
| `test_confirm_replies.py` | ✅ Confirm Appt and 📥 Check replies: the default folder and its box in 📁 Edit folders, which replies count as yes and which are left for you, STOP, a C to another folder's text, confirm texts worded differently (Air South, a coworker's own wording, ServiceTitan's automatic reminder), old or failed confirm texts (which day's texts count), a reply read between the check and Confirm, an appointment moved to another day, the customer cards (the whole reply, the full number, Copy name / phone, Open chat, Copy results, sections folding, one card per customer), ✅ Add to confirm and ↩ Take off (on every Will confirm card; already confirmed in ServiceTitan says why there's no Add), the boss's confirm text, picked jobs, already-confirmed and Done appointments, a confirm that doesn't stick, a new message after the check, unread conversations left unread, signed out |
| `test_when.py` | `{when}`: today, tomorrow, a week out, a day that has passed, a typed job from another day (its own appointment date), a job with no upcoming appointment, holds; the 1.6.4 Confirm Appt message updated once (and not one you changed); Check replies counting a dated confirm text for that date only (a week ahead, another date, 10/30 style), and undated "today" / "tomorrow" texts only for the day they mean |
| `test_concurrency.py` | Several reads at once: Stop and Cancel mid-read, slow and timed-out answers, sign-out, failing answers, the board changing during a run |
| `test_review_fixes.py` | From the Oct 21 2026 review (1.6.3): 🛡️ / 🚫 lists changed in another tab (before the check, mid-run, and when saving settings) in Tech Messages and Customer Texts, no Back-button step per text, the Toolbox put back after Tech Messages moves it aside (and left alone if you dragged it), job and tech IDs that aren't numbers, STOP / START at the same time |
| `test_departments.py` | 📱 Customer Texts ＋ A department…: each team on the board with its job count, the Unassigned list, a job with two teams, techs with no team, canceled jobs left out |
| `test_panel_size.py` | The Toolbox window: nothing in any tool scrolls sideways (even with a very long tag name in a list); wider or narrower by its left edge or bottom-right corner (limits, never off the screen, remembered, double-click for the usual width, folded, a smaller browser window) |
| `test_tech_router.py` | 🧭 Tech Router (Beta): Beta in its name and a warning each time it's opened; 📞 Fill a spot (open time mid-day and at the end of the day, only the job types the tech's department did in the last 4 weeks, a rare type matched by its name, too long or too far left out, the job whose time fits first, a skill the tech doesn't have, the phone number, holds and later days, Holds unticked, End only, the 4 weeks read once, ➡️ to Move Jobs, a plumber, time off, no shift, a meeting, the sales goal, Mapbox down, the Hold list down, the 4 weeks unreadable, picking the tech on the board, nothing changed and every point rounded); 🔎 Closest techs and 📍 Next job |
| `test_animations.py` | The animations: fading in and out, tools and the menu sliding in, smooth folding, the bars dropping in, loading spinners; closing and folding take effect at once (a new Toolbox can open right away); nothing animates on the board; with reduce motion, nothing moves |
| `test_older_texts.py` | 📥 Check replies with confirm texts sent days ahead (a C to Saturday's text for Monday, "already did" / "thanks" after it, weekday-only texts, a text naming another day) |
| `newboard.js` | The fake new Dispatch board (2.0), inside its own shadow root like the real one: Day view, tech names and job cards labelled the way ServiceTitan labels them, the Jobs Tray, the Refresh button, the tech menu, and the board's data requests (techs, the day's assignments with tags, today's history, tech status). Each page sets it up with `NB.setup({ techs, appts, tray, ... })` |
| `board*.html` | The fake pages the tests run on, each built on `newboard.js` (`board_send.html` adds a fake Send Message panel for Tech Messages; `board_router.html` adds the Unassigned and Hold lists, tech homes, the past 4 weeks, shifts, and stand-ins for Mapbox and the US Census; `board.html?full` adds a full day: every assignment with its techs, a canceled one, and the Unassigned list) |

Run them before every update. If one fails, the update isn't ready.
