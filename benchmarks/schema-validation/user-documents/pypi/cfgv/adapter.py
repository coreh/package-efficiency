import cfgv


def check_range(low, high):
    def check(value):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise cfgv.ValidationError(f"Expected number got {type(value).__name__}")
        if not low <= value <= high:
            raise cfgv.ValidationError(f"{value} out of range")

    return check


def check_min_one(value):
    if isinstance(value, bool) or not isinstance(value, int):
        raise cfgv.ValidationError("Expected int")
    if value < 1:
        raise cfgv.ValidationError("Expected at least 1")


def check_non_empty(value):
    cfgv.check_string(value)
    if not value:
        raise cfgv.ValidationError("Expected a non-empty string")


def check_number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise cfgv.ValidationError("Expected number")


GEO = cfgv.Map(
    "Geo", None,
    cfgv.Required("lat", check_range(-90, 90)),
    cfgv.Required("lng", check_range(-180, 180)),
)
ADDRESS = cfgv.Map(
    "Address", None,
    cfgv.Required("city", check_non_empty),
    cfgv.Required("zip", cfgv.check_string),
    cfgv.OptionalRecurse("geo", GEO, {}),
)
USER = cfgv.Map(
    "User", None,
    cfgv.Required("id", check_min_one),
    cfgv.Required("name", check_non_empty),
    cfgv.Required("email", cfgv.check_string),
    cfgv.Required("role", cfgv.check_one_of(("admin", "editor", "viewer"))),
    cfgv.Required("active", cfgv.check_bool),
    cfgv.Required("tags", cfgv.check_array(cfgv.check_string)),
    cfgv.Required("scores", cfgv.check_array(check_number)),
    cfgv.Optional("nickname", cfgv.check_string, ""),
    cfgv.RequiredRecurse("address", ADDRESS),
)


def operation(value):
    try:
        USER.check(value)
    except cfgv.ValidationError:
        return False
    return True
