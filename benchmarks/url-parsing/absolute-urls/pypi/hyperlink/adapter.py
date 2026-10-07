from hyperlink import URL
from hyperlink._url import SCHEME_PORT_MAP
def operation(value):
    return URL.from_text(value)
def describe(u):
    return {"scheme": u.scheme, "userinfo": u.userinfo, "host": u.host, "port": str(u.port) if u.port and u.port != SCHEME_PORT_MAP.get(u.scheme) else "", "path": "/" + "/".join(u.path), "query": "&".join(k if v is None else k + "=" + v for k, v in u.query), "fragment": u.fragment}
