import tomllib


def operation(value):
    try:
        tomllib.loads(value)
        return True
    except tomllib.TOMLDecodeError:
        return False
