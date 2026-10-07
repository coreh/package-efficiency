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
for line in sys.stdin:
    line = line.strip()
    if line == 'exit': break
    if line == 'settle':
        send('settled', memory=memory())
        continue
    command = json.loads(line)
    count, minimum = command['count'], command.get('minMs', 0)/1000
    operations = checksum = 0
    cpu, start = time.process_time(), time.perf_counter()
    while True:
        for i in range(count):
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
    send('round', operations=operations, checksum=checksum, wallMs=wall_ms, cpuMs=cpu_ms)
