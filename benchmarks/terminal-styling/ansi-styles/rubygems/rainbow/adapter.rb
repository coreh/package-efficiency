require 'rainbow'
Rainbow.enabled = true

def operation(x)
  a = x['a']; b = x['b']; c = x['c']
  case x['style']
  when 'red' then Rainbow(a).red.to_s
  when 'green' then Rainbow(a).green.to_s
  when 'bold' then Rainbow(a).bold.to_s
  when 'underline' then Rainbow(a).underline.to_s
  when 'bold-blue' then Rainbow(a).bold.blue.to_s
  when 'red-bold-underline' then Rainbow(a).red.bold.underline.to_s
  when 'bold-in-red' then Rainbow(a).red + Rainbow(b).red.bold + Rainbow(c).red
  when 'underline-in-green' then Rainbow(a).green + Rainbow(b).green.underline + Rainbow(c).green
  when 'red-in-bold' then Rainbow(a).bold + Rainbow(b).bold.red + Rainbow(c).bold
  when 'deep' then Rainbow(a).underline + Rainbow(b).underline.bold.red + Rainbow(c).underline
  else raise "unknown style #{x['style']}"
  end
end
