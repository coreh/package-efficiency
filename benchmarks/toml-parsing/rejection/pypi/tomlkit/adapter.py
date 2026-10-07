import tomlkit
from tomlkit.exceptions import TOMLKitError


def operation(value):
    try:
        tomlkit.parse(value)
        return True
    except TOMLKitError:
        return False
