"""In-process half of a client task for Python. The supervisor
(harness/client.mjs) has already started the peer; the file named by
BENCH_CLIENT_TASK says where it listens, what the task fixes and the fixture
inputs. See "Client tasks" in benchmarks/README.md.

An adapter defines:
  connect(host, port)       once per lane, before anything is measured;
                            returns that lane's own state (a connection).
  operation(state, input)   one exchange with the peer on that state; returns
                            what the library gives back.
  describe(result)          optional; the result as plain JSON for the verifier.

A round of `count` exchanges runs on `concurrency` lanes, one thread each:
lane w performs exchanges w, w + lanes, w + 2*lanes, ... one after another,
and exchange k uses fixture k mod fixtures. CPU time is the whole process's."""
import gc, importlib.util, json, os, sys, threading, time

def memory():
    for _ in range(3):
        gc.collect()
        time.sleep(0.025)
    heap = gc.get_stats()._s.total_gc_memory if hasattr(sys, 'pypy_version_info') else None
    return {'heapUsed': heap}

def send(phase, **fields):
    print('@@' + json.dumps(dict(phase=phase, **fields)), flush=True)

send('boot', pid=os.getpid(), memory=memory())
start, cpu = time.perf_counter(), time.process_time()
spec = importlib.util.spec_from_file_location('adapter', sys.argv[1])
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)
send('loaded', importMs=(time.perf_counter()-start)*1000, importCpuMs=(time.process_time()-cpu)*1000, memory=memory())
with open(os.environ['BENCH_CLIENT_TASK']) as f:
    task = json.load(f)
inputs = [c['input'] for c in task['cases']]
lanes = task['concurrency']
operation = adapter.operation
describe = getattr(adapter, 'describe', lambda output: output)
states = [adapter.connect(task['host'], task['port'])]
# One exchange per fixture, in order; the supervisor compares what came back
# with the task's expected results and with what the peer recorded.
send('verification', outputs=[describe(operation(states[0], x)) for x in inputs])
if sys.stdin.readline().strip() != 'verified':
    sys.exit(1)
while len(states) < lanes:
    states.append(adapter.connect(task['host'], task['port']))
send('ready', memory=memory())

def lane(first, count, state, sums, failures):
    checksum = 0
    try:
        for k in range(first, count, lanes):
            output = operation(state, inputs[k % len(inputs)])
            try:
                value = int(output) if isinstance(output, bool) else len(output)
            except TypeError:
                value = 0 if output is None else 1
            checksum = (checksum + value) & 0xffffffff
    except BaseException as error:
        failures.append(error)
    sums[first] = checksum

for line in sys.stdin:
    line = line.strip()
    if line == 'exit': break
    if line == 'settle':
        send('settled', memory=memory())
        continue
    count = json.loads(line)['count']
    sums, failures = [0] * lanes, []
    cpu, start = time.process_time(), time.perf_counter()
    threads = [threading.Thread(target=lane, args=(w, count, states[w], sums, failures)) for w in range(lanes)]
    for thread in threads: thread.start()
    for thread in threads: thread.join()
    wall_ms = (time.perf_counter()-start)*1000
    cpu_ms = (time.process_time()-cpu)*1000
    if failures:
        raise failures[0]
    send('round', requests=count, checksum=sum(sums) & 0xffffffff, wallMs=wall_ms, cpuMs=cpu_ms)
