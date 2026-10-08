# ServiceTitan Toolbox

A small panel of time-savers for the ServiceTitan Dispatch board. It runs from a browser bookmark, works in Chrome, Edge, Firefox and Safari, and updates itself: everyone who installs it gets the newest version the next time they click the bookmark.

## The panel

- **Tabs** across the top (Notes, Notify, Techs, Units, Texts) switch tools in one click. **⌂** goes to Home, which lists every tool with a line on what it does. While a tool is running, the other tabs wait until it's done.
- **Move it** by dragging the title bar. **Resize it** by dragging the bottom-right corner (double-click the corner for the normal size). **– Minimize** (or double-click the title bar) shrinks it to just the title bar; runs keep going, and **● Running** shows while one is.
- It remembers where you put it, its size and the tool you were on, and always stays fully on screen. Near the bottom of the screen it grows upward; near the top it grows downward. Long screens scroll inside the panel.
- Less-used buttons are under **⋯ More**.

## Tools

**📝 Notes**
Ready-made notes sorted into folders: **📞 Updates** (no answer, left a voicemail and so on), **🚚 Techs** (tech on the way, tech arrived) and **📅 Reschedule**. Open a folder, then click a job on the Dispatch board and click a note (or pick the note first, then click the job). The Toolbox opens that job's customer, clicks **Add Note** and types the note in. It stops there so you can check it and click **Add Note** to save.

- Keyboard shortcuts: **Alt + 1–9** (**Option + 1–9** on a Mac) follow what's on screen: on the folder list they open a folder, inside a folder they add that note.
- Optional time stamp at the start of each note
- **✏️ Edit folders** to add your own folders, rename, reorder or delete them. **Copy all** / **Paste all** moves your folders and notes to another browser.
- **✏️ Edit notes** (inside a folder) to change, add, remove or reorder its notes, or move a note to another folder.
- Edits are saved in your own browser. Notes from before folders were added are in **Updates**.

**🔕 Job Notifications**
On the Dispatch board, choose which jobs:

- **👷 A tech's jobs**: pick a tech from the list (it only shows techs with jobs on the day shown).
- **🖱️ Jobs I pick**: click jobs on the board or in the Unassigned / Hold list at the bottom (they get an orange outline), add every job in the list tab that's open with **+ All in the list**, or type job numbers.

Then either:

- **Check jobs**: shows whether each of their jobs has notifications on. Changes nothing. It reads ServiceTitan's job data directly, so it takes seconds, not minutes.
- **Turn off notifications**: switches them off on each job, after you confirm. Jobs that are already off are skipped without opening them.

Any job that has a problem gets one more try after the rest of the run is done. Shows progress as it goes, with a Stop button and a copyable list of results.

**💬 Tech Messages**
Send a saved message (for example Good Morning or ETA) to the techs you pick. It opens each tech's Send Message panel, types the message, and either waits for you to press Send (**Type only**) or sends it for you (**Auto-send**).

- **✏️ Edit messages** (under ⋯ More) to change or add messages. Use `{first}` for the tech's first name.
- **👥 Choose techs** by team, by name, or only techs with jobs on the board.
- **🖱️ Pick on board**: click techs' names on the Dispatch board to add them (click again to take one off). They show in a list with ✕, and get a purple outline on the board. Techs your 🛡️ settings block can't be added.
- **🛡️ Who can be messaged** (under ⋯ More; the first time, the **🛡️ Set up** button): tick the teams that are OK to message and add anyone to a never-message list (for example the owner). Nothing can be sent until this is set up, and any new team starts blocked.

Safety checks on every send: it re-checks your 🛡️ settings, closes any open job panel, confirms the message panel shows the right person and nothing is covering it, skips anyone whose message box already has text, and stops the whole run if a send can't be confirmed. Auto-send asks you to type how many people it will message, and there's a limit of 57 per run.

**🏢 Business Unit**
Switch the Business Unit on one job or many to a branch: **Mendenhall Branch** unless you pick another. Only branches are offered, not departments.

- **🖱️ Pick on board**, then click jobs on the Dispatch board, or in the Unassigned / Hold list at the bottom, to add them (click again to take one off). Picked jobs get a blue outline. **+ All in the list** adds every job in the list tab that's open, and you can type job numbers, which works for jobs on other days.
- **Check jobs**: shows each job's Business Unit now, and whether it's locked. Changes nothing. It reads ServiceTitan's job data directly, so it takes seconds.
- **Change to …**: after you confirm, it picks the branch on each job's Edit page, presses **Save**, then makes sure the change stuck. Jobs already on that branch, or locked, are left alone without opening them.
- **↩ Put back** returns the jobs from the last run to the Business Unit each one had before.

If ServiceTitan locks a job's Business Unit, the job is skipped and listed. If ServiceTitan pops up a question after Save, the run stops there and leaves the question on screen for you to answer. Up to 50 jobs per run.

**📱 Customer Texts**
Text customers a saved message through ServiceTitan's Chat Center. Messages are sorted into folders, **⏸️ Holds**, **🚚 Tech Updates** and **📅 Reschedule**, plus any you add.

- **Who:** the **Hold list** (every hold on the board's Hold tab loads at once; tick the kinds to text, such as Quote or Non Operational, or open a kind to tick single job types), or **jobs you pick** on the board, in the Unassigned / Hold list at the bottom (or the whole list tab with **+ All in the list**), or by job number. One text per customer.
- **Checked before it starts:** pressing Start checks every customer first, without opening their conversation (a few seconds for a big list). The next screen shows exactly who will be texted and who is skipped, and why. Right before each text it takes one more quick look, in case something changed.
- **Which number:** the Bill To's primary number. If that's a landline, their first mobile number. In ⚙️ Settings you can text every mobile number on the Bill To instead.
- **Fill-ins:** `{dispatcher}` is your first name from your ServiceTitan login (or the name in ⚙️ Settings), `{first}` the customer's first name, `{tech}` the tech's first name (jobs on the board).
- **Repeat rules per folder:** Holds skips anyone who got a text from us in the last 7 days. Tech Updates and Reschedule skip anyone who already got that same message today. Change them in 📁 Edit folders. Automatic notifications and texts that failed don't count.
- **Skipped every time:** anyone who replied STOP or is blocked in ServiceTitan, anyone with an unread reply (listed so you can read it; their conversation isn't opened, so it stays unread), numbers on your 🚫 never-text list, and a number shared with another customer in the same run (texted once).
- **Type only:** it opens each conversation and types the message. You press Send and it moves on by itself. **Auto-send:** you confirm by typing how many texts it will send, and it checks each text went out. A few seconds after each text it also checks ServiceTitan really delivered it, and lists any that failed. It stops if a text can't be confirmed or 3 fail in a row.
- The screen is in three steps you can fold up: **① Message**, **② Who** and **③ How** (Type only or Auto-send). A folded step shows a one-line summary.
- **✏️ Edit messages**, **📁 Edit folders** and **⚙️ Settings** are under ⋯ More, and are saved in your own browser. About 4 seconds per text; keep the tab on screen while it runs.

**🩺 Health check**
If ServiceTitan changes something a tool relies on, a yellow bar at the top of the Toolbox says which tool is affected and what's missing, instead of the tool failing quietly. Use **Copy report** to pass the details along, or **🩺 Check** on the Home screen to check any time.

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
- Customer Texts only sends on its own in Auto-send mode, after you type how many customers it will text.
- Not affiliated with or endorsed by ServiceTitan.

## License

MIT. See [LICENSE](LICENSE).
