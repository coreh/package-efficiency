from ipaddress import ip_network

def operation(value):
    return str(ip_network(value, strict=False).network_address)
