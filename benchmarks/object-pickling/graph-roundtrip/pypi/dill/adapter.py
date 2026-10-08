import dill
import sys, types

# The model classes live in an importable module, as application classes do:
# the adapter module itself is not importable by name under the harness.
class Graph:
    pass

class Group:
    pass

class Node:
    pass

_model = types.ModuleType('graph_model')
for _c in (Graph, Group, Node):
    _c.__module__ = 'graph_model'
    setattr(_model, _c.__name__, _c)
sys.modules['graph_model'] = _model

_originals = []

def make(spec):
    obj = spec[0]()
    obj.__dict__.update(spec[1])
    return obj

# Not timed: builds the live graph from the fixture, once per fixture.
def prepare(spec):
    tag_sets = [list(t) for t in spec['tagSets']]
    groups = [make((Group, dict(name=g['name'], level=g['level'], lead=None))) for g in spec['groups']]
    nodes = [make((Node, dict(id=n['id'], name=n['name'], score=n['score'], pos=tuple(n['pos']), tags=tag_sets[n['tags']], group=groups[n['group']], parent=None, children=[], me=None))) for n in spec['nodes']]
    for n, s in zip(nodes, spec['nodes']):
        if s['parent'] >= 0:
            n.parent = nodes[s['parent']]
            n.parent.children.append(n)
        if s['selfRef']:
            n.me = n
    for g, s in zip(groups, spec['groups']):
        g.lead = nodes[s['lead']]
    graph = make((Graph, dict(nodes=nodes, groups=groups, tag_sets=tag_sets)))
    _originals.append(graph)
    return graph

def operation(graph):
    return dill.loads(dill.dumps(graph))

# Not timed: walks the restored graph for values and for identity.
def describe(result):
    def index(items):
        return {id(x): i for i, x in enumerate(items)}
    ni, gi, ti = index(result.nodes), index(result.groups), index(result.tag_sets)
    same = any(result is o or result.nodes[0] is o.nodes[0] for o in _originals)
    return {
        'sameAsInput': same,
        'distinctNodes': len(ni) == len(result.nodes),
        'distinctGroups': len(gi) == len(result.groups),
        'distinctTagSets': len(ti) == len(result.tag_sets),
        'nodes': [{
            'cls': type(n).__name__, 'id': n.id, 'name': n.name, 'score': n.score,
            'pos': list(n.pos), 'posType': type(n.pos).__name__,
            'tags': ti.get(id(n.tags), -1), 'group': gi.get(id(n.group), -1),
            'parent': -1 if n.parent is None else ni.get(id(n.parent), -2),
            'children': [ni.get(id(c), -2) for c in n.children],
            'selfRef': n.me is n,
        } for n in result.nodes],
        'groups': [{'cls': type(g).__name__, 'name': g.name, 'level': g.level, 'lead': ni.get(id(g.lead), -1)} for g in result.groups],
        'tagSets': [list(t) for t in result.tag_sets],
    }
