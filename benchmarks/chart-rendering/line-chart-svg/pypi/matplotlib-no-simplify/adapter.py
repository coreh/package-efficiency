import io
import matplotlib
from matplotlib.figure import Figure

def operation(value):
    with matplotlib.rc_context({'path.simplify': False}):
        # The SVG backend writes 72 points per inch; 96 CSS pixels per inch makes the size in pixels exact.
        figure = Figure(figsize=(value['width'] / 96, value['height'] / 96))
        axes = figure.add_subplot()
        x = value['x']
        for series in value['series']:
            axes.plot(x, series)
        out = io.StringIO()
        figure.savefig(out, format='svg')
    return out.getvalue()
