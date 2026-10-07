use petgraph::algo::toposort;
use petgraph::graph::{DiGraph, NodeIndex};
use serde_json::json;
use std::collections::HashMap;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value_with_input(
        // The graph is built from the names inside the call, as in the other
        // entries: a node per name, and each edge looked up by name.
        |input| -> Result<Vec<NodeIndex>, String> {
            let nodes = input["nodes"].as_array().ok_or("nodes")?;
            let edges = input["edges"].as_array().ok_or("edges")?;
            let mut graph = DiGraph::<&str, ()>::with_capacity(nodes.len(), edges.len());
            let mut index = HashMap::with_capacity(nodes.len());
            for node in nodes {
                let name = node.as_str().ok_or("node name")?;
                index.insert(name, graph.add_node(name));
            }
            for edge in edges {
                let before = index[edge[0].as_str().ok_or("edge")?];
                let after = index[edge[1].as_str().ok_or("edge")?];
                graph.add_edge(before, after, ());
            }
            toposort(&graph, None).map_err(|_| "cycle".to_string())
        },
        |order| order.len() as u32,
        // Verifier only (not timed): the order holds node indexes, which are
        // positions in the fixture's node list; they are turned back into names here.
        |input, order| json!(order.iter().map(|ix| input["nodes"][ix.index()].clone()).collect::<Vec<_>>()),
    );
}
