from flask import Flask
from werkzeug.test import EnvironBuilder

RESOURCES = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments', 'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews', 'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']

def _h(**kwargs):
    return ''

_app = Flask(__name__)
for _r in RESOURCES:
    _app.add_url_rule(f'/api/{_r}', endpoint=f'GET /api/{_r}', view_func=_h, methods=['GET'])
    _app.add_url_rule(f'/api/{_r}', endpoint=f'POST /api/{_r}', view_func=_h, methods=['POST'])
    _app.add_url_rule(f'/api/{_r}/<id>', endpoint=f'GET /api/{_r}/:id', view_func=_h, methods=['GET'])
    _app.add_url_rule(f'/api/{_r}/<id>', endpoint=f'PUT /api/{_r}/:id', view_func=_h, methods=['PUT'])

# Not timed: runs once per fixture. A WSGI environ, as a server would hand over.
def prepare(value):
    return EnvironBuilder(path=value['path'], method=value['method']).get_environ()

def operation(environ):
    # What Flask does for a request before any view runs: a Request and a URL
    # adapter bound to it, then the match, which sets url_rule and view_args
    # on the request or keeps the 404/405 as routing_exception.
    ctx = _app.request_context(environ)
    ctx.match_request()
    request = ctx.request
    rule = request.url_rule
    if rule is None:
        return None
    return {'route': rule.endpoint, 'params': request.view_args}
