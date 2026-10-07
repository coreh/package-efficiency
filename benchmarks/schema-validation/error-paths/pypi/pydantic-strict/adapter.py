from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, ValidationError


class Geo(BaseModel):
    model_config = ConfigDict(strict=True)

    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class Address(BaseModel):
    model_config = ConfigDict(strict=True)

    city: str = Field(min_length=1)
    zip: str
    geo: Optional[Geo] = None


class User(BaseModel):
    model_config = ConfigDict(strict=True)

    id: int = Field(ge=1)
    name: str = Field(min_length=1)
    email: str
    role: Literal["admin", "editor", "viewer"]
    active: bool
    tags: list[str]
    scores: list[float]
    nickname: str = ""
    address: Address


def operation(value):
    try:
        User.model_validate(value)
    except ValidationError as e:
        return "/" + "/".join(map(str, e.errors()[0]["loc"]))
    return ""
