# Only the Waitress API used by this adapter. WSGI environ values stay dynamic.
from typing import Any, Callable, Protocol

class Dispatcher(Protocol):
    def shutdown(self) -> None: ...

class Server(Protocol):
    effective_port: str
    task_dispatcher: Dispatcher
    def run(self) -> None: ...
    def close(self) -> None: ...

def create_server(
    application: Callable[[dict[str, Any], Callable[..., Any]], list[bytes]],
    *, host: str, port: int, threads: int
) -> Server: ...
