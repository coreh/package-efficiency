from boltons.fileutils import atomic_save

def operation(input):
    for file in input['files']:
        with atomic_save(file['path']) as f:
            f.write(file['content'].encode('utf-8'))
