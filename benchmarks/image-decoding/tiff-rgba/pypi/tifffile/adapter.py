import base64
import io
import imagecodecs  # tifffile reads LZW only through imagecodecs
from tifffile import imread

def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    return imread(io.BytesIO(data))

def describe(arr):
    return {'width': arr.shape[1], 'height': arr.shape[0], 'data': base64.b64encode(arr.tobytes()).decode('ascii')}
