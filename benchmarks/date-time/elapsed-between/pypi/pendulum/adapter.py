from typing import cast
import pendulum
from pendulum import DateTime
def operation(value):
    a = cast(DateTime, pendulum.parse(value["from"]))
    b = cast(DateTime, pendulum.parse(value["to"]))
    s = (b.int_timestamp - a.int_timestamp) + (b.microsecond - a.microsecond) / 1000000
    return [int(s / 3600), int(s / 60), int(s)]
