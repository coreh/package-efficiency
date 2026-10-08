require 'ruby_parser'

def params_of(args)
  args.drop(1).map do |arg|
    name = arg.is_a?(Array) ? arg[1] : arg
    name.to_s.delete_prefix('**').delete_prefix('*').delete_prefix('&')
  end
end

def walk(node, path, out)
  case node[0]
  when :module, :class
    name = node[1].to_s
    inner = path + [name]
    out << [node[0].to_s, inner, node.line, []]
    node.drop(2).each { |child| walk(child, inner, out) if child.is_a?(Array) }
  when :defn
    out << ['def', path + [node[1].to_s], node.line, params_of(node[2])]
    node.drop(3).each { |child| walk(child, path, out) if child.is_a?(Array) }
  when :defs
    out << ['sdef', path + [node[2].to_s], node.line, params_of(node[3])]
    node.drop(4).each { |child| walk(child, path, out) if child.is_a?(Array) }
  else
    node.each { |child| walk(child, path, out) if child.is_a?(Array) }
  end
end

def operation(source)
  out = []
  walk(RubyParser.new.parse(source), [], out)
  out
end
