require 'liquid'
ROW = <<~'T'.chomp
  <tr class="row{% if r.rush %} rush{% endif %}"><td>{{ r.sku | escape }}</td><td>{{ r.name | escape }}</td><td>{{ r.qty }}</td><td>{{ r.price }}</td><td>{% if r.rush %}Rush: {{ r.reason | escape }}{% else %}Standard{% endif %}</td></tr>
T
class Files
  def read_template_file(name)
    raise Liquid::FileSystemError, "no partial #{name}" unless name == 'row'
    ROW
  end
end
Liquid::Template.file_system = Files.new
PAGE = Liquid::Template.parse(<<~'T')
  <article><h1>{{ title | escape }}</h1><address>{{ customer.name | escape }} &lt;{{ customer.email | escape }}&gt;, {{ customer.address.city | escape }}</address><table>
  {% for r in rows %}{% render 'row', r: r %}
  {% endfor %}</table><footer>{{ footer | escape }} - {{ total }}</footer></article>
T
# Liquid parses a partial through the file system and keeps it in the
# :cached_partials register; this hash is passed to every render, so the row
# partial is parsed once (by the first render) and reused.
PARTIALS = {}
def operation(value)
  PAGE.render(value, registers: { cached_partials: PARTIALS })
end
