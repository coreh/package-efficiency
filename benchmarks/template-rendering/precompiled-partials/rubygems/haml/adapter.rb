require 'haml'
class Scope; end
SCOPE = Scope.new
# Plain-HTML opening tag: %tr{} would emit its attributes sorted alphabetically.
ROW = Haml::Template.new { <<~'T' }
  <tr class="row#{r["rush"] ? " rush" : ""}">
  %td= r["sku"]
  %td= r["name"]
  %td= r["qty"]
  %td= r["price"]
  %td= r["rush"] ? "Rush: #{r["reason"]}" : "Standard"
  </tr>
T
PAGE = Haml::Template.new { <<~'T' }
  %article
    %h1= d["title"]
    %address= "#{d["customer"]["name"]} <#{d["customer"]["email"]}>, #{d["customer"]["address"]["city"]}"
    %table
      - d["rows"].each do |r|
        != ROW.render(SCOPE, r: r)
    %footer= "#{d["footer"]} - #{d["total"]}"
T
def operation(value)
  PAGE.render(SCOPE, d: value)
end
