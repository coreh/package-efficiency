import io
import tarfile

def operation(entries):
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode='w') as archive:
        for entry in entries:
            data = entry['text'].encode('utf-8')
            info = tarfile.TarInfo(entry['name'])
            info.size = len(data)
            archive.addfile(info, io.BytesIO(data))
    size = buffer.getbuffer().nbytes
    buffer.seek(0)
    with tarfile.open(fileobj=buffer, mode='r') as archive:
        extracted = [{'name': member.name, 'text': archive.extractfile(member).read().decode('utf-8')} for member in archive]
    return extracted, size

def describe(result):
    return {'entries': result[0], 'archiveBytes': result[1]}
