from sqlmodel import Field, Session, SQLModel, col, create_engine, select


class User(SQLModel, table=True):
    __tablename__ = 'users'
    id: int | None = Field(default=None, primary_key=True)
    name: str
    city: str
    age: int
    score: int


# The engine (one in-memory database) is created once; each call creates the
# table, uses it and drops it.
engine = create_engine('sqlite://')


def operation(value):
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add_all([User(name=name, city=city, age=age, score=score) for name, city, age, score in value['rows']])
        session.commit()
        found = session.exec(
            select(User)
            .where(User.age >= value['minAge'], User.city != value['skipCity'])
            .order_by(col(User.score).desc(), col(User.id))
        ).all()
        out = [[u.id, u.name, u.city, u.age, u.score] for u in found]
    SQLModel.metadata.drop_all(engine)
    return out
