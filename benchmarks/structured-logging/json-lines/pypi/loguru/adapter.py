import io

from loguru import logger

sink = io.StringIO()
logger.remove()
logger.add(sink, serialize=True, level='INFO')
methods = {'info': 'info', 'warn': 'warning', 'error': 'error'}

def operation(doc):
    for r in doc['records']:
        getattr(logger.bind(**r['fields']), methods[r['level']])(r['message'])
    out = sink.getvalue()
    sink.seek(0)
    sink.truncate()
    return out
