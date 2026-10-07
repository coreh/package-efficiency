"""Native operation protocol. CPU is process-wide; verification lives in JS.

An operation may return a string, a boolean, or a structured value (list,
dict, a library's own object). The measured loop reads only its length. The
verifier needs JSON, so an adapter whose result is not plain JSON data defines
describe(output); that runs once per fixture, before any measured work. An
adapter may also define prepare(input), which runs once per fixture, outside
measured work, to turn the fixture's JSON into what the library takes (bytes,
typed records); the operation is then given its result."""
import gc, importlib.util, json, os, sys, time

def memory():
    for _ in range(3):
        gc.collect()
        time.sleep(0.025)
    heap = gc.get_stats()._s.total_gc_memory if hasattr(sys, 'pypy_version_info') else None
    return {'heapUsed': heap}

def send(phase, **fields):
    print('@@' + json.dumps(dict(phase=phase, **fields)), flush=True)

send('boot', pid=os.getpid(), memory=memory())
if sys.argv[1] != '-':
    start, cpu = time.perf_counter(), time.process_time()
    spec = importlib.util.spec_from_file_location('adapter', sys.argv[1])
    adapter = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(adapter)
    send('loaded', importMs=(time.perf_counter()-start)*1000, importCpuMs=(time.process_time()-cpu)*1000, memory=memory())
    with open(sys.argv[2]) as f:
        cases = json.load(f)['cases']
    prepare = getattr(adapter, 'prepare', None)
    inputs = [prepare(c['input']) if prepare else c['input'] for c in cases]
    describe = getattr(adapter, 'describe', lambda output: output)
    send('verification', outputs=[describe(adapter.operation(x)) for x in inputs])
    if sys.stdin.readline().strip() != 'verified':
        sys.exit(1)
    send('ready', memory=memory())
else:
    send('ready', memory=memory())
# A task on the file system whose operations write (see harness/files.mjs):
# the paths in BENCH_FILES_RESET, all under the task's scratch directory
# BENCH_FILES, are removed before every operation, and that is not timed.
import resource
def system_time():
    return resource.getrusage(resource.RUSAGE_SELF).ru_stime
reset_paths = json.loads(os.environ.get('BENCH_FILES_RESET') or '[]')
if not all(p.startswith(os.environ.get('BENCH_FILES', '') + '/') for p in reset_paths):
    sys.exit('BENCH_FILES_RESET names a path outside BENCH_FILES')
def reset_files():
    import shutil
    for p in reset_paths:
        if os.path.isdir(p) and not os.path.islink(p):
            shutil.rmtree(p)
        elif os.path.lexists(p):
            os.unlink(p)
for line in sys.stdin:
    line = line.strip()
    if line == 'exit': break
    if line == 'settle':
        send('settled', memory=memory())
        continue
    command = json.loads(line)
    count, minimum = command['count'], command.get('minMs', 0)/1000
    operations = checksum = 0
    cpu, start, system = time.process_time(), time.perf_counter(), system_time()
    while True:
        for i in range(count):
            if reset_paths:
                # Take the removal out of all three clocks.
                c0, w0, s0 = time.process_time(), time.perf_counter(), system_time()
                reset_files()
                cpu += time.process_time()-c0; start += time.perf_counter()-w0; system += system_time()-s0
            output = adapter.operation(inputs[(operations+i)%len(inputs)])
            try:
                value = int(output) if isinstance(output,bool) else len(output)
            except TypeError:
                value = 0 if output is None else 1
            checksum = (checksum + value) & 0xffffffff
        operations += count
        if time.perf_counter()-start >= minimum: break
    wall_ms = (time.perf_counter()-start)*1000
    cpu_ms = (time.process_time()-cpu)*1000
    send('round', operations=operations, checksum=checksum, wallMs=wall_ms, cpuMs=cpu_ms, systemCpuMs=(system_time()-system)*1000)
