import bcrypt

def operation(value):
    password, first, second = value
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=8))
    return [
        bcrypt.checkpw(first.encode('utf-8'), hashed),
        bcrypt.checkpw(second.encode('utf-8'), hashed),
        hashed.decode('ascii'),
    ]
