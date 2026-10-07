from passlib.hash import scrypt

_scrypt = scrypt.using(rounds=12, block_size=8, parallelism=1)

def operation(value):
    password, wrong = value
    hashed = _scrypt.hash(password)
    return [_scrypt.verify(password, hashed), _scrypt.verify(wrong, hashed)]
