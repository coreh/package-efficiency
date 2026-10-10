require 'bigdecimal'

def operation(input)
  amounts = input['amounts']
  rates = input['rates']
  block = input['block']
  total = BigDecimal(0)
  subtotals = []
  (0...amounts.length).step(block) do |start|
    s = BigDecimal(0)
    start.upto(start + block - 1) { |i| s += BigDecimal(amounts[i]) * BigDecimal(rates[i]) }
    subtotals << s.round(2, :banker).to_s('F')
    total += s
  end
  [total.round(2, :banker).to_s('F')] + subtotals
end
