from markdown_it import MarkdownIt

_md = MarkdownIt()

def operation(text):
    tokens = _md.parse(text)
    out = []
    for i, t in enumerate(tokens):
        if t.type == 'heading_open':
            out.append([int(t.tag[1]), tokens[i + 1].content])
    return out
