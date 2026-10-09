import base64
import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

def operation(document):
    out = io.BytesIO()
    pdf = canvas.Canvas(out, pagesize=A4)
    top = A4[1]
    for page in document['pages']:
        pdf.setFont('Helvetica', 10)
        for t in page['texts']:
            pdf.drawString(t['x'], top - t['y'], t['text'])
        for x1, y1, x2, y2 in page['rules']:
            pdf.line(x1, top - y1, x2, top - y2)
        pdf.showPage()
    pdf.save()
    return out.getvalue()

def describe(result):
    return base64.b64encode(result).decode('ascii')
