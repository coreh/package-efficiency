import { jsPDF } from 'jspdf'
export const operation = ({ pages }) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  pages.forEach((page, i) => {
    if (i > 0) doc.addPage()
    for (const t of page.texts) doc.text(t.text, t.x, t.y)
    for (const [x1, y1, x2, y2] of page.rules) doc.line(x1, y1, x2, y2)
  })
  return doc.output('arraybuffer')
}
