import configargparse

parser = configargparse.ArgumentParser(add_help=False)
parser.add_argument('-v', '--verbose', action='store_true')
parser.add_argument('-d', '--dry-run', action='store_true')
parser.add_argument('-n', '--name')
parser.add_argument('-c', '--count', type=int)
parser.add_argument('-t', '--tag', action='append', default=[])
parser.add_argument('files', nargs='*')

def operation(value):
    r = parser.parse_intermixed_args(value['argv'])
    return {'verbose': r.verbose, 'dry': r.dry_run, 'name': r.name, 'count': r.count, 'tags': r.tag, 'files': r.files}
