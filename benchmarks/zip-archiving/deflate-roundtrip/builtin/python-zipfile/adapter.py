import io
import zipfile

def operation(entries):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as archive:
        for entry in entries:
            archive.writestr(entry['name'], entry['text'].encode('utf-8'))
    with zipfile.ZipFile(buffer) as archive:
        extracted = [{'name': info.filename, 'text': archive.read(info).decode('utf-8')} for info in archive.infolist()]
    return extracted, buffer.getbuffer().nbytes

def describe(result):
    return {'entries': result[0], 'archiveBytes': result[1]}
