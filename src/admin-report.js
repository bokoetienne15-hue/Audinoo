const purple = '8C4DE8'
const ink = '171326'
const muted = '675F73'
const white = 'FFFFFF'

function download(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

function reportFilename(report, extension) {
  return `audinoo-rapport-${report.generatedAt.toISOString().slice(0, 10)}.${extension}`
}

function growth(current, previous) {
  if (!previous) return current ? 'Nouveau (base précédente : 0)' : '0 % (base précédente : 0)'
  const change = (current - previous) / previous
  return `${change > 0 ? '+' : ''}${new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(change)}`
}

function styleWorksheetHeader(row) {
  row.height = 26
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: purple } }
    cell.font = { name: 'Aptos', bold: true, color: { argb: white }, size: 10 }
    cell.alignment = { vertical: 'middle', wrapText: true }
  })
}

function styleWorksheetTitle(sheet, title, subtitle, columnEnd) {
  sheet.mergeCells(1, 1, 1, columnEnd)
  sheet.getCell('A1').value = title
  sheet.getCell('A1').font = { name: 'Aptos Display', size: 21, bold: true, color: { argb: white } }
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ink } }
  sheet.getCell('A1').alignment = { vertical: 'middle' }
  sheet.getRow(1).height = 42
  sheet.mergeCells(2, 1, 2, columnEnd)
  sheet.getCell('A2').value = subtitle
  sheet.getCell('A2').font = { name: 'Aptos', size: 10, color: { argb: muted }, italic: true }
  sheet.getRow(2).height = 24
  sheet.views = [{ state: 'frozen', ySplit: 4 }]
}

export async function exportAdminExcel(report) {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Audinoo — Administration'
  workbook.subject = 'Statistiques réelles des inscriptions et sessions anonymes'
  workbook.title = 'Rapport de croissance Audinoo'
  workbook.created = report.generatedAt
  workbook.modified = report.generatedAt

  const summary = workbook.addWorksheet('Synthèse', { properties: { tabColor: { argb: purple } } })
  summary.columns = [{ width: 34 }, { width: 25 }, { width: 25 }, { width: 34 }]
  styleWorksheetTitle(summary, 'AUDINOO  /  RAPPORT DE CROISSANCE', `${report.periodLabel} · ${report.countryLabel} · Généré le ${report.generatedLabel}`, 4)
  summary.getCell('A4').value = 'INDICATEURS MESURÉS DANS FIRESTORE'
  summary.mergeCells('A4:D4')
  summary.getCell('A4').font = { name: 'Aptos', size: 10, bold: true, color: { argb: purple } }
  const kpiHeader = summary.addRow(['Indicateur', 'Période sélectionnée', 'Période précédente', 'Évolution'])
  styleWorksheetHeader(kpiHeader)
  const kpis = [
    ['Comptes enregistrés', report.totalUsers, '—', 'Stock actuel'],
    ['Nouvelles inscriptions', report.signupTotal, report.previousSignupTotal, growth(report.signupTotal, report.previousSignupTotal)],
    ['Sessions anonymes', report.visitorTotal, report.previousVisitorTotal, growth(report.visitorTotal, report.previousVisitorTotal)]
  ]
  kpis.forEach((values, index) => {
    const row = summary.addRow(values)
    row.height = 25
    row.eachCell((cell) => {
      cell.font = { name: 'Aptos', size: 10, color: { argb: ink }, bold: index === 0 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 ? 'F4F0FA' : white } }
      cell.alignment = { vertical: 'middle', wrapText: true }
    })
    row.getCell(2).numFmt = '#,##0'
    row.getCell(3).numFmt = '#,##0'
  })
  summary.addRow([])
  summary.mergeCells('A9:D9')
  summary.getCell('A9').value = 'LECTURE ET LIMITES DES DONNÉES'
  summary.getCell('A9').font = { name: 'Aptos', size: 10, bold: true, color: { argb: purple } }
  summary.mergeCells('A10:D11')
  summary.getCell('A10').value = 'Les inscriptions proviennent des profils users et les visites des sessions anonymes visitorSessions enregistrés dans Firebase. Une session n’est pas nécessairement une personne unique. Les visites ne sont pas associées à un pays ni à un compte inscrit; le taux de conversion n’est donc pas calculé. Aucun paiement, chiffre d’affaires ou coût n’est enregistré ici : aucune valorisation financière n’est estimée.'
  summary.getCell('A10').alignment = { wrapText: true, vertical: 'top' }
  summary.getCell('A10').font = { name: 'Aptos', size: 10, color: { argb: muted } }
  summary.getCell('A10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F4F0FA' } }
  summary.getRow(10).height = 45
  summary.getRow(11).height = 35
  summary.mergeCells('A13:D13')
  summary.getCell('A13').value = 'Document généré automatiquement par Audinoo. Les chiffres reflètent les données disponibles au moment de l’export.'
  summary.getCell('A13').font = { name: 'Aptos', size: 9, italic: true, color: { argb: muted } }

  const activity = workbook.addWorksheet('Activité', { properties: { tabColor: { argb: '38B7A0' } } })
  activity.columns = [{ width: 23 }, { width: 24 }, { width: 22 }]
  styleWorksheetTitle(activity, 'ACTIVITÉ PAR PÉRIODE', `${report.periodLabel} · Inscriptions selon le filtre pays; visites anonymes tous pays confondus.`, 3)
  const activityRows = [['Période', 'Nouvelles inscriptions', 'Sessions anonymes'], ...report.activity.map((point) => [point.label, point.signups, point.visitors])]
  activityRows.forEach((values, index) => {
    const row = activity.addRow(values)
    if (index === 0) styleWorksheetHeader(row)
    else {
      row.height = 22
      row.eachCell((cell) => {
        cell.font = { name: 'Aptos', size: 10, color: { argb: ink } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 ? 'F4F0FA' : white } }
        cell.alignment = { vertical: 'middle' }
      })
      row.getCell(2).numFmt = '#,##0'
      row.getCell(3).numFmt = '#,##0'
    }
  })
  activity.autoFilter = { from: 'A4', to: `C${activity.rowCount}` }

  const countries = workbook.addWorksheet('Inscriptions par pays', { properties: { tabColor: { argb: 'F2A64A' } } })
  countries.columns = [{ width: 30 }, { width: 18 }, { width: 22 }, { width: 20 }]
  styleWorksheetTitle(countries, 'COMMUNAUTÉ PAR PAYS', `${report.countryLabel} · Répartition des profils inscrits actuellement dans Firebase.`, 4)
  const countryRows = [['Pays', 'Code ISO', 'Comptes inscrits', 'Part des comptes filtrés'], ...report.countries.map((country) => [country.name, country.code || '—', country.count, report.totalUsers ? country.count / report.totalUsers : 0])]
  countryRows.forEach((values, index) => {
    const row = countries.addRow(values)
    if (index === 0) styleWorksheetHeader(row)
    else {
      row.height = 23
      row.eachCell((cell) => {
        cell.font = { name: 'Aptos', size: 10, color: { argb: ink } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 ? 'F4F0FA' : white } }
        cell.alignment = { vertical: 'middle' }
      })
      row.getCell(3).numFmt = '#,##0'
      row.getCell(4).numFmt = '0.0%'
    }
  })
  countries.autoFilter = { from: 'A4', to: `D${countries.rowCount}` }

  const buffer = await workbook.xlsx.writeBuffer()
  download(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), reportFilename(report, 'xlsx'))
}

function drawTrend(doc, series, x, y, width, height, color) {
  if (!series.length) return
  const max = Math.max(1, ...series.map((point) => point.value))
  doc.setDrawColor(229, 224, 237)
  doc.line(x, y + height, x + width, y + height)
  doc.setDrawColor(...color)
  doc.setLineWidth(0.8)
  series.forEach((point, index) => {
    if (index === 0) return
    const previous = series[index - 1]
    const x1 = x + ((index - 1) / Math.max(1, series.length - 1)) * width
    const x2 = x + (index / Math.max(1, series.length - 1)) * width
    const y1 = y + height - (previous.value / max) * height
    const y2 = y + height - (point.value / max) * height
    doc.line(x1, y1, x2, y2)
  })
}

export async function createAdminPdfDocument(report) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  doc.setFillColor(23, 19, 38)
  doc.rect(0, 0, pageWidth, 43, 'F')
  doc.setTextColor(194, 132, 248)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('AUDINOO  /  CENTRE DE PILOTAGE', margin, 14)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(21)
  doc.text('Rapport de croissance', margin, 25)
  doc.setTextColor(218, 210, 230)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`${report.periodLabel}  ·  ${report.countryLabel}`, margin, 34)
  doc.text(`Édité le ${report.generatedLabel}`, pageWidth - margin, 34, { align: 'right' })

  const cardY = 51
  const cardGap = 5
  const cardWidth = (pageWidth - 2 * margin - 2 * cardGap) / 3
  const cards = [
    ['COMPTES ENREGISTRÉS', report.totalUsers, 'Total actuel'],
    ['INSCRIPTIONS', report.signupTotal, growth(report.signupTotal, report.previousSignupTotal)],
    ['SESSIONS ANONYMES', report.visitorTotal, growth(report.visitorTotal, report.previousVisitorTotal)]
  ]
  cards.forEach(([label, value, detail], index) => {
    const x = margin + index * (cardWidth + cardGap)
    doc.setFillColor(index === 1 ? 246 : 244, index === 1 ? 239 : 240, 250)
    doc.roundedRect(x, cardY, cardWidth, 25, 2, 2, 'F')
    doc.setTextColor(103, 95, 115)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(label, x + 4, cardY + 7)
    doc.setTextColor(39, 29, 54)
    doc.setFontSize(18)
    doc.text(new Intl.NumberFormat('fr-FR').format(value), x + 4, cardY + 16)
    doc.setTextColor(123, 112, 137)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(String(detail), x + 4, cardY + 22)
  })

  let y = cardY + 34
  doc.setTextColor(103, 95, 115)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('TENDANCES RÉELLES', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(140, 77, 232)
  doc.text('Inscriptions', margin, y + 4)
  doc.setTextColor(56, 183, 160)
  doc.text('Sessions anonymes', pageWidth / 2 + 3, y + 4)
  const chartGap = 8
  const chartWidth = (pageWidth - 2 * margin - chartGap) / 2
  drawTrend(doc, report.activity.map((item) => ({ value: item.signups })), margin, y + 9, chartWidth, 12, [140, 77, 232])
  drawTrend(doc, report.activity.map((item) => ({ value: item.visitors })), margin + chartWidth + chartGap, y + 9, chartWidth, 12, [56, 183, 160])

  const activityBody = report.activity.map((point) => [point.label, String(point.signups), String(point.visitors)])
  autoTable(doc, {
    startY: y + 27,
    head: [['Période', 'Inscriptions', 'Sessions anonymes']],
    body: activityBody,
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2, textColor: [39, 29, 54], lineColor: [232, 227, 239], lineWidth: 0.15 },
    headStyles: { fillColor: [140, 77, 232], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 244, 250] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }
  })

  const countryStartY = Math.min((doc.lastAutoTable?.finalY || y + 25) + 9, 255)
  autoTable(doc, {
    startY: countryStartY,
    head: [['Pays', 'ISO', 'Comptes inscrits', 'Part']],
    body: report.countries.map((country) => [country.name, country.code || '—', String(country.count), report.totalUsers ? `${(country.count / report.totalUsers * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%` : '0 %']),
    theme: 'grid',
    margin: { left: margin, right: margin },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2, textColor: [39, 29, 54], lineColor: [232, 227, 239], lineWidth: 0.15 },
    headStyles: { fillColor: [38, 156, 140], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [243, 249, 247] },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } }
  })

  const noteY = (doc.lastAutoTable?.finalY || countryStartY) + 8
  if (noteY + 18 > doc.internal.pageSize.getHeight() - 18) doc.addPage()
  const finalNoteY = noteY + 18 > doc.internal.pageSize.getHeight() - 18 ? 18 : noteY
  doc.setFillColor(247, 244, 250)
  doc.roundedRect(margin, finalNoteY, pageWidth - 2 * margin, 19, 2, 2, 'F')
  doc.setTextColor(103, 95, 115)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(doc.splitTextToSize('Méthode : les inscriptions proviennent des profils Firebase; les visites sont des sessions anonymes enregistrées, pas nécessairement des personnes uniques. Les visites ne sont pas liées aux comptes et ne permettent pas de calculer un taux de conversion fiable. Aucun paiement, revenu ou coût n’étant disponible, aucune valorisation financière n’est estimée.', pageWidth - 2 * margin - 8), margin + 4, finalNoteY + 6)

  const pageCount = doc.internal.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    const height = doc.internal.pageSize.getHeight()
    doc.setDrawColor(232, 227, 239)
    doc.line(margin, height - 12, pageWidth - margin, height - 12)
    doc.setTextColor(123, 112, 137)
    doc.setFontSize(7)
    doc.text('Audinoo · rapport automatique · données disponibles au moment de l’export', margin, height - 7)
    doc.text(`${page} / ${pageCount}`, pageWidth - margin, height - 7, { align: 'right' })
  }
  return doc
}

export async function exportAdminPdf(report) {
  const doc = await createAdminPdfDocument(report)
  doc.save(reportFilename(report, 'pdf'))
}
