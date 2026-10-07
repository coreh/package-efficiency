require 'unicode/display_width'

def operation(value)
  Unicode::DisplayWidth.of(value)
end
