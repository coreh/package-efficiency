import jiter
def operation(value):
    try:
        return jiter.from_json(value.encode())
    except ValueError:
        return None
