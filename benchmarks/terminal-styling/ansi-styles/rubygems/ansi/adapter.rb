require 'ansi/code'

def operation(x)
  a = x['a']; b = x['b']; c = x['c']
  case x['style']
  when 'red' then ANSI.ansi(a, :red)
  when 'green' then ANSI.ansi(a, :green)
  when 'bold' then ANSI.ansi(a, :bold)
  when 'underline' then ANSI.ansi(a, :underline)
  when 'bold-blue' then ANSI.ansi(a, :bold, :blue)
  when 'red-bold-underline' then ANSI.ansi(a, :red, :bold, :underline)
  when 'bold-in-red' then ANSI.ansi(a + ANSI.ansi(b, :bold) + c, :red)
  when 'underline-in-green' then ANSI.ansi(a + ANSI.ansi(b, :underline) + c, :green)
  when 'red-in-bold' then ANSI.ansi(a + ANSI.ansi(b, :red) + c, :bold)
  when 'deep' then ANSI.ansi(a + ANSI.ansi(b, :bold, :red) + c, :underline)
  else raise "unknown style #{x['style']}"
  end
end
