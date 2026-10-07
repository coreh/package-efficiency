from typing import Any


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

        out = None
        for _ in range(attempts):
            try:
                out = await job()
                break
            except Exception:
                pass
        results.append({"attempts": calls, "value": out})
    return results
