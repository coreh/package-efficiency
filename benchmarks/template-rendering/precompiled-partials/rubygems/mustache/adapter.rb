require 'mustache'
class Invoice < Mustache
  PARTIALS = {
    'row' => '<tr class="row{{#rush}} rush{{/rush}}"><td>{{sku}}</td><td>{{name}}</td><td>{{qty}}</td><td>{{price}}</td><td>{{#rush}}Rush: {{reason}}{{/rush}}{{^rush}}Standard{{/rush}}</td></tr>'
  }.freeze
  # Partials are looked up here instead of in files; Mustache expands them
  # when the template is compiled.
  def partial(name)
    PARTIALS.fetch(name.to_s)
  end
  self.template = <<~'T'
    <article><h1>{{title}}</h1><address>{{customer.name}} &lt;{{customer.email}}&gt;, {{customer.address.city}}</address><table>
    {{#rows}}{{>row}}
    {{/rows}}</table><footer>{{footer}} - {{total}}</footer></article>
  T
end
# One view instance is built and warmed before the run: Mustache compiles the
# class template once, and the instance's context keeps the compiled row
# partial, so each call only renders. (A fresh instance per call would compile
# the partial again every time.)
VIEW = Invoice.new
VIEW.render({ 'title' => '', 'customer' => { 'name' => '', 'email' => '', 'address' => { 'city' => '' } },
               'rows' => [{ 'sku' => '', 'name' => '', 'qty' => 0, 'price' => 0, 'rush' => false, 'reason' => '' }],
               'footer' => '', 'total' => 0 })
def operation(value)
  VIEW.render(value)
end
