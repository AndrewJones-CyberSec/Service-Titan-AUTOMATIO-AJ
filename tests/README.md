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
| `test_business_unit.py` | 🏢 Business Unit: picking, check, change, put back, locked jobs, errors, pop-ups, Stop |
| `test_job_notifications.py` | 🔕 Job Notifications: a tech's jobs, picked jobs, the job list, scrolling, highlights |
| `test_tech_messages.py` | 💬 Tech Messages: picking techs on the board, 🛡️ rules, highlights |
| `test_customer_texts.py` | 📱 Customer Texts: holds, filters, numbers, repeat rules, STOP, Type only, Auto-send |
| `test_concurrency.py` | Several reads at once: Stop and Cancel mid-read, slow and timed-out answers, sign-out, failing answers, the board changing during a run |
| `board*.html` | The fake pages the tests run on |

Run them before every update. If one fails, the update isn't ready.
