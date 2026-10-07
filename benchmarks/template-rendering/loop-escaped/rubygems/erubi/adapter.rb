require 'erubi'
TEMPLATE = <<~'T'
  <section title="<%== data["title"] %>"><h1><%== data["title"] %></h1><p>By <%== data["author"] %></p><ul>
  <% data["items"].each do |item| %><li id="item-<%= item["id"] %>" class="item<% if item["featured"] %> featured<% end %>" title="<%== item["name"] %>"><b><%== item["name"] %></b> <span><%= item["price"] %></span><% unless item["note"].empty? %><em><%== item["note"] %></em><% end %><% item["tags"].each do |tag| %><i><%== tag %></i><% end %></li>
  <% end %></ul><p><%= data["count"] %> items</p></section>
T
def operation(value)
  data = value
  eval(Erubi::Engine.new(TEMPLATE).src)
end
