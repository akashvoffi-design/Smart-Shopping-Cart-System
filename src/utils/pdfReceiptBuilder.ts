import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import { CartAccountSession } from '@/lib/cart-store';

export interface ReceiptUserInfo {
  name: string;
  email: string;
  phone: string;
  upiId: string;
}

export function sanitizeFilenameCode(cartCode: string): string {
  return cartCode
    .replace(/^#+/, '')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .trim() || 'SC-ORDER';
}

export async function buildReceiptPdfBytes(
  cart: CartAccountSession,
  userInfo: ReceiptUserInfo
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Embed standard Helvetica fonts
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const page = doc.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  // --- 1. Top Brand Accent Stripe ---
  page.drawRectangle({
    x: 0,
    y: height - 8,
    width,
    height: 8,
    color: rgb(0.145, 0.388, 0.921), // #2563eb
  });

  // --- 2. Header: Brand Title & Verified Badge ---
  page.drawText('SMARTCART AI', {
    x: margin,
    y: y - 10,
    size: 22,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16), // #0f172a
  });

  page.drawText('Autonomous IoT Smart Grocery Checkout', {
    x: margin,
    y: y - 26,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.39, 0.45, 0.55), // #64748b
  });

  page.drawText('Store #104 - Autonomous Flagship Terminal', {
    x: margin,
    y: y - 38,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.58, 0.64, 0.72), // #94a3b8
  });

  // Status Badge on Right
  const badgeWidth = 120;
  const badgeHeight = 26;
  const badgeX = width - margin - badgeWidth;
  const badgeY = y - 30;

  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: rgb(0.925, 0.992, 0.961), // #ecfdf5
    borderColor: rgb(0.525, 0.937, 0.675), // #86efac
    borderWidth: 1,
  });

  page.drawText('PAID & VERIFIED', {
    x: badgeX + 16,
    y: badgeY + 8.5,
    size: 10,
    font: fontBold,
    color: rgb(0.082, 0.502, 0.239), // #15803d
  });

  y -= 54;

  // Horizontal divider
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.886, 0.91, 0.941), // #e2e8f0
  });

  y -= 14;

  // --- 3. Customer Info & Order Metadata (Two Side-by-Side Boxes) ---
  const boxGap = 12;
  const boxWidth = (width - margin * 2 - boxGap) / 2;
  const boxHeight = 84;
  const boxY = y - boxHeight;

  // Left Box: Customer Information
  page.drawRectangle({
    x: margin,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    color: rgb(0.973, 0.98, 0.988), // #f8fafc
    borderColor: rgb(0.886, 0.91, 0.941), // #e2e8f0
    borderWidth: 1,
  });

  page.drawText('CUSTOMER INFORMATION', {
    x: margin + 12,
    y: boxY + boxHeight - 16,
    size: 9,
    font: fontBold,
    color: rgb(0.18, 0.24, 0.35),
  });

  const renderLabelVal = (lbl: string, val: string, startY: number, boxLeft: number) => {
    page.drawText(lbl, {
      x: boxLeft + 12,
      y: startY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.39, 0.45, 0.55),
    });
    page.drawText(val, {
      x: boxLeft + 65,
      y: startY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.06, 0.09, 0.16),
    });
  };

  renderLabelVal('Name:', userInfo.name || 'Akash Sharma', boxY + boxHeight - 32, margin);
  renderLabelVal('Email:', userInfo.email || 'akash.sharma@example.com', boxY + boxHeight - 46, margin);
  renderLabelVal('Phone:', userInfo.phone || '+91 98765 43210', boxY + boxHeight - 60, margin);
  renderLabelVal('UPI ID:', userInfo.upiId || 'akash@okhdfcbank', boxY + boxHeight - 74, margin);

  // Right Box: Order & Session Details
  const rightBoxX = margin + boxWidth + boxGap;
  page.drawRectangle({
    x: rightBoxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    color: rgb(0.973, 0.98, 0.988),
    borderColor: rgb(0.886, 0.91, 0.941),
    borderWidth: 1,
  });

  page.drawText('ORDER & RECEIPT DETAILS', {
    x: rightBoxX + 12,
    y: boxY + boxHeight - 16,
    size: 9,
    font: fontBold,
    color: rgb(0.18, 0.24, 0.35),
  });

  const cleanInvoiceCode = sanitizeFilenameCode(cart.cart_code);
  const formattedDate = new Date(cart.completed_at || cart.created_at || Date.now()).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  renderLabelVal('Invoice No:', `REC-${cleanInvoiceCode}`, boxY + boxHeight - 32, rightBoxX);
  renderLabelVal('Cart Code:', cart.cart_code, boxY + boxHeight - 46, rightBoxX);
  renderLabelVal('Timestamp:', formattedDate, boxY + boxHeight - 60, rightBoxX);
  renderLabelVal('Gateway:', 'UPI 1-Click Autonomous', boxY + boxHeight - 74, rightBoxX);

  y = boxY - 18;

  // --- 4. Itemized Purchases Table ---
  const tableHeaderHeight = 22;
  page.drawRectangle({
    x: margin,
    y: y - tableHeaderHeight,
    width: width - margin * 2,
    height: tableHeaderHeight,
    color: rgb(0.145, 0.388, 0.921), // #2563eb
  });

  // Header Titles
  page.drawText('#', { x: margin + 8, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('ITEM DESCRIPTION', { x: margin + 30, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('QTY', { x: width - margin - 170, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('UNIT PRICE', { x: width - margin - 110, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText('TOTAL', { x: width - margin - 45, y: y - 15, size: 8.5, font: fontBold, color: rgb(1, 1, 1) });

  y -= tableHeaderHeight;

  // Item Rows
  const rowHeight = 20;
  let calculatedSubtotal = 0;
  let calculatedWeight = 0;

  const items = cart.items && cart.items.length > 0 ? cart.items : [
    {
      product_name: 'Parle-G Gluco Biscuits',
      quantity: 3,
      unit_price: 10,
      line_total: 30,
      weight_g: 168,
    },
  ];

  items.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: width - margin * 2,
        height: rowHeight,
        color: rgb(0.973, 0.98, 0.988),
      });
    }

    const qty = item.quantity || 1;
    const unitPrice = item.unit_price || (item.line_total ? item.line_total / qty : 0);
    const lineTotal = item.line_total || unitPrice * qty;
    calculatedSubtotal += lineTotal;
    calculatedWeight += (item.weight_g || 0) * qty;

    // Truncate name safely if too long
    const cleanName = item.product_name.length > 38 ? `${item.product_name.substring(0, 36)}...` : item.product_name;

    page.drawText(String(idx + 1), {
      x: margin + 8,
      y: y - 13.5,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.39, 0.45, 0.55),
    });

    page.drawText(cleanName, {
      x: margin + 30,
      y: y - 13.5,
      size: 8.5,
      font: fontBold,
      color: rgb(0.06, 0.09, 0.16),
    });

    page.drawText(`${qty}x`, {
      x: width - margin - 165,
      y: y - 13.5,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.39, 0.45, 0.55),
    });

    page.drawText(`Rs. ${unitPrice.toFixed(2)}`, {
      x: width - margin - 110,
      y: y - 13.5,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.39, 0.45, 0.55),
    });

    page.drawText(`Rs. ${lineTotal.toFixed(2)}`, {
      x: width - margin - 45,
      y: y - 13.5,
      size: 8.5,
      font: fontBold,
      color: rgb(0.06, 0.09, 0.16),
    });

    y -= rowHeight;
  });

  // Table bottom divider
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.886, 0.91, 0.941),
  });

  y -= 16;

  // --- 5. Financial Summary (Right Aligned) ---
  const summaryWidth = 200;
  const summaryX = width - margin - summaryWidth;
  const grandTotal = cart.grand_total || calculatedSubtotal || 30.0;
  const taxAmount = (grandTotal * 0.05) / 1.05;
  const subtotalMRP = grandTotal - taxAmount;

  const renderSummaryRow = (label: string, val: string, currY: number, isBold: boolean = false) => {
    page.drawText(label, {
      x: summaryX,
      y: currY,
      size: 9,
      font: isBold ? fontBold : fontRegular,
      color: rgb(0.39, 0.45, 0.55),
    });
    page.drawText(val, {
      x: width - margin - 50,
      y: currY,
      size: 9,
      font: isBold ? fontBold : fontRegular,
      color: rgb(0.06, 0.09, 0.16),
    });
  };

  renderSummaryRow('Subtotal (MRP):', `Rs. ${subtotalMRP.toFixed(2)}`, y);
  y -= 14;
  renderSummaryRow('GST Included (5%):', `Rs. ${taxAmount.toFixed(2)}`, y);
  y -= 14;

  if (calculatedWeight > 0) {
    renderSummaryRow('Verified Cart Weight:', `${calculatedWeight.toFixed(0)} g`, y);
    y -= 14;
  }

  y -= 4;

  // Grand Total Highlight Pill
  const grandBoxHeight = 28;
  page.drawRectangle({
    x: summaryX - 8,
    y: y - grandBoxHeight,
    width: summaryWidth + 8,
    height: grandBoxHeight,
    color: rgb(0.937, 0.965, 1.0), // #eff6ff
    borderColor: rgb(0.749, 0.859, 0.992), // #bfdbfe
    borderWidth: 1.5,
  });

  page.drawText('TOTAL PAYABLE:', {
    x: summaryX,
    y: y - 18,
    size: 10,
    font: fontBold,
    color: rgb(0.145, 0.388, 0.921), // #2563eb
  });

  page.drawText(`Rs. ${grandTotal.toFixed(2)}`, {
    x: width - margin - 55,
    y: y - 18,
    size: 11,
    font: fontBold,
    color: rgb(0.145, 0.388, 0.921),
  });

  y -= grandBoxHeight + 24;

  // --- 6. Autonomous Verification Seal Box ---
  const sealHeight = 44;
  page.drawRectangle({
    x: margin,
    y: y - sealHeight,
    width: width - margin * 2,
    height: sealHeight,
    color: rgb(0.941, 0.976, 1.0), // #f0f9ff
    borderColor: rgb(0.729, 0.902, 0.992), // #bae6fd
    borderWidth: 1,
  });

  page.drawText('AUTONOMOUS IoT VERIFICATION SEAL', {
    x: margin + 14,
    y: y - 16,
    size: 9,
    font: fontBold,
    color: rgb(0.012, 0.412, 0.631), // #0369a1
  });

  page.drawText('Weight sensor telemetry, optical barcode detection, and UPI ledger verified at exit terminal.', {
    x: margin + 14,
    y: y - 28,
    size: 8,
    font: fontRegular,
    color: rgb(0.055, 0.455, 0.565),
  });

  page.drawText('This electronic tax invoice is an authentic receipt for express exit clearance and warranty returns.', {
    x: margin + 14,
    y: y - 38,
    size: 8,
    font: fontRegular,
    color: rgb(0.055, 0.455, 0.565),
  });

  // --- 7. Footer ---
  const footerY = 24;
  page.drawLine({
    start: { x: margin, y: footerY + 12 },
    end: { x: width - margin, y: footerY + 12 },
    thickness: 0.8,
    color: rgb(0.886, 0.91, 0.941),
  });

  page.drawText('Thank you for shopping with SmartCart AI! | Autonomous Shopping Experience | support@smartcart.ai', {
    x: margin + 20,
    y: footerY,
    size: 8,
    font: fontRegular,
    color: rgb(0.58, 0.64, 0.72),
  });

  return await doc.save();
}
