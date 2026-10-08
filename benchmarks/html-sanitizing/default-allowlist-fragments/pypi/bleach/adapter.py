import bleach
def operation(html):
    return bleach.clean(html)
