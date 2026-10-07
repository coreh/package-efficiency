import asyncio
from typing import Any


class Resource:
    __slots__ = ("uses", "sum")

    def __init__(self) -> None:
        self.uses = 0
        self.sum = 0


async def operation(value: Any) -> Any:
    size, callers, cycles = value["size"], value["callers"], value["cycles"]
    pool: "asyncio.Queue[Resource]" = asyncio.Queue()
    for _ in range(size):
        pool.put_nowait(Resource())
    state = [0, 0]  # in use, peak

    async def caller(c: int) -> None:
        for j in range(cycles):
            r = await pool.get()
            state[0] += 1
            if state[0] > state[1]:
                state[1] = state[0]
            r.uses += 1
            r.sum += (c * 31 + j) % 97 + 1
            await asyncio.sleep(0)
            state[0] -= 1
            pool.put_nowait(r)

    await asyncio.gather(*[caller(c) for c in range(callers)])
    # Check out the whole pool at once: a resource never returned would block here.
    held = [await pool.get() for _ in range(size)]
    return {
        "cycles": sum(r.uses for r in held),
        "checksum": sum(r.sum for r in held),
        "peak": state[1],
        "drained": len(held),
    }
