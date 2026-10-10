import base64
import cv2
import numpy as np

def prepare(value):
    return np.frombuffer(bytes.fromhex(value), dtype=np.uint8)

def operation(data):
    image = cv2.imdecode(data, cv2.IMREAD_COLOR_RGB)
    if image is None:
        raise ValueError('not an image')
    return image

def describe(image):
    return {'width': image.shape[1], 'height': image.shape[0], 'data': base64.b64encode(image.tobytes()).decode('ascii')}
