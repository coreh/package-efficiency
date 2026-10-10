from typing import Any

import anyio


async def operation(value: Any) -> Any:
    producers: int = value["producers"]
    messages: int = value["messages"]
    send, receive = anyio.create_memory_object_stream[int](value["capacity"])

    async def produce(p: int) -> None:
        put = send.send
        for i in range(messages):
            await put(i * producers + p)

    following = [0] * producers
    count = total = 0
    ordered = True
    async with anyio.create_task_group() as group:
        for p in range(producers):
            group.start_soon(produce, p)
        get = receive.receive
        for _ in range(producers * messages):
            v = await get()
            p = v % producers
            if v // producers != following[p]:
                ordered = False
            following[p] += 1
            total += v
            count += 1
    return {"count": count, "sum": total, "ordered": ordered}
