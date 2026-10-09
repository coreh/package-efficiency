require 'liquid'
TEMPLATE = <<~'T'
  <section title="{{ title | escape }}"><h1>{{ title | escape }}</h1><p>By {{ author | escape }}</p><ul>
  {% for item in items %}<li id="item-{{ item.id }}" class="item{% if item.featured %} featured{% endif %}" title="{{ item.name | escape }}"><b>{{ item.name | escape }}</b> <span>{{ item.price }}</span>{% if item.note != "" %}<em>{{ item.note | escape }}</em>{% endif %}{% for tag in item.tags %}<i>{{ tag | escape }}</i>{% endfor %}</li>
  {% endfor %}</ul><p>{{ count }} items</p></section>
T
def operation(value)
  Liquid::Template.parse(TEMPLATE).render(value)
end
