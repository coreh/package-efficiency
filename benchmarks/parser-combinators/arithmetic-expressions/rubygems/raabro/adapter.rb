require 'raabro'

module ArithGrammar
  include Raabro

  def lpar(i); rex(nil, i, /\([ \t]*/); end
  def rpar(i); rex(nil, i, /[ \t]*\)/); end
  def minus(i); rex(nil, i, /-[ \t]*/); end
  def mulop(i); rex(nil, i, /[ \t]*[*\/][ \t]*/); end
  def addop(i); rex(nil, i, /[ \t]*[+\-][ \t]*/); end
  def ws(i); rex(nil, i, /[ \t]*/); end

  def num(i); rex(:num, i, /[0-9]+(\.[0-9]+)?/); end
  def neg(i); seq(:neg, i, :minus, :factor); end
  def paren(i); seq(:paren, i, :lpar, :sum, :rpar); end
  def factor(i); alt(nil, i, :num, :neg, :paren); end
  def product(i); jseq(:product, i, :factor, :mulop); end
  def sum(i); jseq(:sum, i, :product, :addop); end
  def root(i); seq(nil, i, :ws, :sum, :ws); end

  def rewrite_num(t); t.string.to_f; end
  def rewrite_neg(t); -rewrite_(t.c1); end
  def rewrite_paren(t); rewrite_(t.c1); end

  def rewrite_product(t)
    kids = t.children
    acc = rewrite_(kids[0])
    i = 1
    while i < kids.length
      rhs = rewrite_(kids[i + 1])
      acc = kids[i].string.include?('*') ? acc * rhs : acc / rhs
      i += 2
    end
    acc
  end

  def rewrite_sum(t)
    kids = t.children
    acc = rewrite_(kids[0])
    i = 1
    while i < kids.length
      rhs = rewrite_(kids[i + 1])
      acc = kids[i].string.include?('+') ? acc + rhs : acc - rhs
      i += 2
    end
    acc
  end
end

def operation(text)
  ArithGrammar.parse(text)
end
