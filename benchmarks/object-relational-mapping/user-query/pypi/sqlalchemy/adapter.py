from sqlalchemy import create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    city: Mapped[str]
    age: Mapped[int]
    score: Mapped[int]


# The engine (one in-memory database) is created once; each call creates the
# table, uses it and drops it.
engine = create_engine('sqlite://')


def operation(value):
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add_all([User(name=name, city=city, age=age, score=score) for name, city, age, score in value['rows']])
        session.commit()
        found = session.scalars(
            select(User)
            .where(User.age >= value['minAge'], User.city != value['skipCity'])
            .order_by(User.score.desc(), User.id)
        ).all()
        out = [[u.id, u.name, u.city, u.age, u.score] for u in found]
    Base.metadata.drop_all(engine)
    return out
