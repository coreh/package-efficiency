import asyncio
from typing import Any

import anyio


async def operation(value: Any) -> Any:
    values, limit = value["values"], value["limit"]
    limiter = anyio.CapacityLimiter(limit)
    results: list[Any] = [None] * len(values)
    active = peak = 0

    async def job(i: int, v: Any) -> None:
        nonlocal active, peak
        async with limiter:
            active += 1
            if active > peak:
                peak = active
            await asyncio.sleep(0)
            active -= 1
            results[i] = v * 2 + 1

    async with anyio.create_task_group() as group:
        for i, v in enumerate(values):
            group.start_soon(job, i, v)
    return {"results": results, "peak": peak}
