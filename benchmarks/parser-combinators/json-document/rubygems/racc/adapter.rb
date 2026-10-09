require 'racc/static'
require 'strscan'
require 'stringio'

GRAMMAR = <<~'RACC'
  class JsonRacc
  rule
    target : value

    value : object
          | array
          | STRING
          | NUMBER
          | TRUE  { result = true }
          | FALSE { result = false }
          | NULL  { result = nil }

    object : '{' '}'         { result = {} }
           | '{' pairs '}'   { result = val[1] }

    pairs : pair             { result = { val[0][0] => val[0][1] } }
          | pairs ',' pair   { result = val[0]; result[val[2][0]] = val[2][1] }

    pair : STRING ':' value  { result = [val[0], val[2]] }

    array : '[' ']'          { result = [] }
          | '[' items ']'    { result = val[1] }

    items : value            { result = [val[0]] }
          | items ',' value  { result = val[0]; result << val[2] }
  end

  ---- inner
    ESCAPES = { 'b' => "\b", 'f' => "\f", 'n' => "\n", 'r' => "\r", 't' => "\t" }.freeze

    def unescape(s)
      return s unless s.include?('\\')
      s.gsub(/\\(?:u([dD][89abAB]\h{2})\\u([dD][c-fC-F]\h{2})|u(\h{4})|(.))/m) do
        if $1 then (0x10000 + (($1.hex - 0xD800) << 10) + ($2.hex - 0xDC00)).chr('UTF-8')
        elsif $3 then $3.hex.chr('UTF-8')
        else ESCAPES.fetch($4, $4)
        end
      end
    end

    def evaluate(text)
      @scanner = StringScanner.new(text)
      do_parse
    end

    def next_token
      @scanner.skip(/[ \t\r\n]+/)
      return [false, nil] if @scanner.eos?
      if @scanner.scan(/"((?:[^"\\\x00-\x1f]|\\(?:["\\\/bfnrt]|u\h{4}))*)"/)
        [:STRING, unescape(@scanner[1])]
      elsif (n = @scanner.scan(/-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?/))
        [:NUMBER, n.match?(/[.eE]/) ? n.to_f : n.to_i]
      elsif @scanner.scan(/true/) then [:TRUE, true]
      elsif @scanner.scan(/false/) then [:FALSE, false]
      elsif @scanner.scan(/null/) then [:NULL, nil]
      else
        c = @scanner.getch
        [c, c]
      end
    end
RACC

# Generate the LALR parser once from the grammar text, as the racc command does, and load it.
parsed = Racc::GrammarFileParser.new.parse(GRAMMAR, 'json.y')
states = Racc::States.new(parsed.grammar).nfa
states.dfa
params = parsed.params.dup
params.filename = 'json.y'
eval(Racc::ParserFileGenerator.new(states, params).generate_parser, TOPLEVEL_BINDING)

PARSER = JsonRacc.new

def operation(text)
  PARSER.evaluate(text)
end
