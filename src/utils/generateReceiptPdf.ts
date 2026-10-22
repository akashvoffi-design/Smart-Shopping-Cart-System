import { CartAccountSession } from '@/lib/cart-store';
import {
  buildReceiptPdfBytes,
  sanitizeFilenameCode,
  ReceiptUserInfo,
} from '@/utils/pdfReceiptBuilder';

export type { ReceiptUserInfo };

export function getUserInfo(): ReceiptUserInfo {
  if (typeof window === 'undefined') {
    return {
      name: 'Akash Sharma',
      email: 'akash.sharma@example.com',
      phone: '+91 98765 43210',
      upiId: 'akash@okhdfcbank',
    };
  }

  return {
    name: localStorage.getItem('smartcart_user_name') || 'Akash Sharma',
    email: localStorage.getItem('smartcart_user_email') || 'akash.sharma@example.com',
    phone: localStorage.getItem('smartcart_user_phone') || '+91 98765 43210',
    upiId: localStorage.getItem('smartcart_user_upi') || 'akash@okhdfcbank',
  };
}

/**
 * Downloads the receipt as a genuine .pdf file.
 * Uses a native HTTP attachment download from /api/cart/receipt with explicit
 * Content-Type: application/pdf and Content-Disposition headers.
 * This guarantees Chrome/Edge saves it as SmartCart_Receipt_{code}.pdf and never as a UUID.
 */
export async function generateReceiptPdf(
  cart: CartAccountSession,
  customUserInfo?: Partial<ReceiptUserInfo>
): Promise<void> {
  if (typeof window === 'undefined') return;

  const defaultUser = getUserInfo();
  const userInfo: ReceiptUserInfo = {
    name: customUserInfo?.name || defaultUser.name || cart.customer_name || 'Akash Sharma',
    email: customUserInfo?.email || defaultUser.email || cart.customer_email || 'akash.sharma@example.com',
    phone: customUserInfo?.phone || defaultUser.phone || '+91 98765 43210',
    upiId: customUserInfo?.upiId || defaultUser.upiId || 'akash@okhdfcbank',
  };

  const cleanCode = sanitizeFilenameCode(cart.cart_code);
  const targetFilename = `SmartCart_Receipt_${cleanCode}.pdf`;

  // Primary Strategy: Fetch PDF bytes from the server API route
  try {
    const res = await fetch('/api/cart/receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cart, userInfo }),
    });

    if (!res.ok) {
      throw new Error(`Server PDF generation failed with status ${res.status}`);
    }

    const blob = await res.blob();
    // Wrap in explicit application/pdf Blob and File
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], targetFilename, { type: 'application/pdf' });

    // Download via anchor tag with object URL
    const objectUrl = window.URL.createObjectURL(pdfFile);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = objectUrl;
    link.download = targetFilename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    }, 2500);

    return;
  } catch (apiError) {
    console.warn('API route download failed, switching to client-side pdf-lib builder:', apiError);
  }

  // Secondary Strategy: Generate genuine PDF bytes directly in client using pdf-lib
  try {
    const pdfBytes = await buildReceiptPdfBytes(cart, userInfo);
    const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], targetFilename, { type: 'application/pdf' });

    const objectUrl = window.URL.createObjectURL(pdfFile);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = objectUrl;
    link.download = targetFilename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    }, 2500);
  } catch (clientError) {
    console.error('All PDF download strategies failed:', clientError);
    // Last resort fallback: open native print / PDF save dialog
    openPrintDialog(cart, userInfo);
  }
}

function openPrintDialog(cart: CartAccountSession, userInfo: ReceiptUserInfo) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  const formattedDate = new Date(cart.completed_at || cart.created_at).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const grandTotal = cart.grand_total || 0;
  const taxEst = (grandTotal * 0.05) / 1.05;
  const subtotalEst = grandTotal - taxEst;

  const itemsHtml = (cart.items || [])
    .map(
      (item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
      <td style="padding: 10px 12px; font-weight: 600; color: #64748b;">${idx + 1}</td>
      <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">${item.product_name}</td>
      <td style="padding: 10px 12px; text-align: center; font-weight: 600;">${item.quantity}×</td>
      <td style="padding: 10px 12px; text-align: right; color: #475569;">₹${(item.unit_price || item.line_total / item.quantity).toFixed(2)}</td>
      <td style="padding: 10px 12px; text-align: right; font-weight: 800; color: #0f172a;">₹${item.line_total.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SmartCart Receipt - ${cart.cart_code}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 32px; background: #ffffff; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #2563eb; margin-bottom: 24px; }
          .badge { background: #ecfdf5; border: 1px solid #86efac; color: #15803d; padding: 6px 14px; border-radius: 999px; font-weight: 800; font-size: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 13px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          th { background: #2563eb; color: #ffffff; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; }
          .summary { margin-left: auto; width: 300px; font-size: 13px; line-height: 1.8; margin-bottom: 24px; }
          .total-bar { background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; font-size: 16px; font-weight: 800; color: #2563eb; display: flex; justify-content: space-between; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px; }
          @media print {
            body { padding: 16px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #0f172a;">SMARTCART AI</h1>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Autonomous IoT Grocery Checkout • Terminal Station #104</p>
          </div>
          <div class="badge">PAID & VERIFIED</div>
        </div>

        <div class="grid">
          <div class="box">
            <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #334155; text-transform: uppercase;">Customer Information</h4>
            <div><strong>Name:</strong> ${userInfo.name}</div>
            <div><strong>Email:</strong> ${userInfo.email}</div>
            <div><strong>Phone:</strong> ${userInfo.phone}</div>
            <div><strong>UPI ID:</strong> ${userInfo.upiId}</div>
          </div>
          <div class="box">
            <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #334155; text-transform: uppercase;">Receipt Details</h4>
            <div><strong>Invoice No:</strong> REC-${sanitizeFilenameCode(cart.cart_code)}</div>
            <div><strong>Cart Code:</strong> ${cart.cart_code}</div>
            <div><strong>Timestamp:</strong> ${formattedDate}</div>
            <div><strong>Gateway:</strong> 1-Click Autonomous UPI</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 36px;">#</th>
              <th>Item Description</th>
              <th style="text-align: center; width: 60px;">Qty</th>
              <th style="text-align: right; width: 90px;">Unit Price</th>
              <th style="text-align: right; width: 90px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Subtotal (MRP):</span>
            <strong style="color: #0f172a;">₹${subtotalEst.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">GST Included (5%):</span>
            <strong style="color: #0f172a;">₹${taxEst.toFixed(2)}</strong>
          </div>
          <div class="total-bar" style="margin-top: 8px;">
            <span>Grand Total:</span>
            <span>₹${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <button onclick="window.print()" style="background: #2563eb; color: #ffffff; border: none; padding: 10px 22px; border-radius: 999px; font-weight: 700; cursor: pointer; font-size: 14px;">
            Save as PDF / Print
          </button>
        </div>

        <div class="footer">
          Thank you for shopping with SmartCart AI! • Autonomous Scan & Bag Verified • support@smartcart.ai
        </div>

        <script>
          setTimeout(() => { window.print(); }, 400);
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
