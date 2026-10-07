from mako.template import Template

TEMPLATE = """<section title="${title | h}"><h1>${title | h}</h1><p>By ${author | h}</p><ul>
% for item in items:
<li id="item-${item['id']}" class="item${' featured' if item['featured'] else ''}" title="${item['name'] | h}"><b>${item['name'] | h}</b> <span>${item['price']}</span>\\
% if item['note']:
<em>${item['note'] | h}</em>\\
% endif
% for tag in item['tags']:
<i>${tag | h}</i>\\
% endfor
</li>
% endfor
</ul><p>${count} items</p></section>"""


def operation(value):
    return Template(TEMPLATE).render(**value)
