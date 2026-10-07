"""The "minimal" variant: the generated settings with what this shop does not
use taken out.

Selected with DJANGO_SETTINGS_MODULE=config.settings_minimal. The shop has no
models, users, sessions, forms, flash messages or static files, so:

- INSTALLED_APPS is the shop alone (no admin, auth, contenttypes, sessions,
  messages or staticfiles), and the URLconf has no admin;
- the session, CSRF, authentication and message middleware are gone. The
  security, common and clickjacking middleware stay: they set response
  headers (and Content-Length) on every page, which the shop does use;
- the templates get no context processors (none of the pages reads `request`,
  `user`, `perms` or `messages`);
- there is no database.
"""
from .settings import *  # noqa: F401,F403

INSTALLED_APPS = [
    'shop',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls_minimal'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [],
        },
    },
]

DATABASES = {}
