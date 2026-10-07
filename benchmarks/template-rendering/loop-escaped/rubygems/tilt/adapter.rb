require 'tilt'
require 'erb'
TEMPLATE = <<~'T'
  <section title="<%= h(data["title"]) %>"><h1><%= h(data["title"]) %></h1><p>By <%= h(data["author"]) %></p><ul>
  <% data["items"].each do |item| %><li id="item-<%= item["id"] %>" class="item<% if item["featured"] %> featured<% end %>" title="<%= h(item["name"]) %>"><b><%= h(item["name"]) %></b> <span><%= item["price"] %></span><% unless item["note"].empty? %><em><%= h(item["note"]) %></em><% end %><% item["tags"].each do |tag| %><i><%= h(tag) %></i><% end %></li>
  <% end %></ul><p><%= data["count"] %> items</p></section>
T
class Scope
  include ERB::Util
end
SCOPE = Scope.new
def operation(value)
  Tilt::ERBTemplate.new { TEMPLATE }.render(SCOPE, data: value)
end
