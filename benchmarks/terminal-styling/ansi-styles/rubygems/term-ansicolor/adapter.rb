require 'term/ansicolor'
Term::ANSIColor.coloring = true

def operation(x)
  a = x['a']; b = x['b']; c = x['c']
  case x['style']
  when 'red' then Term::ANSIColor.red(a)
  when 'green' then Term::ANSIColor.green(a)
  when 'bold' then Term::ANSIColor.bold(a)
  when 'underline' then Term::ANSIColor.underline(a)
  when 'bold-blue' then Term::ANSIColor.bold(Term::ANSIColor.blue(a))
  when 'red-bold-underline' then Term::ANSIColor.red(Term::ANSIColor.bold(Term::ANSIColor.underline(a)))
  when 'bold-in-red' then Term::ANSIColor.red(a) + Term::ANSIColor.red(Term::ANSIColor.bold(b)) + Term::ANSIColor.red(c)
  when 'underline-in-green' then Term::ANSIColor.green(a) + Term::ANSIColor.green(Term::ANSIColor.underline(b)) + Term::ANSIColor.green(c)
  when 'red-in-bold' then Term::ANSIColor.bold(a) + Term::ANSIColor.bold(Term::ANSIColor.red(b)) + Term::ANSIColor.bold(c)
  when 'deep' then Term::ANSIColor.underline(a) + Term::ANSIColor.underline(Term::ANSIColor.bold(Term::ANSIColor.red(b))) + Term::ANSIColor.underline(c)
  else raise "unknown style #{x['style']}"
  end
end
