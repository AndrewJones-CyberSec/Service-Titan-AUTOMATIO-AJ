# Changelog

## 1.5.2

A new look that's easier to get around and stays out of the way. The tools themselves work the same.

- **Tabs** across the top switch tools in one click (Notes, Notify, Techs, Units, Texts), and **⌂** goes Home. The ← Menu buttons are gone. While a tool is running, the other tabs wait until it's done.
- **Home** lists every tool with a line on what it does, plus 🩺 Check.
- **Resize** by dragging the bottom-right corner (double-click it for the normal size). **– Minimize**, or double-click the title bar, shrinks the Toolbox to its title bar while runs keep going; **● Running** shows in the title bar during a run.
- **Always on screen.** It remembers where you put it, its size and whether it's minimized. Near the bottom of the screen it grows upward, near the top it grows downward, and it moves back on screen if the window gets smaller. Long screens scroll inside the panel, and long lists size themselves to the panel.
- **⋯ More** holds the less-used buttons: Edit messages and Who can be messaged in 💬 Tech Messages; Edit messages, Edit folders and Settings in 📱 Customer Texts. Until Tech Messages is set up, a **🛡️ Set up** button shows on its main screen.
- **📱 Customer Texts** is in three steps you can fold up: **① Message**, **② Who** and **③ How**. A folded step shows a summary (for example "Hold list · 11 customers"). ③ How starts folded.
- Added tests for the panel (`tests/test_panel.py`).

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
