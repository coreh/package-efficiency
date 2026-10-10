import uuid_utils
def operation(value):
    return [str(uuid_utils.uuid7()) for _ in range(value)]
