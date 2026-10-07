from mako.template import Template

TEMPLATE = """<%def name="row(r)"><tr class="row${' rush' if r['rush'] else ''}"><td>${r['sku'] | h}</td><td>${r['name'] | h}</td><td>${r['qty']}</td><td>${r['price']}</td><td>\\
% if r['rush']:
Rush: ${r['reason'] | h}\\
% else:
Standard\\
% endif
</td></tr></%def>\\
<article><h1>${title | h}</h1><address>${customer['name'] | h} &lt;${customer['email'] | h}&gt;, ${customer['address']['city'] | h}</address><table>
% for r in rows:
${row(r)}
% endfor
</table><footer>${footer | h} - ${total}</footer></article>"""

page = Template(TEMPLATE)


def operation(value):
    return page.render(**value)
