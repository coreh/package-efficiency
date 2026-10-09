import base64
from fpdf import FPDF

def operation(document):
    pdf = FPDF(unit='pt', format='A4')
    pdf.set_font('helvetica', size=10)
    for page in document['pages']:
        pdf.add_page()
        for t in page['texts']:
            pdf.text(t['x'], t['y'], t['text'])
        for x1, y1, x2, y2 in page['rules']:
            pdf.line(x1, y1, x2, y2)
    return pdf.output()

def describe(result):
    return base64.b64encode(bytes(result)).decode('ascii')
