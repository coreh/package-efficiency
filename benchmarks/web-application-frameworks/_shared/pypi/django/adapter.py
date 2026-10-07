"""Starts the Django project on its server, inside the runner's process.

Django is deployed by giving the project's `application` to a WSGI or an ASGI
server. BENCH_SERVER picks which (prepare.mjs sets it from the variant):

  wsgi  `waitress-serve config.wsgi:application`, done from Python: Waitress
        with its own defaults (4 worker threads), or with BENCH_THREADS
        worker threads (`--threads`) when a variant sets it.
  asgi  `uvicorn config.asgi:application`, done from Python: Uvicorn on
        asyncio with h11.

Either way the server runs on a thread of the one process the harness
measures, and DJANGO_SETTINGS_MODULE says which settings the project loads.
"""
import os
from typing import Callable

SERVER = os.environ.get("BENCH_SERVER", "wsgi")
if SERVER == "wsgi":
    from config.wsgi import application
elif SERVER == "asgi":
    from config.asgi import application
else:
    raise RuntimeError(f"Unknown BENCH_SERVER {SERVER!r}")


def start_wsgi() -> tuple[int, Callable[[], None]]:
    import logging, threading
    from waitress import create_server
    # Waitress warns on stderr whenever requests queue for a thread; the tasks allow no logging.
    logging.getLogger("waitress.queue").setLevel(logging.ERROR)
    # Waitress's own default (4) unless the variant sets BENCH_THREADS.
    threads = {"threads": int(os.environ["BENCH_THREADS"])} if "BENCH_THREADS" in os.environ else {}
    server = create_server(application, host="127.0.0.1", port=0, **threads)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    def close() -> None:
        server.task_dispatcher.shutdown()
        server.close()
        thread.join(10)
        if thread.is_alive(): raise RuntimeError("Waitress failed to stop")
    return int(server.effective_port), close


def start_asgi() -> tuple[int, Callable[[], None]]:
    import threading, time, uvicorn
    server = uvicorn.Server(uvicorn.Config(application, host="127.0.0.1", port=0, loop="asyncio", http="h11", lifespan="off", access_log=False, log_level="critical"))
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    deadline = time.monotonic() + 20
    while not server.started:
        if not thread.is_alive() or time.monotonic() > deadline: raise RuntimeError("Uvicorn failed to start")
        time.sleep(.005)
    port = server.servers[0].sockets[0].getsockname()[1]
    def close() -> None:
        server.should_exit = True
        thread.join(10)
        if thread.is_alive(): raise RuntimeError("Uvicorn failed to stop")
    return port, close


start = start_wsgi if SERVER == "wsgi" else start_asgi
