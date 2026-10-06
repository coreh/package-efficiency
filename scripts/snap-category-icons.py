"""Snap the category drawings to the pixel grid they are shown on.

The drawings use a 96-unit grid and are shown at 48 px, so one pixel is two
units. A 1 px line (2 units wide) is only sharp when its centre sits on a half
pixel, which is an odd unit. This moves every straight-edged coordinate to the
nearest odd unit and makes every length an even number of units. Shapes inside
a rotated or scaled group are left alone, since their grid is not the screen's.

Usage: python3 scripts/snap-category-icons.py   (safe to run again)
"""
import glob, re

ARITY = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'C': 6, 'S': 4, 'Q': 4, 'T': 2, 'A': 7, 'Z': 0}
odd = lambda v: 2 * round((v - 1) / 2) + 1
even = lambda v: 2 * round(v / 2)
fmt = lambda v: ('%g' % v)

def snap_path(d):
    tokens = re.findall(r'[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?', d)
    out, i = [], 0
    while i < len(tokens):
        cmd = tokens[i]; i += 1
        upper = cmd.upper()
        n = ARITY[upper]
        out.append(cmd)
        first = True
        while n and i < len(tokens) and not tokens[i].isalpha():
            args = [float(t) for t in tokens[i:i + n]]; i += n
            point = odd if cmd.isupper() else even
            if upper == 'A':
                args[5], args[6] = point(args[5]), point(args[6])
                args[2:5] = [int(a) for a in args[2:5]]
            else:
                args = [point(a) for a in args]
            out.append(('' if first else ' ') + ' '.join(fmt(a) for a in args))
            first = False
    return ''.join(out)

def snap_tag(match):
    tag = match.group(0)
    if 'transform=' in tag:
        return tag
    def attr(name, fn):
        nonlocal tag
        tag = re.sub(r'(\s%s=")(-?[\d.]+)(")' % name, lambda m: m.group(1) + fmt(fn(float(m.group(2)))) + m.group(3), tag)
    name = match.group(1)
    if name == 'path':
        tag = re.sub(r'(\sd=")([^"]+)(")', lambda m: m.group(1) + snap_path(m.group(2)) + m.group(3), tag)
    elif name == 'rect':
        attr('x', odd); attr('y', odd)
        attr('width', lambda v: max(2, even(v))); attr('height', lambda v: max(2, even(v)))
    elif name in ('circle', 'ellipse'):
        attr('cx', odd); attr('cy', odd)
    elif name == 'polygon':
        tag = re.sub(r'(\spoints=")([^"]+)(")', lambda m: m.group(1) + ' '.join(','.join(fmt(odd(float(v))) for v in p.split(',')) for p in m.group(2).split()) + m.group(3), tag)
    return tag

skipped = []
for file in sorted(glob.glob('site/assets/categories/*.svg')):
    source = open(file).read()
    if '<g transform=' in source:
        skipped.append(file.split('/')[-1])
        continue
    open(file, 'w').write(re.sub(r'<(path|rect|circle|ellipse|polygon)\b[^>]*>', snap_tag, source))
print('left as drawn (rotated or scaled):', ', '.join(skipped))
