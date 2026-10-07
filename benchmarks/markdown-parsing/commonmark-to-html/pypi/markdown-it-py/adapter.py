from markdown_it import MarkdownIt

_md = MarkdownIt()

def operation(text):
    return _md.render(text)
