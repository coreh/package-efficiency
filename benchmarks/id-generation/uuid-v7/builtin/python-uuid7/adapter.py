import uuid
def operation(value):
    # uuid.uuid7 is new in Python 3.14; the type check targets 3.12, whose typeshed lacks it.
    return [str(uuid.uuid7()) for _ in range(value)]  # type: ignore[attr-defined]
