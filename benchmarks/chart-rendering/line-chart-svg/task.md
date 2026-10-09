# Line chart to SVG

One operation is given a canvas size and five series of 500 numbers on a shared
x axis (`{ width, height, x, series }`), draws a line chart of them with the
library's default styling and returns the SVG text. Axes, ticks, labels,
colours and margins are the library's own.

The 6 fixtures are 560 by 352 to 1000 by 600 pixels (every size a multiple of
4, so points and CSS pixels convert exactly). The x values are 0 to 499; each
series is a slow wave plus grain large enough that no point lies on the line
through its neighbours, so every point is a corner of the line.

## What counts as correct

No two libraries draw the same picture, so the verifier reads the SVG back
with a strict XML reader of its own and checks what makes it this chart:

- the root is an `<svg>` in the SVG namespace whose `width` and `height` (in
  px or pt) are the size asked for, within half a pixel; a `viewBox` and
  `transform`s on groups (`matrix`, `translate`, `scale`, `rotate`) are
  applied;
- there are exactly five lines of 450 to 500 vertices, each a `<polyline>` or
  a `<path>` of one subpath made of straight segments (`M L H V`, absolute or
  relative), a vertex repeated in a row counting once; what is inside
  `<defs>`, `<clipPath>` and similar is not drawn and not counted;
- each line is paired with the series it follows most closely (the absolute
  correlation of its height at every data point's x, so the pairing does not
  depend on which way the y axis runs), and no series is drawn twice;
- each vertex is matched to a data point of its series, in order, starting at
  the first point and ending at the last; one mapping for all five,
  `px = a·x + b` and `py = c·y + e`, fits every vertex within one pixel, with
  `a > 0` and `c < 0` (larger values higher up);
- a point a line leaves out (as a renderer that simplifies paths does) lies
  within one pixel of the segment drawn across it;
- the lines span at least half the width and 40 % of the height, and every
  vertex lies inside the canvas.

The check asks whether the chart draws the data, not whether every coordinate
is exact, since the timings compare libraries doing the same job. So a chart
with a series missing, a series shifted by 2 px or scaled on its own, a line
that cuts corners off the data, a curve, an upside-down chart or a different
size fails, and the scenario asserts each of these when it loads; a chart with
its vertices on whole pixels, or with points left out that lie on the line
anyway, passes. Not compared: axes, ticks, text, colours, grid lines, legends
and margins.

Measured worst distances from the one mapping, over the six fixtures:
matplotlib and leather 0.000 px, gonum/plot 0.007, echarts and charts-rs
(coordinates to one decimal) 0.050 to 0.052, plotters (whole pixels) 0.503 to
0.519. A series moved by 2 px on its own lands at 1.62 px. A point left out of
a line by matplotlib's default simplification is at most 1/9 px from it; one
that is not on the line is tens of pixels away.

## Packages

- `echarts`: `init(null, null, { renderer: 'svg', ssr: true, width, height })`,
  `setOption` with value axes and five line series, animation off as
  server-side rendering asks, `renderToSVGString()`, `dispose()`. The `[x, y]`
  pairs are built inside the call.
- `charts-rs` (Rust): `LineChart::new(series, labels)` with the default theme,
  `width` and `height` set, `svg()`. Its line charts have a category x axis,
  so the x values are given as labels (made once per fixture), and the chart
  takes its data by value (copied inside the call).
- `plotters` (Rust): `SVGBackend::with_string`, `ChartBuilder` with label
  areas, `build_cartesian_2d` over the data's ranges (plotters takes them from
  the caller), `configure_mesh().draw()`, one `LineSeries` per series. Its
  backend coordinates are integers, so every vertex is rounded to a whole
  pixel (0.50 to 0.52 px from the mapping).
- `matplotlib` (PyPI): `Figure(figsize=(width / 96, height / 96))`,
  `add_subplot()`, `plot(x, series)` per series, `savefig(..., format='svg')`.
  The SVG backend writes points, 72 per inch. Path
  simplification (on by default, threshold 1/9 pixel) leaves out the points
  that lie on the line through their neighbours (the lines of the first
  fixture keep 485 to 495 of 500). `matplotlib-no-simplify` is the same inside
  `rc_context({'path.simplify': False})`, writing every point. CPython only: matplotlib
  has no pure-Python wheel for PyPy.
- `leather` (PyPI): `Chart()`, `add_line(list(zip(x, series)))` per series,
  `to_svg(width=..., height=...)`, which returns the text when no path is
  given. Pure Python, so it runs on PyPy too.
- `gonum.org/v1/plot` (Go): `plot.New()`, `plotter.NewLine` and `Add` per
  series, `Draw` on a `vgsvg` canvas of the size in points, `WriteTo` a
  buffer.

No standard library draws charts, so there are no built-in entries.

Left out: PyPI `altair` and `plotly` need an external renderer for SVG
(`vl-convert`, `kaleido`); `seaborn` is a statistical layer over matplotlib;
`sparklines` writes Unicode text. Go `ajstarks/svgo` writes SVG primitives
only, so the adapter would draw the chart itself. PNG output is not covered:
rasterizers and fonts differ and no pixel check is fair.

See [shared methodology](../../README.md) for timing and reproduction.
