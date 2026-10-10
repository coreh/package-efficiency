from typing import Any

from pybreaker import CircuitBreaker


def operation(value: Any) -> Any:
    breaker = CircuitBreaker(fail_max=value["threshold"], reset_timeout=value["openMs"] / 1000)
    ran = False
    fail = False

    def fn() -> None:
        nonlocal ran
        ran = True
        if fail:
            raise RuntimeError("failed")

    out = []
    for f in value["fail"]:
        ran = False
        fail = f
        try:
            breaker.call(fn)
            out.append("ran-ok")
        except Exception:
            out.append("ran-failed" if ran else "rejected")
    return out
