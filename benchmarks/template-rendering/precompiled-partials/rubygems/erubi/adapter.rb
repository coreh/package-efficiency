require 'erubi'
module Views
end
Views.module_eval("def row(r)\n" + Erubi::Engine.new(<<~'T').src + "\nend", __FILE__, __LINE__)
  <tr class="row<% if r["rush"] %> rush<% end %>"><td><%== r["sku"] %></td><td><%== r["name"] %></td><td><%= r["qty"] %></td><td><%= r["price"] %></td><td><% if r["rush"] %>Rush: <%== r["reason"] %><% else %>Standard<% end %></td></tr>
T
Views.module_eval("def page(d)\n" + Erubi::Engine.new(<<~'T').src + "\nend", __FILE__, __LINE__)
  <article><h1><%== d["title"] %></h1><address><%== d["customer"]["name"] %> &lt;<%== d["customer"]["email"] %>&gt;, <%== d["customer"]["address"]["city"] %></address><table>
  <% d["rows"].each do |r| %><%= row(r) %>
  <% end %></table><footer><%== d["footer"] %> - <%= d["total"] %></footer></article>
T
VIEWS = Object.new.extend(Views)
def operation(value)
  VIEWS.page(value)
end
