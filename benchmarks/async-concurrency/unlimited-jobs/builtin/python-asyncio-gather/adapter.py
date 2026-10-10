import asyncio
from typing import Any


async def operation(value: Any) -> Any:
    values = value["values"]
    active = peak = 0

    async def job(v: Any) -> Any:
        nonlocal active, peak
        active += 1
        if active > peak:
            peak = active
        await asyncio.sleep(0)
        active -= 1
        return v * 2 + 1

    results = await asyncio.gather(*[job(v) for v in values])
    return {"results": results, "peak": peak}
