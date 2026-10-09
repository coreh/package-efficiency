require 'redcarpet'

# A renderer that keeps only the headings: Redcarpet parses the whole
# document and calls header for each block-level heading.
class Outline < Redcarpet::Render::Base
  attr_reader :headings

  def header(text, level)
    @headings << [level, text]
    ''
  end

  def doc_header
    @headings = []
    ''
  end
end

MARKDOWN = Redcarpet::Markdown.new(Outline, fenced_code_blocks: true, space_after_headers: true)

def operation(text)
  r = MARKDOWN.renderer
  MARKDOWN.render(text)
  r.headings
end
