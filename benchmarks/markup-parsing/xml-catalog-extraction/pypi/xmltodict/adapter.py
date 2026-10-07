import xmltodict

def non_space(s):
    return len(s) - s.count(" ") - s.count("\t") - s.count("\n") - s.count("\r")

def as_list(x):
    return x if isinstance(x, list) else [x]

def text_of(x):
    if isinstance(x, dict):
        x = x.get('#text')
    return x or ''

def operation(value):
    products = in_stock = cents = tags = description_chars = 0
    catalog = xmltodict.parse(value)['catalog']
    for category in as_list(catalog['category']):
        for product in as_list(category['product']):
            products += 1
            if product['@stock'] == 'true':
                in_stock += 1
            cents += int(text_of(product['price']))
            tags += len(as_list(product['tags']['tag']))
            description_chars += non_space(text_of(product['description']))
    return {'products': products, 'inStock': in_stock, 'cents': cents, 'tags': tags, 'descriptionChars': description_chars}
