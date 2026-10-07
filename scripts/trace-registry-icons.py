#!/usr/bin/env python3
"""Line drawings of the PyPI and crates.io marks for use beside text.

Both marks are shaded pictures of stacked boxes, which turn to mush at text
size. This draws them as lines of one colour:

- PyPI: traced over the logo itself (the `pypi` icon of @iconify-json/logos).
  Every edge of every cube that can be seen is kept, and the upper snake's
  cubes are filled, with their edges and eye cut out of the fill, so the two
  snakes built of cubes can still be told apart in one colour.
- crates.io: Cargo's crates on a pallet, drawn from a small model of boxes
  (four stacks, the front-left one a crate lower), with hidden edges removed.

Prints the path data as JSON; site/icons.mjs holds the result (BOX_ICONS).
Usage: python3 scripts/trace-registry-icons.py
"""
import json, math, re, subprocess

def parse(d):
    """Sub-paths of a path made only of straight segments, as point lists."""
    toks = re.findall(r'[MmLlHhVvZz]|-?\d*\.?\d+(?:e-?\d+)?', d)
    i = 0; x = y = sx = sy = 0; cmd = None; subs = []; cur = []
    def num():
        nonlocal i; v = float(toks[i]); i += 1; return v
    while i < len(toks):
        if re.match(r'[A-Za-z]', toks[i]): cmd = toks[i]; i += 1
        if cmd in 'Zz':
            if cur: subs.append(cur); cur = []
            x, y = sx, sy; continue
        if cmd in 'Mm':
            if cmd == 'M': x = num(); y = num()
            else: x += num(); y += num()
            sx, sy = x, y
            if cur: subs.append(cur)
            cur = [(x, y)]; cmd = 'L' if cmd == 'M' else 'l'
        elif cmd == 'L': x = num(); y = num(); cur.append((x, y))
        elif cmd == 'l': x += num(); y += num(); cur.append((x, y))
        elif cmd == 'H': x = num(); cur.append((x, y))
        elif cmd == 'h': x += num(); cur.append((x, y))
        elif cmd == 'V': y = num(); cur.append((x, y))
        elif cmd == 'v': y += num(); cur.append((x, y))
    if cur: subs.append(cur)
    return subs

def inside(p, poly):
    x, y = p; c = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c

def visible_edges(faces):
    """Faces are polygons in the order they are painted, back to front. An
    edge is kept wherever the face showing on one side of it differs from the
    face showing on the other, so edges hidden behind nearer faces go."""
    def top(p):
        for i in range(len(faces) - 1, -1, -1):
            if inside(p, faces[i]): return i
        return None
    span = max(max(p[0] for f in faces for p in f) - min(p[0] for f in faces for p in f), 1)
    off = span * 0.006
    segs = []; seen = set()
    for poly in faces:
        for a, b in zip(poly, poly[1:] + poly[:1]):
            L = math.hypot(b[0] - a[0], b[1] - a[1])
            if L < span * 0.008: continue
            key = tuple(sorted(((round(a[0] / off / 2), round(a[1] / off / 2)), (round(b[0] / off / 2), round(b[1] / off / 2)))))
            if key in seen: continue
            seen.add(key)
            nx, ny = -(b[1] - a[1]) / L, (b[0] - a[0]) / L
            N = 32; run = None
            for i in range(N + 1):
                t = i / N; t2 = min(max(t, 0.02), 0.98)
                p = (a[0] + (b[0] - a[0]) * t2, a[1] + (b[1] - a[1]) * t2)
                keep = top((p[0] + nx * off, p[1] + ny * off)) != top((p[0] - nx * off, p[1] - ny * off))
                q = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
                if keep: run = [q, q] if run is None else [run[0], q]
                else:
                    if run and run[0] != run[1]: segs.append(tuple(run))
                    run = None
            if run and run[0] != run[1]: segs.append(tuple(run))
    return segs

def fit(segs, size=24, margin=1.2):
    xs = [p[0] for s in segs for p in s]; ys = [p[1] for s in segs for p in s]
    k = (size - 2 * margin) / max(max(xs) - min(xs), max(ys) - min(ys))
    ox = (size - (max(xs) - min(xs)) * k) / 2 - min(xs) * k
    oy = (size - (max(ys) - min(ys)) * k) / 2 - min(ys) * k
    return k, lambda p: (p[0] * k + ox, p[1] * k + oy)

f = lambda v: ('%.2f' % v).rstrip('0').rstrip('.')

def path(segs, T):
    """Segments joined end to end into as few strokes as possible."""
    pool = [(T(a), T(b)) for a, b in segs]; d = ''
    near = lambda p, q: abs(p[0] - q[0]) < 0.12 and abs(p[1] - q[1]) < 0.12
    while pool:
        a, b = pool.pop(0); chain = [a, b]; grew = True
        while grew:
            grew = False
            for i, (c, e) in enumerate(pool):
                if near(chain[-1], c): chain.append(e)
                elif near(chain[-1], e): chain.append(c)
                elif near(chain[0], e): chain.insert(0, c)
                elif near(chain[0], c): chain.insert(0, e)
                else: continue
                pool.pop(i); grew = True; break
        out = [chain[0]]
        for i in range(1, len(chain) - 1):
            A, B, C = out[-1], chain[i], chain[i + 1]
            if abs((B[0] - A[0]) * (C[1] - B[1]) - (B[1] - A[1]) * (C[0] - B[0])) > 0.05: out.append(B)
        out.append(chain[-1])
        d += 'M' + 'L'.join(f'{f(x)} {f(y)}' for x, y in out)
    return d

# The faces of the upper snake (the blue one) in the logo.
BLUE = {'#3775a9', '#2f6491', '#353564', '#afafde', '#e9e9ff'}

def pypi():
    body = subprocess.run(['node', '-e', "process.stdout.write(require('@iconify-json/logos/icons.json').icons.pypi.body)"], capture_output=True, text=True, check=True).stdout
    faces = []; blue = []
    for attrs in re.findall(r'<path\b([^>]*)/?>', body):
        fill = re.search(r'fill="([^"]+)"', attrs).group(1)
        # The #ccc paths are the logo's own thin outlines, not faces.
        if fill == '#ccc': continue
        for sub in parse(re.search(r' d="([^"]+)"', attrs).group(1)):
            if len(sub) >= 4: faces.append(sub); blue.append(fill in BLUE)
    segs = visible_edges(faces)
    k, T = fit(segs)
    poly = lambda face: 'M' + 'L'.join(f'{f(T(p)[0])} {f(T(p)[1])}' for p in face) + 'z'
    eyes = {True: '', False: ''}
    for attrs in re.findall(r'<ellipse\b([^>]*)/?>', body):
        cx, cy, rx, ry = (float(re.search(rf'{name}="([^"]+)"', attrs).group(1)) for name in ('cx', 'cy', 'rx', 'ry'))
        on_blue = next((blue[i] for i in range(len(faces) - 1, -1, -1) if inside((cx, cy), faces[i])), False)
        x, y = T((cx, cy)); rx *= k * 1.2; ry *= k * 1.2
        eyes[on_blue] += f'M{f(x - rx)} {f(y)}a{f(rx)} {f(ry)} 0 1 0 {f(2 * rx)} 0a{f(rx)} {f(ry)} 0 1 0 {f(-2 * rx)} 0z'
    edges = path(segs, T)
    # The upper snake is filled, with its cube edges and its eye cut out of the
    # fill; everything else is drawn in line. Two masks do it: faces painted in
    # the logo's own order, white where the upper snake shows and black where
    # it is covered, which also hides the parts of it behind nearer cubes.
    painted = lambda on, off: ''.join(f'<path d="{poly(face)}" fill="{on if is_blue else off}"/>' for face, is_blue in zip(faces, blue))
    stroke = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'
    return {'body': (
        f'<mask id="pypi-snake" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">{painted("#fff", "#000")}'
        f'<path d="{edges}" {stroke} stroke="#000" stroke-width="0.75"/><path d="{eyes[True]}" fill="#000"/></mask>'
        f'<mask id="pypi-rest" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/>{painted("#000", "#fff")}</mask>'
        f'<rect width="24" height="24" fill="currentColor" mask="url(#pypi-snake)"/>'
        f'<g mask="url(#pypi-rest)"><path d="{edges}" {stroke} stroke="currentColor" stroke-width="1"/><path d="{eyes[False]}" fill="currentColor"/></g>'
    )}

def cargo():
    A, B = 0.866, 0.5
    P = lambda x, y, z: ((x - y) * A, (x + y) * B - z)
    def box(x0, x1, y0, y1, z0, z1, top=True):
        faces = [[P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)]]
        if top: faces.append([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)])
        return faces
    heights = {(0, 0): 2, (1, 0): 2, (0, 1): 1, (1, 1): 2}
    m, t = 0.28, 0.4
    faces = box(-m, 2 + m, -m, 2 + m, -t, 0)                      # the pallet, behind everything
    for (x, y), h in sorted(heights.items(), key=lambda item: item[0][0] + item[0][1]):
        for z in range(h): faces += box(x, x + 1, y, y + 1, z, z + 1, top=z == h - 1)
    segs = visible_edges(faces)
    k, T = fit(segs)
    return {'stroke': path(segs, T), 'fill': ''}

print(json.dumps({'eco-pypi': pypi(), 'eco-cargo': cargo()}, indent=1))
