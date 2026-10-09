from retrying import RetryError, Retrying


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
            out = Retrying(stop_max_attempt_number=attempts, wait_fixed=0).call(job)
        except RuntimeError:
            pass
        except RetryError:
            pass
        results.append({"attempts": calls, "value": out})
    return results
