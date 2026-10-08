require 'parser/current'

def params_of(args)
  args.children.map { |arg| arg.children[0].to_s }
end

def walk(node, path, out)
  case node.type
  when :module, :class
    name = node.children[0].children[1].to_s
    inner = path + [name]
    out << [node.type.to_s, inner, node.loc.name.line, []]
    node.children[1..].each { |child| walk(child, inner, out) if child.is_a?(Parser::AST::Node) }
  when :def
    out << ['def', path + [node.children[0].to_s], node.loc.name.line, params_of(node.children[1])]
    walk(node.children[2], path, out) if node.children[2]
  when :defs
    out << ['sdef', path + [node.children[1].to_s], node.loc.name.line, params_of(node.children[2])]
    walk(node.children[3], path, out) if node.children[3]
  else
    node.children.each { |child| walk(child, path, out) if child.is_a?(Parser::AST::Node) }
  end
end

def operation(source)
  out = []
  tree = Parser::CurrentRuby.parse(source)
  walk(tree, [], out) if tree
  out
end
