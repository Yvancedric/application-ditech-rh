/**
 * Utilitaires d'export PDF et Excel
 */

// Imports statiques de jsPDF et jspdf-autotable (méthode recommandée)
// Pour jspdf v2, on utilise l'export nommé { jsPDF }
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Export en PDF avec jsPDF
 */
export const exportToPDF = async (data, columns, title, filename) => {
  try {

    // Créer le document PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // Titre
    doc.setFontSize(16)
    doc.setTextColor(30, 58, 138) // #1e3a8a
    doc.text(title, 14, 10)

    // Date d'export
    const exportDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Exporté le ${exportDate}`, 14, 16)

    // Utiliser autoTable - avec jspdf-autotable v5, on peut utiliser autoTable(doc, ...) ou doc.autoTable(...)
    const tableConfig = {
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => {
        const value = col.accessor ? col.accessor(row) : row[col.key]
        return value !== null && value !== undefined ? String(value) : '-'
      })),
      startY: 20,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [30, 58, 138], // #1e3a8a
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { top: 20, left: 14, right: 14 }
    }

    // Utiliser autoTable - avec jspdf-autotable v3, on utilise autoTable(doc, ...)
    autoTable(doc, tableConfig)

    // Sauvegarder
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error)
    alert('Erreur lors de l\'export PDF. Veuillez installer jsPDF et jspdf-autotable: npm install jspdf jspdf-autotable')
  }
}

/**
 * Export en Excel avec xlsx
 */
export const exportToExcel = async (data, columns, title, filename) => {
  try {
    // Dynamiquement importer xlsx
    const XLSXModule = await import('xlsx')
    const XLSX = XLSXModule.default || XLSXModule

    // Préparer les données
    const worksheetData = [
      columns.map((col) => col.header),
      ...data.map((row) => columns.map((col) => {
        const value = col.accessor ? col.accessor(row) : row[col.key]
        return value !== null && value !== undefined ? value : '-'
      }))
    ]

    // Créer le workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Largeur des colonnes
    const colWidths = columns.map((col) => {
      const maxLength = Math.max(
        col.header.length,
        ...data.map((row) => {
          const value = col.accessor ? col.accessor(row) : row[col.key]
          return String(value || '').length
        })
      )
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) }
    })
    worksheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, title || 'Sheet1')

    // Sauvegarder
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error)
    alert('Erreur lors de l\'export Excel. Veuillez installer xlsx: npm install xlsx')
  }
}

/**
 * Export simple CSV (fallback si xlsx n'est pas disponible)
 */
export const exportToCSV = (data, columns, filename) => {
  const headers = columns.map(col => col.header).join(',')
  const rows = data.map(row => 
    columns.map(col => {
      const value = col.accessor ? col.accessor(row) : row[col.key]
      return `"${String(value || '').replace(/"/g, '""')}"`
    }).join(',')
  ).join('\n')

  const csvContent = `${headers}\n${rows}`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
