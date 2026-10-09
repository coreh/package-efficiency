require 'prawn'

# Not timed: Prawn otherwise prints a warning about non-ASCII text in its built-in fonts.
Prawn::Fonts::AFM.hide_m17n_warning = true

def operation(document)
  pdf = Prawn::Document.new(page_size: 'A4', margin: 0)
  top = pdf.bounds.top
  document['pages'].each_with_index do |page, i|
    pdf.start_new_page if i.positive?
    pdf.font('Helvetica', size: 10)
    page['texts'].each { |t| pdf.draw_text(t['text'], at: [t['x'], top - t['y']]) }
    page['rules'].each { |x1, y1, x2, y2| pdf.stroke_line([x1, top - y1], [x2, top - y2]) }
  end
  pdf.render
end

def describe(result)
  [result].pack('m0')
end
