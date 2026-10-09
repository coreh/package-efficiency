require 'colored'

def operation(x)
  a = x['a']; b = x['b']; c = x['c']
  case x['style']
  when 'red' then a.red
  when 'green' then a.green
  when 'bold' then a.bold
  when 'underline' then a.underline
  when 'bold-blue' then a.bold.blue
  when 'red-bold-underline' then a.red.bold.underline
  when 'bold-in-red' then a.red + b.red.bold + c.red
  when 'underline-in-green' then a.green + b.green.underline + c.green
  when 'red-in-bold' then a.bold + b.bold.red + c.bold
  when 'deep' then a.underline + b.underline.bold.red + c.underline
  else raise "unknown style #{x['style']}"
  end
end
