import fastar

def operation(input):
    with fastar.open(input['archive'], 'w') as archive:
        archive.append(input['source'], arcname='.')
    with fastar.open(input['archive'], 'r') as archive:
        archive.unpack(input['target'])
