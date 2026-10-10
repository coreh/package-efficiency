import asyncio
from typing import Any


async def operation(value: Any) -> Any:
    tasks: int = value["tasks"]
    multiplier: int = value["multiplier"]
    offset: int = value["offset"]
    modulus: int = value["modulus"]

    async def task(i: int) -> int:
        await asyncio.sleep(0)
        return (i * multiplier + offset) % modulus

    async with asyncio.TaskGroup() as group:
        handles = [group.create_task(task(i)) for i in range(tasks)]
    total = 0
    for handle in handles:
        total += handle.result()
    return total
