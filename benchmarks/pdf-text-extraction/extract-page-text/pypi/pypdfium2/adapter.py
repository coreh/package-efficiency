import pypdfium2 as pdfium

# Not timed: runs once per fixture.
def prepare(value):
    return bytes.fromhex(value)

def operation(data):
    pdf = pdfium.PdfDocument(data)
    try:
        return [pdf[i].get_textpage().get_text_range() for i in range(len(pdf))]
    finally:
        pdf.close()
