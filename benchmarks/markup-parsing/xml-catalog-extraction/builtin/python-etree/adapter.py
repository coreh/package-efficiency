import xml.etree.ElementTree as ET

# Code points other than space, tab, line feed and carriage return.
def non_space(s):
    return len(s) - s.count(' ') - s.count('\t') - s.count('\n') - s.count('\r')

def operation(value):
    products = in_stock = cents = tags = description_chars = 0
    for product in ET.fromstring(value).iter('product'):
        products += 1
        if product.get('stock') == 'true':
            in_stock += 1
        cents += int(product.find('price').text)
        tags += len(product.find('tags').findall('tag'))
        description_chars += non_space(product.find('description').text)
    return {'products': products, 'inStock': in_stock, 'cents': cents, 'tags': tags, 'descriptionChars': description_chars}
