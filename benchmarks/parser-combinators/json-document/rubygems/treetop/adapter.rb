require 'treetop'

module JsonUnescape
  ESCAPES = { 'b' => "\b", 'f' => "\f", 'n' => "\n", 'r' => "\r", 't' => "\t" }.freeze

  def self.call(s)
    return s unless s.include?('\\')
    s.gsub(/\\(?:u([dD][89abAB]\h{2})\\u([dD][c-fC-F]\h{2})|u(\h{4})|(.))/m) do
      if $1 then (0x10000 + (($1.hex - 0xD800) << 10) + ($2.hex - 0xDC00)).chr('UTF-8')
      elsif $3 then $3.hex.chr('UTF-8')
      else ESCAPES.fetch($4, $4)
      end
    end
  end
end

Treetop.load_from_string(<<~'GRAMMAR')
  grammar Json
    rule document
      ws v:value ws { def value; v.value; end }
    end

    rule value
      string / number / object / array / true / false / null
    end

    rule object
      '{' ws '}' { def value; {}; end }
      / '{' ws first:pair rest:(ws ',' ws p:pair)* ws '}' {
        def value
          h = { first.key => first.pair_value }
          rest.elements.each { |e| h[e.p.key] = e.p.pair_value }
          h
        end
      }
    end

    rule pair
      k:string ws ':' ws v:value {
        def key; k.value; end
        def pair_value; v.value; end
      }
    end

    rule array
      '[' ws ']' { def value; []; end }
      / '[' ws first:value rest:(ws ',' ws v:value)* ws ']' {
        def value
          a = [first.value]
          rest.elements.each { |e| a << e.v.value }
          a
        end
      }
    end

    rule string
      '"' ('\\' ('u' [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] / ["\\/bfnrt]) / [^"\\\x00-\x1f])* '"' {
        def value; JsonUnescape.call(text_value[1..-2]); end
      }
    end

    rule number
      '-'? ('0' / [1-9] [0-9]*) ('.' [0-9]+)? ([eE] [+\-]? [0-9]+)? {
        def value
          t = text_value
          t.match?(/[.eE]/) ? t.to_f : t.to_i
        end
      }
    end

    rule true
      'true' { def value; true; end }
    end

    rule false
      'false' { def value; false; end }
    end

    rule null
      'null' { def value; nil; end }
    end

    rule ws
      [ \t\r\n]*
    end
  end
GRAMMAR

PARSER = JsonParser.new

def operation(text)
  tree = PARSER.parse(text)
  raise ArgumentError, PARSER.failure_reason unless tree
  tree.value
end
