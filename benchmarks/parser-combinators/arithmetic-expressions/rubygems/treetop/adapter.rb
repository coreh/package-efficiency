require 'treetop'

Treetop.load_from_string(<<~'GRAMMAR')
  grammar Arith
    rule document
      ws s:sum ws { def value; s.value; end }
    end

    rule sum
      head:product tail:(ws op:[+\-] ws t:product)* {
        def value
          acc = head.value
          tail.elements.each { |e| acc = e.op.text_value == '+' ? acc + e.t.value : acc - e.t.value }
          acc
        end
      }
    end

    rule product
      head:factor tail:(ws op:[*/] ws f:factor)* {
        def value
          acc = head.value
          tail.elements.each { |e| acc = e.op.text_value == '*' ? acc * e.f.value : acc / e.f.value }
          acc
        end
      }
    end

    rule factor
      '-' ws f:factor { def value; -f.value; end }
      / '(' ws s:sum ws ')' { def value; s.value; end }
      / number
    end

    rule number
      [0-9]+ ('.' [0-9]+)? { def value; text_value.to_f; end }
    end

    rule ws
      [ \t]*
    end
  end
GRAMMAR

PARSER = ArithParser.new

def operation(text)
  tree = PARSER.parse(text)
  raise ArgumentError, PARSER.failure_reason unless tree
  tree.value
end
