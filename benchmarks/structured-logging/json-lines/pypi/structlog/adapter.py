import io

import structlog

sink = io.StringIO()
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt='iso'),
        structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.WriteLoggerFactory(file=sink),
)
log = structlog.get_logger()
methods = {'info': log.info, 'warn': log.warning, 'error': log.error}

def operation(doc):
    for r in doc['records']:
        methods[r['level']](r['message'], **r['fields'])
    out = sink.getvalue()
    sink.seek(0)
    sink.truncate()
    return out
