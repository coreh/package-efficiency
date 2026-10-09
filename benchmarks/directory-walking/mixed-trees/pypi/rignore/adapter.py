import rignore

def operation(input):
    return [str(path) for path in rignore.walk(
        input['root'],
        ignore_hidden=False,
        read_ignore_files=False,
        read_parents_ignores=False,
        read_git_ignore=False,
        read_global_git_ignore=False,
        read_git_exclude=False,
        require_git=False,
    )]
