require 'tilt'
require 'erb'
class Scope
  include ERB::Util
end
ROW = Tilt::ERBTemplate.new { <<~'T' }
  <tr class="row<% if r["rush"] %> rush<% end %>"><td><%= h(r["sku"]) %></td><td><%= h(r["name"]) %></td><td><%= r["qty"] %></td><td><%= r["price"] %></td><td><% if r["rush"] %>Rush: <%= h(r["reason"]) %><% else %>Standard<% end %></td></tr>
T
PAGE = Tilt::ERBTemplate.new { <<~'T' }
  <article><h1><%= h(d["title"]) %></h1><address><%= h(d["customer"]["name"]) %> &lt;<%= h(d["customer"]["email"]) %>&gt;, <%= h(d["customer"]["address"]["city"]) %></address><table>
  <% d["rows"].each do |r| %><%= ROW.render(SCOPE, r: r) %>
  <% end %></table><footer><%= h(d["footer"]) %> - <%= d["total"] %></footer></article>
T
SCOPE = Scope.new
def operation(value)
  PAGE.render(SCOPE, d: value)
end
