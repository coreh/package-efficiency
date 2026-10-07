require 'raabro'

module JsonGrammar
  include Raabro

  def sbstart(i); rex(nil, i, /\[[ \t\r\n]*/); end
  def sbend(i); rex(nil, i, /[ \t\r\n]*\]/); end
  def pstart(i); rex(nil, i, /\{[ \t\r\n]*/); end
  def pend(i); rex(nil, i, /[ \t\r\n]*\}/); end
  def comma(i); rex(nil, i, /[ \t\r\n]*,[ \t\r\n]*/); end
  def colon(i); rex(nil, i, /[ \t\r\n]*:[ \t\r\n]*/); end
  def ws(i); rex(nil, i, /[ \t\r\n]*/); end

  def string(i); rex(:string, i, /"(\\["\\\/bfnrt]|\\u[0-9a-fA-F]{4}|[^"\\\x00-\x1f])*"/); end
  def number(i); rex(:number, i, /-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/); end
  def btrue(i); str(:btrue, i, 'true'); end
  def bfalse(i); str(:bfalse, i, 'false'); end
  def null(i); str(:null, i, 'null'); end

  def entry(i); seq(:entry, i, :string, :colon, :value); end
  def object(i); eseq(:object, i, :pstart, :entry, :comma, :pend); end
  def array(i); eseq(:array, i, :sbstart, :value, :comma, :sbend); end
  def value(i); alt(nil, i, :string, :number, :object, :array, :btrue, :bfalse, :null); end
  def root(i); seq(nil, i, :ws, :value, :ws); end

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

  def rewrite_string(t); unescape(t.string[1..-2]); end

  def rewrite_number(t)
    s = t.string
    s.match?(/[.eE]/) ? s.to_f : s.to_i
  end

  def rewrite_btrue(t); true; end
  def rewrite_bfalse(t); false; end
  def rewrite_null(t); nil; end

  def rewrite_object(t)
    h = {}
    t.children[1..-2].each_slice(2) { |e, _| h[rewrite_string(e.c0)] = rewrite_(e.c2) }
    h
  end

  def rewrite_array(t)
    t.children[1..-2].each_slice(2).map { |e, _| rewrite_(e) }
  end
end

def operation(text)
  JsonGrammar.parse(text)
end
