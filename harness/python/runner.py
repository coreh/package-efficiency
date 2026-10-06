"""Native operation protocol. CPU is process-wide; verification lives in JS."""
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
    inputs = [c['input'] for c in cases]
    send('verification', outputs=[adapter.operation(x) for x in inputs])
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
            checksum = (checksum + (int(output) if isinstance(output,bool) else len(output))) & 0xffffffff
        operations += count
        if time.perf_counter()-start >= minimum: break
    wall_ms = (time.perf_counter()-start)*1000
    cpu_ms = (time.process_time()-cpu)*1000
    send('round', operations=operations, checksum=checksum, wallMs=wall_ms, cpuMs=cpu_ms)
