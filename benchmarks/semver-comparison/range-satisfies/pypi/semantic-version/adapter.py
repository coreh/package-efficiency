from semantic_version import Version, NpmSpec

def operation(pair):
    return NpmSpec(pair[1]).match(Version(pair[0]))
