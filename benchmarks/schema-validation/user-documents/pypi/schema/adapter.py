from schema import And, Optional, Or, Schema

NUMBER = Or(int, float)

user = Schema(
    {
        "id": And(int, lambda n: n >= 1),
        "name": And(str, len),
        "email": str,
        "role": Or("admin", "editor", "viewer"),
        "active": bool,
        "tags": [str],
        "scores": [NUMBER],
        Optional("nickname"): str,
        "address": {
            "city": And(str, len),
            "zip": str,
            Optional("geo"): {
                "lat": And(NUMBER, lambda n: -90 <= n <= 90),
                "lng": And(NUMBER, lambda n: -180 <= n <= 180),
            },
        },
    }
)


def operation(value):
    return user.is_valid(value)
