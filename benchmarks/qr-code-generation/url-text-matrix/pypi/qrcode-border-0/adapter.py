import qrcode
from qrcode.constants import ERROR_CORRECT_L, ERROR_CORRECT_M, ERROR_CORRECT_Q, ERROR_CORRECT_H

LEVELS = [ERROR_CORRECT_L, ERROR_CORRECT_M, ERROR_CORRECT_Q, ERROR_CORRECT_H]


def operation(value):
    qr = qrcode.QRCode(error_correction=LEVELS[value["level"]], border=0)
    qr.add_data(value["text"])
    return qr.get_matrix()
