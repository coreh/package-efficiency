from fastapi import APIRouter
from starlette.routing import Match

RESOURCES = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments', 'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews', 'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']

def _h():
    pass

_router = APIRouter()
for _r in RESOURCES:
    _router.add_api_route(f'/api/{_r}', _h, methods=['GET'], name=f'GET /api/{_r}')
    _router.add_api_route(f'/api/{_r}', _h, methods=['POST'], name=f'POST /api/{_r}')
    _router.add_api_route(f'/api/{_r}/{{id}}', _h, methods=['GET'], name=f'GET /api/{_r}/:id')
    _router.add_api_route(f'/api/{_r}/{{id}}', _h, methods=['PUT'], name=f'PUT /api/{_r}/:id')
_routes = _router.routes

# Not timed: runs once per fixture.
def prepare(value):
    return {'type': 'http', 'method': value['method'], 'path': value['path']}

def operation(scope):
    for route in _routes:
        match, child = route.matches(scope)
        if match == Match.FULL:
            return {'route': route.name, 'params': child['path_params']}
    return None
