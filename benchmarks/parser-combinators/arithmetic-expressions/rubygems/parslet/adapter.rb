require 'parslet'

class ArithParser < Parslet::Parser
  rule(:sp) { match('[ \t]').repeat }
  rule(:number) { (match('[0-9]').repeat(1) >> (str('.') >> match('[0-9]').repeat(1)).maybe).as(:num) >> sp }
  rule(:primary) do
    (str('-') >> sp >> primary.as(:neg)) |
      (str('(') >> sp >> expression >> str(')') >> sp) |
      number
  end
  rule(:expression) do
    infix_expression(primary,
                     [match('[*/]') >> sp, 2, :left],
                     [match('[+\-]') >> sp, 1, :left])
  end
  rule(:document) { sp >> expression }
  root(:document)
end

class ArithEval < Parslet::Transform
  rule(num: simple(:n)) { n.to_s.to_f }
  rule(neg: simple(:v)) { -v }
  rule(l: simple(:l), o: simple(:o), r: simple(:r)) do
    case o.to_s.strip
    when '+' then l + r
    when '-' then l - r
    when '*' then l * r
    else l / r
    end
  end
end

PARSER = ArithParser.new
EVAL = ArithEval.new

def operation(text)
  EVAL.apply(PARSER.parse(text))
end
