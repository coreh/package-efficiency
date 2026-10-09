from typing import Any

import backoff


async def operation(value: Any) -> Any:
    attempts = value["attempts"]
    results = []
    for item in value["items"]:
        failures, v = int(item["failures"]), int(item["value"])
        calls = 0

        @backoff.on_exception(backoff.constant, RuntimeError, max_tries=attempts, interval=0, jitter=None)
        async def job() -> int:
            nonlocal calls
            calls += 1
            if calls <= failures:
                raise RuntimeError("failed")
            return v * 2 + 1

        out = None
        try:
            out = await job()
        except RuntimeError:
            pass
        results.append({"attempts": calls, "value": out})
    return results
