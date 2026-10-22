import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { registerCustomer, getCustomerByEmail, getActiveSessionCustomer, setActiveSessionCustomer } from '@/lib/customer-store';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Try to get Supabase session
    const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));

    if (session?.user) {
      // Check Supabase customers table first
      try {
        const { data: dbCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (dbCustomer) {
          return NextResponse.json({ success: true, customer: dbCustomer });
        }
      } catch {}

      const email = session.user.email || '';
      const meta = session.user.user_metadata || {};
      const customer = registerCustomer({
        full_name: meta.full_name || email.split('@')[0],
        email: email,
        phone: meta.phone || '',
        upi_id: meta.upi_id || '',
      });
      return NextResponse.json({ success: true, customer });
    }

    // 2. Fetch latest active customer and sync with Supabase customers table
    const active = getActiveSessionCustomer();
    if (active?.email) {
      try {
        const { data: dbCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('email', active.email.toLowerCase())
          .maybeSingle();

        if (dbCustomer) {
          return NextResponse.json({ success: true, customer: dbCustomer });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, customer: active });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Failed to fetch customer data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, full_name, email, phone, upi_id, password } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email address is required.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    let supabaseUser: { id: string; email?: string } | null = null;
    let supabaseError = null;

    if (mode === 'signup') {
      // 1. Attempt Supabase Auth Registration
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password || 'DefaultPass123!',
          options: {
            data: {
              full_name: full_name || '',
              phone: phone || '',
              upi_id: upi_id || '',
            },
          },
        });

        if (error) {
          console.warn('Supabase auth notice:', error.message);
          supabaseError = error.message;
        } else if (data?.user) {
          supabaseUser = { id: data.user.id, email: data.user.email };
        }
      } catch (authErr) {
        console.warn('Supabase signup exception handled:', authErr);
      }

      // 2. Authoritative backend registration
      const customer = registerCustomer({
        full_name: full_name || 'Valued Shopper',
        email: email.trim(),
        phone: phone || '',
        upi_id: upi_id || '',
      });

      // 3. Upsert to Supabase public.customers table
      try {
        const payload: Record<string, any> = {
          full_name: customer.full_name,
          email: customer.email.toLowerCase(),
          phone: customer.phone,
          upi_id: customer.upi_id,
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (supabaseUser?.id) {
          payload.id = supabaseUser.id;
        }
        await supabase.from('customers').upsert(payload, { onConflict: 'email' });
      } catch (err) {
        console.warn('Supabase customer table upsert error:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Customer Account created successfully!',
        customer,
        supabase_connected: !supabaseError,
      });
    } else {
      // Sign in mode
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password || '',
        });

        if (!error && data?.user) {
          supabaseUser = { id: data.user.id, email: data.user.email };
        }
      } catch {}

      // Update Supabase customer last_login_at
      try {
        await supabase
          .from('customers')
          .update({ last_login_at: new Date().toISOString() })
          .eq('email', email.trim().toLowerCase());
      } catch {}

      // Check if profile exists in Supabase
      try {
        const { data: dbCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        if (dbCustomer) {
          const customer = registerCustomer({
            full_name: dbCustomer.full_name,
            email: dbCustomer.email,
            phone: dbCustomer.phone || '',
            upi_id: dbCustomer.upi_id || '',
          });
          return NextResponse.json({
            success: true,
            message: 'Signed in successfully',
            customer,
          });
        }
      } catch {}

      const existing = getCustomerByEmail(email);
      if (existing) {
        setActiveSessionCustomer(existing.id);
        return NextResponse.json({
          success: true,
          message: 'Signed in successfully',
          customer: existing,
        });
      }

      // If user provided sign-in for unknown email, register on the fly
      const customer = registerCustomer({
        full_name: full_name || email.split('@')[0],
        email: email.trim(),
        phone: phone || '',
        upi_id: upi_id || '',
      });

      return NextResponse.json({
        success: true,
        message: 'Signed in successfully',
        customer,
      });
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Server error processing customer account' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, phone, upi_id } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Customer email is required to update account' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Update in customer store
    const customer = registerCustomer({
      full_name: full_name?.trim() || 'Valued Shopper',
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      upi_id: upi_id?.trim() || '',
    });

    // 2. Synchronize to Supabase customers table
    try {
      await supabase
        .from('customers')
        .update({
          full_name: customer.full_name,
          phone: customer.phone,
          upi_id: customer.upi_id,
          updated_at: new Date().toISOString(),
        })
        .eq('email', customer.email);
    } catch (dbErr) {
      console.warn('Supabase profile update warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      customer,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

