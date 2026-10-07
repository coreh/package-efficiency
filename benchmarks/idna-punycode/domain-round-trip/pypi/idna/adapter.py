import idna
def operation(value):
    ascii_form = idna.encode(value).decode('ascii')
    return [ascii_form, idna.decode(ascii_form)]
