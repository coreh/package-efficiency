from atomicwrites import atomic_write

def operation(input):
    for file in input['files']:
        with atomic_write(file['path'], overwrite=True) as f:
            f.write(file['content'])
