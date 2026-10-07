require 'redcarpet'

RENDERER = Redcarpet::Markdown.new(Redcarpet::Render::HTML)

def operation(text)
  RENDERER.render(text)
end
