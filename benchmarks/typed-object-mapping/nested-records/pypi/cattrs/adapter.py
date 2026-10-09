from typing import List, Optional

from attrs import define
import cattrs


@define
class Customer:
    name: str
    age: int
    score: float
    active: bool
    nickname: Optional[str]


@define
class Line:
    sku: str
    qty: int
    price: float
    gift: bool
    comment: Optional[str]


@define
class Order:
    id: int
    ref: str
    total: float
    paid: bool
    note: Optional[str]
    tags: List[str]
    customer: Customer
    lines: List[Line]


converter = cattrs.Converter()
# Build and cache the structure/unstructure hooks once, as the library does on first use.
converter.structure({'id': 0, 'ref': '', 'total': 0.0, 'paid': False, 'note': None, 'tags': [],
                     'customer': {'name': '', 'age': 0, 'score': 0.0, 'active': False, 'nickname': None},
                     'lines': []}, Order)
converter.unstructure(Order(0, '', 0.0, False, None, [], Customer('', 0, 0.0, False, None), []))


def operation(value):
    record = converter.structure(value, Order)
    return (record, converter.unstructure(record))


def describe(result):
    record, plain = result
    return {
        'classes': [type(record).__name__, type(record.customer).__name__, type(record.lines[0]).__name__],
        'customer': record.customer.name,
        'lines': len(record.lines),
        'first': record.lines[0].sku,
        'plain': plain,
    }
