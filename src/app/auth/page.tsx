'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. Establish browser Supabase session so cookies are synced for API routes
      try {
        if (mode === 'signup') {
          await supabase.auth.signUp({
            email: email.trim(),
            password: password || 'DefaultPass123!',
            options: {
              data: {
                full_name: fullName || '',
                phone: phone || '',
                upi_id: upiId || '',
              },
            },
          });
        } else {
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password || 'DefaultPass123!',
          });
        }
      } catch (clientAuthErr) {
        console.warn('Client Supabase auth non-fatal notice:', clientAuthErr);
      }

      // 2. Authoritative customer profile registration/sync in backend
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          full_name: fullName,
          email,
          phone,
          upi_id: upiId,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process customer account');
      }

      const customer = data.customer;
      if (typeof window !== 'undefined') {
        // Clear stale data from any prior session first
        localStorage.removeItem('smartcart_user_name');
        localStorage.removeItem('smartcart_user_email');
        localStorage.removeItem('smartcart_user_phone');
        localStorage.removeItem('smartcart_user_upi');
        localStorage.removeItem('smartcart_customer_id');
        sessionStorage.removeItem('smartcart_checkout_key');

        if (customer.full_name) localStorage.setItem('smartcart_user_name', customer.full_name);
        if (customer.email) localStorage.setItem('smartcart_user_email', customer.email);
        if (customer.phone) localStorage.setItem('smartcart_user_phone', customer.phone);
        if (customer.upi_id) localStorage.setItem('smartcart_user_upi', customer.upi_id);
        if (customer.id) localStorage.setItem('smartcart_customer_id', customer.id);

        window.dispatchEvent(new CustomEvent('smartcart_customer_updated', { detail: customer }));
        window.dispatchEvent(new CustomEvent('customer-account-updated', { detail: customer }));
        window.dispatchEvent(new CustomEvent('smartcart_auth_changed', { detail: { action: mode, customer } }));
      }

      setMessage({
        type: 'success',
        text: mode === 'signup'
          ? `✓ Account registered! Customer profile for "${customer.full_name}" connected to Supabase.`
          : `✓ Signed in as "${customer.full_name}". Redirecting...`,
      });

      setTimeout(() => router.push('/'), 1200);
    } catch (err) {
      setMessage({
        type: 'error',
        text: (err as Error).message || 'Authentication error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestDemo = () => {
    router.push('/');
  };

  return (
    <div className="luxury-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background Architectural Layer & Gradient Overlay identical to Dashboard */}
      <div className="hero-bg-layer" />
      <div className="hero-overlay-layer" />
      {/* Ambient Floating 3D Frosted Water Bubbles */}
      <div
        style={{
          position: 'absolute',
          top: '4%',
          left: '12%',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 32% 32%, rgba(255, 255, 255, 0.95), rgba(219, 234, 254, 0.5) 60%, rgba(191, 219, 254, 0.2) 100%)',
          filter: 'blur(3px)',
          boxShadow: '0 12px 36px rgba(59, 130, 246, 0.15)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '8%',
          right: '10%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.9), rgba(224, 242, 254, 0.45) 60%, rgba(186, 230, 253, 0.15) 100%)',
          filter: 'blur(4px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          left: '6%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.85), rgba(219, 234, 254, 0.4) 65%, rgba(191, 219, 254, 0.1) 100%)',
          filter: 'blur(5px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '8%',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(224, 231, 255, 0.4) 60%, rgba(199, 210, 254, 0.1) 100%)',
          filter: 'blur(4px)',
          pointerEvents: 'none',
        }}
      />

      {/* Return Pill Navigation in top header */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          zIndex: 20,
        }}
      >
        <Link
          href="/"
          prefetch={true}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 22px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '2px solid rgba(255, 255, 255, 0.98)',
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.18), 0 2px 6px rgba(0, 0, 0, 0.04)',
            textDecoration: 'none',
            color: '#0f172a',
            fontSize: '14.5px',
            fontWeight: 800,
            transition: 'all 0.15s ease',
            cursor: 'pointer',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px', color: '#10b981', strokeWidth: 2.5 }} />
          </div>
          <span>Back to Cart</span>
        </Link>
      </div>

      {/* Main Glassmorphic Card (Matches Attached Design Exactly) */}
      <div
        className="auth-glass-card"
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(255, 255, 255, 0.74)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderRadius: '44px',
          border: '2px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 35px 90px -20px rgba(59, 130, 246, 0.28), inset 0 2px 4px rgba(255, 255, 255, 1), 0 10px 30px rgba(0, 0, 0, 0.03)',
          padding: mode === 'signin' ? '28px 34px 26px' : '26px 34px 24px',
          maxHeight: 'calc(100% - 24px)',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <style jsx>{`
          .auth-glass-card::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
        `}</style>
        {/* Integrated Subsurface Bubble Highlights at Card Corners */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95), rgba(219, 234, 254, 0.45) 60%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '-30px',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.9), rgba(219, 234, 254, 0.38) 60%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '15px',
            left: '-25px',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.9), rgba(224, 231, 255, 0.35) 65%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-25px',
            right: '-20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.9), rgba(219, 234, 254, 0.4) 60%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top 3D Green Cart Badge */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            margin: '0 auto 12px',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.98)',
            boxShadow: '0 10px 24px rgba(59, 130, 246, 0.16), inset 0 3px 6px #ffffff, inset 0 -2px 5px rgba(191, 219, 254, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src="/icons/cart.png"
            alt="SmartCart"
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 10px rgba(34, 197, 94, 0.3))',
            }}
          />
        </div>

        {/* Headings */}
        <div style={{ textAlign: 'center', marginBottom: '18px', position: 'relative', zIndex: 2 }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.025em',
              margin: '0 0 4px 0',
              lineHeight: 1.25,
            }}
          >
            {mode === 'signin' ? 'Sign In to SmartCart' : 'Create Customer Account'}
          </h1>
          <p
            style={{
              fontSize: '12.5px',
              fontWeight: 500,
              color: '#64748b',
              margin: 0,
              lineHeight: 1.35,
            }}
          >
            Synchronize your shopping session and receipts with Supabase
          </p>
        </div>

        {/* Pill Segmented Tab Switcher */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            background: 'rgba(224, 235, 253, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '9999px',
            padding: '4px',
            border: '1.5px solid rgba(255, 255, 255, 0.9)',
            marginBottom: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setMessage(null);
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              background: mode === 'signin' ? '#ffffff' : 'transparent',
              color: mode === 'signin' ? '#4338ca' : '#64748b',
              boxShadow: mode === 'signin' ? '0 4px 14px rgba(67, 56, 202, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setMessage(null);
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              background: mode === 'signup' ? '#ffffff' : 'transparent',
              color: mode === 'signup' ? '#4338ca' : '#64748b',
              boxShadow: mode === 'signup' ? '0 4px 14px rgba(67, 56, 202, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Register
          </button>
        </div>

        {/* Input Form Fields */}
        <form
          onSubmit={handleSubmit}
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '7px',
                  }}
                >
                  Full Name
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '52px',
                    borderRadius: '20px',
                    background: 'rgba(238, 245, 255, 0.65)',
                    border: '1.5px solid rgba(224, 236, 255, 0.95)',
                    boxShadow: 'inset 0 2px 4px rgba(148, 163, 184, 0.08)',
                    padding: '0 8px 0 10px',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      borderRadius: '13px',
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      border: '1.5px solid rgba(255, 255, 255, 0.95)',
                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.14), inset 0 1px 2px #ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User style={{ width: '18px', height: '18px', color: '#2563eb' }} />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Akash Sharma"
                    style={{
                      flex: 1,
                      height: '100%',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>

              {/* Phone Number (Optional) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '7px',
                  }}
                >
                  Phone Number (Optional)
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '52px',
                    borderRadius: '20px',
                    background: 'rgba(238, 245, 255, 0.65)',
                    border: '1.5px solid rgba(224, 236, 255, 0.95)',
                    boxShadow: 'inset 0 2px 4px rgba(148, 163, 184, 0.08)',
                    padding: '0 8px 0 10px',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      borderRadius: '13px',
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      border: '1.5px solid rgba(255, 255, 255, 0.95)',
                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.14), inset 0 1px 2px #ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Phone style={{ width: '18px', height: '18px', color: '#2563eb' }} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{
                      flex: 1,
                      height: '100%',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>

              {/* UPI ID (Pay via UPI) */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '7px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    UPI ID (Pay via UPI)
                  </label>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '8px',
                      border: '1px solid rgba(134, 239, 172, 0.6)',
                    }}
                  >
                    AutoPay Linked
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '52px',
                    borderRadius: '20px',
                    background: 'rgba(238, 245, 255, 0.65)',
                    border: '1.5px solid rgba(224, 236, 255, 0.95)',
                    boxShadow: 'inset 0 2px 4px rgba(148, 163, 184, 0.08)',
                    padding: '0 8px 0 10px',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      borderRadius: '13px',
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      border: '1.5px solid rgba(255, 255, 255, 0.95)',
                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.14), inset 0 1px 2px #ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Zap style={{ width: '18px', height: '18px', color: '#2563eb' }} />
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. akash@okhdfcbank or phone@upi"
                    style={{
                      flex: 1,
                      height: '100%',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    marginTop: '5px',
                    marginLeft: '2px',
                    display: 'block',
                  }}
                >
                  Pre-links your UPI handle for 1-click autonomous checkout.
                </span>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '7px',
              }}
            >
              Email Address
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '52px',
                borderRadius: '20px',
                background: 'rgba(238, 245, 255, 0.65)',
                border: '1.5px solid rgba(224, 236, 255, 0.95)',
                boxShadow: 'inset 0 2px 4px rgba(148, 163, 184, 0.08)',
                padding: '0 8px 0 10px',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  borderRadius: '13px',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  border: '1.5px solid rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 2px 6px rgba(59, 130, 246, 0.14), inset 0 1px 2px #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail style={{ width: '18px', height: '18px', color: '#2563eb' }} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === 'signin' ? 'asd@gmail.com' : 'asd@gmial.com'}
                style={{
                  flex: 1,
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '7px',
              }}
            >
              Password
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '52px',
                borderRadius: '20px',
                background: 'rgba(238, 245, 255, 0.65)',
                border: '1.5px solid rgba(224, 236, 255, 0.95)',
                boxShadow: 'inset 0 2px 4px rgba(148, 163, 184, 0.08)',
                padding: '0 8px 0 10px',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  borderRadius: '13px',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  border: '1.5px solid rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 2px 6px rgba(59, 130, 246, 0.14), inset 0 1px 2px #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock style={{ width: '18px', height: '18px', color: '#2563eb' }} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                style={{
                  flex: 1,
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                  letterSpacing: password ? '0.15em' : 'normal',
                }}
              />
            </div>
          </div>

          {message && (
            <div
              style={{
                padding: '11px 16px',
                borderRadius: '16px',
                border: `1.5px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`,
                background: message.type === 'success' ? 'rgba(240, 253, 244, 0.85)' : 'rgba(254, 242, 242, 0.85)',
                color: message.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backdropFilter: 'blur(8px)',
              }}
            >
              {message.type === 'success' ? (
                <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0, color: '#16a34a' }} />
              ) : (
                <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0, color: '#dc2626' }} />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Glowing 3D Glass Pill Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              height: '54px',
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%)',
              border: '1.5px solid rgba(255, 255, 255, 0.45)',
              boxShadow: '0 12px 32px -4px rgba(16, 185, 129, 0.45), inset 0 2px 3px rgba(255, 255, 255, 0.65), inset 0 -2px 4px rgba(0, 0, 0, 0.2)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '4px',
              transition: 'all 0.2s ease',
            }}
          >
            {/* 3D Glass Pill End Highlight Orbs */}
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.08) 65%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.08) 65%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
            <span style={{ position: 'relative', zIndex: 2, letterSpacing: '0.01em' }}>
              {loading
                ? 'Processing...'
                : mode === 'signin'
                ? 'Sign In to SmartCart'
                : 'Register Account'}
            </span>
          </button>
        </form>

        {/* Divider: INSTANT EVALUATION */}
        <div style={{ position: 'relative', margin: '16px 0 14px', textAlign: 'center', zIndex: 2 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div style={{ width: '100%', borderTop: '1px solid rgba(203, 213, 225, 0.6)' }} />
          </div>
          <span
            style={{
              position: 'relative',
              background: 'rgba(240, 246, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              padding: '0 14px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontFamily: 'monospace',
            }}
          >
            Instant Evaluation
          </span>
        </div>

        {/* Guest Demo Shopper Button */}
        <button
          type="button"
          onClick={handleGuestDemo}
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            height: '46px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(168, 85, 247, 0.45)',
            boxShadow: '0 4px 16px rgba(168, 85, 247, 0.08)',
            color: '#4338ca',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '9px',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles style={{ width: '17px', height: '17px', color: '#7c3aed' }} />
          <span>Continue as Guest Demo Shopper</span>
        </button>
      </div>
    </div>
  );
}
