from cleo.io.inputs.argv_input import ArgvInput
from cleo.io.inputs.definition import Definition
from cleo.io.inputs.argument import Argument
from cleo.io.inputs.option import Option

definition = Definition([
    Option('verbose', 'v', flag=True),
    Option('dry-run', 'd', flag=True),
    Option('name', 'n', flag=False),
    Option('count', 'c', flag=False),
    Option('tag', 't', flag=False, is_list=True),
    Argument('files', required=False, is_list=True),
])

def operation(value):
    inp = ArgvInput(['cli', *value['argv']], definition)
    count = inp.option('count')
    return {'verbose': inp.option('verbose'), 'dry': inp.option('dry-run'), 'name': inp.option('name'), 'count': None if count is None else int(count), 'tags': inp.option('tag'), 'files': inp.argument('files')}
