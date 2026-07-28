/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export async function generateInvoicePdf(data: any) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let custom = {} as any;
  if (data.complexData) {
    custom = data.complexData;
  } else if (data.additionalNotes) {
    try { custom = JSON.parse(data.additionalNotes); } catch(e) {}
  }

  const items = custom.items && Array.isArray(custom.items) ? custom.items : [
    { description: data.description || "", hsn: "", qty: data.quantity || 1, rate: data.unitRate || 0, uom: "1 Nos" }
  ];
  
  const drawText = (text: string, x: number, y: number, size: number, weight: "normal" | "bold", color: number[], align: "left" | "center" | "right" = "left") => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, x, y, { align });
  };

  // HEADER
  drawText("Company Name", margin, margin + 5, 20, "bold", [33, 37, 41]);
  drawText("123 Business Road, Corporate District", margin, margin + 12, 9, "normal", [100, 100, 100]);
  drawText("City, State, 12345", margin, margin + 16, 9, "normal", [100, 100, 100]);
  drawText("Phone: +1 234 567 890", margin, margin + 20, 9, "normal", [100, 100, 100]);
  drawText("GSTIN: 12XXXXX1234X1ZX", margin, margin + 24, 9, "normal", [100, 100, 100]);

  drawText("INVOICE", pageWidth - margin, margin + 5, 22, "bold", [37, 99, 235], "right");
  
  const rightColX = pageWidth - margin - 40;
  drawText("Invoice No:", rightColX, margin + 14, 9, "bold", [50, 50, 50], "left");
  drawText((data.invoiceNumber || "").toString(), pageWidth - margin, margin + 14, 9, "normal", [100, 100, 100], "right");
  
  const dateStr = data.date ? new Date(data.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'); 
  drawText("Date:", rightColX, margin + 19, 9, "bold", [50, 50, 50], "left");
  drawText(dateStr, pageWidth - margin, margin + 19, 9, "normal", [100, 100, 100], "right");

  if (custom.buyersOrderNo) {
    drawText("PO Number:", rightColX, margin + 24, 9, "bold", [50, 50, 50], "left");
    drawText(custom.buyersOrderNo.toString(), pageWidth - margin, margin + 24, 9, "normal", [100, 100, 100], "right");
  }

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, margin + 30, pageWidth - margin, margin + 30);

  // BILL TO
  drawText("Bill To:", margin, margin + 40, 10, "bold", [50, 50, 50]);
  drawText(data.customerName || "Customer Name", margin, margin + 46, 12, "bold", [33, 37, 41]);
  if (custom.customerAddress) {
    const splitAddr = doc.splitTextToSize(custom.customerAddress, 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(splitAddr, margin, margin + 52);
  }

  // TABLE
  let subtotal = 0;
  const tableData: any[] = [];
  
  items.forEach((item: any, i: number) => {
    const qty = Number(item.qty) || 1;
    const rate = Number(item.rate) || 0;
    const amt = qty * rate;
    subtotal += amt;
    tableData.push([
      (i + 1).toString(),
      item.description || "-",
      qty.toString(),
      rate.toFixed(2),
      amt.toFixed(2)
    ]);
  });

  const tableStartY = margin + 70;

  autoTable(doc, {
    startY: tableStartY,
    head: [["#", "Item Description", "Qty", "Rate", "Amount"]],
    body: tableData,
    theme: "plain",
    headStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { textColor: [80, 80, 80], fontSize: 9 },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: "auto", halign: "right" }
    },
    margin: { left: margin, right: margin }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = pageWidth - margin - 60;
  const valuesX = pageWidth - margin;

  // SUMMARY
  drawText("Subtotal:", totalsX, finalY, 9, "bold", [50, 50, 50]);
  drawText(subtotal.toFixed(2), valuesX, finalY, 9, "normal", [80, 80, 80], "right");

  let currentY = finalY + 6;
  const discountAmt = Number(custom.discountValue) || 0;
  if (discountAmt > 0) {
    drawText("Discount:", totalsX, currentY, 9, "bold", [50, 50, 50]);
    const discountVal = custom.discountType === "PERCENTAGE" ? (subtotal * discountAmt / 100) : discountAmt;
    drawText("-" + discountVal.toFixed(2), valuesX, currentY, 9, "normal", [80, 80, 80], "right");
    subtotal -= discountVal;
    currentY += 6;
  }

  const taxAmt = (subtotal * (Number(custom.gstPercent) || 0)) / 100;
  if (taxAmt > 0) {
    drawText("Tax (%):", totalsX, currentY, 9, "bold", [50, 50, 50]);
    drawText(taxAmt.toFixed(2), valuesX, currentY, 9, "normal", [80, 80, 80], "right");
    currentY += 6;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(totalsX, currentY, valuesX, currentY);
  currentY += 6;

  const totalAmount = Number(data.totalAmount) || (subtotal + taxAmt);
  drawText("TOTAL AMOUNT:", totalsX, currentY, 10, "bold", [33, 37, 41]);
  drawText(totalAmount.toFixed(2), valuesX, currentY, 11, "bold", [37, 99, 235], "right");

  const advancePaid = Number(data.advanceAmount) || 0;
  if (advancePaid > 0) {
    currentY += 8;
    drawText("Advance Paid:", totalsX, currentY, 9, "bold", [50, 50, 50]);
    drawText("-" + advancePaid.toFixed(2), valuesX, currentY, 9, "normal", [34, 197, 94], "right");
    
    currentY += 6;
    drawText("BALANCE DUE:", totalsX, currentY, 10, "bold", [33, 37, 41]);
    const balance = totalAmount - advancePaid;
    drawText(balance.toFixed(2), valuesX, currentY, 11, "bold", [239, 68, 68], "right");
  }

  // FOOTER / TERMS
  const termsY = pageHeight - 50;
  doc.line(margin, termsY - 5, pageWidth - margin, termsY - 5);
  
  drawText("Payment Terms", margin, termsY, 9, "bold", [50, 50, 50]);
  drawText(custom.paymentTerms || "As agreed upon.", margin, termsY + 6, 8, "normal", [100, 100, 100]);
  
  if (custom.deliveryNote) {
    drawText("Delivery Note:", margin, termsY + 12, 8, "bold", [50, 50, 50]);
    drawText(custom.deliveryNote, margin + 20, termsY + 12, 8, "normal", [100, 100, 100]);
  }

  drawText("Authorized Signatory", pageWidth - margin, termsY + 20, 9, "bold", [50, 50, 50], "right");

  return doc;
}
