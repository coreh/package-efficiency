"""The "async" variant: the generated settings with the asynchronous views.

Selected with DJANGO_SETTINGS_MODULE=config.settings_async and served through
config.asgi. Only the URLconf differs: it routes to shop.views_async.
"""
from .settings import *  # noqa: F401,F403

ROOT_URLCONF = 'config.urls_async'
