from ua_parser import Parser, BasicResolver, load_builtins

parser = Parser(BasicResolver(load_builtins()))

def operation(ua):
    b = parser.parse_user_agent(ua)
    o = parser.parse_os(ua)
    return {"browser": b.family if b else None, "version": b.major if b else None, "os": o.family if o else None}
