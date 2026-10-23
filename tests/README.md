# Tests

Automatic checks for the Toolbox. They load `toolbox.js` into fake copies of the Dispatch board,
Edit Job page and Chat Center, click through each tool, and check the results. Nothing here
touches ServiceTitan.

```
pip install playwright
playwright install chromium
python3 tests/run_all.py
```

| File | What it checks |
|---|---|
| `test_notes.py` | 📝 Notes: note first or job first, a job panel still loading, a merged customer ("Page Could Not Be Found") |
| `test_business_unit.py` | 🏢 Business Unit: picking, check, change, put back, locked jobs, errors, pop-ups, Stop |
| `test_job_notifications.py` | 🔕 Job Notifications: a tech's jobs, picked jobs, turning off and on, a switch that won't stay on, no job-record access, the job list, scrolling, highlights |
| `test_tech_messages.py` | 💬 Tech Messages: picking techs on the board, 🛡️ rules, highlights |
| `test_customer_texts.py` | 📱 Customer Texts: holds, filters, numbers, repeat rules, STOP, Type only, Auto-send, ＋ Everyone on the board |
| `test_outreach.py` | 📣 OutReach: a default folder, added once to saved folders (and not again after deleting it), its 30-day rule and opt-out line; the look-ahead at the next customer (one quick read at their turn, a STOP after the look-ahead is still caught, a stale one is taken again) |
| `test_no_permission.py` | 📱 Customer Texts for a login that can't open job records: numbers from the customer, never a false "signed out" |
| `test_move_jobs.py` | 🔀 Move Jobs: move, add, unassign, both swaps, skill / booked / managed-tech / other-branch warnings, failures and retries, a job changed after the review, Put back (and a saved Put back after reopening), the board refreshing itself, Stop, handing jobs to Job Notifications |
| `test_move_safety.py` | 🔀 Move Jobs safety (from the Oct 2026 review): swaps are both jobs or neither, lost answers and exact Put back, bookings in swaps and stacking, fresh techs and old reviews, a sign-in check that never answers, answers in an unknown shape, status numbers (a board that's behind can't hide a Dispatch), an unknown tech never counted as managed, a job your board's filters hide, booked mid-run in a 3-job stack (read from the day's full schedule), Put back's booked and status checks, an exact match before every change, closing during a run |
| `test_move_speed.py` | 🔀 Move Jobs three jobs at once (1.6.2): never more than three, each add confirmed before the old tech comes off, two visits of a job one after the other, one at a time after a problem, signed out with several jobs on their way, a whole-day swap and its exact Put back |
| `test_confirm_replies.py` | ✅ Confirm Appt and 📥 Check replies: the default folder and its box in 📁 Edit folders, which replies count as yes and which are left for you, STOP, a C to another folder's text, old or failed confirm texts (which day's texts count), a reply read between the check and Confirm, an appointment moved to another day, the Needs a look cards (the whole reply, the full number, Copy name / phone, Open chat, Copy results), the boss's confirm text, picked jobs, already-confirmed and Done appointments, a confirm that doesn't stick, a new message after the check, unread conversations left unread, signed out |
| `test_concurrency.py` | Several reads at once: Stop and Cancel mid-read, slow and timed-out answers, sign-out, failing answers, the board changing during a run |
| `test_review_fixes.py` | From the Oct 21 2026 review (1.6.3): 🛡️ / 🚫 lists changed in another tab (before the check, mid-run, and when saving settings) in Tech Messages and Customer Texts, no Back-button step per text, the Toolbox put back after Tech Messages moves it aside (and left alone if you dragged it), job and tech IDs that aren't numbers, STOP / START at the same time |
| `board*.html` | The fake pages the tests run on (`board_send.html` adds a fake Send Message panel for Tech Messages) |

Run them before every update. If one fails, the update isn't ready.
