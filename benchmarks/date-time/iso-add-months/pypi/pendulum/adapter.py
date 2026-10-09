from typing import cast
import pendulum
from pendulum import DateTime
def operation(value):
    return cast(DateTime, pendulum.parse(value["ts"])).add(months=value["months"], days=value["days"]).format("YYYY-MM-DD HH:mm:ss")
