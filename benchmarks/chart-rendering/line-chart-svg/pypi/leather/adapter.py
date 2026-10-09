import leather

def operation(value):
    chart = leather.Chart()
    x = value['x']
    for series in value['series']:
        chart.add_line(list(zip(x, series)))
    # With no path, to_svg returns the SVG text (IPython's SVG object when IPython is installed; it is not).
    return chart.to_svg(width=value['width'], height=value['height'])
