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
and exchange k uses fixture k mod fixtures. A lane's thread lives for the
whole run and is the one that called connect for it, so a client that keeps
its connection per thread keeps it. CPU time is the whole process's."""
import gc, importlib.util, json, os, queue, sys, threading, time

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

def checksum_of(output):
    try:
        return int(output) if isinstance(output, bool) else len(output)
    except TypeError:
        return 0 if output is None else 1

class Lane:
    """One lane: a thread with its own state, given one job at a time."""
    def __init__(self, index):
        self.index, self.jobs, self.results = index, queue.Queue(), queue.Queue()
        threading.Thread(target=self.work, daemon=True).start()
        self.result()

    def work(self):
        try:
            state = adapter.connect(task['host'], task['port'])
            self.results.put((None, None))
        except BaseException as error:
            self.results.put((None, error))
            return
        while True:
            job = self.jobs.get()
            try:
                self.results.put((job(state), None))
            except BaseException as error:
                self.results.put((None, error))

    def result(self):
        value, error = self.results.get()
        if error is not None:
            raise error
        return value

    def round(self, count):
        def job(state):
            checksum = 0
            for k in range(self.index, count, lanes):
                checksum = (checksum + checksum_of(operation(state, inputs[k % len(inputs)]))) & 0xffffffff
            return checksum
        self.jobs.put(job)

workers = [Lane(0)]
# One exchange per fixture, in order, on the first lane; the supervisor
# compares what came back with the task's expected results and with what the
# peer recorded.
workers[0].jobs.put(lambda state: [describe(operation(state, x)) for x in inputs])
send('verification', outputs=workers[0].result())
if sys.stdin.readline().strip() != 'verified':
    sys.exit(1)
while len(workers) < lanes:
    workers.append(Lane(len(workers)))
send('ready', memory=memory())

for line in sys.stdin:
    line = line.strip()
    if line == 'exit': break
    if line == 'settle':
        send('settled', memory=memory())
        continue
    count = json.loads(line)['count']
    cpu, start = time.process_time(), time.perf_counter()
    for worker in workers: worker.round(count)
    checksum = sum(worker.result() for worker in workers) & 0xffffffff
    wall_ms = (time.perf_counter()-start)*1000
    cpu_ms = (time.process_time()-cpu)*1000
    send('round', requests=count, checksum=checksum, wallMs=wall_ms, cpuMs=cpu_ms)
