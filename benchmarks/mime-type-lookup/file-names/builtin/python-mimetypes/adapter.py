import mimetypes
def operation(value):
    return mimetypes.guess_type(value)[0]
