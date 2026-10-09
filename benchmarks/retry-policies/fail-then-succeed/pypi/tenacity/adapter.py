from typing import Any

from tenacity import AsyncRetrying, RetryError, stop_after_attempt, wait_none


async def operation(value: Any) -> Any:
    attempts = value["attempts"]
    results = []
    for item in value["items"]:
        failures, v = int(item["failures"]), int(item["value"])
        calls = 0

        async def job() -> int:
            nonlocal calls
            calls += 1
            if calls <= failures:
                raise RuntimeError("failed")
            return v * 2 + 1

        retrying = AsyncRetrying(stop=stop_after_attempt(attempts), wait=wait_none())
        out = None
        try:
            out = await retrying(job)
        except RetryError:
            pass
        results.append({"attempts": calls, "value": out})
    return results
