from pyrsistent import pvector


def operation(value):
    lst = pvector(value['items'])
    gets = []
    for kind, i, v in value['ops']:
        if kind == 'set':
            lst = lst.set(i, v)
        elif kind == 'insert':
            lst = lst[:i].append(v).extend(lst[i:])
        elif kind == 'remove':
            lst = lst.delete(i)
        else:
            gets.append(lst[i])
    return [list(lst), gets]
