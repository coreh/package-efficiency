from yarl import URL
def operation(value):
    return URL(value[0]).join(URL(value[1]))
def describe(u):
    return str(u)
