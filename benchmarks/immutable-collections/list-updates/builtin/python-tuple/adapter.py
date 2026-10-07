def operation(value):
    lst = tuple(value['items'])
    gets = []
    for kind, i, v in value['ops']:
        if kind == 'set':
            lst = lst[:i] + (v,) + lst[i + 1:]
        elif kind == 'insert':
            lst = lst[:i] + (v,) + lst[i:]
        elif kind == 'remove':
            lst = lst[:i] + lst[i + 1:]
        else:
            gets.append(lst[i])
    return [list(lst), gets]
