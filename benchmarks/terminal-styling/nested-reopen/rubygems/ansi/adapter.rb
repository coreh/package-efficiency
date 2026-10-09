require 'ansi/code'

def operation(x)
  a = x['a']; b = x['b']; c = x['c']; d = x['d']; e = x['e']
  case x['style']
  when 'red-green-twice' then ANSI.ansi(a + ANSI.ansi(b, :green) + c + ANSI.ansi(d, :green) + e, :red)
  when 'blue-yellow' then ANSI.ansi(a + ANSI.ansi(b, :yellow) + c, :blue)
  when 'bold-dim' then ANSI.ansi(a + ANSI.ansi(b, :faint) + c, :bold)
  when 'three-level' then ANSI.ansi(a + ANSI.ansi(b + ANSI.ansi(c, :blue) + d, :green) + e, :red)
  when 'bold-red-dim' then ANSI.ansi(a + ANSI.ansi(b + ANSI.ansi(c, :faint) + d, :red) + e, :bold)
  else raise "unknown style #{x['style']}"
  end
end
