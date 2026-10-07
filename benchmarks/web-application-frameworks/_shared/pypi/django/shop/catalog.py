"""The shop's data. There is no database: an item is computed from its id."""

TAGS = ["alpha", "beta", "gamma", "delta"]


def price_cents(id):
    return 199 + (id * 37) % 5000


def get_item(id):
    return {
        "id": id,
        "name": f"Item {id}",
        "priceCents": price_cents(id),
        "inStock": id % 3 != 0,
        "discountPercent": 15 if id % 5 == 0 else 0,
        "note": f"Fish & Chips <{id}> \"quoted\" it's",
        "tags": TAGS[: id % 4 + 1],
        "related": [
            {"id": other, "name": f"Item {other}", "priceCents": price_cents(other)}
            for other in range(id + 1, id + 13)
        ],
    }
