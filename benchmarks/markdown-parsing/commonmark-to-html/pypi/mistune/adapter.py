import mistune

_md = mistune.create_markdown()

def operation(text):
    return _md(text)
