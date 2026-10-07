from yarl import URL
def operation(value):
    return URL(value)
def describe(u):
    return {"scheme": u.scheme, "userinfo": (u.raw_user or "") + (":" + u.raw_password if u.raw_password else ""), "host": u.raw_host or "", "port": str(u.explicit_port) if u.explicit_port else "", "path": u.raw_path, "query": u.raw_query_string, "fragment": u.raw_fragment}
