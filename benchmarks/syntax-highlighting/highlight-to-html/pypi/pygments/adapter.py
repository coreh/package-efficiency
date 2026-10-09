from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import get_lexer_by_name

# Set up once: the formatter and one lexer per language.
formatter = HtmlFormatter()
lexers = {name: get_lexer_by_name(name) for name in ('javascript', 'python')}

def operation(input):
    return highlight(input['code'], lexers[input['language']], formatter)
