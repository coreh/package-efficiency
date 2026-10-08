require 'ripper'

def params_of(params)
  params = params[1] if params[0] == :paren
  names = []
  params[1]&.each { |p| names << p[1] }
  params[2]&.each { |p| names << p[0][1] }
  names << params[3][1][1] if params[3].is_a?(Array) && params[3][1]
  params[4]&.each { |p| names << p[1] }
  params[5]&.each { |p| names << p[0][1].chomp(':') }
  names << params[6][1][1] if params[6].is_a?(Array) && params[6][1]
  names << params[7][1][1] if params[7]
  names
end

def walk(node, path, out)
  case node[0]
  when :module, :class
    name = node[1][1][1]
    inner = path + [name]
    out << [node[0].to_s, inner, node[1][1][2][0], []]
    node[2..].each { |child| walk(child, inner, out) if child.is_a?(Array) }
  when :def
    out << ['def', path + [node[1][1]], node[1][2][0], params_of(node[2])]
    walk(node[3], path, out)
  when :defs
    out << ['sdef', path + [node[3][1]], node[3][2][0], params_of(node[4])]
    walk(node[5], path, out)
  else
    node.each { |child| walk(child, path, out) if child.is_a?(Array) }
  end
end

def operation(source)
  out = []
  walk(Ripper.sexp(source), [], out)
  out
end
