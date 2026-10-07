from typing import List, Optional
import typer
import typer.main

app = typer.Typer(add_help_option=False)

@app.command()
def cli(
    verbose: bool = typer.Option(False, '--verbose', '-v'),
    dry_run: bool = typer.Option(False, '--dry-run', '-d'),
    force: bool = typer.Option(False, '--force', '-f'),
    name: Optional[str] = typer.Option(None, '--name', '-n'),
    count: Optional[int] = typer.Option(None, '--count', '-c'),
    tag: List[str] = typer.Option([], '--tag', '-t'),
    files: Optional[List[str]] = typer.Argument(None),
) -> dict[str, object]:
    return {'verbose': verbose, 'dry': dry_run, 'force': force, 'name': name, 'count': count, 'tags': list(tag), 'files': list(files or [])}

command = typer.main.get_command(app)

def operation(value):
    return command.main(args=value['argv'], standalone_mode=False)
