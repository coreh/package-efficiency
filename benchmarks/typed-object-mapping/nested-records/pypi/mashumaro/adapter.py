from dataclasses import dataclass
from typing import List, Optional

from mashumaro import DataClassDictMixin


@dataclass
class Customer(DataClassDictMixin):
    name: str
    age: int
    score: float
    active: bool
    nickname: Optional[str]


@dataclass
class Line(DataClassDictMixin):
    sku: str
    qty: int
    price: float
    gift: bool
    comment: Optional[str]


@dataclass
class Order(DataClassDictMixin):
    id: int
    ref: str
    total: float
    paid: bool
    note: Optional[str]
    tags: List[str]
    customer: Customer
    lines: List[Line]


def operation(value):
    record = Order.from_dict(value)
    return (record, record.to_dict())


def describe(result):
    record, plain = result
    return {
        'classes': [type(record).__name__, type(record.customer).__name__, type(record.lines[0]).__name__],
        'customer': record.customer.name,
        'lines': len(record.lines),
        'first': record.lines[0].sku,
        'plain': plain,
    }
