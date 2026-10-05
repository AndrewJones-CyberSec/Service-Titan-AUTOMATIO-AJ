# Changelog

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
