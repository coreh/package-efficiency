import tomli


def operation(value):
    try:
        tomli.loads(value)
        return True
    except tomli.TOMLDecodeError:
        return False
