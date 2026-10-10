import tarfile

def operation(input):
    with tarfile.open(input['archive'], 'w') as archive:
        archive.add(input['source'], arcname='.')
    with tarfile.open(input['archive'], 'r') as archive:
        archive.extractall(input['target'], filter='data')
