/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
import { toWords } from "number-to-words";

export async function generateInvoicePdf(data: any) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 10; // Tighter margins to fit everything
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Try to parse complex JSON data
  let custom = {} as any;
  if (data.complexData) {
    custom = data.complexData;
  } else if (data.additionalNotes) {
    try {
      custom = JSON.parse(data.additionalNotes);
    } catch(e) {}
  }

  const items = custom.items && Array.isArray(custom.items) ? custom.items : [
    { description: data.description || "", hsn: "", qty: data.quantity || 1, rate: data.unitRate || 0, uom: "1 Nos" }
  ];
  const gstPercent = custom.gstPercent ?? 5;

  // Colors
  const black = [0, 0, 0];

  const drawText = (text: string, x: number, y: number, size: number, weight: "normal" | "bold", color: number[], align: "left" | "center" | "right" = "left") => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x, y, { align });
  };

  // Outer Border Box
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin + 5, pageWidth - margin * 2, pageHeight - margin * 2 - 5);

  // --- TOP TITLE ---
  drawText("INVOICE", pageWidth / 2, margin + 3, 11, "bold", black, "center");

  // --- HEADER GRID ---
  // The header is split into two main columns
  const colDivider = pageWidth / 2 + 5;
  
  // Vertical line down the middle of header
  doc.line(colDivider, margin + 5, colDivider, margin + 77);
  
  // LEFT SIDE - Seller Info
  let cy = margin + 10;
  drawText("Sunway Medical System", margin + 2, cy, 14, "bold", black);
  cy += 5;
  drawText("2-2-647/71,", margin + 2, cy, 9, "normal", black);
  cy += 4;
  drawText("Central Excise Colony, Bagh Amberpet", margin + 2, cy, 9, "normal", black);
  cy += 4;
  drawText("Hyderabad, Telangana", margin + 2, cy, 9, "normal", black);
  cy += 5;
  drawText("GSTIN : 36AHDPP2509F1ZK", margin + 2, cy, 10, "bold", black);

  // Horizontal line separating seller and buyer
  doc.line(margin, cy + 3, colDivider, cy + 3);

  // LEFT SIDE - Buyer Info
  cy += 8;
  drawText("Buyer", margin + 2, cy, 9, "normal", black);
  cy += 5;
  drawText(data.customerName || "Customer Name", margin + 2, cy, 11, "bold", black);
  
  if (custom.customerAddress) {
    cy += 5;
    const addrLines = doc.splitTextToSize(custom.customerAddress, colDivider - margin - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(addrLines, margin + 2, cy);
  }

  // RIGHT SIDE GRID
  const rcDivider = (pageWidth - colDivider) / 2 + colDivider;
  let ry = margin + 5;
  
  // Row 1 (Invoice No | Date)
  drawText("Invoice No.", colDivider + 2, ry + 4, 8, "normal", black);
  drawText((data.invoiceNumber || "").toString(), rcDivider - 2, ry + 9, 10, "bold", black, "right");
  
  doc.line(rcDivider, ry, rcDivider, ry + 12); // vertical divider
  
  drawText("Date", rcDivider + 2, ry + 4, 8, "normal", black);
  const dateStr = new Date(data.date).toLocaleDateString('en-GB'); // dd/mm/yyyy
  drawText(dateStr, pageWidth - margin - 2, ry + 9, 10, "bold", black, "right");
  
  ry += 12;
  doc.line(colDivider, ry, pageWidth - margin, ry); // h line

  // Row 2 (Delivery Note | Terms of Payment)
  drawText("Delivery Note", colDivider + 2, ry + 4, 8, "normal", black);
  if (custom.deliveryNote) drawText(custom.deliveryNote, colDivider + 2, ry + 9, 9, "normal", black);
  
  doc.line(rcDivider, ry, rcDivider, ry + 12); // v line
  
  drawText("Mode/Terms of Payment", rcDivider + 2, ry + 4, 8, "normal", black);
  if (custom.paymentTerms) drawText(custom.paymentTerms, rcDivider + 2, ry + 9, 9, "normal", black);
  
  ry += 12;
  doc.line(colDivider, ry, pageWidth - margin, ry); // h line

  // Row 3 (Buyer's Order No | empty)
  drawText("Buyer's Order No.", colDivider + 2, ry + 4, 8, "normal", black);
  if (custom.buyersOrderNo) drawText(custom.buyersOrderNo, colDivider + 2, ry + 9, 9, "normal", black);
  
  doc.line(rcDivider, ry, rcDivider, ry + 12); // v line
  drawText("Dated", rcDivider + 2, ry + 4, 8, "normal", black);
  
  ry += 12;
  doc.line(colDivider, ry, pageWidth - margin, ry); // h line

  // Row 4 (Despatch Doc No | Dated)
  drawText("Despatch Document No.", colDivider + 2, ry + 4, 8, "normal", black);
  if (custom.despatchDocNo) drawText(custom.despatchDocNo, colDivider + 2, ry + 9, 9, "normal", black);
  
  doc.line(rcDivider, ry, rcDivider, ry + 12); // v line
  drawText("Dated", rcDivider + 2, ry + 4, 8, "normal", black);
  if (custom.despatchDated) drawText(custom.despatchDated, rcDivider + 2, ry + 9, 9, "normal", black);

  ry += 12;
  doc.line(colDivider, ry, pageWidth - margin, ry); // h line

  // Row 5 (Despatched through | Destination)
  drawText("Despatched through", colDivider + 2, ry + 4, 8, "normal", black);
  if (custom.despatchedThrough) drawText(custom.despatchedThrough, colDivider + 2, ry + 9, 9, "normal", black);
  
  doc.line(rcDivider, ry, rcDivider, ry + 12); // v line
  drawText("Destination", rcDivider + 2, ry + 4, 8, "normal", black);
  if (custom.destination) drawText(custom.destination, rcDivider + 2, ry + 9, 9, "normal", black);

  ry += 12;
  doc.line(colDivider, ry, pageWidth - margin, ry); // h line

  // Row 6 (Terms of Delivery)
  drawText("Terms of Delivery", colDivider + 2, ry + 4, 8, "normal", black);
  if (custom.termsOfDelivery) drawText(custom.termsOfDelivery, colDivider + 2, ry + 9, 9, "normal", black);

  // Close Header Grid
  doc.line(margin, margin + 77, pageWidth - margin, margin + 77);

  // --- ITEMS TABLE ---
  let subtotal = 0;
  const tableData: any[] = [];
  
  items.forEach((item: any, index: number) => {
    const amt = item.qty * item.rate;
    subtotal += amt;
    
    // Combine description and HSN for column 2
    let desc = item.description || "";
    if (item.hsn) desc += `\nHSN CODE: ${item.hsn}`;

    tableData.push([
      index + 1,
      desc,
      item.qty,
      item.rate.toFixed(2),
      item.uom || "1 Nos",
      amt.toFixed(2)
    ]);
  });

  const gstAmount = subtotal * (gstPercent / 100);
  const finalTotal = subtotal + gstAmount;

  // Inject GST row at the bottom of the items, right before TOTAL
  tableData.push([
    "",
    { content: `GST@${gstPercent}%`, styles: { fontStyle: 'bold' } },
    "",
    "",
    "",
    { content: gstAmount.toFixed(2), styles: { fontStyle: 'bold' } }
  ]);

  // We want to force the lines down to a specific height, but autoTable is tricky.
  // We'll use autoTable for the layout and let it draw the vertical lines using table body height.
  autoTable(doc, {
    startY: margin + 77,
    theme: 'grid',
    styles: { 
      font: 'helvetica', 
      fontSize: 9,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
      minCellHeight: 8
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 'auto', fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
      3: { halign: 'right', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'right', cellWidth: 25, fontStyle: 'bold' },
    },
    head: [['Sl\nNo.', 'Description of Goods', 'Quantity', 'Rate', 'per', 'Amount']],
    body: tableData,
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      // HSN formatting inside the Description cell
      if (data.section === 'body' && data.column.index === 1 && typeof data.cell.raw === 'string' && data.cell.raw.includes('HSN CODE:')) {
         // AutoTable will render it as is, but we can't easily mixed bold/italic in one cell cleanly via styles.
         // Standard bold for description is fine.
      }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY;

  // TOTAL ROW
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY); // Top line of total row
  
  drawText("TOTAL", pageWidth - margin - 30, currentY + 5, 10, "bold", black, "right");
  drawText(finalTotal.toFixed(2), pageWidth - margin - 2, currentY + 5, 10, "bold", black, "right");
  
  currentY += 8;
  doc.line(margin, currentY, pageWidth - margin, currentY); // Bottom line of total row

  // E. & O.E
  drawText("E. & O.E", pageWidth - margin - 2, currentY + 4, 8, "normal", black, "right");

  // Amount in Words
  currentY += 10;
  const inWords = toWords(finalTotal).toUpperCase();
  drawText(`Rupees : ( ${inWords} RUPEES ONLY )`, margin + 2, currentY, 9, "bold", black);

  // Terms & Conditions
  currentY += 10;
  drawText("Terms & Conditions :", margin + 6, currentY, 8, "bold", black);
  cy = currentY + 4;
  drawText("100% Advance on purchase order", margin + 6, cy, 8, "normal", black);
  cy += 4;
  drawText("Disputes, if any will be subject to Hyderabad Jurisdiction only", margin + 6, cy, 8, "normal", black);
  cy += 4;
  drawText("Goods once Sold will not be taken back", margin + 6, cy, 8, "normal", black);

  // Bank Details
  currentY += 25;
  drawText("Bank Details :", margin + 6, currentY, 8, "bold", black);
  cy = currentY + 4;
  drawText("Axis Bank, DD Colony", margin + 6, cy, 8, "bold", black);
  cy += 4;
  drawText("A/c. No.     919020033293328", margin + 6, cy, 8, "bold", black);
  cy += 4;
  drawText("IFSC           UTIB0004188", margin + 6, cy, 8, "bold", black);

  // Authorised Signatory Box
  const sigBoxW = 80;
  const sigBoxH = 30;
  const sigBoxX = pageWidth - margin - sigBoxW;
  const sigBoxY = pageHeight - margin - 5 - sigBoxH;

  doc.setLineWidth(0.5);
  doc.line(sigBoxX, sigBoxY, pageWidth - margin, sigBoxY); // Top line of sig box
  doc.line(sigBoxX, sigBoxY, sigBoxX, pageHeight - margin - 5); // Left line of sig box

  drawText("for Sunway Medical System", pageWidth - margin - 2, sigBoxY + 4, 9, "bold", black, "right");

  // Add Stamp inside the signature box
  try {
    const stampRes = await fetch(window.location.origin + '/stamp.png.jpeg');
    if (stampRes.ok) {
      const stampBlob = await stampRes.blob();
      const reader = new FileReader();
      const stampBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(stampBlob);
      });
      // Center the stamp inside the signature block horizontally
      doc.addImage(stampBase64, 'JPEG', pageWidth - margin - 35, sigBoxY + 6, 20, 20);
    }
  } catch (e) {
    console.log("Could not load stamp.png.jpeg");
  }

  drawText("Authorised Signatory", pageWidth - margin - 2, pageHeight - margin - 7, 9, "bold", black, "right");

  // Output
  const fileName = `Invoice_${data.invoiceNumber || "SMS"}.pdf`;
  doc.save(fileName);
  return true;
}


