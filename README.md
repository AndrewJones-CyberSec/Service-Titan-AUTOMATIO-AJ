# ServiceTitan Toolbox

A small panel of time-savers for the ServiceTitan Dispatch board. It runs from a browser bookmark, works in Chrome, Edge, Firefox and Safari, and updates itself: everyone who installs it gets the newest version the next time they click the bookmark.

## Tools

**📝 Quick Notes**
Click a job on the Dispatch board, then click a note (or pick the note first, then click the job). The Toolbox opens that job's customer, clicks **Add Note** and types the note in. It stops there so you can check it and click **Add Note** to save.

- Keyboard shortcuts: **Alt + 1–9** (**Option + 1–9** on a Mac)
- Optional time stamp at the start of each note
- **✏️ Edit notes** to change, add, remove or reorder notes. Edits are saved in your own browser.

**🔕 Job Notifications**
On the Dispatch board, pick a tech from the list (it only shows techs with jobs on the day shown), then either:

- **Check jobs**: shows whether each of their jobs has notifications on. Changes nothing.
- **Turn off notifications**: switches them off on each job, after you confirm.

Shows progress as it goes, with a Stop button and a copyable list of results.

## Install

Open the project's install page (the GitHub Pages address for this project) and drag the **🧰 Toolbox** button onto your bookmarks bar. The page also has copy-and-paste steps for each browser.

## Releasing an update

1. Open `toolbox.js` on GitHub and click the pencil icon to edit it.
2. Make your change.
3. Near the top, raise the version number (for example `const VERSION = '1.1';`) and add a line to `WHATS_NEW` describing the change. People see that message the first time they open the new version.
4. Add the same line to `CHANGELOG.md`.
5. Click **Commit changes**.

GitHub Pages usually publishes the change within a few minutes. Nobody needs to reinstall anything.

## Files

| File | What it is |
|---|---|
| `toolbox.js` | The Toolbox itself |
| `index.html` | The install page |
| `CHANGELOG.md` | What changed in each version |
| `LICENSE` | MIT License |

## Notes

- The Toolbox only works in your own browser while you're signed in to ServiceTitan. It doesn't collect or send any data anywhere.
- Quick Notes never saves a note by itself; you always click **Add Note** in ServiceTitan.
- Not affiliated with or endorsed by ServiceTitan.

## License

MIT. See [LICENSE](LICENSE).
