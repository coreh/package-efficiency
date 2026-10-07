"""config.urls without the admin, which the "minimal" variant does not install."""
from django.urls import include, path

urlpatterns = [
    path('', include('shop.urls')),
]
