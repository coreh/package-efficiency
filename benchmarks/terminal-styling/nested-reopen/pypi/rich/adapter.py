import io
from rich.console import Console
from rich.text import Text

_console = Console(file=io.StringIO(), force_terminal=True, color_system="standard", width=10000,
                   markup=False, highlight=False, emoji=False)

def _t(style, *parts):
    t = Text(style=style)
    for text, st in parts:
        t.append(text, st) if st else t.append(text)
    return t

def operation(x):
    s, a, b, c, d, e = x["style"], x["a"], x["b"], x["c"], x["d"], x["e"]
    if s == "red-green-twice": t = _t("red", (a, None), (b, "green"), (c, None), (d, "green"), (e, None))
    elif s == "blue-yellow": t = _t("blue", (a, None), (b, "yellow"), (c, None))
    elif s == "bold-dim": t = _t("bold", (a, None), (b, "dim"), (c, None))
    elif s == "three-level": t = _t("red", (a, None), (b, "green"), (c, "green blue"), (d, "green"), (e, None))
    elif s == "bold-red-dim": t = _t("bold", (a, None), (b, "red"), (c, "red dim"), (d, "red"), (e, None))
    else: raise ValueError(s)
    with _console.capture() as cap:
        _console.print(t, end="")
    return cap.get()
