"""Runs every Toolbox test against ../toolbox.js (or the file given) and prints a summary.

    python3 tests/run_all.py            # tests the toolbox.js in this repo
    python3 tests/run_all.py other.js   # tests another copy

Needs Python 3 and Playwright (pip install playwright, then: playwright install chromium).
The tests use fake copies of the Dispatch board, so nothing touches ServiceTitan.
"""
import pathlib, subprocess, sys, time

HERE = pathlib.Path(__file__).parent
target = sys.argv[1] if len(sys.argv) > 1 else str(HERE.parent / 'toolbox.js')
suites = sorted(HERE.glob('test_*.py'))
total_pass = total_fail = 0
bad = []
start = time.time()
for t in suites:
    out = subprocess.run([sys.executable, str(t), target], capture_output=True, text=True)
    text = out.stdout + out.stderr
    p = text.count('\nPASS ') + text.startswith('PASS ')
    f = text.count('\nFAIL ') + text.startswith('FAIL ')
    crashed = 'Traceback' in text
    total_pass += p; total_fail += f
    status = 'CRASHED' if crashed else ('FAILED' if f or out.returncode else 'ok')
    print('%-32s %3d passed  %2d failed  %s' % (t.name, p, f, status))
    if status != 'ok':
        bad.append(t.name)
        for line in text.splitlines():
            if line.startswith('FAIL ') or 'Error' in line:
                print('    ' + line)
print('\n%d passed, %d failed in %.0fs' % (total_pass, total_fail, time.time() - start))
sys.exit(1 if bad else 0)
