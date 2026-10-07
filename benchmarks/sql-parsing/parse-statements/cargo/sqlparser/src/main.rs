use serde_json::{Value as Json, json};
use sqlparser::ast::{
    AssignmentTarget, BinaryOperator, Expr, FromTable, ObjectName, SetExpr, Statement, TableFactor, TableObject, TableWithJoins, Value,
};
use sqlparser::dialect::GenericDialect;
use sqlparser::parser::Parser;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The common result. Building it from the crate's syntax tree is part of the
// measured call, as it is for every entry; turning it into JSON is not.
enum Node { Op(&'static str, Box<Node>, Box<Node>), Col(Option<String>, String), Num(i64), Str(String) }
struct Parsed { kind: &'static str, tables: Vec<String>, columns: Vec<String>, items: usize, condition: Option<Node> }

fn last(name: &ObjectName) -> Result<String, String> {
    name.0.last().and_then(|part| part.as_ident()).map(|ident| ident.value.clone()).ok_or_else(|| "unnamed object".to_string())
}
fn table(factor: &TableFactor) -> Result<String, String> {
    match factor { TableFactor::Table { name, .. } => last(name), other => Err(format!("unexpected table factor: {other}")) }
}
fn tables(from: &[TableWithJoins]) -> Result<Vec<String>, String> {
    let mut out = Vec::new();
    for item in from {
        out.push(table(&item.relation)?);
        for join in &item.joins { out.push(table(&join.relation)?) }
    }
    Ok(out)
}
fn node(expr: &Expr) -> Result<Node, String> {
    Ok(match expr {
        Expr::Nested(inner) => node(inner)?,
        Expr::BinaryOp { left, op, right } => {
            let name = match op {
                BinaryOperator::And => "and", BinaryOperator::Or => "or", BinaryOperator::Eq => "=", BinaryOperator::NotEq => "<>",
                BinaryOperator::Lt => "<", BinaryOperator::Gt => ">", BinaryOperator::LtEq => "<=", BinaryOperator::GtEq => ">=",
                other => return Err(format!("unexpected operator: {other}")),
            };
            Node::Op(name, Box::new(node(left)?), Box::new(node(right)?))
        }
        Expr::Like { negated: false, expr, pattern, .. } => Node::Op("like", Box::new(node(expr)?), Box::new(node(pattern)?)),
        Expr::Identifier(ident) => Node::Col(None, ident.value.clone()),
        Expr::CompoundIdentifier(parts) if parts.len() == 2 => Node::Col(Some(parts[0].value.clone()), parts[1].value.clone()),
        Expr::Value(value) => match &value.value {
            Value::Number(text, _) => Node::Num(text.parse().map_err(|_| format!("not an integer: {text}"))?),
            Value::SingleQuotedString(text) => Node::Str(text.clone()),
            other => return Err(format!("unexpected literal: {other}")),
        },
        other => return Err(format!("unexpected expression: {other}")),
    })
}
fn condition(selection: &Option<Expr>) -> Result<Option<Node>, String> { selection.as_ref().map(node).transpose() }

fn parse(sql: &str) -> Result<Parsed, String> {
    let statements = Parser::parse_sql(&GenericDialect {}, sql).map_err(|e| e.to_string())?;
    Ok(match statements.first().ok_or("no statement")? {
        Statement::Query(query) => match query.body.as_ref() {
            SetExpr::Select(select) => Parsed { kind: "select", tables: tables(&select.from)?, columns: Vec::new(), items: select.projection.len(), condition: condition(&select.selection)? },
            other => return Err(format!("unexpected query body: {other}")),
        },
        Statement::Insert(insert) => {
            let TableObject::TableName(name) = &insert.table else { return Err("unexpected insert target".to_string()) };
            let rows = match insert.source.as_ref().map(|query| query.body.as_ref()) { Some(SetExpr::Values(values)) => values.rows.len(), _ => return Err("VALUES expected".to_string()) };
            Parsed { kind: "insert", tables: vec![last(name)?], columns: insert.columns.iter().map(last).collect::<Result<_, _>>()?, items: rows, condition: None }
        }
        Statement::Update(update) => {
            let columns = update.assignments.iter().map(|a| match &a.target { AssignmentTarget::ColumnName(name) => last(name), _ => Err("tuple assignment".to_string()) }).collect::<Result<_, _>>()?;
            Parsed { kind: "update", tables: tables(std::slice::from_ref(&update.table))?, columns, items: 0, condition: condition(&update.selection)? }
        }
        Statement::Delete(delete) => {
            let (FromTable::WithFromKeyword(from) | FromTable::WithoutKeyword(from)) = &delete.from;
            Parsed { kind: "delete", tables: tables(from)?, columns: Vec::new(), items: 0, condition: condition(&delete.selection)? }
        }
        Statement::CreateTable(create) => Parsed { kind: "create_table", tables: vec![last(&create.name)?], columns: create.columns.iter().map(|c| c.name.value.clone()).collect(), items: 0, condition: None },
        other => return Err(format!("unexpected statement: {other}")),
    })
}

fn describe_node(node: &Node) -> Json {
    match node {
        Node::Op(op, left, right) => json!([op, describe_node(left), describe_node(right)]),
        Node::Col(table, column) => json!(["col", table, column]),
        Node::Num(n) => json!(["num", n]),
        Node::Str(s) => json!(["str", s]),
    }
}

fn main() {
    bench_harness::operation::run_value(
        |input| parse(input.as_str().ok_or("string fixture")?),
        |p: &Parsed| (p.tables.len() + p.columns.len() + p.items) as u32,
        |p| json!({"kind": p.kind, "tables": p.tables, "columns": p.columns, "items": p.items, "where": p.condition.as_ref().map(describe_node)}),
    );
}
