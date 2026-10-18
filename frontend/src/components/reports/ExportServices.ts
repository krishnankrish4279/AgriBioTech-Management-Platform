import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (filename: string, rows: any[], headers: { key: string; label: string }[]) => {
  const headerRow = headers.map(h => `"${h.label}"`).join(',');
  const dataRows = rows.map(row => {
    return headers.map(h => {
      const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]).replace(/"/g, '""') : '';
      return `"${val}"`;
    }).join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...dataRows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportComprehensivePDF = (title: string, summaryMetrics: Record<string, string | number>, tableData: { headers: string[]; rows: (string | number)[][] }) => {
  const doc = new jsPDF();

  // Branding Header
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('AgriBioTech Management & Advisory Platform', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 211, 153); // #34d399
  doc.text(`Official Intelligence & Surveillance Report • Generated: ${new Date().toLocaleDateString()}`, 14, 23);

  // Document Title
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 44);

  // Summary Metrics Box
  let yPos = 52;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, yPos, 182, 24, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  let xOffset = 20;
  Object.entries(summaryMetrics).forEach(([key, val]) => {
    doc.text(key.toUpperCase(), xOffset, yPos + 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(11);
    doc.text(String(val), xOffset, yPos + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    xOffset += 44;
  });

  // Table Data
  yPos += 34;
  autoTable(doc, {
    startY: yPos,
    head: [tableData.headers],
    body: tableData.rows,
    theme: 'grid',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} • AgriBioTech Platform Confidential`, 14, 290);
  }

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
