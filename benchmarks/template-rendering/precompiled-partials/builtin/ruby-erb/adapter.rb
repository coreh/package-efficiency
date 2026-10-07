require 'erb'
module Views
  include ERB::Util
end
ERB.new(<<~'T').def_method(Views, 'row(r)')
  <tr class="row<% if r["rush"] %> rush<% end %>"><td><%= h(r["sku"]) %></td><td><%= h(r["name"]) %></td><td><%= r["qty"] %></td><td><%= r["price"] %></td><td><% if r["rush"] %>Rush: <%= h(r["reason"]) %><% else %>Standard<% end %></td></tr>
T
ERB.new(<<~'T').def_method(Views, 'page(d)')
  <article><h1><%= h(d["title"]) %></h1><address><%= h(d["customer"]["name"]) %> &lt;<%= h(d["customer"]["email"]) %>&gt;, <%= h(d["customer"]["address"]["city"]) %></address><table>
  <% d["rows"].each do |r| %><%= row(r) %>
  <% end %></table><footer><%= h(d["footer"]) %> - <%= d["total"] %></footer></article>
T
VIEWS = Object.new.extend(Views)
def operation(value)
  VIEWS.page(value)
end
