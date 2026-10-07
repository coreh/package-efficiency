require 'psych'
def operation(value)
  Psych.safe_load(value)
end
