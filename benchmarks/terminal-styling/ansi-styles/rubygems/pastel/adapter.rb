require 'pastel'
PASTEL = Pastel.new(enabled: true)

def operation(x)
  a = x['a']; b = x['b']; c = x['c']
  case x['style']
  when 'red' then PASTEL.red(a)
  when 'green' then PASTEL.green(a)
  when 'bold' then PASTEL.bold(a)
  when 'underline' then PASTEL.underline(a)
  when 'bold-blue' then PASTEL.bold.blue(a)
  when 'red-bold-underline' then PASTEL.red.bold.underline(a)
  when 'bold-in-red' then PASTEL.red(a + PASTEL.bold(b) + c)
  when 'underline-in-green' then PASTEL.green(a + PASTEL.underline(b) + c)
  when 'red-in-bold' then PASTEL.bold(a + PASTEL.red(b) + c)
  when 'deep' then PASTEL.underline(a + PASTEL.bold.red(b) + c)
  else raise "unknown style #{x['style']}"
  end
end
