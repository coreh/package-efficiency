from configparser import ConfigParser

def operation(text):
    parser = ConfigParser()
    parser.read_string(text)
    return parser

# For the verifier only, outside measured work.
def describe(parser):
    return {name: dict(parser[name]) for name in parser.sections()}
