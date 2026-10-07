import rfc3986
def operation(value):
    return rfc3986.urlparse(value)
def describe(u):
    return {"scheme": u.scheme or "", "userinfo": u.userinfo or "", "host": u.host or "", "port": str(u.port) if u.port else "", "path": u.path or "", "query": u.query or "", "fragment": u.fragment or ""}
