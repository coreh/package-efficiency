import { strict as assert } from 'node:assert'
// Ruby source files are written line by line together with what a parser must
// find in them. The common result is a list, one entry per definition, in
// source order (a class or module before the methods inside it):
//   [kind, path, line, params]
// kind:   'class' | 'module' | 'def' | 'sdef' (a method defined as `def self.name`)
// path:   names of the enclosing modules and classes, then the name itself
// line:   the line (from 1) on which the definition's name is written
// params: the parameter names of a method in the order written, without * ** & or :
const verbs = ['fetch', 'build', 'render', 'load', 'merge', 'scan', 'emit', 'check']
const nouns = ['user', 'order', 'item', 'page', 'node', 'entry', 'token', 'record']
const modNames = ['Billing', 'Catalog', 'Network', 'Storage', 'Reports', 'Parsing', 'Scheduling', 'Accounts']
const classNames = ['Account', 'Invoice', 'Importer', 'Registry', 'Renderer', 'Planner', 'Session', 'Tracker', 'Worker']
const baseNames = ['Base', 'Struct', 'StandardError', 'Object']
// [source text, name]
const paramSets = [
  [],
  [['x', 'x']],
  [['id', 'id'], ['opts = {}', 'opts']],
  [['first', 'first'], ['*rest', 'rest']],
  [['name', 'name'], ['count = 1', 'count'], ['*items', 'items'], ['&block', 'block']],
  [['key:', 'key'], ['value: nil', 'value']],
  [['a', 'a'], ['b', 'b'], ['c: 3', 'c'], ['**extra', 'extra']],
  [['head', 'head'], ['*mid', 'mid'], ['tail', 'tail']],
]
// Bodies: plain syntax that is parsed and never compared, and traps: text that
// looks like a definition inside a string, a comment, a heredoc, a regular
// expression or a symbol. Each is a list of lines.
const bodies = [
  ['@count = (@count || 0) + 1', '"#{self.class.name}: #{@count}"'],
  ['rows = [1, 2, 3].map { |v| v * 2 }', 'rows.each_with_index do |row, idx|', '  @seen[idx] = row if row > 2', 'end', 'rows'],
  ['text = <<~TEXT', '  def fake_in_heredoc(a, b)', '    class NotAClass', '  end', '  total: #{@count}', 'TEXT', 'text.lines.size'],
  ['# def commented_out(a)', 'label = "def inside_string(x)"', 'label.upcase'],
  ['case @state', 'when :open then "class Open"', 'when :closed, :done', '  :module', 'else', '  nil', 'end'],
  ['begin', '  Integer(@raw)', 'rescue ArgumentError => e', '  warn("bad value: #{e.message}")', '  0', 'ensure', '  @raw = nil', 'end'],
  ['pattern = /def\\s+(\\w+)\\s*\\(/', 'scale = ->(a, b) { a * b }', 'scale.call(2, 3) + (@raw.to_s =~ pattern).to_i'],
  ['config = { name: "x", sizes: %w[small large], nested: { deep: [1, 2, { a: 1 }] } }', 'config[:nested][:deep].last&.fetch(:a, 0)'],
  ['sym = :def', 'other = %i[class module]', '[sym, *other].map(&:to_s).join(",")'],
  ['total = 0', 'index = 0', 'while index < 10', '  total += index unless index.odd?', '  index += 1', 'end', 'total'],
  ['value = @items.select { |item| item.respond_to?(:call) }.sum { |item| item.call.to_i }', 'value > 100 ? "big" : "small"'],
  ['case [@count, @raw]', 'in [Integer => n, String => s] if n > 0', '  "#{n}:#{s}"', 'in [Integer, nil]', '  "none"', 'else', '  "other"', 'end'],
]
const operators = ['==', '<=>', '+', '[]']

const fixture = (n) => {
  const lines = []
  const defs = []
  const path = []
  const put = (text, depth = 0) => {
    for (const line of text.split('\n')) lines.push(line === '' ? '' : '  '.repeat(depth) + line)
  }
  const record = (kind, name, params) => defs.push([kind, [...path, name], lines.length + 1, params.map((p) => p[1])])
  const sig = (name, params, k) => {
    const list = params.map((p) => p[0]).join(', ')
    return params.length === 0 ? (k % 2 ? `${name}()` : name) : `${name}(${list})`
  }
  const method = (depth, k) => {
    const verb = verbs[(n + k) % verbs.length]
    const noun = nouns[(n * 3 + k * 5) % nouns.length]
    const base = `${verb}_${noun}_${k}`
    const body = bodies[(n * 5 + k * 7) % bodies.length]
    const style = (n + k) % 8
    if (style === 1) {
      record('def', `${base}?`, [])
      put(`def ${base}?`, depth)
      put('!@items.empty?', depth + 1)
      put('end', depth)
    } else if (style === 2) {
      const params = paramSets[(n + k) % paramSets.length]
      record('sdef', base, params)
      put(`def self.${sig(base, params, k)}`, depth)
      put(body.join('\n'), depth + 1)
      put('end', depth)
    } else if (style === 3) {
      record('def', `${base}=`, [['value', 'value']])
      put(`def ${base}=(value)`, depth)
      put('@raw = value', depth + 1)
      put('end', depth)
    } else if (style === 4) {
      const op = operators[(n + k) % operators.length]
      record('def', op, [['other', 'other']])
      put(`def ${op}(other)`, depth)
      put('other.respond_to?(:count) && other.count == @count', depth + 1)
      put('end', depth)
    } else if (style === 5) {
      record('def', base, [['x', 'x']])
      put(`def ${base}(x) = x * ${k + 2}`, depth)
    } else if (style === 6) {
      const params = paramSets[(n + k) % paramSets.length]
      put('private', depth)
      record('def', base, params)
      put(`def ${sig(base, params, k)}`, depth)
      put(body.join('\n'), depth + 1)
      put('end', depth)
    } else {
      const params = paramSets[(n + 2 * k) % paramSets.length]
      record('def', base, params)
      put(`def ${sig(base, params, k)}`, depth)
      put(body.join('\n'), depth + 1)
      put('end', depth)
    }
    put('', 0)
  }
  const klass = (depth, k) => {
    const name = `${classNames[(n + k) % classNames.length]}${k ? k : ''}`
    const base = baseNames[(n + k) % baseNames.length]
    record('class', name, [])
    put(`class ${name}${(n + k) % 3 === 0 ? '' : ` < ${base}`}`, depth)
    path.push(name)
    put('attr_reader :items, :count', depth + 1)
    put('', 0)
    const methods = 5 + ((n + k) % 4)
    for (let m = 0; m < methods; m++) method(depth + 1, m + k)
    path.pop()
    put('end', depth)
    put('', 0)
  }
  put('# frozen_string_literal: true\n# Generated fixture ' + n + '\n# def not_a_definition(a, b)\n\nrequire "json"\n\nCONSTANT_' + n + ' = %w[a b c].freeze\n')
  if (n % 4 === 1) put('=begin\ndef inside_block_comment(a)\nclass Hidden\n=end\n')
  const modules = 1 + (n % 3)
  for (let mod = 0; mod < modules; mod++) {
    const name = `${modNames[(n + mod) % modNames.length]}${mod ? mod : ''}`
    record('module', name, [])
    put(`module ${name}`)
    path.push(name)
    if (mod % 2 === 1) {
      const inner = `Inner${n}`
      record('module', inner, [])
      put(`module ${inner}`, 1)
      path.push(inner)
      klass(2, mod)
      path.pop()
      put('end', 1)
      put('', 0)
    }
    klass(1, mod + 1)
    klass(1, mod + 2)
    path.pop()
    put('end', 0)
    put('', 0)
  }
  const helper = paramSets[n % paramSets.length]
  record('def', `helper_${n}`, helper)
  put(`def helper_${n}${helper.length ? `(${helper.map((p) => p[0]).join(', ')})` : ''}`)
  put('  puts "done"\nend\n')
  record('class', `Top${n}`, [])
  put(`class Top${n}`)
  path.push(`Top${n}`)
  method(1, 0)
  method(1, 3)
  path.pop()
  put('end\n')
  if (n % 5 === 0) put('__END__\ndef after_end(a)\nclass AfterEnd')
  return { input: lines.join('\n') + '\n', expected: defs }
}
export const cases = Array.from({ length: 24 }, (_, i) => fixture(i))

const naive = (source) => [...source.matchAll(/^\s*(?:private\s+)?(def|class|module)\s+/gm)].length

export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  if (typeof output === 'string') output = JSON.parse(output)
  assert.ok(Array.isArray(output), `fixture ${i}: a list is required`)
  const got = output.map((d) => [d[0], [...d[1]], d[2], [...d[3]]])
  assert.equal(got.length, expected.length, `fixture ${i}: ${expected.length} definitions expected, ${got.length} found`)
  for (const [k, entry] of expected.entries()) assert.deepEqual(got[k], entry, `fixture ${i}, definition ${k}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// Proof that the check can fail: a scan of the text for `def`, `class` and
// `module` is fooled by the lookalikes in strings, comments and heredocs.
assert.ok(cases.some(({ input, expected }) => naive(input) !== expected.length), 'a text scan must not pass')
