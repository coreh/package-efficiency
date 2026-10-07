import io
import json
import logging

sink = io.StringIO()

class JsonFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({'level': record.levelname.lower(), 'time': self.formatTime(record), 'message': record.getMessage(), **record.fields})

handler = logging.StreamHandler(sink)
handler.setFormatter(JsonFormatter())
logger = logging.Logger('bench', logging.INFO)
logger.addHandler(handler)
methods = {'info': logger.info, 'warn': logger.warning, 'error': logger.error}

def operation(doc):
    for r in doc['records']:
        methods[r['level']](r['message'], extra={'fields': r['fields']})
    out = sink.getvalue()
    sink.seek(0)
    sink.truncate()
    return out
