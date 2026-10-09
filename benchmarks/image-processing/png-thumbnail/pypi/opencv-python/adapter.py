import base64
import cv2
import numpy as np

def prepare(value):
    return np.frombuffer(bytes.fromhex(value['png']), dtype=np.uint8), (value['width'], value['height'])

def operation(value):
    data, size = value
    image = cv2.imdecode(data, cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError('not an image')
    ok, encoded = cv2.imencode('.png', cv2.resize(image, size, interpolation=cv2.INTER_AREA))
    return encoded

def describe(result):
    return base64.b64encode(result.tobytes()).decode('ascii')
