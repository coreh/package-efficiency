import pyotp

def operation(value):
    secret = value['secret']
    totp = pyotp.TOTP(secret)
    return [
        pyotp.HOTP(secret).at(value['counter']),
        totp.at(value['time']),
        totp.verify(value['code'], for_time=value['time'], valid_window=1),
    ]
