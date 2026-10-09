require 'citrus'

Citrus.eval(<<~'GRAMMAR')
  grammar JsonCitrus
    rule root
      (ws value ws) { capture(:value).value }
    end

    rule value
      string | number | object | array | true | false | null
    end

    rule object
      ('{' ws (pair (ws ',' ws pair)*)? ws '}') {
        h = {}
        captures[:pair].each { |p| h[p.key] = p.val }
        h
      }
    end

    rule pair
      (string ws ':' ws value) {
        def key; capture(:string).value; end
        def val; capture(:value).value; end
      }
    end

    rule array
      ('[' ws (value (ws ',' ws value)*)? ws ']') { captures[:value].map(&:value) }
    end

    rule string
      ('"' body:/(?:[^"\\\x00-\x1f]|\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4}))*/ '"') {
        s = capture(:body).to_s
        if s.include?('\\')
          s.gsub(/\\(?:u([dD][89abAB]\h{2})\\u([dD][c-fC-F]\h{2})|u(\h{4})|(.))/m) do
            if $1 then (0x10000 + (($1.hex - 0xD800) << 10) + ($2.hex - 0xDC00)).chr('UTF-8')
            elsif $3 then $3.hex.chr('UTF-8')
            else { 'b' => "\b", 'f' => "\f", 'n' => "\n", 'r' => "\r", 't' => "\t" }.fetch($4, $4)
            end
          end
        else
          s
        end
      }
    end

    rule number
      /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?/ {
        t = to_s
        t.match?(/[.eE]/) ? t.to_f : t.to_i
      }
    end

    rule true
      'true' { true }
    end

    rule false
      'false' { false }
    end

    rule null
      'null' { nil }
    end

    rule ws
      /[ \t\r\n]*/
    end
  end
GRAMMAR

def operation(text)
  JsonCitrus.parse(text).value
end
