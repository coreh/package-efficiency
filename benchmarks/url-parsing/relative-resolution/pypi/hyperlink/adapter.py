from hyperlink import URL
def operation(value):
    return URL.from_text(value[0]).click(value[1]).to_text()
