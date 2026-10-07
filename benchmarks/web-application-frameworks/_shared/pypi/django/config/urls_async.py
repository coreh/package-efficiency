"""config.urls with the shop's asynchronous views in place of the synchronous ones."""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('shop.urls_async')),
]
