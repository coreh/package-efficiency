import sys
import types
from typing import Any

from django.conf import settings
from django.http import HttpRequest
from django.urls import Resolver404, path, resolve
from django.views import View

RESOURCES = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments', 'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews', 'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']

def _handler(route: str) -> Any:
    def handle(self: Any, request: Any, **kwargs: Any) -> Any:
        return {'route': route, 'params': kwargs}
    return handle

# Django's default for a method the view lacks builds a 405 response and logs
# a warning; this one answers with nothing instead.
def _not_allowed(self: Any, request: Any, *args: Any, **kwargs: Any) -> Any:
    return None

# A URL pattern has no method in Django: the class-based view chooses the
# handler by method. So there are 50 patterns, each with a view of two methods.
_urls = types.ModuleType('bench_hundred_routes_urls')
_patterns: list[Any] = []
for _r in RESOURCES:
    _list: Any = type('ListView', (View,), {'get': _handler(f'GET /api/{_r}'), 'post': _handler(f'POST /api/{_r}'), 'http_method_not_allowed': _not_allowed})
    _item: Any = type('ItemView', (View,), {'get': _handler(f'GET /api/{_r}/:id'), 'put': _handler(f'PUT /api/{_r}/:id'), 'http_method_not_allowed': _not_allowed})
    _patterns.append(path(f'api/{_r}', _list.as_view()))
    _patterns.append(path(f'api/{_r}/<id>', _item.as_view()))
setattr(_urls, 'urlpatterns', _patterns)
sys.modules[_urls.__name__] = _urls
settings.configure(ROOT_URLCONF=_urls.__name__)

# Not timed: runs once per fixture.
def prepare(value):
    request = HttpRequest()
    request.method = value['method']
    request.path = request.path_info = value['path']
    return request

def operation(request):
    try:
        match = resolve(request.path_info)
    except Resolver404:
        return None
    return match.func(request, *match.args, **match.kwargs)
