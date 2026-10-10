from jsonpointer import resolve_pointer

def operation(value):
    document = value['document']
    return [resolve_pointer(document, pointer, None) for pointer in value['pointers']]
