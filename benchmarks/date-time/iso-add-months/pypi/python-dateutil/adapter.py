from dateutil import parser
from dateutil.relativedelta import relativedelta
def operation(value):
    t = parser.isoparse(value["ts"]) + relativedelta(months=value["months"]) + relativedelta(days=value["days"])
    return t.strftime("%Y-%m-%d %H:%M:%S")
