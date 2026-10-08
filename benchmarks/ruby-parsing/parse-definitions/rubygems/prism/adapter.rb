require 'prism'

class Definitions < Prism::Visitor
  def out
    @out ||= []
  end

  def path
    @path ||= []
  end

  def visit_module_node(node)
    nested('module', node)
  end

  def visit_class_node(node)
    nested('class', node)
  end

  def visit_def_node(node)
    kind = node.receiver ? 'sdef' : 'def'
    out << [kind, path + [node.name.to_s], node.name_loc.start_line, params_of(node.parameters)]
    super
  end

  private

  def nested(kind, node)
    path.push(node.name.to_s)
    out << [kind, path.dup, node.constant_path.location.start_line, []]
    super_visit(node)
    path.pop
  end

  def super_visit(node)
    visit_child_nodes(node)
  end

  def params_of(params)
    return [] unless params
    names = []
    params.requireds.each { |p| names << p.name.to_s }
    params.optionals.each { |p| names << p.name.to_s }
    names << params.rest.name.to_s if params.rest&.name
    params.posts.each { |p| names << p.name.to_s }
    params.keywords.each { |p| names << p.name.to_s }
    names << params.keyword_rest.name.to_s if params.keyword_rest.respond_to?(:name) && params.keyword_rest.name
    names << params.block.name.to_s if params.block&.name
    names
  end
end

def operation(source)
  visitor = Definitions.new
  Prism.parse(source).value.accept(visitor)
  visitor.out
end
