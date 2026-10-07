import humanfriendly
def operation(value):
    return humanfriendly.format_size(value, binary=True)
