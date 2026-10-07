import markupsafe
def operation(value):
    return markupsafe.Markup(value).unescape()
