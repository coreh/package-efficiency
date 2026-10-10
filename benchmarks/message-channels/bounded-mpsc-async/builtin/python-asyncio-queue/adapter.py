import asyncio
from typing import Any


async def operation(value: Any) -> Any:
    producers: int = value["producers"]
    messages: int = value["messages"]
    channel: asyncio.Queue[int] = asyncio.Queue(value["capacity"])

    async def produce(p: int) -> None:
        put = channel.put
        for i in range(messages):
            await put(i * producers + p)

    tasks = [asyncio.create_task(produce(p)) for p in range(producers)]
    following = [0] * producers
    count = total = 0
    ordered = True
    get = channel.get
    for _ in range(producers * messages):
        v = await get()
        p = v % producers
        if v // producers != following[p]:
            ordered = False
        following[p] += 1
        total += v
        count += 1
    await asyncio.gather(*tasks)
    return {"count": count, "sum": total, "ordered": ordered}
