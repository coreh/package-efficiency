from decimal import ROUND_HALF_EVEN, Decimal

CENT = Decimal('0.01')


def operation(value):
    amounts = value['amounts']
    rates = value['rates']
    block = value['block']
    total = Decimal(0)
    subtotals = []
    for start in range(0, len(amounts), block):
        s = Decimal(0)
        for i in range(start, start + block):
            s += Decimal(amounts[i]) * Decimal(rates[i])
        subtotals.append(str(s.quantize(CENT, rounding=ROUND_HALF_EVEN)))
        total += s
    return [str(total.quantize(CENT, rounding=ROUND_HALF_EVEN))] + subtotals
