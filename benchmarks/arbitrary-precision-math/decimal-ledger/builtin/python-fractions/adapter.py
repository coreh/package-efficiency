from fractions import Fraction


def operation(value):
    amounts = value['amounts']
    rates = value['rates']
    block = value['block']
    total = Fraction(0)
    subtotals = []
    for start in range(0, len(amounts), block):
        s = Fraction(0)
        for i in range(start, start + block):
            s += Fraction(amounts[i]) * Fraction(rates[i])
        subtotals.append(format(s, '.2f'))
        total += s
    return [format(total, '.2f')] + subtotals
