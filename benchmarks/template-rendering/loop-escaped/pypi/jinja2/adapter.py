from jinja2 import Environment

TEMPLATE = """<section title="{{ title|e }}"><h1>{{ title|e }}</h1><p>By {{ author|e }}</p><ul>
{% for item in items %}<li id="item-{{ item.id }}" class="item{% if item.featured %} featured{% endif %}" title="{{ item.name|e }}"><b>{{ item.name|e }}</b> <span>{{ item.price }}</span>{% if item.note %}<em>{{ item.note|e }}</em>{% endif %}{% for tag in item.tags %}<i>{{ tag|e }}</i>{% endfor %}</li>
{% endfor %}</ul><p>{{ count }} items</p></section>"""

env = Environment()


def operation(value):
    return env.from_string(TEMPLATE).render(value)
