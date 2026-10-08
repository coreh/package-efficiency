from dataclasses import dataclass
from typing import List, Optional

from marshmallow import Schema, fields, post_load


@dataclass
class Customer:
    name: str
    age: int
    score: float
    active: bool
    nickname: Optional[str]


@dataclass
class Line:
    sku: str
    qty: int
    price: float
    gift: bool
    comment: Optional[str]


@dataclass
class Order:
    id: int
    ref: str
    total: float
    paid: bool
    note: Optional[str]
    tags: List[str]
    customer: Customer
    lines: List[Line]


class CustomerSchema(Schema):
    name = fields.Str(required=True)
    age = fields.Int(required=True)
    score = fields.Float(required=True)
    active = fields.Bool(required=True)
    nickname = fields.Str(required=True, allow_none=True)

    @post_load
    def make(self, data, **kwargs):
        return Customer(**data)


class LineSchema(Schema):
    sku = fields.Str(required=True)
    qty = fields.Int(required=True)
    price = fields.Float(required=True)
    gift = fields.Bool(required=True)
    comment = fields.Str(required=True, allow_none=True)

    @post_load
    def make(self, data, **kwargs):
        return Line(**data)


class OrderSchema(Schema):
    id = fields.Int(required=True)
    ref = fields.Str(required=True)
    total = fields.Float(required=True)
    paid = fields.Bool(required=True)
    note = fields.Str(required=True, allow_none=True)
    tags = fields.List(fields.Str(), required=True)
    customer = fields.Nested(CustomerSchema, required=True)
    lines = fields.List(fields.Nested(LineSchema), required=True)

    @post_load
    def make(self, data, **kwargs):
        return Order(**data)


schema = OrderSchema()


def operation(value):
    record = schema.load(value)
    return (record, schema.dump(record))


def describe(result):
    record, plain = result
    return {
        'classes': [type(record).__name__, type(record.customer).__name__, type(record.lines[0]).__name__],
        'customer': record.customer.name,
        'lines': len(record.lines),
        'first': record.lines[0].sku,
        'plain': plain,
    }
