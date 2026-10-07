from django import template

register = template.Library()


@register.filter
def price(cents):
    """A price in cents as shown: 236 is $2.36."""
    return f"${cents // 100}.{cents % 100:02d}"
