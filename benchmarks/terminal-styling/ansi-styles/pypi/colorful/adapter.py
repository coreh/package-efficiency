import colorful as cf

cf.use_8_ansi_colors()

def describe(result):
    return str(result)

def operation(x):
    s, a, b, c = x["style"], x["a"], x["b"], x["c"]
    if s == "red": return cf.red(a)
    if s == "green": return cf.green(a)
    if s == "bold": return cf.bold(a)
    if s == "underline": return cf.underlined(a)
    if s == "bold-blue": return cf.bold_blue(a)
    if s == "red-bold-underline": return cf.bold_underlined_red(a)
    if s == "bold-in-red": return cf.red(f"{a}{cf.bold(b)}{c}")
    if s == "underline-in-green": return cf.green(f"{a}{cf.underlined(b)}{c}")
    if s == "red-in-bold": return cf.bold(f"{a}{cf.red(b)}{c}")
    if s == "deep": return cf.underlined(f"{a}{cf.bold_red(b)}{c}")
    raise ValueError(s)
