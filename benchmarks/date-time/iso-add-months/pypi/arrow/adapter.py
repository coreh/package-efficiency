import arrow
def operation(value):
    return arrow.get(value["ts"]).shift(months=value["months"]).shift(days=value["days"]).format("YYYY-MM-DD HH:mm:ss")
