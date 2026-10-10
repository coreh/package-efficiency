from typing import Any, AsyncIterator
from aioitertools.builtins import map as amap, sum as asum
from aioitertools.itertools import filterfalse, islice


def triple_plus_one(x: int) -> int:
    return x * 3 + 1


def drop(x: int) -> bool:
    return x % 5 == 0


async def operation(value: Any) -> Any:
    data, limit = value
    pulled = 0

    async def source() -> AsyncIterator[int]:
        nonlocal pulled
        for x in data:
            pulled += 1
            yield x

    total = await asum(islice(filterfalse(drop, amap(triple_plus_one, source())), limit))
    return {"sum": total, "pulled": pulled}
