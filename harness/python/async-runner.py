"""Asynchronous operation protocol (task kind "async-operation"). The same
phases, rounds and figures as runner.py, with the whole run inside one asyncio
event loop, as a JavaScript process has one.

An adapter defines `async def operation(input)`: the runner awaits it, one
call per operation. A coroutine must finish only when all of its work is done;
after the last call of a round the loop is given one more turn inside the
timed part, so whatever was left scheduled is charged to the round. An adapter
may instead define a plain `def operation(input)` that starts its own threads
and joins them before it returns. CPU is process-wide, all threads included.
prepare(input) and describe(output) are as in runner.py and are not timed."""
import asyncio, gc, importlib.util, inspect, json, os, sys, time

def memory():
    for _ in range(3):
        gc.collect()
        time.sleep(0.025)
    heap = gc.get_stats()._s.total_gc_memory if hasattr(sys, 'pypy_version_info') else None
    return {'heapUsed': heap}

def send(phase, **fields):
    print('@@' + json.dumps(dict(phase=phase, **fields)), flush=True)

def measure(output):
    try:
        return int(output) if isinstance(output, bool) else len(output)
    except TypeError:
        return 0 if output is None else 1

async def main():
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
        operation = adapter.operation
        awaited = inspect.iscoroutinefunction(operation)
        outputs = []
        for x in inputs:
            outputs.append(describe(await operation(x) if awaited else operation(x)))
        send('verification', outputs=outputs)
        if sys.stdin.readline().strip() != 'verified':
            sys.exit(1)
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
        size = len(inputs)
        cpu, start = time.process_time(), time.perf_counter()
        while True:
            if awaited:
                for i in range(count):
                    checksum = (checksum + measure(await operation(inputs[(operations+i)%size]))) & 0xffffffff
            else:
                for i in range(count):
                    checksum = (checksum + measure(operation(inputs[(operations+i)%size]))) & 0xffffffff
            operations += count
            if time.perf_counter()-start >= minimum: break
        await asyncio.sleep(0)
        wall_ms = (time.perf_counter()-start)*1000
        cpu_ms = (time.process_time()-cpu)*1000
        send('round', operations=operations, checksum=checksum, wallMs=wall_ms, cpuMs=cpu_ms)

asyncio.run(main())
