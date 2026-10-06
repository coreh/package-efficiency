from typing import Any, Callable
import json, logging, os
from waitress import create_server
def app(environ: dict[str, Any], start_response: Callable[..., Any]) -> list[bytes]:
    path = environ['PATH_INFO']
    if path == '/':
        body, content_type = b'Hello, World!', 'text/plain'
    elif path.startswith('/users/'):
        user_id = int(path.rsplit('/',1)[1])
        body, content_type = json.dumps({'id':user_id,'name':f'User {user_id}'}).encode(), 'application/json'
    else:
        value = json.loads(environ['wsgi.input'].read(int(environ['CONTENT_LENGTH'])))
        body, content_type = json.dumps({'echo':value}).encode(), 'application/json'
    start_response('200 OK',[('Content-Type',content_type),('Content-Length',str(len(body)))])
    return [body]
def start() -> tuple[int, Callable[[], None]]:
    import threading
    # Waitress warns on stderr whenever requests queue for a thread; the task allows no logging.
    logging.getLogger('waitress.queue').setLevel(logging.ERROR)
    # Waitress's own default unless a variant sets BENCH_THREADS.
    threads = {'threads': int(os.environ['BENCH_THREADS'])} if 'BENCH_THREADS' in os.environ else {}
    server = create_server(app, host='127.0.0.1',port=0,**threads)
    thread = threading.Thread(target=server.run,daemon=True)
    thread.start()
    def close() -> None:
        server.task_dispatcher.shutdown()
        server.close()
        thread.join(10)
        if thread.is_alive(): raise RuntimeError('Waitress failed to stop')
    return int(server.effective_port), close
