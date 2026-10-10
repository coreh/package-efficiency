import asyncio
from typing import Any

import anyio


async def operation(value: Any) -> Any:
    turns: int = value["turns"]
    lock = anyio.Lock()
    counter = 0
    sums: list[int] = []

    async def task() -> None:
        nonlocal counter
        mine = 0
        for _ in range(turns):
            async with lock:
                ticket = counter
                await asyncio.sleep(0)
                counter = ticket + 1
            mine += ticket
        sums.append(mine)

    async with anyio.create_task_group() as group:
        for _ in range(value["tasks"]):
            group.start_soon(task)
    return {"count": counter, "sum": sum(sums)}
