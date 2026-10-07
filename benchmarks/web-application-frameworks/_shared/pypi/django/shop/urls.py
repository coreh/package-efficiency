from django.urls import path

from . import views

app_name = "shop"

urlpatterns = [
    path("about", views.AboutView.as_view(), name="about"),
    path("items/<int:id>", views.item_detail, name="item-detail"),
    path("api/items/<int:id>", views.item_api, name="item-api"),
]
