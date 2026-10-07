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

def _render(t):
    with _console.capture() as cap:
        _console.print(t, end="")
    return cap.get()

def operation(x):
    s, a, b, c = x["style"], x["a"], x["b"], x["c"]
    if s == "red": return _render(Text(a, style="red"))
    if s == "green": return _render(Text(a, style="green"))
    if s == "bold": return _render(Text(a, style="bold"))
    if s == "underline": return _render(Text(a, style="underline"))
    if s == "bold-blue": return _render(Text(a, style="bold blue"))
    if s == "red-bold-underline": return _render(Text(a, style="red bold underline"))
    if s == "bold-in-red": return _render(_t("red", (a, None), (b, "bold"), (c, None)))
    if s == "underline-in-green": return _render(_t("green", (a, None), (b, "underline"), (c, None)))
    if s == "red-in-bold": return _render(_t("bold", (a, None), (b, "red"), (c, None)))
    if s == "deep": return _render(_t("underline", (a, None), (b, "bold red"), (c, None)))
    raise ValueError(s)
