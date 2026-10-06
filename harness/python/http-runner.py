"""Single-process HTTP protocol; the supervisor measures every server thread."""
import gc, importlib.util, json, os, sys, time

def memory():
    for _ in range(3):
        gc.collect()
        time.sleep(0.025)
    return {'heapUsed': gc.get_stats()._s.total_gc_memory if hasattr(sys, 'pypy_version_info') else None}

def send(phase, **fields):
    print('@@' + json.dumps(dict(phase=phase, **fields)), flush=True)

send('boot', pid=os.getpid(), memory=memory())
close = lambda: None
if sys.argv[1] != '-':
    sys.path.insert(0, sys.argv[2])
    start = time.perf_counter()
    spec = importlib.util.spec_from_file_location('adapter', sys.argv[1])
    adapter = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(adapter)
    send('loaded', importMs=(time.perf_counter()-start)*1000, memory=memory())
    port, close = adapter.start()
    send('ready', port=port, memory=memory())
else:
    send('ready', memory=memory())
try:
    for line in sys.stdin:
        if line.strip() == 'exit': break
        if line.strip() == 'settle': send('settled', memory=memory())
finally:
    close()
