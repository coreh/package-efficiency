use lib_ruby_parser::nodes::{Class, Def, Defs, Module};
use lib_ruby_parser::traverse::visitor::Visitor;
use lib_ruby_parser::{Node, Parser, ParserOptions};
use serde_json::{Value as Json, json};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The common result: one entry per definition. Building it from the crate's
// tree is part of the measured call; turning it into JSON is not.
struct Definition { kind: &'static str, path: Vec<String>, line: usize, params: Vec<String> }

struct Collector<'a> { input: &'a lib_ruby_parser::source::DecodedInput, path: Vec<String>, out: Vec<Definition> }

fn const_name(node: &Node) -> String {
    match node { Node::Const(c) => c.name.clone(), _ => String::new() }
}
fn params_of(args: &Option<Box<Node>>) -> Vec<String> {
    let Some(node) = args else { return Vec::new() };
    let Node::Args(args) = node.as_ref() else { return Vec::new() };
    args.args
        .iter()
        .filter_map(|arg| match arg {
            Node::Arg(a) => Some(a.name.clone()),
            Node::Optarg(a) => Some(a.name.clone()),
            Node::Restarg(a) => a.name.clone(),
            Node::Kwarg(a) => Some(a.name.clone()),
            Node::Kwoptarg(a) => Some(a.name.clone()),
            Node::Kwrestarg(a) => a.name.clone(),
            Node::Blockarg(a) => a.name.clone(),
            _ => None,
        })
        .collect()
}

impl Collector<'_> {
    fn line(&self, pos: usize) -> usize { self.input.line_col_for_pos(pos).map(|(line, _)| line + 1).unwrap_or(0) }
    fn nested(&mut self, kind: &'static str, name: &Node, body: Option<&Node>) {
        let Node::Const(c) = name else { return };
        self.path.push(const_name(name));
        self.out.push(Definition { kind, path: self.path.clone(), line: self.line(c.name_l.begin), params: Vec::new() });
        if let Some(body) = body { self.visit(body) }
        self.path.pop();
    }
}

impl Visitor for Collector<'_> {
    fn on_module(&mut self, node: &Module) { self.nested("module", &node.name, node.body.as_deref()) }
    fn on_class(&mut self, node: &Class) { self.nested("class", &node.name, node.body.as_deref()) }
    fn on_def(&mut self, node: &Def) {
        let mut path = self.path.clone();
        path.push(node.name.clone());
        self.out.push(Definition { kind: "def", path, line: self.line(node.name_l.begin), params: params_of(&node.args) });
        if let Some(body) = &node.body { self.visit(body) }
    }
    fn on_defs(&mut self, node: &Defs) {
        let mut path = self.path.clone();
        path.push(node.name.clone());
        self.out.push(Definition { kind: "sdef", path, line: self.line(node.name_l.begin), params: params_of(&node.args) });
        if let Some(body) = &node.body { self.visit(body) }
    }
}

fn parse(source: &str) -> Result<Vec<Definition>, String> {
    let result = Parser::new(source.as_bytes().to_vec(), ParserOptions::default()).do_parse();
    let mut collector = Collector { input: &result.input, path: Vec::new(), out: Vec::new() };
    if let Some(ast) = &result.ast { collector.visit(ast) }
    Ok(collector.out)
}

fn main() {
    bench_harness::operation::run_value(
        |input| parse(input.as_str().ok_or("string fixture")?),
        |d: &Vec<Definition>| d.len() as u32,
        |d| Json::Array(d.iter().map(|x| json!([x.kind, x.path, x.line, x.params])).collect()),
    );
}
