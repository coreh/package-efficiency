require 'mustache'
TEMPLATE = <<~'T'
  <section title="{{title}}"><h1>{{title}}</h1><p>By {{author}}</p><ul>
  {{#items}}<li id="item-{{id}}" class="item{{#featured}} featured{{/featured}}" title="{{name}}"><b>{{name}}</b> <span>{{price}}</span>{{#hasNote}}<em>{{note}}</em>{{/hasNote}}{{#tags}}<i>{{.}}</i>{{/tags}}</li>
  {{/items}}</ul><p>{{count}} items</p></section>
T
# Mustache is logic-less and an empty string is truthy in it, so "no note"
# needs a boolean in the view data; it is added once, outside the timed call.
def prepare(input)
  input.merge('items' => input['items'].map { |it| it.merge('hasNote' => !it['note'].empty?) })
end
def operation(value)
  Mustache.render(TEMPLATE, value)
end
