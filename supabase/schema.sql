-- ==============================================================================
-- SMART SHOPPING CART SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- Project: https://juxzffultcdwiwiekgbv.supabase.co
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode VARCHAR(64) UNIQUE NOT NULL,
    barcode_type VARCHAR(32) NOT NULL DEFAULT 'synthetic_demo', -- 'authentic_ean13' | 'synthetic_demo'
    barcode_provenance VARCHAR(128) DEFAULT 'catalog_import',
    product_name TEXT NOT NULL,
    brand VARCHAR(128) NOT NULL DEFAULT 'General',
    mrp NUMERIC(10, 2) NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL,
    discount_pct NUMERIC(5, 1) DEFAULT 0.0,
    weight_g NUMERIC(10, 1) NOT NULL DEFAULT 100.0,
    unit_type VARCHAR(32) DEFAULT 'weight', -- 'weight' | 'volume' | 'count' | 'unit'
    raw_quantity VARCHAR(64),
    category VARCHAR(128) NOT NULL DEFAULT 'Grocery & Staples',
    subcategory VARCHAR(128),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products USING gin(to_tsvector('english', product_name));

-- -----------------------------------------------------------------------------
-- 2. CARTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_token VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'abandoned'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_carts_user ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session ON public.carts(session_token);

-- -----------------------------------------------------------------------------
-- 3. CART_ITEMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    barcode VARCHAR(64) NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL,
    line_total NUMERIC(10, 2) NOT NULL,
    weight_g NUMERIC(10, 1) NOT NULL,
    total_weight_g NUMERIC(10, 1) NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_cart_product UNIQUE(cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);

-- -----------------------------------------------------------------------------
-- 4. ORDERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cart_id UUID REFERENCES public.carts(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed' | 'cancelled'
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(10, 2) NOT NULL,
    item_count INTEGER NOT NULL DEFAULT 0,
    total_weight_g NUMERIC(10, 1) NOT NULL DEFAULT 0.0,
    correlation_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- -----------------------------------------------------------------------------
-- 5. ORDER_ITEMS TABLE (Snapshots at time of order)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    barcode VARCHAR(64) NOT NULL,
    product_name TEXT NOT NULL,
    brand VARCHAR(128),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL,
    line_total NUMERIC(10, 2) NOT NULL,
    weight_g NUMERIC(10, 1) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- -----------------------------------------------------------------------------
-- 6. PAYMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider VARCHAR(64) NOT NULL DEFAULT 'demo', -- 'demo' | 'razorpay' | 'upi'
    provider_reference VARCHAR(128),
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
    correlation_id VARCHAR(128) NOT NULL,
    payment_method VARCHAR(64) DEFAULT 'upi_qr',
    metadata JSONB DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_corr ON public.payments(correlation_id);

-- -----------------------------------------------------------------------------
-- 7. DEVICES & IOT WEIGHT TELEMETRY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
    device_id VARCHAR(64) PRIMARY KEY,
    device_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'offline', -- 'online' | 'offline' | 'simulated'
    tare_offset NUMERIC(10, 1) DEFAULT 0.0,
    last_weight_g NUMERIC(10, 1) DEFAULT 0.0,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.weight_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) NOT NULL REFERENCES public.devices(device_id) ON DELETE CASCADE,
    weight_g NUMERIC(10, 1) NOT NULL,
    delta_g NUMERIC(10, 1) NOT NULL DEFAULT 0.0,
    stable BOOLEAN NOT NULL DEFAULT true,
    correlation_id VARCHAR(128),
    event_type VARCHAR(64) DEFAULT 'weight_sample', -- 'weight_sample' | 'item_placed' | 'item_removed' | 'tare'
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_telemetry_device ON public.weight_telemetry(device_id, recorded_at DESC);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_telemetry ENABLE ROW LEVEL SECURITY;

-- Products: readable by everyone
CREATE POLICY "Public products viewable by all" ON public.products
    FOR SELECT USING (true);

-- Carts: viewable and modifiable by owner or anonymous session holder
CREATE POLICY "Users can manage own carts" ON public.carts
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Cart items: viewable and modifiable through cart ownership
CREATE POLICY "Users can manage own cart items" ON public.cart_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.carts 
            WHERE carts.id = cart_items.cart_id 
            AND (carts.user_id = auth.uid() OR carts.user_id IS NULL)
        )
    );

-- Orders: users view own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Order items: viewable by order owner
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );

-- Payments: viewable by order owner
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = payments.order_id 
            AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
        )
    );

-- Devices & telemetry: public read/write for demo IoT prototype
CREATE POLICY "Public device telemetry access" ON public.devices
    FOR ALL USING (true);

CREATE POLICY "Public weight telemetry insert" ON public.weight_telemetry
    FOR ALL USING (true);

-- -----------------------------------------------------------------------------
-- 8. CUSTOMERS TABLE (Stores Registration, UPI & Login Details)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    upi_id TEXT,
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_auth_user ON public.customers(auth_user_id);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow public read so the IoT Smart Cart & Navigation displays customer profile
CREATE POLICY "Allow public read customers" ON public.customers
    FOR SELECT USING (true);

-- Allow authenticated and anonymous operations for kiosk / smart cart app
CREATE POLICY "Allow insert customers" ON public.customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update customers" ON public.customers
    FOR UPDATE USING (true);

-- -----------------------------------------------------------------------------
-- 9. AUTH SYNC TRIGGERS (Auto-sync Supabase Auth signups into public.customers)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.customers (id, auth_user_id, full_name, email, phone, upi_id, last_login_at, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'upi_id', ''),
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.customers.full_name END,
    phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.customers.phone END,
    upi_id = CASE WHEN EXCLUDED.upi_id <> '' THEN EXCLUDED.upi_id ELSE public.customers.upi_id END,
    last_login_at = timezone('utc', now()),
    updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user registration in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger on user login: Supabase Auth updates last_sign_in_at on each login
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS trigger AS $$
BEGIN
  UPDATE public.customers
  SET 
    last_login_at = NEW.last_sign_in_at,
    updated_at = timezone('utc', now())
  WHERE auth_user_id = NEW.id OR email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_login();

-- Grant permissions to Supabase roles
GRANT ALL ON TABLE public.customers TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 10. SAMPLE REGISTERED CUSTOMER (For instant app preview)
-- -----------------------------------------------------------------------------
INSERT INTO public.customers (full_name, email, phone, upi_id)
VALUES ('Akash v', 'akash@gmail.com', '6369135512', '6369135512@sbi')
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  upi_id = EXCLUDED.upi_id,
  last_login_at = timezone('utc', now());

-- -----------------------------------------------------------------------------
-- 11. CART HISTORY & SESSIONS TABLE (Backend Stored History)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_code VARCHAR(32) NOT NULL, -- e.g. '#SC-01', '#SC-02'
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'completed', -- 'active' | 'completed' | 'archived'
    item_count INTEGER NOT NULL DEFAULT 0,
    grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_cart_history_email ON public.cart_history(customer_email);
CREATE INDEX IF NOT EXISTS idx_cart_history_cart_code ON public.cart_history(cart_code);

-- Enable RLS
ALTER TABLE public.cart_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read cart_history" ON public.cart_history
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert cart_history" ON public.cart_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update cart_history" ON public.cart_history
    FOR UPDATE USING (true);

GRANT ALL ON TABLE public.cart_history TO anon, authenticated, service_role;

-- Seed Cart History for Akash v
INSERT INTO public.cart_history (cart_code, customer_email, customer_name, status, item_count, grand_total, items, created_at, completed_at)
VALUES 
(
  '#SC-01',
  'akash@gmail.com',
  'Akash v',
  'completed',
  4,
  470.00,
  '[
    {"barcode": "8901030000001", "product_name": "Fortune Sunlite Refined Sunflower Oil 1L", "quantity": 1, "unit_price": 145.0, "line_total": 145.0},
    {"barcode": "8901030000002", "product_name": "Tata Salt Vacuum Evaporated Iodised 1kg", "quantity": 2, "unit_price": 25.0, "line_total": 50.0},
    {"barcode": "8901030000003", "product_name": "Amul Pasteurised Butter 500g", "quantity": 1, "unit_price": 275.0, "line_total": 275.0}
  ]'::jsonb,
  timezone('utc', now() - INTERVAL '2 days'),
  timezone('utc', now() - INTERVAL '2 days' + INTERVAL '30 minutes')
),
(
  '#SC-01',
  'akash@gmail.com',
  'Akash v',
  'completed',
  3,
  480.00,
  '[
    {"barcode": "8901030000004", "product_name": "Aashirvaad Shudh Chakki Atta 5kg", "quantity": 1, "unit_price": 260.0, "line_total": 260.0},
    {"barcode": "8901030000005", "product_name": "India Gate Basmati Rice Feast Rozzana 1kg", "quantity": 2, "unit_price": 110.0, "line_total": 220.0}
  ]'::jsonb,
  timezone('utc', now() - INTERVAL '1 day'),
  timezone('utc', now() - INTERVAL '1 day' + INTERVAL '25 minutes')
);

