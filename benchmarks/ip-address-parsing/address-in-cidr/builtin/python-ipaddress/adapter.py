from ipaddress import ip_address, ip_network

def operation(value):
    return ip_address(value[0]) in ip_network(value[1])
