import asyncio
from typing import Any


async def operation(value: Any) -> Any:
    turns = value["turns"]
    lock = asyncio.Lock()
    counter = 0

    async def task() -> int:
        nonlocal counter
        mine = 0
        for _ in range(turns):
            async with lock:
                ticket = counter
                await asyncio.sleep(0)
                counter = ticket + 1
            mine += ticket
        return mine

    sums = await asyncio.gather(*[task() for _ in range(value["tasks"])])
    return {"count": counter, "sum": sum(sums)}
