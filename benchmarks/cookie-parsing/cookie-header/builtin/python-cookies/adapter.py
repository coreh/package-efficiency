from http.cookies import SimpleCookie

def operation(value):
    c = SimpleCookie()
    c.load(value)
    return {k: m.value for k, m in c.items()}
