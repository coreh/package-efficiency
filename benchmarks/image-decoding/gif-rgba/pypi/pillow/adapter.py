import base64
import io
from PIL import Image

def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    return Image.open(io.BytesIO(data)).convert('RGBA')

def describe(image):
    return {'width': image.width, 'height': image.height, 'data': base64.b64encode(image.tobytes()).decode('ascii')}
