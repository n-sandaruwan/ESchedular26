import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create landscape A4 PDF
const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4'
});

// Dimensions (A4 landscape: 297mm x 210mm)
const pageWidth = 297;
const margin = 10;
const tableWidth = pageWidth - (margin * 2); // 277mm
const startX = margin;
const startY = 22;

// Draw Title
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.text('3rd Semester Time Table - Electrical and Information Engineering', pageWidth / 2, 14, { align: 'center' });
doc.setLineWidth(0.8);
doc.line((pageWidth / 2) - 85, 15.5, (pageWidth / 2) + 85, 15.5);

// Column Widths
const colTimeWidth = 32;
const colDayWidth = (tableWidth - colTimeWidth) / 5; // 49mm per day

// Row Heights
const headerHeight = 10;
const rowHeight = 15; // 10 time slots = 150mm
const totalTableHeight = headerHeight + (10 * rowHeight); // 160mm

// Background color helper
const fillBox = (x, y, w, h, r, g, b) => {
  doc.setFillColor(r, g, b);
  doc.rect(x, y, w, h, 'F');
};

// Draw Grid Box helper
const drawCell = (colIdx, rowStart, rowSpan, title, sub, r, g, b, isDiagonal = false) => {
  const x = startX + colTimeWidth + (colIdx * colDayWidth);
  const y = startY + headerHeight + (rowStart * rowHeight);
  const w = colDayWidth;
  const h = rowSpan * rowHeight;

  if (r !== undefined && g !== undefined && b !== undefined) {
    fillBox(x, y, w, h, r, g, b);
  } else {
    fillBox(x, y, w, h, 255, 255, 255);
  }

  doc.setLineWidth(0.4);
  doc.setDrawColor(0, 0, 0);
  doc.rect(x, y, w, h, 'S');

  if (isDiagonal) {
    doc.line(x, y + h, x + w, y);
  }

  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);

    const titleLines = doc.splitTextToSize(title, w - 2);
    const subLines = sub ? doc.splitTextToSize(sub, w - 2) : [];
    const totalLines = titleLines.length + subLines.length;
    const textStartY = y + (h / 2) - ((totalLines * 4) / 2) + 3;

    let currY = textStartY;
    titleLines.forEach((line) => {
      doc.text(line, x + (w / 2), currY, { align: 'center' });
      currY += 4.5;
    });

    if (sub) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      subLines.forEach((line) => {
        doc.text(line, x + (w / 2), currY, { align: 'center' });
        currY += 4;
      });
    }
  }
};

// 1. Draw Table Header Row
doc.setFillColor(230, 230, 230);
doc.rect(startX, startY, tableWidth, headerHeight, 'F');
doc.setLineWidth(0.6);
doc.rect(startX, startY, tableWidth, headerHeight, 'S');

doc.setFont('helvetica', 'bolditalic');
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);

doc.text('TIME', startX + (colTimeWidth / 2), startY + 6.5, { align: 'center' });
const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
days.forEach((day, idx) => {
  const x = startX + colTimeWidth + (idx * colDayWidth) + (colDayWidth / 2);
  doc.text(day, x, startY + 6.5, { align: 'center' });
});

// Time Slot Labels
const times = [
  '08:30 - 09:30',
  '09:30 - 10:30',
  '10:30 - 11:30',
  '11:30 - 12:30',
  '12:30 - 1:30',
  '1:30 - 2:30',
  '2:30 - 3:30',
  '3:30 - 4:30',
  '4:30 - 5:30',
  '5:30 - 6:30'
];

times.forEach((t, idx) => {
  const y = startY + headerHeight + (idx * rowHeight);
  doc.setFillColor(245, 245, 245);
  doc.rect(startX, y, colTimeWidth, rowHeight, 'F');
  doc.setLineWidth(0.4);
  doc.rect(startX, y, colTimeWidth, rowHeight, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(t, startX + (colTimeWidth / 2), y + (rowHeight / 2) + 1.5, { align: 'center' });
});

// 2. Draw Table Cells matching exact screenshot

// --- MONDAY ---
// 08:30-10:30 (row 0, span 2): EE3203 (NCC)
drawCell(0, 0, 2, 'EE3203 (NCC)', 'Electrical and Electronic Measurements', 243, 211, 211);
// 10:30-11:30 (row 2, span 1): EE3202 (LT1)
drawCell(0, 2, 1, 'EE3202 (LT1)', 'Data Structures and Algorithms', 184, 210, 236);
// 12:30-02:30 (row 4, span 2): Slanted Line
drawCell(0, 4, 2, '', '', 255, 255, 255, true);
// 02:30-04:30 (row 6, span 2): EE 3304 (NLH2)
drawCell(0, 6, 2, 'EE 3304 (NLH2)', 'Engineering Electromagnetism', 243, 211, 211);
// 04:30-06:30 (row 8, span 2): IS3301 [AUD]
drawCell(0, 8, 2, 'IS3301 [AUD]', 'Complex Analysis and Mathematical Transforms', 252, 227, 203);

// --- TUESDAY ---
// 08:30-09:30 (row 0, span 1): EE 3306 (LT2)
drawCell(1, 0, 1, 'EE 3306 (LT2)', 'Signals and Systems', 208, 230, 248);
// 09:30-11:30 (row 1, span 2): EE3202 (LT2)
drawCell(1, 1, 2, 'EE3202 (LT2)', 'Data Structures and Algorithms', 184, 210, 236);
// 12:30-02:30 (row 4, span 2): IS3321 [AUD]
drawCell(1, 4, 2, 'IS3321 [AUD]', 'Fundamentals of Management for Engineers', 230, 228, 223);
// 02:30-04:30 (row 6, span 2): EE 3205 (LT1)
drawCell(1, 6, 2, 'EE 3205 (LT1)', 'Power and Energy', 211, 238, 239);
// 04:30-06:30 (row 8, span 2): EE 3301 (LT2)
drawCell(1, 8, 2, 'EE 3301 (LT2)', 'Analog Electronics', 228, 232, 210);

// --- WEDNESDAY ---
// 08:30-11:30 (row 0, span 3): LABORATORY / FIELD WORK
drawCell(2, 0, 3, 'LABORATORY /', 'FIELD WORK', 255, 255, 255);
// 12:30-01:30 (row 4, span 1): IS3301 [AUD]
drawCell(2, 4, 1, 'IS3301 [AUD]', 'Complex Analysis and Mathematical Transforms', 252, 227, 203);
// 01:30-02:30 (row 5, span 1): IS 3321 [AUD]
drawCell(2, 5, 1, 'IS 3321 [AUD]', 'Fundamentals of Management for Engineers', 230, 228, 223);
// 02:30-04:30 (row 6, span 2): Common Hours
drawCell(2, 6, 2, 'Common Hours', '', 255, 255, 255);
// 04:30-06:30 (row 8, span 2): Slanted Line
drawCell(2, 8, 2, '', '', 255, 255, 255, true);

// --- THURSDAY ---
// 08:30-11:30 (row 0, span 3): Slanted Line
drawCell(3, 0, 3, '', '', 255, 255, 255, true);
// 12:30-02:30 (row 4, span 2): EE 3306 (NCC)
drawCell(3, 4, 2, 'EE 3306 (NCC)', 'Signals and Systems', 226, 238, 212);
// 02:30-04:30 (row 6, span 2): IS3322 (AUD)
drawCell(3, 6, 2, 'IS3322 (AUD)', 'Society and the Engineers', 216, 216, 216);
// 04:30-06:30 (row 8, span 2): Slanted Line
drawCell(3, 8, 2, '', '', 255, 255, 255, true);

// --- FRIDAY ---
// 08:30-10:30 (row 0, span 2): EE 3301 (NCC)
drawCell(4, 0, 2, 'EE 3301 (NCC)', 'Analog Electronics', 228, 232, 210);
// 10:30-11:30 (row 2, span 1): EE3304 (NCC)
drawCell(4, 2, 1, 'EE3304 (NCC)', 'Engineering Electromagnetism', 237, 220, 242);
// 12:30-02:30 (row 4, span 2): IS3322 [AUD]
drawCell(4, 4, 2, 'IS3322 [AUD]', 'Society and the Engineers', 216, 216, 216);

// Friday Afternoon (row 6 to 9, span 4): Split between CCSSD and Vertical LABORATORY/FIELD WORK
const friX = startX + colTimeWidth + (4 * colDayWidth);
const friY = startY + headerHeight + (6 * rowHeight);
const friW = colDayWidth;
const friH = 4 * rowHeight; // 60mm

// Left section of Friday 2:30-6:30
const leftW = friW - 8;
fillBox(friX, friY, leftW, friH, 255, 255, 255);
doc.setLineWidth(0.4);
doc.rect(friX, friY, leftW, friH, 'S');

// Top left diagonal line (2:30-3:30)
doc.line(friX, friY + 15, friX + leftW, friY);

// CCSSD (LT2) (3:30-4:30)
doc.line(friX, friY + 15, friX + leftW, friY + 15);
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.text('CCSSD (LT2)', friX + (leftW / 2), friY + 23, { align: 'center' });

// CCSSD (LT2) (4:30-5:30)
doc.line(friX, friY + 30, friX + leftW, friY + 30);
doc.text('CCSSD (LT2)', friX + (leftW / 2), friY + 38, { align: 'center' });

// Free bottom (5:30-6:30)
doc.line(friX, friY + 45, friX + leftW, friY + 45);

// Right vertical sidebar of Friday: LABORATORY / FIELD WORK
const rightX = friX + leftW;
const rightW = 8;
fillBox(rightX, friY, rightW, friH, 255, 255, 255);
doc.rect(rightX, friY, rightW, friH, 'S');

doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.text('LABORATORY / FIELD WORK', rightX + 5, friY + (friH / 2) + 18, { angle: 90, align: 'center' });

// --- LUNCH ROW (Row index 3: 11:30 - 12:30) ---
const lunchY = startY + headerHeight + (3 * rowHeight);
fillBox(startX, lunchY, tableWidth, rowHeight, 255, 255, 255);
doc.setLineWidth(0.6);
doc.rect(startX, lunchY, tableWidth, rowHeight, 'S');

// Redraw time column box for lunch
fillBox(startX, lunchY, colTimeWidth, rowHeight, 245, 245, 245);
doc.rect(startX, lunchY, colTimeWidth, rowHeight, 'S');
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.text('11:30 - 12:30', startX + (colTimeWidth / 2), lunchY + 9, { align: 'center' });

doc.setFontSize(11);
doc.text('LUNCH INTERVAL', startX + colTimeWidth + ((tableWidth - colTimeWidth) / 2), lunchY + 9.5, { align: 'center' });

// Save PDF file
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
const pdfPath = path.join(publicDir, '3rd_Semester_Time_Table_Electrical_and_Information_Engineering.pdf');
fs.writeFileSync(pdfPath, pdfBuffer);
console.log('Successfully generated official PDF at:', pdfPath);
