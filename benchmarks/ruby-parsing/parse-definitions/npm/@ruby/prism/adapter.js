import { loadPrism, Visitor } from '@ruby/prism'

const parse = await loadPrism()

// Collects the common shape. Nodes are visited in source order, so the line of
// a definition is found by counting newlines forward from the previous one.
class Definitions extends Visitor {
  constructor(source) {
    super()
    this.source = source
    this.out = []
    this.path = []
    this.at = 0
    this.line = 1
  }
  lineAt(offset) {
    for (let i = this.source.indexOf('\n', this.at); i !== -1 && i < offset; i = this.source.indexOf('\n', this.at)) {
      this.line++
      this.at = i + 1
    }
    return this.line
  }
  nested(kind, node) {
    this.path.push(node.name)
    this.out.push([kind, [...this.path], this.lineAt(node.constantPath.location.startOffset), []])
    this.visitChildNodes(node)
    this.path.pop()
  }
  visitModuleNode(node) { this.nested('module', node) }
  visitClassNode(node) { this.nested('class', node) }
  visitDefNode(node) {
    const p = node.parameters
    const params = []
    if (p) {
      for (const r of p.requireds) params.push(r.name)
      for (const o of p.optionals) params.push(o.name)
      if (p.rest?.name) params.push(p.rest.name)
      for (const r of p.posts) params.push(r.name)
      for (const k of p.keywords) params.push(k.name)
      if (p.keywordRest?.name) params.push(p.keywordRest.name)
      if (p.block?.name) params.push(p.block.name)
    }
    this.out.push([node.receiver ? 'sdef' : 'def', [...this.path, node.name], this.lineAt(node.nameLoc.startOffset), params])
    this.visitChildNodes(node)
  }
}

export const operation = (source) => {
  const visitor = new Definitions(source)
  parse(source).value.accept(visitor)
  return visitor.out
}
