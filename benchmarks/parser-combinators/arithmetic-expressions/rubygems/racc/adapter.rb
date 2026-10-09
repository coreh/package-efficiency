require 'racc/static'
require 'strscan'
require 'stringio'

GRAMMAR = <<~'RACC'
  class ArithRacc
  rule
    target : sum

    sum : sum '+' product { result = val[0] + val[2] }
        | sum '-' product { result = val[0] - val[2] }
        | product

    product : product '*' factor { result = val[0] * val[2] }
            | product '/' factor { result = val[0] / val[2] }
            | factor

    factor : '-' factor { result = -val[1] }
           | '(' sum ')' { result = val[1] }
           | NUMBER
  end

  ---- inner
    def evaluate(text)
      @scanner = StringScanner.new(text)
      do_parse
    end

    def next_token
      @scanner.skip(/[ \t]+/)
      return [false, nil] if @scanner.eos?
      if (n = @scanner.scan(/[0-9]+(?:\.[0-9]+)?/))
        [:NUMBER, n.to_f]
      else
        c = @scanner.getch
        [c, c]
      end
    end
RACC

# Generate the LALR parser once from the grammar text, as the racc command does, and load it.
parsed = Racc::GrammarFileParser.new.parse(GRAMMAR, 'arith.y')
states = Racc::States.new(parsed.grammar).nfa
states.dfa
params = parsed.params.dup
params.filename = 'arith.y'
eval(Racc::ParserFileGenerator.new(states, params).generate_parser, TOPLEVEL_BINDING)

PARSER = ArithRacc.new

def operation(text)
  PARSER.evaluate(text)
end
