require 'dentaku'

def operation(value)
  expr = value['expr']
  calculator = Dentaku::Calculator.new
  value['vars'].map { |vars| calculator.evaluate!(expr, vars) }
end

# Dentaku works in BigDecimal; the number is handed over as a Float.
def describe(result)
  result.map { |x| x == true || x == false ? x : x.to_f }
end
