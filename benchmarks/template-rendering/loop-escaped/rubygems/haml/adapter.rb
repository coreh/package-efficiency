require 'haml'
# The <li> opening tag is written as plain HTML with interpolation (escaped by
# Haml) because %li{...} would emit its attributes sorted alphabetically.
TEMPLATE = <<~'T'
  %section{title: data["title"]}
    %h1= data["title"]
    %p= "By #{data["author"]}"
    %ul
      - data["items"].each do |item|
        - extra = item["featured"] ? " featured" : ""
        <li id="item-#{item["id"]}" class="item#{extra}" title="#{item["name"]}">
        %b= item["name"]
        %span= item["price"]
        - unless item["note"].empty?
          %em= item["note"]
        - item["tags"].each do |tag|
          %i= tag
        </li>
    %p= "#{data["count"]} items"
T
class Scope; end
SCOPE = Scope.new
def operation(value)
  Haml::Template.new { TEMPLATE }.render(SCOPE, data: value)
end
