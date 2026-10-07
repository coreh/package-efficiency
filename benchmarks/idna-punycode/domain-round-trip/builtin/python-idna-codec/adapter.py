def operation(value):
    encoded = value.encode('idna')
    return [encoded.decode('ascii'), encoded.decode('idna')]
