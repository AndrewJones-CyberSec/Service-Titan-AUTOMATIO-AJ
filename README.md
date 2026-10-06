# ServiceTitan Toolbox

A small panel of time-savers for the ServiceTitan Dispatch board. It runs from a browser bookmark, works in Chrome, Edge, Firefox and Safari, and updates itself: everyone who installs it gets the newest version the next time they click the bookmark.

## Tools

**📝 Notes**
Ready-made notes sorted into folders: **📞 Updates** (no answer, left a voicemail and so on), **🚚 Techs** (tech on the way, tech arrived) and **📅 Reschedule**. Open a folder, then click a job on the Dispatch board and click a note (or pick the note first, then click the job). The Toolbox opens that job's customer, clicks **Add Note** and types the note in. It stops there so you can check it and click **Add Note** to save.

- Keyboard shortcuts: **Alt + 1–9** (**Option + 1–9** on a Mac) follow what's on screen: on the folder list they open a folder, inside a folder they add that note.
- Optional time stamp at the start of each note
- **✏️ Edit folders** to add your own folders, rename, reorder or delete them. **Copy all** / **Paste all** moves your folders and notes to another browser.
- **✏️ Edit notes** (inside a folder) to change, add, remove or reorder its notes, or move a note to another folder.
- Edits are saved in your own browser. Notes from before folders were added are in **Updates**.

**🔕 Job Notifications**
On the Dispatch board, pick a tech from the list (it only shows techs with jobs on the day shown), then either:

- **Check jobs**: shows whether each of their jobs has notifications on. Changes nothing.
- **Turn off notifications**: switches them off on each job, after you confirm.

Any job that has a problem gets one more try after the rest of the run is done. Shows progress as it goes, with a Stop button and a copyable list of results.

**💬 Tech Messages**
Send a saved message (for example Good Morning or ETA) to the techs you pick. It opens each tech's Send Message panel, types the message, and either waits for you to press Send (**Type only**) or sends it for you (**Auto-send**).

- **✏️ Edit messages** to change or add messages. Use `{first}` for the tech's first name.
- **👥 Choose techs** by team, by name, or only techs with jobs on the board.
- **🛡️ Who can be messaged**: tick the teams that are OK to message and add anyone to a never-message list (for example the owner). Nothing can be sent until this is set up, and any new team starts blocked.

Safety checks on every send: it re-checks your 🛡️ settings, closes any open job panel, confirms the message panel shows the right person and nothing is covering it, skips anyone whose message box already has text, and stops the whole run if a send can't be confirmed. Auto-send asks you to type how many people it will message, and there's a limit of 57 per run.

**🩺 Health check**
If ServiceTitan changes something a tool relies on, a yellow bar at the top of the Toolbox says which tool is affected and what's missing, instead of the tool failing quietly. Use **Copy report** to pass the details along, or **🩺 Check** in the menu to check any time.

## Install

Open the project's install page (the GitHub Pages address for this project) and drag the **🧰 Toolbox** button onto your bookmarks bar. The page also has copy-and-paste steps for each browser.

## Files

| File | What it is |
|---|---|
| `toolbox.js` | The Toolbox itself |
| `index.html` | The install page |
| `CHANGELOG.md` | What changed in each version |
| `LICENSE` | MIT License |

## Notes

- The Toolbox only works in your own browser while you're signed in to ServiceTitan. It doesn't collect or send any data anywhere.
- Notes never saves a note by itself; you always click **Add Note** in ServiceTitan.
- Tech Messages only sends on its own in Auto-send mode, after you confirm.
- Not affiliated with or endorsed by ServiceTitan.

## License

MIT. See [LICENSE](LICENSE).
