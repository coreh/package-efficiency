require 'diff/lcs'

def operation(value)
  out = []
  Diff::LCS.sdiff(value['a'].lines, value['b'].lines).each do |c|
    ops = c.action == '!' ? ['-', '+'] : [c.action]
    ops.each do |op|
      if out.empty? || out[-1][0] != op then out << [op, 1] else out[-1][1] += 1 end
    end
  end
  out
end
