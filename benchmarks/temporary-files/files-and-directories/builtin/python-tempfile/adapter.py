import tempfile

payload = bytes((i * 7 + 3) & 255 for i in range(1024))

def operation(input):
    root = input['root']
    files = [tempfile.NamedTemporaryFile(dir=root, prefix=input['filePrefix'], suffix=input['fileSuffix']) for _ in range(input['files'])]
    for f in files:
        f.write(payload)
    dirs = [tempfile.TemporaryDirectory(dir=root, prefix=input['dirPrefix']) for _ in range(input['dirs'])]
    names = [f.name for f in files] + [d.name for d in dirs]
    for f in files:
        f.close()
    for d in dirs:
        d.cleanup()
    return names
