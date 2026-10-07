from django.http import JsonResponse
from django.shortcuts import render
from django.views.generic import TemplateView

from .catalog import get_item


class AboutView(TemplateView):
    """The static page: a template rendered with no data."""

    template_name = "shop/about.html"


def item_detail(request, id):
    return render(request, "shop/item_detail.html", {"item": get_item(id)})


def item_api(request, id):
    return JsonResponse(get_item(id))
