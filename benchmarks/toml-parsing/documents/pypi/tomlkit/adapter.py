import tomlkit


def operation(value):
    return tomlkit.parse(value)


def describe(result):
    return result.unwrap()
