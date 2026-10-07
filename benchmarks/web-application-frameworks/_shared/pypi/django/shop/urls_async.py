"""shop.urls, routed to the asynchronous views (the "async" variant)."""
from django.urls import path

from . import views_async as views

app_name = "shop"

urlpatterns = [
    path("about", views.about, name="about"),
    path("items/<int:id>", views.item_detail, name="item-detail"),
    path("api/items/<int:id>", views.item_api, name="item-api"),
]
