"""The shop's views as coroutines, for the "async" variant.

Under ASGI Django calls these on the event loop, with no hand-over to a
thread for the view. The static page is a function here: a TemplateView
returns an unrendered TemplateResponse, which Django's asynchronous handler
renders on a thread.
"""
from django.http import JsonResponse
from django.shortcuts import render

from .catalog import get_item


async def about(request):
    return render(request, "shop/about.html")


async def item_detail(request, id):
    return render(request, "shop/item_detail.html", {"item": get_item(id)})


async def item_api(request, id):
    return JsonResponse(get_item(id))
