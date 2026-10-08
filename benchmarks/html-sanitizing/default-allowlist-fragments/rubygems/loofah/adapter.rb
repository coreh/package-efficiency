require 'loofah'
def operation(html)
  Loofah.scrub_fragment(html, :strip).to_s
end
