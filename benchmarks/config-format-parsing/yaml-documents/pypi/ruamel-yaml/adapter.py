from ruamel.yaml import YAML
_yaml = YAML(typ='safe')
def operation(value):
    return _yaml.load(value)
