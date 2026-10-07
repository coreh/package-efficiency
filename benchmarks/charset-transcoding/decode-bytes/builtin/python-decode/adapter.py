# Not timed: the fixture's binary string becomes bytes once.
def prepare(value):
    return {'encoding': value['encoding'], 'bytes': value['bytes'].encode('latin-1')}


def operation(value):
    return value['bytes'].decode(value['encoding'])
