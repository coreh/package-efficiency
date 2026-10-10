import base64
import io
from PIL import Image

def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    # Image.open is lazy; load() forces the decode. The mode stays RGB or RGBA.
    image = Image.open(io.BytesIO(data))
    image.load()
    return image

def describe(image):
    return {'width': image.width, 'height': image.height, 'data': base64.b64encode(image.tobytes()).decode('ascii')}
