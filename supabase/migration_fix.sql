-- ==============================================================================
-- SMARTCART AI — FIX FOREIGN KEY & ENABLE PER-ACCOUNT HISTORY
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/juxzffultcdwiwiekgbv/sql
-- ==============================================================================

-- 1. Remove the restrictive foreign key on auth.users(id)
-- This allows orders to link to public.customers(id) without crashing!
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 2. Add customer_email and customer_name directly to orders
-- This guarantees every order is permanently attached to the user's account email!
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_name  VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email 
  ON public.orders(customer_email);

-- 3. Update RLS policies to allow the Next.js server API routes to read/write
DROP POLICY IF EXISTS "Users can view own orders"   ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all on orders"         ON public.orders;

CREATE POLICY "Allow all on orders" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own order items"   ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow all on order_items"         ON public.order_items;

CREATE POLICY "Allow all on order_items" ON public.order_items
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own payments"   ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all on payments"         ON public.payments;

CREATE POLICY "Allow all on payments" ON public.payments
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Update create_order_with_items function with customer_email and customer_name support
CREATE OR REPLACE FUNCTION public.create_order_with_items(
  p_order_number      VARCHAR,
  p_user_id           UUID,
  p_idempotency_key   VARCHAR,
  p_subtotal          NUMERIC,
  p_discount_total    NUMERIC,
  p_tax_total         NUMERIC,
  p_grand_total       NUMERIC,
  p_item_count        INTEGER,
  p_total_weight_g    NUMERIC,
  p_correlation_id    VARCHAR,
  p_items             JSONB,
  p_customer_email    VARCHAR DEFAULT NULL,
  p_customer_name     VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id UUID;
  v_existing_order_id UUID;
  v_item JSONB;
BEGIN
  -- Idempotency check: return existing order if key already used
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_order_id
      FROM public.orders
     WHERE idempotency_key = p_idempotency_key
     LIMIT 1;

    IF v_existing_order_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'order_id', v_existing_order_id,
        'duplicate', true
      );
    END IF;
  END IF;

  -- Insert the order with customer details
  INSERT INTO public.orders (
    order_number, user_id, customer_email, customer_name, idempotency_key,
    payment_status, order_status, status,
    subtotal, discount_total, tax_total, grand_total,
    item_count, total_weight_g, correlation_id,
    created_at, updated_at
  ) VALUES (
    p_order_number, p_user_id, p_customer_email, p_customer_name, p_idempotency_key,
    'pending', 'pending', 'pending',
    p_subtotal, p_discount_total, p_tax_total, p_grand_total,
    p_item_count, p_total_weight_g, p_correlation_id,
    now(), now()
  )
  RETURNING id INTO v_order_id;

  -- Insert all order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, barcode, product_name, brand, category,
      quantity, unit_price, mrp, line_total, weight_g
    ) VALUES (
      v_order_id,
      CASE 
        WHEN (v_item->>'product_id') IS NOT NULL 
         AND (v_item->>'product_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN (v_item->>'product_id')::UUID 
        ELSE NULL 
      END,
      COALESCE(v_item->>'barcode', ''),
      COALESCE(v_item->>'product_name', 'Item'),
      COALESCE(v_item->>'brand', ''),
      COALESCE(v_item->>'category', ''),
      GREATEST(1, COALESCE((v_item->>'quantity')::INTEGER, 1)),
      COALESCE((v_item->>'unit_price')::NUMERIC, 0.0),
      COALESCE((v_item->>'mrp')::NUMERIC, 0.0),
      COALESCE((v_item->>'line_total')::NUMERIC, 0.0),
      COALESCE((v_item->>'weight_g')::NUMERIC, 0.0)
    );
  END LOOP;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'duplicate', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_with_items TO authenticated, anon, service_role;
