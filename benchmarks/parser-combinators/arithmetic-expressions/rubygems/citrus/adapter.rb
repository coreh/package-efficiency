require 'citrus'

Citrus.eval(<<~'GRAMMAR')
  grammar ArithCitrus
    rule root
      (sp sum sp) { capture(:sum).value }
    end

    rule sum
      (product (addop product)*) {
        acc = capture(:product).value
        captures[:addop].zip(captures[:product].drop(1)) do |op, rhs|
          acc = op.to_s.strip == '+' ? acc + rhs.value : acc - rhs.value
        end
        acc
      }
    end

    rule addop
      (sp [+\-] sp)
    end

    rule product
      (factor (mulop factor)*) {
        acc = capture(:factor).value
        captures[:mulop].zip(captures[:factor].drop(1)) do |op, rhs|
          acc = op.to_s.strip == '*' ? acc * rhs.value : acc / rhs.value
        end
        acc
      }
    end

    rule mulop
      (sp [*/] sp)
    end

    rule factor
      neg | paren | number
    end

    rule neg
      ('-' sp factor) { -capture(:factor).value }
    end

    rule paren
      ('(' sp sum sp ')') { capture(:sum).value }
    end

    rule number
      /[0-9]+(\.[0-9]+)?/ { to_s.to_f }
    end

    rule sp
      /[ \t]*/
    end
  end
GRAMMAR

def operation(text)
  ArithCitrus.parse(text).value
end
