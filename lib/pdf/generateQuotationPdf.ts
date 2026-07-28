/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
export async function generateQuotationPdf(data: any) {
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
  if (data.notes) {
    try { custom = JSON.parse(data.notes); } catch(e) {}
  }

  const items = data.items && Array.isArray(data.items) ? data.items : [
    { description: data.job_title || "", qty: 1, unit_price: data.total_amount || 0, uom: "1 Nos" }
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

  drawText("QUOTATION", pageWidth - margin, margin + 5, 22, "bold", [249, 115, 22], "right");
  
  const rightColX = pageWidth - margin - 40;
  drawText("Quotation No:", rightColX, margin + 14, 9, "bold", [50, 50, 50], "left");
  drawText((data.quotation_number || "Draft").toString(), pageWidth - margin, margin + 14, 9, "normal", [100, 100, 100], "right");
  
  const dateStr = data.delivery_date ? new Date(data.delivery_date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'); 
  drawText("Date:", rightColX, margin + 19, 9, "bold", [50, 50, 50], "left");
  drawText(dateStr, pageWidth - margin, margin + 19, 9, "normal", [100, 100, 100], "right");

  if (data.valid_until) {
    drawText("Valid Until:", rightColX, margin + 24, 9, "bold", [50, 50, 50], "left");
    drawText(new Date(data.valid_until).toLocaleDateString('en-GB'), pageWidth - margin, margin + 24, 9, "normal", [100, 100, 100], "right");
  }

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, margin + 30, pageWidth - margin, margin + 30);

  // BILL TO
  drawText("Quote To:", margin, margin + 40, 10, "bold", [50, 50, 50]);
  drawText(data.customer_name || "Customer Name", margin, margin + 46, 12, "bold", [33, 37, 41]);
  if (data.customer_address) {
    const splitAddr = doc.splitTextToSize(data.customer_address, 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(splitAddr, margin, margin + 52);
  }

  if (data.job_title) {
    drawText("Project / Subject:", pageWidth - margin - 80, margin + 40, 10, "bold", [50, 50, 50]);
    const splitJob = doc.splitTextToSize(data.job_title, 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(splitJob, pageWidth - margin - 80, margin + 46);
  }

  // TABLE
  let subtotal = 0;
  const tableData: any[] = [];
  
  items.forEach((item: any, i: number) => {
    const qty = Number(item.qty) || 1;
    const rate = Number(item.unit_price) || 0;
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
  const discountAmt = Number(data.discount_amount) || 0;
  if (discountAmt > 0) {
    drawText("Discount:", totalsX, currentY, 9, "bold", [50, 50, 50]);
    drawText("-" + discountAmt.toFixed(2), valuesX, currentY, 9, "normal", [80, 80, 80], "right");
    currentY += 6;
  }

  const taxAmt = Number(data.tax_amount) || 0;
  if (taxAmt > 0) {
    drawText("Tax (%):", totalsX, currentY, 9, "bold", [50, 50, 50]);
    drawText(taxAmt.toFixed(2), valuesX, currentY, 9, "normal", [80, 80, 80], "right");
    currentY += 6;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(totalsX, currentY, valuesX, currentY);
  currentY += 6;

  const totalAmount = Number(data.total_amount) || (subtotal - discountAmt + taxAmt);
  drawText("TOTAL AMOUNT:", totalsX, currentY, 10, "bold", [33, 37, 41]);
  drawText(totalAmount.toFixed(2), valuesX, currentY, 11, "bold", [249, 115, 22], "right");

  // FOOTER / TERMS
  const termsY = pageHeight - 50;
  doc.line(margin, termsY - 5, pageWidth - margin, termsY - 5);
  
  drawText("Terms & Conditions", margin, termsY, 9, "bold", [50, 50, 50]);
  drawText("1. 100% advance payment required to commence work.", margin, termsY + 6, 8, "normal", [100, 100, 100]);
  drawText("2. Validity of this quotation is 30 days.", margin, termsY + 11, 8, "normal", [100, 100, 100]);
  drawText("3. Final deliverables subject to approval.", margin, termsY + 16, 8, "normal", [100, 100, 100]);

  drawText("Authorized Signatory", pageWidth - margin, termsY + 20, 9, "bold", [50, 50, 50], "right");

  doc.save(`Quotation_${data.quotation_number || "Draft"}.pdf`);
  return doc;
}
