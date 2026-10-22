import { NextRequest, NextResponse } from 'next/server';
import { getProductByBarcode, searchProducts, getCategories, getAuthenticReferenceItems } from '@/lib/products';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const limit = parseInt(searchParams.get('limit') || '24', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const getReference = searchParams.get('reference') === 'true';
  const getCats = searchParams.get('categories') === 'true';

  if (getCats) {
    return NextResponse.json({ categories: getCategories() });
  }

  if (getReference) {
    return NextResponse.json({ items: getAuthenticReferenceItems() });
  }

  if (barcode) {
    const product = getProductByBarcode(barcode);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found', barcode },
        { status: 404 }
      );
    }
    return NextResponse.json({ product });
  }

  const result = searchProducts(query, category, limit, offset);
  return NextResponse.json({
    items: result.items,
    total: result.total,
    limit,
    offset,
  });
}
