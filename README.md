# ServiceTitan Toolbox

A small panel of time-savers for the ServiceTitan Dispatch board. It runs from a browser bookmark, works in Chrome, Edge, Firefox and Safari, and updates itself: everyone who installs it gets the newest version the next time they click the bookmark.

## The new Dispatch board (2.0)

Version 2.0 works on ServiceTitan's new Dispatch board, on its **Day** view. On the Week view the Toolbox asks you to switch to Day.

- **Jobs you pick show more:** their tags (12-5 AFTERNOON, Total Care Club Member…) and how their day is going: 🗓️ the appointment time, 🚚 Dispatched 10:20 AM, or 🔧 Working. It comes from the board's own data, nothing is opened.
- **＋ Jobs with a tag…** under every job list adds every job on the board (and the Unassigned list) that has that tag.
- **The whole day in one request:** ＋ Whole board, ＋ Everyone on the board and ＋ A department… read the day's jobs, techs and teams the way the board does, so they're quicker and don't miss jobs scrolled out of view.
- **The Jobs Tray** under the board (Unassigned, Hold and the other tabs): click jobs in it to pick them, or **+ Tray page** to add the tab and page that are open.
- **A new look**, matching the new board. **–** folds the Toolbox down to its title bar; click it again to open it back up.
- **Make it wider or narrower** by dragging its left edge or bottom-right corner. It remembers the width; double-click either one for the usual width. Nothing inside scrolls sideways.
- **Quick animations** (fading in and out, tools sliding in, smooth folding, loading spinners). If your computer is set to reduce motion, they're turned off.

## Tools

**📝 Notes**
Ready-made notes sorted into folders: **📞 Updates** (no answer, left a voicemail and so on), **🚚 Techs** (tech on the way, tech arrived) and **📅 Reschedule**. Open a folder, then click a job on the Dispatch board and click a note (or pick the note first, then click the job). The Toolbox opens that job's customer, clicks **Add Note** and types the note in. It stops there so you can check it and click **Add Note** to save.

- Keyboard shortcuts: **Alt + 1–9** (**Option + 1–9** on a Mac) follow what's on screen: on the folder list they open a folder, inside a folder they add that note.
- Optional time stamp at the start of each note
- **✏️ Edit folders** to add your own folders, rename, reorder or delete them. **Copy all** / **Paste all** moves your folders and notes to another browser.
- **✏️ Edit notes** (inside a folder) to change, add, remove or reorder its notes, or move a note to another folder.
- Edits are saved in your own browser. Notes from before folders were added are in **Updates**.

**🔕 Job Notifications**
One list of jobs, filled any way you like (picked jobs get an orange outline on the board):

- **🖱️ Pick on board**: click jobs on the timeline or in the Jobs Tray under the board. Click a **tech's name** to add their whole day (click it again to take it off).
- **＋ Whole board**: every job on the day the board shows, the timeline plus the whole Unassigned list (all pages, your board's branches), read in one go. Holds and canceled appointments aren't included.
- **＋ A tech's jobs…**: pick a tech from the list (only techs with jobs that day, with how many).
- **+ Tray page** (the Jobs Tray tab and page that are open), **＋ Jobs with a tag…**, or type job numbers.

Each job's setting is read as soon as it's added, without opening anything: **🔔 on** or **🔕 off** shows next to it in the list, and on the board off jobs get a **gray dashed** outline instead of orange. The line above the buttons adds it up (*🔔 11 on · 🔕 3 off*).

- **🔕 Turn off (11)** / **🔔 Turn on (3)**: each button says how many jobs it would change. The confirm says how many are already that way (left alone) and about how long it takes. Every job is read fresh, and only the ones that need it are opened, one at a time, to flip the switch and make sure it stuck. Turning on means those customers get ServiceTitan's automatic job notifications again.
- **↻ Check**: reads every job again and lists them (changes nothing). If ServiceTitan's job data can't be read, it opens each job instead.

Results come back as cards: **⚠️ Problems** first (with **🔗 Open job** to look at it yourself), then what was turned off or on, then what was already that way. Any job that has a problem gets one more try after the rest of the run, and **↻ Try the problem jobs again** runs it once more. Jobs stay on the list showing their new setting; **Clear** starts over. **📜 Details** shows the step-by-step log, and **Copy results** copies everything.

Your ServiceTitan login needs permission to open job records. Without it, the tool says so and changes nothing.

**💬 Tech Messages**
Send a saved message (for example Good Morning or ETA) to the techs you pick. It opens each tech's Send Message panel, types the message, and either waits for you to press Send (**Type only**) or sends it for you (**Auto-send**).

- **✏️ Edit messages** to change or add messages. Use `{first}` for the tech's first name.
- **👥 Choose techs** by team, by name, or only techs with jobs on the board.
- **＋ 🔧 Working (n)** and **＋ 🚚 Dispatched (n)**: add every tech ServiceTitan shows as working a job, or on the way to one, in one click. Each picked tech shows that status too. (Idle isn't offered: it can mean too many things.)
- **🖱️ Pick on board**: click techs' names on the Dispatch board to add them (click again to take one off). They show in a list with ✕, and get a purple outline on the board. Techs your 🛡️ settings block can't be added.
- **🛡️ Who can be messaged**: tick the teams that are OK to message and add anyone to a never-message list (for example the owner). Nothing can be sent until this is set up, and any new team starts blocked.

Safety checks on every send: it re-checks your 🛡️ settings, closes any open job panel, confirms the message panel shows the right person and nothing is covering it, skips anyone whose message box already has text, and stops the whole run if a send can't be confirmed. Auto-send asks you to type how many people it will message, and there's a limit of 57 per run.

**🏢 Business Unit**
Switch the Business Unit on one job or many to a branch: **Mendenhall Branch** unless you pick another. Only branches are offered, not departments.

- **🖱️ Pick on board**, then click jobs on the Dispatch board, or in the Jobs Tray under it, to add them (click again to take one off). Picked jobs get a blue outline. **+ Tray page** adds every job on the Jobs Tray page that's open, and you can type job numbers, which works for jobs on other days.
- **Check jobs**: shows each job's Business Unit now, and whether it's locked. Changes nothing. It reads ServiceTitan's job data directly, so it takes seconds.
- **Change to …**: after you confirm, it picks the branch on each job's Edit page, presses **Save**, then makes sure the change stuck. Jobs already on that branch, or locked, are left alone without opening them.
- **↩ Put back** returns the jobs from the last run to the Business Unit each one had before.

If ServiceTitan locks a job's Business Unit, the job is skipped and listed. If ServiceTitan pops up a question after Save, the run stops there and leaves the question on screen for you to answer. Up to 50 jobs per run.

**📱 Customer Texts**
Text customers a saved message through ServiceTitan's Chat Center. Messages are sorted into folders, **⏸️ Holds**, **🚚 Tech Updates**, **📅 Reschedule**, **✅ Confirm Appt** and **📣 OutReach**, plus any you add.

- **Who:** the **Hold list** (every hold on the board's Hold tab loads at once; tick the kinds to text, such as Quote or Non Operational, or open a kind to tick single job types), or **jobs you pick** on the board, in the Jobs Tray under it (or a whole Tray page with **+ Tray page**), by tag, or by job number. **＋ Everyone on the board** adds every job for the day the board shows: the timeline plus the whole Unassigned list (holds and canceled appointments aren't included). One text per customer. **＋ A department…** next to it adds just one team's jobs that day (the team names on the board, like Level 1 Service or Installers, with how many jobs each has), or just the Unassigned list; pick another to add it too. A job with two techs on different teams is in both. Teams come from the board's own data, so a board filter doesn't hide them; a tech with no team is under *Other (no team)*.
- **Checked before it starts:** pressing Start checks every customer first, without opening their conversation (a few seconds for a big list). The next screen shows exactly who will be texted and who is skipped, and why. Right before each text it takes one more quick look, in case something changed (a reply, a STOP, or a hold that has been booked since).
- **Which number:** the Bill To's primary number. If that's a landline, their first mobile number. In ⚙️ Settings you can text every mobile number on the Bill To instead.
- **Fill-ins:** `{dispatcher}` is your first name from your ServiceTitan login (or the name in ⚙️ Settings), `{first}` the customer's first name, `{tech}` the tech's first name (jobs on the board), `{when}` when their appointment is: **today**, **tomorrow**, or the date (**on Friday, October 30**), from the appointment's day and today's date. Jobs on the board's day use the board's day (the easiest way is **＋ Everyone on the board**); a job from another tab or typed in gets its own next appointment read. Holds are skipped for `{when}`, and so is a day that has already passed.
- **Repeat rules per folder:** Holds skips anyone who got a text from us in the last 7 days. Tech Updates and Reschedule skip anyone who already got that same message today. OutReach skips anyone who got that same message in the last 30 days. Change them in 📁 Edit folders. Automatic notifications and texts that failed don't count.
- **Skipped every time:** anyone who replied STOP or is blocked in ServiceTitan, anyone with an unread reply (listed so you can read it; their conversation isn't opened, so it stays unread), numbers on your 🚫 never-text list, and a number shared with another customer in the same run (texted once).
- **Type only:** it opens each conversation and types the message. You press Send and it moves on by itself. **Auto-send:** you confirm by typing how many texts it will send, and it checks each text went out. A few seconds after each text it also checks ServiceTitan really delivered it, and lists any that failed. It stops if a text can't be confirmed or 3 fail in a row.
- **✅ Confirm Appt and 📥 Check replies:** with the board on tomorrow, send **✅ Confirm Appt** to **＋ Everyone on the board**, or one department with **＋ A department…** (it asks customers to reply C). Later, press **📥 Check replies and confirm** in that folder. It reads each customer's replies to any text asking them to reply C (yours, a coworker's in their own words, or ServiceTitan's automatic reminder) and shows (nothing is sent, and unread conversations stay unread):
  - **✅ Answered yes:** they replied only C, Yes, OK, Confirmed, 👍 or similar (with or without "thanks"). Their appointments on the board's day get confirmed when you press **Confirm**, the same as ⋮ → Confirm on the job panel, and each one is checked afterwards. A C to an earlier text about the same appointment (Saturday's for Monday, say) still counts after a newer reminder went out, as long as all they said after it was another yes, "already did" / "I already confirmed" or "thanks".
  - **⚠️ Needs a look:** anything else (a question, "C but…", STOP, a reply after their yes), a confirm text that didn't go through, or a confirm that didn't stick. Each is a card with their name, job number, full phone number and everything they replied, plus **📋 Name**, **📋 Phone** and **💬 Open chat** buttons so you can follow up.
  - **💤 No reply yet** and **Not texted** (no confirm text about the board's day): nothing changes for them. A text that names the day, by its date or just its weekday (*Monday*, sent Thursday or Saturday), counts however early it was sent; one naming another day doesn't. A text that names no day counts if it was sent since the last weekday before the board's day (a Monday's reaches back to Friday); an older one was for an earlier appointment, so a C to it doesn't count.
    The report is a card for every customer, in sections that fold open or shut (Needs a look and the ones to confirm start open), each with their name, job numbers, full phone number, what they replied, and copy / open-chat buttons.
  **✅ Add to confirm** on a Needs a look, No reply yet or Not texted card puts them on the list to confirm (for a reply that's really a yes, or someone who confirmed by phone); **↩ Take off** puts them back.
  Picked jobs: only those are checked; nothing picked: everyone on the board. Right before a customer is confirmed their conversation is looked at once more; if a new message came in, they go to Needs a look instead (someone just reading their reply doesn't count). Canceled and Done appointments, and ones moved to another day since the check, are never confirmed.
  Which folders count is the **✅ Customers confirm by replying C** box in 📁 Edit folders (on for Confirm Appt only). Replies to any other folder's texts, like OutReach, are never read as a confirmation.
- **✏️ Edit messages**, **📁 Edit folders** and **⚙️ Settings** are saved in your own browser. About 3 to 4 seconds per text (the next customer is checked while the current text goes out); keep the tab on screen while it runs.

**🔀 Move Jobs**
Move jobs between techs without dragging, from the Dispatch board. It works on the day the board shows. Pick what to do:

- **➡️ Move to a tech**: the picked jobs go to the tech you pick. **From** can be **Anyone on the job** (the new tech replaces everyone) or one tech, for jobs with two techs.
- **➕ Add a tech**: puts another tech on the jobs and keeps whoever is on them.
- **⬅️ Unassign**: takes everyone, or one tech, off the jobs.
- **🔄 Swap two jobs' techs**: pick two jobs and they trade techs. It's both jobs or neither: if one can't go (a warning you don't tick, a Done job, a change since the review), nothing is swapped. If the second job fails after the first changed, it says it's half swapped.
- **🔁 Swap two techs' whole day**: every open job of Tech A's goes to Tech B, and every one of B's goes to A.

Pick jobs with **🖱️ Pick on board**, **+ Tray page**, **＋ Jobs with a tag…**, typed job numbers, or **＋ All Unassigned**, which loads the whole Unassigned list for the day (all pages) for your board's branches. That's the quick way to put every unassigned job on one tech.

- **Review (changes nothing)** checks every job first and lists what will change. It makes the same checks ServiceTitan's job panel makes before assigning: a **skill** the tech doesn't have, a tech **already booked** at that time, and a **managed tech** on every job with a price (that one ServiceTitan doesn't allow, so those jobs are left alone). It also warns about a job that isn't **Scheduled** (the tech is on the way, working, or it's on hold). Jobs with a warning are only done if you tick that warning's box. Done and Canceled appointments, and any status the Toolbox doesn't know, are left alone (the job's fresh status decides, not the board's label). **Already booked** counts other jobs, time off, meetings and recurring events; for swaps it doesn't count the job each tech is leaving, and when several jobs go on one tech at the same time (stacking) the review says so and the run's own jobs don't count. Jobs your board's filters hide still count: when it needs to, the Toolbox reads the day's full schedule for every branch and team. A review is good for 5 minutes, and the tech list (skills, managed techs) is read fresh every review. **Stop checking** stops a slow review.
- **Never left in Unassigned halfway:** the new tech is always added before the old one comes off, and only once ServiceTitan shows the new tech on the job.
- **Another branch's job:** unassigning a job that isn't in your board's branch sends it to that branch's Unassigned list, where it drops off your board. Those are listed with a warning and only unassigned if you tick that box.
- Right before each job it takes one more look: if its techs aren't exactly what the review saw, it's left for you to look at. Each change is confirmed from ServiceTitan's data, problem jobs get one more try, and there's a Stop button and a copyable list of results. If ServiceTitan's answer gets lost, the Toolbox reads the job to see what really happened instead of guessing.
- **↩ Put back** returns the jobs from the last run to exactly the techs they had before the run touched them (even after a retry or a lost answer). It's reviewed like any move: a tech booked elsewhere since, or a job that's no longer Scheduled, gets a warning to tick. A job someone changed since is left alone, and one whose change couldn't be confirmed is listed for you to check. It's saved in your browser for a day, so closing the Toolbox or reloading the page doesn't lose it.
- After a run, Move Jobs presses the board's own **Refresh** so it shows the changes (same day and filters, no page reload). The review reads the board fresh too.
- **🔕 Notifications for these jobs…** opens Job Notifications with the moved jobs added to its list, to turn their notifications off. That part needs permission to open job records.

It sends the same requests the job panel's ⋮ → Assign/Unassign sends. Up to three jobs are worked on at once (each one step by step: checked, new tech added and confirmed, old tech taken off and confirmed), so a run takes a fraction of a second to a couple of seconds per job, where clicking through the panel takes several. Two visits of the same job, and a two-job swap, go one after the other. Up to 300 jobs per run.

**🧭 Tech Router (Beta)**
Still being built: it says so each time it's opened, so check its suggestions before you call a customer or move a job. It only reads; nothing changes unless you take a job to 🔀 Move Jobs and press the button there.

- **📞 Fill a spot**: for a tech whose day is already planned. Pick the tech (the list, or 🖱️ and their name on the board) and when: any time, 🌅 first thing, 🕛 mid-day or 🌇 the end of the day. It finds their open time on the day the board shows (their shift less their jobs, meetings and time off; 8 AM–5 PM if the board has no shift for them) and lists the best jobs to fill it from the **Unassigned list** (that day and the next 14) and the **Hold list**, with the customer's phone number to call and move them up.
  - Only the kinds of jobs the tech or their department did in the **last 4 weeks of schedules**, so a project coordinator gets quotes, not electrical or plumbing ones.
  - The job and the driving must fit the open time; least extra driving first (from their job before, or home, to it and on to their next job, or home). Then Urgent and High priority, jobs already on that day, and jobs waiting longest. Over 90 minutes out of the way is left out.
  - Jobs that need a skill the tech doesn't have, and (for Sales/ Service and Project Coordinators) jobs that would take a day of driving past 5 hr 30 min, are marked ⚠️ and rank lower.
  - 📋 Phone, 📋 Name, 🔎 Open job on each, ➡️ Move Jobs for a job already on that day's Unassigned list, 📋 Copy list for all of them.
- **🗺️ Plan the day**: a tech and a route for every Unassigned job on the day the board shows. Each route goes 8-12s first, then 12-5s, then 5-9s (by the job's arrival-window tag); a little late is OK (up to 1 hour to start, which you can change), and Urgent jobs go first. Jobs already on a tech's board keep their order and new ones go in between, in the right department, with the least extra driving, spreading the work and keeping to the sales rule. You see each route with arrival times (late stops marked) and what couldn't be planned, then **➡️ Send to Move Jobs**, Review and **Assign** there.
- **🔎 Closest techs**: a zip code or job number (or 🖱️ and a job on the board): the techs closest by drive time, from where they are now (today) or from home. For a job with a tech, **📍 Next job** lists the Unassigned jobs nearby that tech could take after it.
- Drive times come from Mapbox (a public key is built in; ⚙️ Drive times can use your own). Every point sent is rounded to about half a mile, and nothing else about a job is sent. If drive times can't be had, straight-line miles are used and marked ~.

**🩺 Health check**
If ServiceTitan changes something a tool relies on, a yellow bar at the top of the Toolbox says which tool is affected and what's missing, instead of the tool failing quietly. Use **Copy report** to pass the details along, or **🩺 Check** in the menu to check any time.

If ServiceTitan signs you out during a run, the run stops and says so. If ServiceTitan is slow or failing, the Toolbox eases off and stops asking after a few failed answers in a row, and the **Stop** button always works right away.

## Install

Open the project's install page (the GitHub Pages address for this project) and drag the **🧰 Toolbox** button onto your bookmarks bar. The page also has copy-and-paste steps for each browser.

## Tests

The `tests` folder has automatic checks that run the Toolbox on fake copies of the Dispatch board (nothing touches ServiceTitan). Run `python3 tests/run_all.py` before releasing an update. See `tests/README.md`.

## Files

| File | What it is |
|---|---|
| `toolbox.js` | The Toolbox itself |
| `index.html` | The install page |
| `CHANGELOG.md` | What changed in each version |
| `tests/` | Automatic checks (see above) |
| `LICENSE` | MIT License |

## Notes

- The Toolbox only works in your own browser while you're signed in to ServiceTitan. It doesn't collect or send any data anywhere.
- Notes never saves a note by itself; you always click **Add Note** in ServiceTitan.
- Tech Messages only sends on its own in Auto-send mode, after you confirm.
- Business Unit only saves jobs after you confirm, and checks each one afterwards.
- Customer Texts only sends on its own in Auto-send mode, after you type how many customers it will text. 📥 Check replies never sends anything, and only confirms appointments after you press Confirm.
- Not affiliated with or endorsed by ServiceTitan.

## License

MIT. See [LICENSE](LICENSE).
