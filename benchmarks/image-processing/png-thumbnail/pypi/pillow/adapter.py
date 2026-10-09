import base64
import io
from PIL import Image

def prepare(value):
    return bytes.fromhex(value['png']), (value['width'], value['height'])

def operation(value):
    data, size = value
    out = io.BytesIO()
    with Image.open(io.BytesIO(data)) as image:
        image.resize(size, Image.Resampling.LANCZOS).save(out, format='PNG')
    return out.getvalue()

def describe(result):
    return base64.b64encode(result).decode('ascii')
