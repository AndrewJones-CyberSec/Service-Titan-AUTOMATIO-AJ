"""Runs the Toolbox tests against ../toolbox.js (or the file given) and prints a summary.

    python3 tests/run_all.py              # every suite, a few at a time
    python3 tests/run_all.py other.js     # tests another copy
    python3 tests/run_all.py moves texts  # only the suites with "moves" or "texts" in their name
                                          # (a quick check while working on one tool; the full
                                          # run is still what counts before a release)
    python3 tests/run_all.py --jobs 1     # one suite at a time, like before

Suites run side by side (each in its own browser, on its own fake board), which takes about half
the time. The suites that time how fast the Toolbox is (ALONE, below) run afterwards with nothing
else going, so their timing checks measure the Toolbox, not a busy computer.

Needs Python 3 and Playwright (pip install playwright, then: playwright install chromium).
The tests use fake copies of the Dispatch board, so nothing touches ServiceTitan.
"""
import os, pathlib, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed

HERE = pathlib.Path(__file__).parent
# Suites with checks on how long things take: run one at a time, after the others.
ALONE = {'test_move_speed.py', 'test_concurrency.py'}

args = sys.argv[1:]
jobs = max(2, min(3, os.cpu_count() or 2))
if '--jobs' in args:
    i = args.index('--jobs')
    jobs = max(1, int(args[i + 1]))
    del args[i:i + 2]
target = next((a for a in args if a.endswith('.js')), str(HERE.parent / 'toolbox.js'))
words = [a for a in args if not a.endswith('.js')]
suites = sorted(HERE.glob('test_*.py'))
if words:
    suites = [t for t in suites if any(w.lower() in t.name.lower() for w in words)]
    if not suites:
        print('No suite matches: ' + ', '.join(words))
        sys.exit(1)

def run(t):
    started = time.time()
    out = subprocess.run([sys.executable, str(t), target], capture_output=True, text=True)
    return t, out, time.time() - started

results = {}
def report(r):
    t, out, secs = r
    text = out.stdout + out.stderr
    p = text.count('\nPASS ') + text.startswith('PASS ')
    f = text.count('\nFAIL ') + text.startswith('FAIL ')
    crashed = 'Traceback' in text
    status = 'CRASHED' if crashed else ('FAILED' if f or out.returncode else 'ok')
    results[t.name] = (p, f, status)
    print('%-32s %3d passed  %2d failed  %4.0fs  %s' % (t.name, p, f, secs, status), flush=True)
    if status != 'ok':
        for line in text.splitlines():
            if line.startswith('FAIL ') or 'Error' in line:
                print('    ' + line, flush=True)

start = time.time()
together = [t for t in suites if t.name not in ALONE]
alone = [t for t in suites if t.name in ALONE]
if jobs > 1:
    # The longest suites start first, so the run doesn't end waiting on one slow straggler.
    order = sorted(together, key=lambda t: -t.stat().st_size)
    with ThreadPoolExecutor(max_workers=jobs) as pool:
        for f in as_completed([pool.submit(run, t) for t in order]):
            report(f.result())
else:
    for t in together:
        report(run(t))
for t in alone:
    report(run(t))

total_pass = sum(r[0] for r in results.values())
total_fail = sum(r[1] for r in results.values())
bad = [n for n, r in results.items() if r[2] != 'ok']
print('\n%d passed, %d failed in %.0fs (%d suites, %d at a time)' % (total_pass, total_fail, time.time() - start, len(results), jobs))
sys.exit(1 if bad else 0)
