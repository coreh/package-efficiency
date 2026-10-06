"""Measure child CPU across all threads and peak RSS with wait4 (no rounding)."""
import json, os, subprocess, sys, tempfile, time
with tempfile.TemporaryFile() as out, tempfile.TemporaryFile() as err:
    start = time.perf_counter()
    proc = subprocess.Popen(sys.argv[1:], stdout=out, stderr=err)
    _, status, usage = os.wait4(proc.pid, 0)
    proc.returncode = os.waitstatus_to_exitcode(status)
    elapsed = (time.perf_counter() - start) * 1000
    out.seek(0); err.seek(0)
    print(json.dumps(dict(status=proc.returncode, cpuMs=(usage.ru_utime+usage.ru_stime)*1000,
        timeMs=elapsed, peakRssMb=usage.ru_maxrss/(1048576 if sys.platform=='darwin' else 1024),
        stdout=out.read().decode(), stderr=err.read().decode())))
