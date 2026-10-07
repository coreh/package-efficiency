require 'parslet'

class JsonParser < Parslet::Parser
  rule(:ws) { match('[ \t\r\n]').repeat }
  rule(:digit) { match('[0-9]') }
  rule(:number) do
    (str('-').maybe >> (str('0') | (match('[1-9]') >> digit.repeat)) >>
      (str('.') >> digit.repeat(1)).maybe >>
      (match('[eE]') >> match('[+\-]').maybe >> digit.repeat(1)).maybe).as(:number)
  end
  rule(:string) do
    str('"') >>
      ((str('\\') >> (match('["\\\\/bfnrt]') | (str('u') >> match('[0-9a-fA-F]').repeat(4, 4)))) |
        match('[^"\\\\\x00-\x1f]')).repeat.as(:string) >>
      str('"')
  end
  rule(:array) do
    str('[') >> ws >> (value.as(:item) >> (ws >> str(',') >> ws >> value.as(:item)).repeat).maybe.as(:array) >> ws >> str(']')
  end
  rule(:entry) { (string.as(:key) >> ws >> str(':') >> ws >> value.as(:val)).as(:entry) }
  rule(:object) do
    str('{') >> ws >> (entry >> (ws >> str(',') >> ws >> entry).repeat).maybe.as(:object) >> ws >> str('}')
  end
  rule(:value) do
    string | number | object | array | str('true').as(:true) | str('false').as(:false) | str('null').as(:null)
  end
  rule(:document) { ws >> value >> ws }
  root(:document)
end

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

Item = Struct.new(:v)
Entry = Struct.new(:k, :v)

class JsonTransform < Parslet::Transform
  rule(string: subtree(:s)) { s.is_a?(Parslet::Slice) ? JsonUnescape.call(s.to_s) : '' }
  rule(number: simple(:n)) do
    t = n.to_s
    t.match?(/[.eE]/) ? t.to_f : t.to_i
  end
  rule(true: simple(:x)) { true }
  rule(false: simple(:x)) { false }
  rule(null: simple(:x)) { nil }
  rule(item: subtree(:v)) { Item.new(v) }
  rule(entry: { key: simple(:k), val: subtree(:v) }) { Entry.new(k, v) }
  rule(array: subtree(:a)) do
    case a
    when Array then a.map(&:v)
    when Item then [a.v]
    else []
    end
  end
  rule(object: subtree(:o)) do
    case o
    when Array then o.each_with_object({}) { |e, h| h[e.k] = e.v }
    when Entry then { o.k => o.v }
    else {}
    end
  end
end

PARSER = JsonParser.new
TRANSFORM = JsonTransform.new

def operation(text)
  TRANSFORM.apply(PARSER.parse(text))
end
