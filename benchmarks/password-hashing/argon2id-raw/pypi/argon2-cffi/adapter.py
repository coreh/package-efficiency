from argon2.low_level import hash_secret_raw, Type

def prepare(value):
    return {**value, 'salt': bytes.fromhex(value['salt'])}

def operation(value):
    return hash_secret_raw(
        value['password'].encode('utf-8'), value['salt'],
        time_cost=value['passes'], memory_cost=value['memory'],
        parallelism=value['parallelism'], hash_len=value['length'], type=Type.ID)

def describe(result):
    return list(result)
