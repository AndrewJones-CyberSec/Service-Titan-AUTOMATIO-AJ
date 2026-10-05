# Changelog

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
