import asyncio


async def operation(value):
    values, limit = value["values"], value["limit"]
    semaphore = asyncio.Semaphore(limit)
    active = peak = 0

    async def job(v):
        nonlocal active, peak
        async with semaphore:
            active += 1
            if active > peak:
                peak = active
            await asyncio.sleep(0)
            active -= 1
            return v * 2 + 1

    results = await asyncio.gather(*[job(v) for v in values])
    return {"results": results, "peak": peak}
