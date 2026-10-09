from uri_template import URITemplate

def operation(input):
    return URITemplate(input['template']).expand(**input['vars'])
