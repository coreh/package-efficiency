from jinja2 import DictLoader, Environment

SOURCES = {
    "row": """<tr class="row{% if r.rush %} rush{% endif %}"><td>{{ r.sku|e }}</td><td>{{ r.name|e }}</td><td>{{ r.qty }}</td><td>{{ r.price }}</td><td>{% if r.rush %}Rush: {{ r.reason|e }}{% else %}Standard{% endif %}</td></tr>""",
    "page": """<article><h1>{{ title|e }}</h1><address>{{ customer.name|e }} &lt;{{ customer.email|e }}&gt;, {{ customer.address.city|e }}</address><table>
{% for r in rows %}{% include "row" %}
{% endfor %}</table><footer>{{ footer|e }} - {{ total }}</footer></article>""",
}

env = Environment(loader=DictLoader(SOURCES))
page = env.get_template("page")
env.get_template("row")


def operation(value):
    return page.render(value)
