import httpagentparser

def operation(ua):
    r = httpagentparser.detect(ua)
    b = r.get("browser", {})
    return {"browser": b.get("name"), "version": b.get("version"), "os": r.get("os", {}).get("name")}
