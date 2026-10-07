from werkzeug.routing import Map, Rule
from werkzeug.exceptions import HTTPException

RESOURCES = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments', 'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews', 'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']

_rules = []
for _r in RESOURCES:
    _rules.append(Rule(f'/api/{_r}', methods=['GET'], endpoint=f'GET /api/{_r}'))
    _rules.append(Rule(f'/api/{_r}', methods=['POST'], endpoint=f'POST /api/{_r}'))
    _rules.append(Rule(f'/api/{_r}/<id>', methods=['GET'], endpoint=f'GET /api/{_r}/:id'))
    _rules.append(Rule(f'/api/{_r}/<id>', methods=['PUT'], endpoint=f'PUT /api/{_r}/:id'))
_adapter = Map(_rules).bind('localhost')

def operation(value):
    try:
        endpoint, args = _adapter.match(value['path'], method=value['method'])
    except HTTPException:
        return None
    return {'route': endpoint, 'params': args}
