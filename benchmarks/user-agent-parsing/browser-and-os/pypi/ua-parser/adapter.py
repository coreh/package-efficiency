from ua_parser import parse_user_agent, parse_os

def operation(ua):
    b = parse_user_agent(ua)
    o = parse_os(ua)
    return {"browser": b.family if b else None, "version": b.major if b else None, "os": o.family if o else None}
