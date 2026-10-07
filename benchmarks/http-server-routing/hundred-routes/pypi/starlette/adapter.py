from starlette.routing import Route, Match

RESOURCES = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments', 'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews', 'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']

async def _h(request):
    pass

_routes = []
for _r in RESOURCES:
    _routes.append(Route(f'/api/{_r}', _h, methods=['GET'], name=f'GET /api/{_r}'))
    _routes.append(Route(f'/api/{_r}', _h, methods=['POST'], name=f'POST /api/{_r}'))
    _routes.append(Route(f'/api/{_r}/{{id}}', _h, methods=['GET'], name=f'GET /api/{_r}/:id'))
    _routes.append(Route(f'/api/{_r}/{{id}}', _h, methods=['PUT'], name=f'PUT /api/{_r}/:id'))

# Not timed: runs once per fixture.
def prepare(value):
    return {'type': 'http', 'method': value['method'], 'path': value['path']}

def operation(scope):
    for route in _routes:
        match, child = route.matches(scope)
        if match == Match.FULL:
            return {'route': route.name, 'params': child['path_params']}
    return None
