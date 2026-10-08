from user_agents import parse

def operation(ua):
    r = parse(ua)
    return {"browser": r.browser.family, "version": r.browser.version_string, "os": r.os.family}
