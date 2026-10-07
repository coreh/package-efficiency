from termcolor import colored

def _c(text, color=None, attrs=None):
    return colored(text, color, attrs=attrs, force_color=True)

def operation(x):
    s, a, b, c = x["style"], x["a"], x["b"], x["c"]
    if s == "red": return _c(a, "red")
    if s == "green": return _c(a, "green")
    if s == "bold": return _c(a, None, ["bold"])
    if s == "underline": return _c(a, None, ["underline"])
    if s == "bold-blue": return _c(a, "blue", ["bold"])
    if s == "red-bold-underline": return _c(a, "red", ["bold", "underline"])
    if s == "bold-in-red": return _c(a, "red") + _c(b, "red", ["bold"]) + _c(c, "red")
    if s == "underline-in-green": return _c(a, "green") + _c(b, "green", ["underline"]) + _c(c, "green")
    if s == "red-in-bold": return _c(a, None, ["bold"]) + _c(b, "red", ["bold"]) + _c(c, None, ["bold"])
    if s == "deep": return _c(a, None, ["underline"]) + _c(b, "red", ["bold", "underline"]) + _c(c, None, ["underline"])
    raise ValueError(s)
