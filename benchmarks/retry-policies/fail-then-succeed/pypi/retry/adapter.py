from retry.api import retry_call


def operation(value):
    attempts = value["attempts"]
    results = []
    for item in value["items"]:
        failures, v = int(item["failures"]), int(item["value"])
        calls = 0

        def job():
            nonlocal calls
            calls += 1
            if calls <= failures:
                raise RuntimeError("failed")
            return v * 2 + 1

        out = None
        try:
            out = retry_call(job, exceptions=RuntimeError, tries=attempts, delay=0, logger=None)
        except RuntimeError:
            pass
        results.append({"attempts": calls, "value": out})
    return results
