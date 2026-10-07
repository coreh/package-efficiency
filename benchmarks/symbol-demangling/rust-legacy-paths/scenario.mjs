import { strict as assert } from 'node:assert'
// Deterministic pseudo-random generator (LCG), no Math.random.
let seed = 12345
const next = (n) => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return (seed >>> 8) % n }
const pick = (list) => list[next(list.length)]
// Everything below is written the way a demangler prints it; `mangle` turns it into the symbol.
const modules = [
  ['core', 'ptr'], ['core', 'slice', 'sort', 'stable'], ['alloc', 'raw_vec'], ['alloc', 'collections', 'btree', 'node'],
  ['std', 'sys', 'thread_local', 'native', 'lazy'], ['std', 'io', 'buffered', 'bufwriter'],
  ['tokio', 'runtime', 'scheduler', 'multi_thread', 'worker'], ['hyper', 'proto', 'h1', 'conn'], ['serde_json', 'de'],
  ['regex_automata', 'meta', 'strategy'], ['hashbrown', 'raw'], ['my_application', 'handlers', 'users', 'registry'],
]
const types = [
  'u8', 'usize', '&str', '&mut T', '*const u8', '[u8; 32]', '&[T]', "&'a mut [u8]", '()', '(usize, alloc::string::String)',
  'alloc::string::String', 'alloc::vec::Vec<u8>', 'alloc::vec::Vec<T,A>', 'core::option::Option<usize>',
  'core::result::Result<alloc::string::String, std::io::error::Error>', 'alloc::sync::Arc<tokio::sync::mutex::Mutex<T>>',
  'std::collections::hash::map::HashMap<alloc::string::String, alloc::vec::Vec<u32>>',
  'alloc::boxed::Box<dyn core::error::Error + core::marker::Send + core::marker::Sync>',
  'core::iter::adapters::map::Map<core::slice::iter::Iter<u8>, F>', 'my_application::handlers::users::UserRecord',
]
const traits = [
  ['core::fmt::Debug', 'fmt'], ['core::fmt::Display', 'fmt'], ['core::clone::Clone', 'clone'], ['core::ops::drop::Drop', 'drop'],
  ['core::iter::traits::iterator::Iterator', 'next'], ['core::hash::Hash', 'hash'], ['serde::ser::Serialize', 'serialize'],
  ['core::convert::From<std::io::error::Error>', 'from'], ['core::future::future::Future', 'poll'],
  ['core::cmp::PartialEq<&str>', 'eq'],
]
const generics = ['Vec<T,A>', 'RawVec<T,A>', 'HashMap<K,V,S>', 'Option<T>', 'Result<T,E>', 'Cell<T>', 'RawTable<T,A>', 'Handle<NodeRef<BorrowType,K,V,NodeType>,HandleType>']
const names = ['Formatter', 'Parser', 'Deserializer', 'Context', 'Registry', 'Conn', 'Worker', 'BufWriter']
const methods = ['new', 'push', 'insert', 'reserve_for_push', 'grow_amortized', 'write_str', 'parse_value', 'poll_read', 'run', 'drop_slow', 'from_utf8', 'with_capacity']
const shapes = [
  // crate::module::Type::method
  () => [...pick(modules), pick(names), pick(methods)],
  // <Type as Trait>::method
  () => { const [trait, method] = pick(traits); return [`<${pick(types)} as ${trait}>`, method] },
  // crate::module::function::{{closure}}, sometimes nested
  () => [...pick(modules), pick(methods), '{{closure}}', ...(next(3) === 0 ? ['{{closure}}'] : [])],
  // core::ptr::drop_in_place<Type>
  () => ['core', 'ptr', `drop_in_place<${pick(types)}>`],
  // crate::module::Type<T>::method
  () => [...pick(modules), pick(generics), pick(methods)],
  // crate::module::<impl Trait for Type>::method
  () => { const [trait, method] = pick(traits); return [...pick(modules), `<impl ${trait} for ${pick(types)}>`, method] },
  // <Type as Trait>::method::{{closure}}
  () => { const [trait, method] = pick(traits); return [`<${pick(types)} as ${trait}>`, method, '{{closure}}'] },
  // generic function instance and the FnOnce vtable shim
  () => next(2) === 0
    ? ['core', 'ops', 'function', 'FnOnce', 'call_once{{vtable.shim}}']
    : [...pick(modules), `${pick(methods)}<${pick(types)}>`],
]
// rustc's legacy mangling of one path segment: `::` becomes `..`, eight characters have named escapes,
// other punctuation becomes $u<hex>$, and a segment that would start with `$` gets a leading underscore.
const named = { '@': '$SP$', '*': '$BP$', '&': '$RF$', '<': '$LT$', '>': '$GT$', '(': '$LP$', ')': '$RP$', ',': '$C$' }
const mangleSegment = (text) => {
  let out = ''
  for (const c of text.replaceAll('::', '..')) out += /[A-Za-z0-9_.]/.test(c) ? c : named[c] ?? `$u${c.charCodeAt(0).toString(16)}$`
  return (out[0] === '$' ? '_' : '') + out
}
const hex = '0123456789abcdef'
const cases = []
for (let i = 0; i < 64; i++) {
  const segs = shapes[i % shapes.length]()
  let hash = ''
  for (let k = 0; k < 16; k++) hash += hex[next(16)]
  const input = '_ZN' + segs.map(mangleSegment).map((s) => s.length + s).join('') + '17h' + hash + 'E'
  // rustc writes `-` and a lone `:` as `.`, which cannot be undone, so the fixtures contain neither.
  assert.ok(segs.every((s) => !/-|(^|[^:]):([^:]|$)|^[0-9]/.test(s)), `fixture ${i}: segment cannot be mangled reversibly`)
  assert.ok(/^[\x21-\x7e]+$/.test(input), `fixture ${i}: a symbol is printable ASCII`)
  cases.push({ input, expected: segs.join('::') + '::h' + hash })
}
assert.equal(new Set(cases.map(({ input }) => input)).size, cases.length, 'fixtures must be distinct')
export { cases }
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.notEqual(outputs[i], input, `fixture ${i}: input returned unchanged`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
