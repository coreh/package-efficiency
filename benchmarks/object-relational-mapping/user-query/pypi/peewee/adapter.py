from peewee import AutoField, CharField, IntegerField, Model, SqliteDatabase

db = SqliteDatabase(':memory:')


class User(Model):
    id = AutoField()
    name = CharField()
    city = CharField()
    age = IntegerField()
    score = IntegerField()

    class Meta:
        database = db


# The connection (one in-memory database) is opened once; each call creates
# the table, uses it and drops it.
db.connect()


def operation(value):
    db.create_tables([User])
    with db.atomic():
        User.bulk_create(
            [User(name=name, city=city, age=age, score=score) for name, city, age, score in value['rows']],
            batch_size=100,
        )
    found = (
        User.select()
        .where((User.age >= value['minAge']) & (User.city != value['skipCity']))
        .order_by(User.score.desc(), User.id)
    )
    out = [[u.id, u.name, u.city, u.age, u.score] for u in found]
    db.drop_tables([User])
    return out
