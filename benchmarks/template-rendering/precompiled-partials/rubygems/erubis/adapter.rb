require 'erubis'
module Views
end
Erubis::Eruby.new(<<~'T').def_method(Views, 'row(r)')
  <tr class="row<% if r["rush"] %> rush<% end %>"><td><%== r["sku"] %></td><td><%== r["name"] %></td><td><%= r["qty"] %></td><td><%= r["price"] %></td><td><% if r["rush"] %>Rush: <%== r["reason"] %><% else %>Standard<% end %></td></tr>
T
Erubis::Eruby.new(<<~'T').def_method(Views, 'page(d)')
  <article><h1><%== d["title"] %></h1><address><%== d["customer"]["name"] %> &lt;<%== d["customer"]["email"] %>&gt;, <%== d["customer"]["address"]["city"] %></address><table>
  <% d["rows"].each do |r| %><%= row(r) %>
  <% end %></table><footer><%== d["footer"] %> - <%= d["total"] %></footer></article>
T
VIEWS = Object.new.extend(Views)
def operation(value)
  VIEWS.page(value)
end
