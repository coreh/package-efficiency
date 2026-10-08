import duckdb

# Not timed: the in-process database and its table are built once per fixture.
def prepare(value):
    con = duckdb.connect()
    con.execute(
        'CREATE TABLE t AS SELECT unnest(?::BIGINT[]) AS key, unnest(?::BIGINT[]) AS qty, unnest(?::BIGINT[]) AS amount',
        [value['key'], value['qty'], value['amount']],
    )
    return con, value['min']

def operation(prepared):
    con, minimum = prepared
    return con.execute('SELECT key, sum(amount), avg(qty) FROM t WHERE qty >= ? GROUP BY key', [minimum]).fetchall()
