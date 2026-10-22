import { NextRequest, NextResponse } from 'next/server';
import { getCartHistoryForCustomer, CartAccountSession } from '@/lib/cart-store';
import {
  buildReceiptPdfBytes,
  sanitizeFilenameCode,
  ReceiptUserInfo,
} from '@/utils/pdfReceiptBuilder';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let cart: CartAccountSession;
    let userInfo: ReceiptUserInfo;

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const rawCart = formData.get('cart');
      const rawUser = formData.get('userInfo');
      cart = rawCart ? JSON.parse(rawCart.toString()) : null;
      userInfo = rawUser ? JSON.parse(rawUser.toString()) : null;
    } else {
      const body = await request.json();
      cart = body.cart;
      userInfo = body.userInfo;
    }

    if (!userInfo) {
      userInfo = {
        name: 'Akash Sharma',
        email: 'akash.sharma@example.com',
        phone: '+91 98765 43210',
        upiId: 'akash@okhdfcbank',
      };
    }

    if (!cart || !cart.cart_code) {
      return NextResponse.json(
        { success: false, error: 'Invalid cart session data provided' },
        { status: 400 }
      );
    }

    const pdfBytes = await buildReceiptPdfBytes(cart, userInfo);
    const cleanCode = sanitizeFilenameCode(cart.cart_code);
    const filename = `SmartCart_Receipt_${cleanCode}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(pdfBytes.byteLength),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error('Error generating PDF receipt in POST route:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Failed to generate PDF receipt' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartCodeParam = searchParams.get('cart_code');
    const emailParam = searchParams.get('email') || undefined;
    const nameParam = searchParams.get('name') || 'Akash Sharma';

    if (!cartCodeParam) {
      return NextResponse.json(
        { success: false, error: 'cart_code query parameter is required' },
        { status: 400 }
      );
    }

    // Try finding in existing history
    const history = getCartHistoryForCustomer(emailParam);
    const cleanSearchCode = cartCodeParam.replace(/^#+/, '').trim().toLowerCase();
    let foundCart = history.find(
      (c) => c.cart_code.replace(/^#+/, '').trim().toLowerCase() === cleanSearchCode
    );

    if (!foundCart) {
      // Fallback virtual session for this cart code
      foundCart = {
        id: `virtual_${Date.now()}`,
        cart_code: cartCodeParam.startsWith('#') ? cartCodeParam : `#${cartCodeParam}`,
        customer_email: emailParam || 'akash@gmail.com',
        customer_name: nameParam,
        status: 'completed',
        items: [
          {
            barcode: '8901063012480',
            product_name: 'Parle-G Gluco Biscuits',
            quantity: 3,
            unit_price: 10,
            line_total: 30,
            weight_g: 168,
          },
        ],
        item_count: 3,
        grand_total: 30.0,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
    }

    const userInfo: ReceiptUserInfo = {
      name: nameParam,
      email: emailParam || foundCart.customer_email || 'akash.sharma@example.com',
      phone: '+91 98765 43210',
      upiId: 'akash@okhdfcbank',
    };

    const pdfBytes = await buildReceiptPdfBytes(foundCart, userInfo);
    const cleanCode = sanitizeFilenameCode(foundCart.cart_code);
    const filename = `SmartCart_Receipt_${cleanCode}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(pdfBytes.byteLength),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error('Error generating PDF receipt in GET route:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Failed to generate PDF receipt' },
      { status: 500 }
    );
  }
}
