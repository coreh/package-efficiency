import base64
import io
import imageio.v3 as iio
from skimage.util import img_as_ubyte
from skimage.transform import resize

def prepare(value):
    return bytes.fromhex(value['png']), (value['height'], value['width'])

def operation(value):
    data, shape = value
    image = iio.imread(data)
    return iio.imwrite("<bytes>", img_as_ubyte(resize(image, shape)), extension=".png")  # type: ignore[no-untyped-call]

def describe(result):
    return base64.b64encode(result).decode('ascii')
