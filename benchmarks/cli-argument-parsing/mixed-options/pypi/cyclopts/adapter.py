from typing import Annotated, Optional
from cyclopts import App, Parameter

app = App(help_flags=[], version_flags=[])

@app.default
def cli(
    *files: str,
    verbose: Annotated[bool, Parameter(name=['--verbose', '-v'], negative=())] = False,
    dry_run: Annotated[bool, Parameter(name=['--dry-run', '-d'], negative=())] = False,

    name: Annotated[Optional[str], Parameter(name=['--name', '-n'])] = None,
    count: Annotated[Optional[int], Parameter(name=['--count', '-c'])] = None,
    tag: Annotated[list[str], Parameter(name=['--tag', '-t'], negative=())] = [],
) -> dict[str, object]:
    return {'verbose': verbose, 'dry': dry_run, 'name': name, 'count': count, 'tags': list(tag), 'files': list(files)}

def operation(value):
    return app(value['argv'], exit_on_error=False, print_error=False, result_action='return_value')
