ENV['GITHUB_ACTIONS'] = 'true' # Formatador colors only on a tty or in CI
require 'formatador'

def operation(x)
  a = x['a']; b = x['b']; c = x['c']
  case x['style']
  when 'red' then Formatador.parse("[red]#{a}[/]")
  when 'green' then Formatador.parse("[green]#{a}[/]")
  when 'bold' then Formatador.parse("[bold]#{a}[/]")
  when 'underline' then Formatador.parse("[underline]#{a}[/]")
  when 'bold-blue' then Formatador.parse("[bold][blue]#{a}[/]")
  when 'red-bold-underline' then Formatador.parse("[red][bold][underline]#{a}[/]")
  when 'bold-in-red' then Formatador.parse("[red]#{a}[/][red][bold]#{b}[/][red]#{c}[/]")
  when 'underline-in-green' then Formatador.parse("[green]#{a}[/][green][underline]#{b}[/][green]#{c}[/]")
  when 'red-in-bold' then Formatador.parse("[bold]#{a}[/][bold][red]#{b}[/][bold]#{c}[/]")
  when 'deep' then Formatador.parse("[underline]#{a}[/][underline][bold][red]#{b}[/][underline]#{c}[/]")
  else raise "unknown style #{x['style']}"
  end
end
