require 'word_wrap'

def operation(input)
  WordWrap.ww(input['text'], input['width'], true)
end
