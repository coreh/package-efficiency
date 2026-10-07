from http.cookies import SimpleCookie

def operation(value):
    c = SimpleCookie()
    c.load(value)
    for name, m in c.items():
        max_age = m['max-age']
        return {
            'name': name,
            'value': m.value,
            'path': m['path'] or None,
            'domain': m['domain'] or None,
            'maxAge': int(max_age) if max_age else None,
            'secure': bool(m['secure']),
            'httpOnly': bool(m['httponly']),
            'sameSite': m['samesite'].lower() or None,
        }
    raise ValueError('no cookie')
