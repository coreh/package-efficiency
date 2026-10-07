require 'colored2/strings'
Colored2.enable!

def operation(x)
  a = x['a']; b = x['b']; c = x['c']
  case x['style']
  when 'red' then a.red
  when 'green' then a.green
  when 'bold' then a.bold
  when 'underline' then a.underlined
  when 'bold-blue' then a.bold.blue
  when 'red-bold-underline' then a.red.bold.underlined
  when 'bold-in-red' then a.red + b.red.bold + c.red
  when 'underline-in-green' then a.green + b.green.underlined + c.green
  when 'red-in-bold' then a.bold + b.bold.red + c.bold
  when 'deep' then a.underlined + b.underlined.bold.red + c.underlined
  else raise "unknown style #{x['style']}"
  end
end
