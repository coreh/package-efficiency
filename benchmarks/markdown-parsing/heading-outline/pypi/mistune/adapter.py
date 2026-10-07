from typing import Any, cast

import mistune

_md = mistune.create_markdown(renderer=None)

def operation(text):
    out = []
    for t in cast(list[dict[str, Any]], _md(text)):
        if t['type'] == 'heading':
            out.append([t['attrs']['level'], ''.join(c.get('raw', '') for c in t['children'])])
    return out
