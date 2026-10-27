# Changelog

## 1.8

- **New: 🧭 Tech Router**, two tabs. It only reads; changes go through 🔀 Move Jobs.
  - **🔎 Closest techs:** one box for a zip code or a job number (a job on the board is a job; five digits that are a zip code are a zip, with a *Job # instead?* button; anything else is looked up as a job from its job panel), or **🖱️** to click a job on the board (green outline). The closest techs by drive time with traffic, closest first (3, Show more up to 10), as compact two-line rows: time, miles, where they're measured from (*working a job in Magee*, *on the way to a job in Pinola*, *finished a job in Braxton*, *from home (Braxton)*, *same zip code*), department, jobs that day. 🗺️ Google Maps directions; ➡️ hands a job and tech to Move Jobs. Techs it can't place fold open by name.
  - **📍 Next job:** for a job that has a tech, the Unassigned jobs closest to it that the tech could take next (not over before this job ends, nothing else of theirs then, their department does that kind of job; a kind with nothing to go by is kept, marked ⚠️), shown first, with what was left out and why. ➡️ hands one to Move Jobs. Closest techs is one click away.
  - **📋 Plan Unassigned:** plans a tech for every job on the day's Unassigned list (your board's branches), most urgent first, then by time. Right department from the last 2 weeks of boards (field techs' jobs only, so an office login with a pile of jobs doesn't skew it; a team needs a fifth of the jobs like it; few jobs → matched on the start of the type's name; none → any department, ⚠️). Free techs first: a job on top of another of the tech's jobs then (the plan's own count) costs an extra hour, so it only happens when no one in the department is free, marked ⚠️ (Move Jobs asks for a tick), and never on a job of 4 hours or more (all-day installs). Nothing more than 1½ hours' drive (left out with who was closest and how far). Routed from each tech's previous job that day, or home. Spread the work: each job a tech already has counts as 15 minutes of driving. The plan lists each job, tech, drive and why; ✕ takes one off; *Jobs not planned* (with why) and *Who gets what* fold open; Copy. **Send to Move Jobs** hands over the whole plan. Past boards are read once and saved in the browser (40 days kept).
  - **⚙️ Options** fold into one line that says what they're set to: measure from (now / home), Field techs only (on: ServiceTitan's managed technicians, so office staff with a row on the board are left out), department, 🔑 Drive-time key.
  - **Places and drive times:** jobs and zip codes are measured to the middle of their zip code (the US Census's point, only zip codes sent, saved in the browser). Mapbox Matrix for whole lists in one request (9 places with traffic, 24 without), Directions one by one if the Matrix can't be had, straight-line guesses marked ~ if Mapbox can't be reached. A public Mapbox key is built in (only works from go.servicetitan.com); a different key can be saved in one browser (checked first; secret `sk.` keys refused). Tech homes are rounded to about half a mile before they're sent; no names or street addresses are sent anywhere, or shown.
  - Plain messages for a job number that doesn't exist, a job with no zip code, an unknown zip, the Census or Mapbox being down, and past boards that can't be read; board data in an unknown shape raises the yellow bar.
- **🔀 Move Jobs:** takes a single job and tech from another tool (➡️), and a whole plan where each job has its own tech (*Planned*, Assign N jobs), with the usual review, warnings, add-before-remove, retries and ↩ Put back.
- Shared: the technician list includes each tech's home from their profile; the board's techs and the Unassigned list are read with job types.
- Tests: new `tests/test_tech_router.py` on `tests/board_near.html` (tech homes, job zip codes, statuses and types, two weeks of past boards, a fake Census map service and a fake Mapbox with a river that's slow to cross).

## 1.7.2

- **📱 Customer Texts: ＋ A department…** next to ＋ Everyone on the board. It lists each team on the board (Level 1 Service, Installers… in the board's order) with how many jobs it has on the day the board shows, plus the **Unassigned list**. Picking one adds that team's jobs (canceled appointments left out); pick another to add it too, and take anyone off with ✕. A job with two techs on different teams is in both. Jobs only in the board's data (scrolled out of view) are found too.
  - The team is the team header above each tech's row. Each tech's team is remembered once seen (the same list 💬 Tech Messages keeps), so a board filter that hides the headers doesn't lose them. Techs whose team can't be told are under *Other (team not showing)*.
  - 📥 Check replies already looks only at the jobs in the list, so texting one department and checking replies stays on that department.
- Shared: the board's whole-day loader now gives each job its teams (🔕 Job Notifications' ＋ Whole board is unchanged).
- Tests: new `tests/test_departments.py`; `tests/board_texts.html?teams` lays the board out with team headers like the real one.

## 1.7.1

- **📥 Check replies: earlier confirm texts about the same appointment count.**
  - **A C stays a yes.** Someone who answered C to Saturday's text for Monday and then got another reminder Sunday is confirmed if all they said after their C was another yes, *I already confirmed*, *Already did*, *Done*, or just *Thanks*. A question, a change of plans or anything else after it still goes to Needs a look, with what they said. *Thanks* with no yes before it is still Needs a look.
  - **Texts that name only the weekday** (a coworker's *…your appointment Monday…*, sent Thursday or Saturday) count for the next one, however early they went out. Before, only texts with a date counted from before the last weekday before the board's day.
  - **A text naming another day doesn't count**, even if it was sent recently: Friday's *…your appointment Saturday…* is no longer read as a confirm for Monday. Texts naming no day (or more than one weekday) work as before.
- Tests: new `tests/test_older_texts.py` (the board on the next Monday, so it works any day of the week).

## 1.7

- **🔕 Job Notifications, reworked to be quicker to use.** The two modes (*A tech's jobs* / *Jobs I pick*) are gone: there's one list, and every way of adding jobs fills it.
  - **Click a tech's name on the board** (with 🖱️ Pick on board on) to add their whole day; click it again to take it off. Clicking jobs, the Unassigned / Hold list, **+ All in the list** and typed job numbers work as before.
  - **＋ Whole board**: every job on the day the board shows, the timeline plus the whole Unassigned list (all pages, your board's branches), the same set 📱 Customer Texts' ＋ Everyone on the board uses (now shared code). Holds, canceled appointments and other days are left out. The message says how many came from each.
  - **＋ A tech's jobs…** list: picking a tech adds their day to the list. Counts and jobs come from the board's own data plus the bubbles showing, so a job scrolled out of view isn't missed. The list updates itself when you point at it.
  - **Each job's setting is read as soon as it's added** (a few at a time, from ServiceTitan's job data, no pages opened): 🔔 or 🔕 next to it in the list, and a **gray dashed** outline on the board for jobs that are off (orange for on). A line adds it up: *🔔 11 on · 🔕 3 off*. A job taken off the list forgets its reading, and a reading older than 10 minutes is read again. Jobs that can't be read show ❔.
  - **The buttons count what they'd change:** *🔕 Turn off (11)*, *🔔 Turn on (3)*, and stay grayed out when there's nothing to change. The confirm says how many are already that way (left alone), how many haven't been read yet, and about how long it will take.
  - **Turning off / on works exactly as before:** every job is read fresh at the start, only the ones that need it are opened one at a time, the switch is flipped and checked against ServiceTitan's data, and problem jobs get one more try at the end.
  - **Results are customer cards** (the shared cards from 📥 Check replies, without the phone line): ⚠️ Problems first, each with **🔗 Open job** (opens it in a new tab), then *Turned off*, then *Already off*. Long sections start folded. **↻ Try the problem jobs again** reruns the list (finished jobs are only read). The step-by-step log is under **📜 Details**; **Copy results** copies the cards and the log.
  - **Jobs stay on the list after a run**, showing their new setting, so the board shows at a glance what's off. **Clear** starts over.
  - **↻ Check** replaces *Check jobs (changes nothing)*: reads every job again and lists them as cards (opening a job only if its data can't be read).
  - **No permission to open job records:** the tool says so as soon as the jobs are read, and the turn buttons stay off.
  - The tool scrolls when a long list and the results are taller than the window.
- **Shared pieces:** the job picker can take tech-name clicks, show a mark next to each job and add its own board highlighting; the customer cards can leave out the phone line; ＋ Everyone on the board's loading moved to shared code (📱 Customer Texts behaves the same).
- Tests: `tests/test_job_notifications.py` rewritten for the new tool, with a whole-board section; `tests/board.html?full` adds the board's own data (the day, assignments with their techs, a job not drawn, canceled and next-day appointments, and the Unassigned list).

## 1.6.5

- **📱 Customer Texts: `{when}` fill-in.** It becomes **today**, **tomorrow**, or the date (**on Friday, October 30**) by comparing the appointment's day on the board with today's date when the text goes out. Today and tomorrow stay plain words; anything later is the date. Jobs on the board's day (the timeline, or **＋ Everyone on the board**, which also adds that day's Unassigned list) use the board's day; a job picked from another tab of the job list or typed in gets its next appointment read from ServiceTitan (the same list the job panel shows). Holds are skipped with the reason, and so is a day that has already passed.
- **✅ Confirm Appt uses it:** *…remind you of your appointment you have with us {when}…*, so one message works the day before, the morning of, or a week ahead. Anyone with the 1.6.4 message saved unchanged gets it updated once; a message you changed is left alone.
- **📥 Check replies reads dates.** A confirm text that names a date (*on Friday, October 30*, *Oct 30th*, *10/30*, or ServiceTitan's reminder with its date) counts for that day only, however long before it was sent, so a reminder sent a week ahead counts and one for a different appointment doesn't. A text without a date counts when it was sent since the last weekday before the day, as before, except that one saying *today* only counts if it was sent on the day itself, and one saying *tomorrow* doesn't if it was (each is about another appointment). **Not texted** now says which day: *no confirm text for Fri, Oct 23*.
- **📥 Check replies cards say why there's no ✅ Add to confirm:** a customer whose appointment is already confirmed in ServiceTitan (a C to ServiceTitan's own reminder, or a coworker confirmed it) now shows *☑️ Already confirmed in ServiceTitan* instead of just having no button. Every card on the Will confirm list has **↩ Take off** (before, only the ones you added); taking off someone who answered yes puts them under Needs a look, saying so.
- Tests: new `tests/test_when.py`. The Check replies tests' texts no longer depend on the time of day they run.

## 1.6.4

- **📱 Customer Texts: ✅ Confirm Appt folder** (new default; added once for anyone who already saved their folders). Its message: *Hey, this is {dispatcher} with AirSouth… remind you of your appointment you have with us tomorrow… Reply 'C' to confirm. Thank you!* Same-message-today repeat rule. Send it with the board on tomorrow and **＋ Everyone on the board**.
- **📥 Check replies and confirm** (in Confirm Appt, or any folder with **✅ Customers confirm by replying C** ticked in 📁 Edit folders). It never sends anything. For each customer on the board's day (or only the jobs you picked) it finds the confirm texts sent since the last weekday before that day (a Monday's reaches back to Friday; an older text was for an earlier appointment), and every reply after the first one. A confirm text is any text asking them to reply C to confirm, however it's worded: a Confirm Appt message (only letters and numbers are compared, so "Air South" / "AirSouth" and "&" / "and" don't matter), a coworker's own wording, or ServiceTitan's automatic reminder. (ServiceTitan confirms a C to its own reminder by itself, so those show as already confirmed; anything else said to it is read like any other reply.)
  - **Only C, Yes, OK, Confirmed, 👍 and the like** (with or without "thanks", and iPhone 👍/❤️ reactions): their appointments that day are confirmed when you press Confirm, with the same request as the job panel's ⋮ → Confirm, then read back to make sure it stuck.
  - **Anything else** (a question, "C but…", STOP, a yes followed by something else), a confirm text that failed, a Done or canceled appointment, or a confirm that didn't stick: listed under **⚠️ Needs a look**. Nothing is tagged or changed for them. Each one is a card with their name, job number, full phone number and everything they replied (never cut short), with **📋 Name**, **📋 Phone** and **💬 Open chat** (their conversation in a new tab) buttons.
  - **No reply yet** and **Not texted** are listed too.
  - **✅ Add to confirm** on Needs a look, No reply yet and Not texted cards: when you decide they're a yes ("C call before you come…", or they confirmed by phone), the card moves to **Will confirm** (marked *Added by you*), with **↩ Take off** to put it back. Nothing is confirmed until you press Confirm, and a card you added is still looked at once more first: a message that came in since the check stops it.
  - **The whole report is customer cards**, in sections that fold open or shut (Needs a look and the ones to confirm start open). Each card: name, job numbers, full phone number, what happened, everything they replied, and **📋 Name**, **📋 Phone** and **💬 Open chat** buttons. Color-coded: amber needs a look, green yes / confirmed, blue already confirmed, gray no reply or not texted. **Copy results** copies all of it as text. The cards are a shared piece, ready for other tools later.
  - Right before a customer is confirmed, their conversation is looked at once more; a message that came in since the check sends them to Needs a look instead (you or a coworker reading their reply doesn't). An appointment moved to another day since the check isn't confirmed. Stopping lists every appointment it didn't get to.
  - Unread conversations stay unread. Reading the data shouldn't mark them read, but the first unread one is checked right after, and if ServiceTitan did mark it read, no other unread conversation is read that time (they're listed instead).
  - Replies to other folders' texts (OutReach, Holds…) are never read as a confirmation.
- Tests: new `tests/test_confirm_replies.py`. The fake board now has appointment numbers, the confirmed flag, and the job panel's confirm request.

## 1.6.3

- **Safer with two tabs open (💬 Tech Messages and 📱 Customer Texts).** Each tab used to load your 🛡️ *Who can be messaged* and 🚫 *Never text* lists once, when the Toolbox opened. So with the Toolbox open in two tabs:
  - someone blocked in tab A could still be messaged or texted from tab B, and
  - opening 🛡️ or ⚙️ Settings in tab B and pressing Save **erased** the blocks made in tab A (it saved tab B's old list over them).

  Now both tools read the lists as saved right now: when showing who's picked, when picking on the board, on the check before sending, when opening 🛡️ / ⚙️ Settings, and again right before each person. Someone blocked mid-run (in another tab) is skipped at their turn with *on your 🚫 never-text list* or *blocked by your 🛡️ settings*, and their conversation is never opened. If the saved list can't be read, the tool keeps the list it already had rather than an empty one (for 🛡️ teams, damaged settings block everyone).
- **📱 Customer Texts no longer fills the Back button.** Every conversation a run opened was a new step behind the browser's Back button (a 150-text OutReach run left 150+). Now each page the run opens takes the place of the one before, ending back on the board, so Back works the same after a run as before it.
- **💬 Tech Messages puts the Toolbox back.** During a run it slides the Toolbox to the left so it doesn't cover the message panel; it now goes back where it was when the run ends (unless you dragged it somewhere during the run).
- **Job and tech numbers only.** Clicking a job or tech on the board only ever picks a real number, and only numbers go into the highlight styling. (ServiceTitan's IDs are always numbers, so this is a guard, not a fix you'd notice.)
- **📱 STOP / START at the same moment.** If a customer's STOP and START replies have the same time (or no time), they're read in message-number order instead of whatever order the list came in.
- Tests: new `tests/test_review_fixes.py` and `tests/board_send.html` (a fake Send Message panel, so Tech Messages' sending is tested for the first time). The fake Chat Center data can now set a message's number.

## 1.6.2

- **Faster 🔀 Move Jobs: up to three jobs at once.** Moving a job off one tech and onto another waits on six answers from ServiceTitan (a fresh look, the booked check, the add, a reading to confirm it, the take-off, a reading to confirm that), where a job from Unassigned waits on four. Done one job after another, that's what made tech-to-tech moves slow. Now up to three jobs are worked on at once, so the waiting overlaps. On the test board with ServiceTitan answering in 0.3 s, 6 jobs from one tech to another went from about 15 s to 4 s, and 6 from Unassigned from about 11 s to 3 s (with the quicker ending below).
  - **Each job is still done the same careful way**, in the same order: a fresh look right before, the checks again, the new tech added and confirmed from ServiceTitan's data, and only then the old tech taken off and confirmed. A job is never left with no tech halfway.
  - **Two visits of the same job are never worked on at the same time** (they go one after the other).
  - **If a job has a problem, it goes back to one job at a time** until a job goes through, to go easy on ServiceTitan when it's slow or failing. Problem jobs still get one more try at the end, one at a time.
  - **Stop** starts no new job and lets the jobs already started finish (the button says *Stopping after the jobs in progress...*), so nothing is still changing after the run says it's done. Closing the Toolbox during a run waits for them too.
  - **Swap two jobs' techs** still goes one job after the other (it's both jobs or neither). **Swap whole day** and **↩ Put back** use the three-at-once runs.
  - **Already booked, with several jobs at once:** every job the run will do counts as the run's own from the start (not only the ones already done), so the jobs being stacked or swapped onto a tech never count as "booked" for each other, whatever order they finish in. Anything else at that time (another job, time off, a meeting, a job your board's filters hide) still does. Jobs worked on at the same time share one read of the day's full schedule.
  - **A run ends as soon as the board shows the changes.** It used to always wait 2.5 seconds before checking. Now it checks every 0.2 seconds and finishes the moment every moved job shows its new tech (usually within a second). If the board still hasn't caught up after 2.5 seconds, it refreshes the board as before.
  - **Signed out mid-run:** a change ServiceTitan refused because you were signed out isn't listed for Put back (nothing changed on it). A change that went through before the sign-out still is.
- Tests: new `tests/test_move_speed.py` (three at once and never more, add confirmed before every take-off, two visits one after the other, slowing down after a problem, signed out with several jobs on their way, a whole-day swap and its Put back). The stop test now uses nine jobs, and the "booked mid-run" tests hold back the later job's own check until the earlier jobs have changed, which is what mid-run means when jobs run side by side.

## 1.6.1

- **New in 📱 Customer Texts: ＋ Everyone on the board.** Under **Who → 🖱️ Jobs I pick**, it adds every job on the board for the day it shows:
  - every job on the timeline (with your board's filters), and the whole Unassigned list for that day (all pages, for your board's branches), even jobs not showing at the bottom of the board;
  - one text per customer, as always (a customer on the timeline and in Unassigned counts once);
  - canceled appointments are left out, and so is anything from another day;
  - holds aren't included (the Hold list has its own choice under Who);
  - the picked list shows everyone, so you can take anyone off with ✕ before pressing Start. All the usual checks still run before anything is typed.
- **New folder: 📣 OutReach**, for reminders to customers on the board. Its repeat rule skips anyone who got the same message in the last 30 days, and it starts with a **🔥 Heater reminder** you can edit. The starter text is a plain reminder ending in *Reply STOP to opt out*, with no phone number, offer or "call us" (that's what makes a reminder read as a sales text). If you already saved your own folders, OutReach is added once at the end of your list; delete it and it stays deleted. If you already have a folder called Outreach, you don't get a second one.
- **Faster big runs (about 15% faster per text, measured on the test board with slow ServiceTitan answers):**
  - The full fresh look at the next customer (a new reply, a STOP, blocked in ServiceTitan) now happens while the current text is being typed and sent. At their turn, one quick read of their conversation confirms nothing has changed since and that you're still signed in; if anything changed, the full look is done again. A look more than 15 seconds old (Type only, while you take your time) is done again, and holds always get the full look at their turn. The open conversation is still checked right before typing, every time.
  - It notices a loaded conversation and a sent text sooner (checks every 0.1 to 0.15 seconds instead of every 0.25 to 0.3).
- Added tests (`tests/test_customer_texts.py`, `tests/test_outreach.py`, `tests/board_texts.html`).

## 1.6

- **New: 🔀 Move Jobs.** Move jobs between techs without dragging on the board:
  - **➡️ Move to a tech** (replace everyone, or just one tech on a two-tech job), **➕ Add a tech**, **⬅️ Unassign**, **🔄 Swap two jobs' techs** and **🔁 Swap two techs' whole day**.
  - **＋ All Unassigned** loads the whole Unassigned list for the day the board shows, so every unassigned job can go on one tech at once.
  - **Review (changes nothing)** shows every job and every warning first, with the same checks the job panel makes before assigning: a skill the tech doesn't have, a tech already booked at that time, and a managed tech on every job with a price. Jobs with a warning are only done if you tick that warning's box.
  - The new tech is always added before the old one comes off, so a job is never left in Unassigned halfway. Unassigning a job from another branch (which would drop off your board) needs its own tick.
  - Each job gets a fresh look right before it changes, each change is confirmed from ServiceTitan's data, problem jobs get one more try, and **↩ Put back** undoes the last run.
  - **🔕 Notifications for these jobs…** hands the moved jobs to Job Notifications.
  - **↩ Put back is saved in your browser for a day**, so it still works after the Toolbox is closed, the page is reloaded, or a new copy is loaded, and from any day on the board. A job someone changed since the move is still left alone.
  - **The board refreshes itself** if it hasn't shown a move after a couple of seconds (the board's own refresh: same day and filters, no page reload). Only if that doesn't work does it say to press F5.
- **Move Jobs safety fixes (from a code review, each with a test in `tests/test_move_safety.py`):**
  - **Swap two jobs is both jobs or neither.** One side with an unticked warning, a Done job, or a change since the review means nothing is swapped. Both jobs are read again right before. If the second fails after the first changed, it says *half swapped* and Put back can undo the first.
  - **Lost answers:** if a change goes through but ServiceTitan's answer never arrives, the Toolbox reads the job to see what happened instead of saying "Nothing changed". Put back always returns jobs to where they were before the run touched them, even after a retry, and keeps a job that changed just before a sign-out.
  - **Swaps check bookings:** time off, meetings, recurring events and other jobs now count for both swaps. Only the job each tech is leaving doesn't.
  - **Stacking:** the review says when jobs going on one tech overlap. During the run, the run's own jobs don't count as booked, but a real new booking still stops that job.
  - **Fresh checks:** the tech list (skills, managed techs) is read every review, and a review over 5 minutes old has to be done again.
  - **Status:** ServiceTitan now sends appointment status as a number, so Done appointments weren't being recognized. Fixed, and a job that isn't Scheduled (on the way, working, on hold) now gets a warning you have to tick. The fresh reading decides, never the board's word, so a board that's behind can't hide a Dispatch or a cancellation. All six status numbers were checked on the live account (Scheduled, Dispatched, Working, Hold, Done, Canceled); Done, Canceled and any status the Toolbox doesn't know are always left alone, even with the warning ticked.
  - **Managed tech:** a tech who isn't in the tech list is no longer counted as managed. A priced job with no known managed tech is left alone for you to check.
  - **Jobs your board's filters hide count too:** when three or more overlapping jobs go onto one tech (or a whole-day swap involves a tech with overlapping jobs), ServiceTitan's own check can't leave out all of the run's jobs, so the Toolbox reads the day's full schedule for every branch and team (the same data the board loads, without its filters) and looks for any other job at that time. Stacking still works. If that schedule can't be read, the job is left alone and the results say why.
  - **Answers in a shape the Toolbox doesn't know** (a renamed booked check, a missing job total or status) stop that job and show the yellow warning bar, instead of being read as "free" or "$0".
  - **Stop checking** stops a slow review.
  - **Put back checks too:** a tech going back on a job who's been booked elsewhere since the move gets the booked warning (undoing a swap doesn't count the swapped jobs), and a job that's no longer Scheduled needs a tick.
  - **Exact match before every change:** if a job's techs aren't exactly what the review saw, it's left alone with "changed since the review", for every mode including Put back.
- **All tools:** the "are you still signed in?" check now gives up after 8 seconds, and a check that doesn't answer is treated as ServiceTitan being slow, not as signed out. Before, it could hang a run forever.
- Closing the Toolbox during a run now waits until the run has really stopped. Business Unit's confirm step counts clock time.
- Job Notifications can now take a list of jobs from another tool.
- Added tests for Move Jobs (`tests/test_move_jobs.py`, `tests/test_move_safety.py`, `tests/board_moves.html`). The fake board now answers the way ServiceTitan did when checked live in Oct 2026.

## 1.5.4

- **New: 🔕 Job Notifications can turn notifications back ON.** Next to *Turn off notifications…* there's now **Turn on notifications…**, for a tech's jobs or jobs you pick. It works exactly like turning off, in reverse:
  - It asks first, and the confirm says those customers will get ServiceTitan's automatic job notifications again.
  - Jobs that are already on are skipped without opening them (on a fresh reading, in case someone changed one meanwhile).
  - Each change is confirmed from the job data. A switch that snaps back off is reported, tried once more, and stays on your picked list.
  - Picked jobs that end up on come off the list, the same as turning off.
- **Job Notifications without job-record access:** if your login can't open job records, it now stops right away and says so, instead of opening every job and blaming a ServiceTitan change.
- **Fix: 📱 Customer Texts said "ServiceTitan has signed you out" while you were signed in**, and sent nothing. Since October 2026 many dispatcher logins can't open the job record, and ServiceTitan refuses that the same way it refuses a signed-out session. Customer Texts read phone numbers from the job record, so it stopped every run.
  - Phone numbers now come from the **customer** (the same list as the customer page's Contact Methods panel), which those logins can still see. Who gets texted, landline-to-mobile, STOP, unread replies and the repeat rules all work as before.
  - When ServiceTitan refuses something, the Toolbox now checks whether you're still signed in. It only says "signed out" if you really are; otherwise it says your login doesn't have permission to see that. This applies to every tool.
  - Without job-record access, a typed job number that isn't on the board can't be looked up, so it says to pick the job on the board or from the Hold list instead.
  - Without job-record access, holds booked since the Hold list was loaded can't be spotted. The check screen says so; reload the Hold list if it's been a while.
- Added tests for a login without job-record access (`tests/test_no_permission.py`).

## 1.5.3

- **Fix: 📝 Notes opened a "This Page Could Not Be Found" page** and showed the yellow "Can't find the Add Note button" warning. When you click a job, ServiceTitan's job panel first shows a blank link to customer #0 for about a second while the job loads. Notes followed that blank link if you picked the note first, or picked it right after clicking the job. Notes now waits for the real customer (it says "Job loading..." meanwhile).
- If ServiceTitan really can't open a customer (for example a merged or deleted record), Notes now says so within a second instead of waiting 20 seconds and blaming a ServiceTitan change.
- The "job panel doesn't show the customer link" warning no longer fires while a job panel is still loading.
- Added tests for Notes (`tests/test_notes.py`).

## 1.5.2

Steadier when ServiceTitan or the board changes during a run. Nothing works differently when everything is normal.

- **Stop works right away**, even while Job Notifications, Business Unit or Customer Texts is still reading jobs. Cancel on Customer Texts' check screen stops the checking too (before, it finished in the background).
- **Signed out?** If ServiceTitan's session ends, a run stops and says "ServiceTitan has signed you out" instead of opening every job onto a sign-in page or reporting it as a ServiceTitan change. Nothing more is changed or sent.
- **ServiceTitan slow or failing:** the Toolbox drops to one request at a time, and after 4 slow or failed answers in a row it stops asking. Job Notifications and Business Unit then open the remaining jobs one at a time (the old way); Customer Texts lists who couldn't be checked so you can try again.
- **The board can change mid-run:** jobs are read all at once at the start, but a job is only left alone ("already off", "already on that branch", locked) on a reading from the last few seconds. Otherwise it's read again at its turn, in case someone changed it meanwhile.
- **📱 Customer Texts re-checks holds:** a job from the Hold list that has been booked (or cancelled) since the list was loaded is skipped, both when checking and right before its text.
- Added tests for all of this (`tests/test_concurrency.py`): slow and timed-out answers, sign-out, failing answers, Stop and Cancel mid-read, and the board changing during a run.

## 1.5.1

Faster and steadier. Nothing works differently for you except that it's quicker and tells you more.

- **Check jobs is much faster** in 🔕 Job Notifications and 🏢 Business Unit. It reads ServiceTitan's job data directly (the same data the job page shows) instead of opening every job, so 50 jobs take a few seconds instead of a couple of minutes.
- **Changes skip what's already done.** Turning off notifications skips jobs that are already off, and changing Business Units skips jobs already on that branch or locked, without opening them. After saving, the change is confirmed from the job data, which is quicker than re-opening the job.
- **📱 Customer Texts checks everyone before it starts.** The confirm screen now shows exactly how many texts will go out and who is skipped and why (STOP, unread reply, texted recently, no mobile, same number, blocked in ServiceTitan). Auto-send asks for the number of texts. Skipped customers no longer cost a page load each, and a conversation with an unread reply is never opened, so it stays unread for you.
- **Customer Texts confirms delivery in the background.** A few seconds after each text it checks ServiceTitan really sent it, and lists any that failed, even ones that fail a little after sending. Less waiting between texts.
- **ServiceTitan's "blocked" flag** on a conversation is now respected, as well as STOP replies.
- Customer Texts decides what counts as an automatic message (reminders, confirmations, surveys…) exactly the way the Chat Center page does, so a text a tech sent from his phone still counts toward the repeat rule. It also sees up to 100 messages of history, where the page shows the latest 25.
- **One picking system for every job tool**: Job Notifications, Business Unit and Customer Texts all have 🖱️ Pick on board, **+ All in the list** and typed job numbers, and work the same way.
- The Hold list loads its pages in parallel. Tech Messages counts jobs per tech in one pass.
- If ServiceTitan's data can't be read for a job or conversation, the tool opens the page and checks it the old way, so nothing is missed.
- Added automatic tests (`tests/`) that run every tool on a fake Dispatch board.

## 1.5

- **📱 Customer Texts** (new): text customers a saved message through the Chat Center.
  - Folders: **⏸️ Holds** (free-quote follow-up), **🚚 Tech Updates** (running late) and **📅 Reschedule**, plus your own. ✏️ Edit messages and 📁 Edit folders.
  - **Hold list:** loads every hold at once from the board's Hold tab, grouped by job type (Quote, Non Operational, Maintenance…) with counts. Tick groups or single job types. Or pick jobs on the board / type job numbers.
  - **Numbers:** Bill To primary, or their first mobile if the primary is a landline. Option to text every mobile on the Bill To.
  - **Fill-ins:** `{dispatcher}` (your first name from your login), `{first}` (customer), `{tech}` (tech on the board).
  - **Repeat rule per folder** (Holds: 7 days; Tech Updates and Reschedule: same message today). Always skips STOP replies, unread replies, the never-text list and numbers already texted in the run.
  - **Type only** (you press Send; it notices and moves on) or **Auto-send** (type the count to confirm; each text is checked; stops if one can't be confirmed or 3 fail in a row). Stop button and copyable results.
- **🔕 Job Notifications** can now work on **jobs you pick** as well as a tech's jobs: click jobs on the board or in the Unassigned / Hold list, add a whole list tab with **+ All in the list**, or type job numbers. The tech picker works the same as before.
- **🏢 Business Unit** and **📱 Customer Texts** can pick jobs from the Unassigned / Hold list at the bottom of the board too.
- **💬 Tech Messages**: new **🖱️ Pick on board**. Click techs' names on the board to add them, click again to take them off. The picked techs show in a list with ✕ on the main screen and are outlined on the board. 👥 Choose techs and 🛡️ Who can be messaged work as before, and blocked techs can't be added.
- Picking fixes: picking deep in the Unassigned / Hold list no longer jumps the page back to the top, pressing a job while picking can't start a drag, and each tool's highlights only show while that tool is open.

## 1.4

- **🏢 Business Unit** (new): switch the Business Unit on the jobs you pick to a branch, **Mendenhall Branch** by default. The list only offers branches, not departments.
  - Pick jobs by clicking them on the Dispatch board (they get a blue outline), or type job numbers.
  - **Check jobs** shows each job's Business Unit now and changes nothing.
  - **Change to …** asks first, then opens each job's Edit page, picks the branch, saves, and re-opens the job to confirm it stuck. Jobs already on that branch are left alone; locked jobs are skipped.
  - **↩ Put back** undoes the last run. Problem jobs get one more try. Stop button, copyable results, 50 jobs per run.
  - If ServiceTitan asks a question after Save, the run stops and leaves it for you.

## 1.3.1

- Tech Messages: the per-run limit is now **57** people (was 50).

## 1.3

- **Quick Notes is now 📝 Notes, with folders.** Opening Notes shows the folders first: **📞 Updates** (no answer, left a voicemail and so on), **🚚 Techs** (tech on the way, arrived, running late, finished) and **📅 Reschedule**. Open a folder to see its notes; adding a note to a job works the same as before.
- **Your notes carried over**: the notes you already had are in **Updates**. Techs and Reschedule start with a few notes you can change.
- **✏️ Edit folders** (on the folder list): add your own folder with its own name, rename, reorder or delete folders. Deleting a folder that has notes in it asks first. Also has **Reset to original**, and **Copy all** / **Paste all** to move everything to another browser (an old Quick Notes "Copy list" can be pasted too; it becomes its own folder).
- **✏️ Edit notes** (inside a folder): same as before, plus **Move to** on each note to put it in another folder.
- **Shortcuts follow the screen**: on the folder list, Alt/Option + 1–9 opens that folder; inside a folder, it adds that note.
- Notes reopens the folder you were last in.

## 1.2.5

- **Safer closing**: closing the Toolbox (✕ or the bookmark) while Job Notifications or Tech Messages is running now asks first. **Stop it and close** stops the run cleanly, then closes. Before, the panel closed but the run kept going out of sight.
- **Tech Messages is lighter on the board**: it remembers where ServiceTitan's message panel is instead of searching the whole page over and over.
- **Quick Notes rests while you use other tools**: leaving Quick Notes cancels a note that was waiting for a job click. Using an Alt/Option + number shortcut from another tool opens Quick Notes so you can see what it's doing (ignored while another tool is running).
- ✏️ Edit notes and ✏️ Edit messages now share the same editor behind the scenes. They look and work the same.
- Small fix: a damaged saved setting can no longer stop Tech Messages from starting.

## 1.2.4

- **Job Notifications retries problem jobs**: if a job fails during a run (switch not found, didn't turn off, flipped back on, or an error), the tool goes back to it once after the rest of the run is done.
- Retry lines show in the results as "retry:", and the final count uses each job's latest result. Anything that still fails is listed at the end.
- Pressing Stop skips the retries.

## 1.2.3

- **Fix for board filters**: a team or people filter hides the team headers, which made Tech Messages warn "can't find team names" / "can't tell which team each tech is on". Tech Messages now remembers each tech's team whenever the board is unfiltered and uses that while a filter is on, so the warning doesn't appear and picking works the same as always.
- Blocked teams and the never-message list still apply while filtered.
- A tech the Toolbox has never seen on an unfiltered board can't be picked until it has. The picker says how many, and clearing the filter once fixes it.

## 1.2.2

- **Back to the 1.2 picker**: choose techs one by one or by team, exactly like before. 1.2.1's change to the picker is undone.
- **Board filters work**: with the Dispatch board filtered by team or people, anyone the filter hides is labeled "hidden by board filter" in the picker and skipped during a run. It no longer stops the run or shows the "ServiceTitan may have changed" warning.
- If a tech's menu is slow to open, it tries once more before warning.
- The health check looks at a tech who is showing on the board.

## 1.2.1

- **Fix**: filtering the Dispatch board by team or people no longer sets off the "ServiceTitan may have changed" warning or stops a Tech Messages run.
- Tech Messages only lists and messages techs that are showing on the board. Techs you picked who are filtered out stay picked, and the "To:" line says how many are being left out.
- The health check now looks at a tech who is showing, and skips its checks if a filter is hiding everyone.

## 1.2

- **Health check**: when the Toolbox opens on the Dispatch board it quietly checks that the things each tool relies on are still there. If ServiceTitan has changed something, a yellow bar says which tool is affected and what's missing, with a **Copy report** button.
- The same warning appears if a tool runs into a missing piece while working (for example the Add Note button, the notification switch, or the message box). Tech Messages stops the whole run when that happens.
- **🩺 Check** button in the menu to run the check any time.

## 1.1

- **Tech Messages** (new): send a saved message such as Good Morning or ETA to the techs you pick, one at a time through each tech's Send Message panel.
  - Editable messages, with `{first}` for the tech's first name.
  - Pick techs by team, search, or "only techs with jobs today".
  - **Type only** mode (you press Send for each person) or **Auto-send** mode (you confirm by typing how many people it will message).
  - Safety: only teams you approve can ever be messaged (new teams start blocked), a never-message list for individual people, a check that the panel shows the right person and nothing is covering it before typing, a 50-person limit per run, and it stops if a send can't be confirmed.

## 1.0.1

- Test update.

## 1.0

First version.

- **Quick Notes**: adds a ready-made note to a job's customer in one click, in either order (job then note, or note then job). Retries the Add Note button if the page is slow and checks the note was really typed. Editable notes, time stamp option, Alt/Option + number shortcuts.
- **Job Notifications**: pick a tech from a list of techs with jobs that day, then check or turn off notifications on their jobs, with live progress, a Stop button and copyable results.
- Menu layout: pick a tool from the main menu; Quick Notes reopens where you left off.
- Works in Chrome, Edge, Firefox and Safari.
- Loads the newest version every time the bookmark is clicked, and shows what's new after an update.
