import markdown

def operation(text):
    return markdown.markdown(text, extensions=['fenced_code'])
