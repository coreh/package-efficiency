import io
import logging

from pythonjsonlogger.json import JsonFormatter

sink = io.StringIO()
handler = logging.StreamHandler(sink)
handler.setFormatter(JsonFormatter('%(asctime)s %(levelname)s %(message)s'))
logger = logging.Logger('bench', logging.INFO)
logger.addHandler(handler)
methods = {'info': logger.info, 'warn': logger.warning, 'error': logger.error}

def operation(doc):
    for r in doc['records']:
        methods[r['level']](r['message'], extra=r['fields'])
    out = sink.getvalue()
    sink.seek(0)
    sink.truncate()
    return out
