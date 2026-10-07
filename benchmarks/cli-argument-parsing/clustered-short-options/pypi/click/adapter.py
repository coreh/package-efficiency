import click

@click.command(add_help_option=False)
@click.option('-v', '--verbose', is_flag=True)
@click.option('-d', '--dry-run', is_flag=True)
@click.option('-f', '--force', is_flag=True)
@click.option('-n', '--name')
@click.option('-c', '--count', type=int)
@click.option('-t', '--tag', multiple=True)
@click.argument('files', nargs=-1)
def cli(verbose, dry_run, force, name, count, tag, files):
    return {'verbose': verbose, 'dry': dry_run, 'force': force, 'name': name, 'count': count, 'tags': list(tag), 'files': list(files)}

def operation(value):
    return cli.main(args=value['argv'], standalone_mode=False)
