'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Phone,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  X,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectUrl = searchParams.get('redirect') || searchParams.get('next') || '/';

  // Mode: signin vs signup
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // Form Fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');

  // Password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotMessage, setForgotMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [verifyingSession, setVerifyingSession] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Persistent Session Check:
  // If user already has an active session, redirect immediately to their dashboard!
  useEffect(() => {
    let isMounted = true;
    async function checkExistingSession() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (isMounted && user && !error) {
          const meta = user.user_metadata || {};
          if (typeof window !== 'undefined') {
            if (meta.full_name) localStorage.setItem('smartcart_user_name', meta.full_name);
            if (user.email) localStorage.setItem('smartcart_user_email', user.email);
            if (meta.phone) localStorage.setItem('smartcart_user_phone', meta.phone);
            if (meta.upi_id) localStorage.setItem('smartcart_user_upi', meta.upi_id);
            localStorage.setItem('smartcart_customer_id', user.id);
          }
          const target = redirectUrl.startsWith('/') && !redirectUrl.startsWith('//') ? redirectUrl : '/';
          router.replace(target);
          return;
        }
      } catch (err) {
        console.warn('Session check warning:', err);
      } finally {
        if (isMounted) setVerifyingSession(false);
      }
    }

    checkExistingSession();
    return () => {
      isMounted = false;
    };
  }, [router, redirectUrl, supabase]);

  // Main Submit (Sign In or Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      setLoading(false);
      return;
    }

    if (!password) {
      setMessage({ type: 'error', text: 'Password is required.' });
      setLoading(false);
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signin') {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (authError || !authData.user) {
          throw new Error(
            authError?.message === 'Invalid login credentials'
              ? 'Invalid email or password. Please verify your credentials and try again.'
              : authError?.message || 'Failed to sign in. Please verify your credentials.'
          );
        }

        // Fetch customer profile from backend
        const res = await fetch('/api/customers');
        const profileData = await res.json();

        const activeCustomer = profileData.customer || {
          id: authData.user.id,
          full_name: authData.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: authData.user.user_metadata?.phone || '',
          upi_id: authData.user.user_metadata?.upi_id || '',
        };

        if (typeof window !== 'undefined') {
          localStorage.removeItem('smartcart_user_name');
          localStorage.removeItem('smartcart_user_email');
          localStorage.removeItem('smartcart_user_phone');
          localStorage.removeItem('smartcart_user_upi');
          localStorage.removeItem('smartcart_customer_id');
          sessionStorage.removeItem('smartcart_checkout_key');

          if (activeCustomer.full_name) localStorage.setItem('smartcart_user_name', activeCustomer.full_name);
          if (activeCustomer.email) localStorage.setItem('smartcart_user_email', activeCustomer.email);
          if (activeCustomer.phone) localStorage.setItem('smartcart_user_phone', activeCustomer.phone);
          if (activeCustomer.upi_id) localStorage.setItem('smartcart_user_upi', activeCustomer.upi_id);
          if (activeCustomer.id) localStorage.setItem('smartcart_customer_id', activeCustomer.id);

          window.dispatchEvent(new CustomEvent('smartcart_customer_updated', { detail: activeCustomer }));
          window.dispatchEvent(new CustomEvent('customer-account-updated', { detail: activeCustomer }));
          window.dispatchEvent(new CustomEvent('smartcart_auth_changed', { detail: { action: 'signin', customer: activeCustomer } }));
        }

        setMessage({
          type: 'success',
          text: `Welcome back, ${activeCustomer.full_name}! Redirecting to your dashboard...`,
        });

        const target = redirectUrl.startsWith('/') && !redirectUrl.startsWith('//') ? redirectUrl : '/';
        setTimeout(() => {
          router.replace(target);
        }, 800);
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: fullName.trim() || 'Valued Shopper',
              phone: phone.trim() || '',
              upi_id: upiId.trim() || '',
            },
          },
        });

        if (signUpError) {
          throw new Error(signUpError.message || 'Unable to create account. Please try again.');
        }

        const syncRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'signup',
            full_name: fullName.trim() || 'Valued Shopper',
            email: cleanEmail,
            phone: phone.trim() || '',
            upi_id: upiId.trim() || '',
            password: password,
          }),
        });
        const syncData = await syncRes.json();
        const activeCustomer = syncData.customer || {
          id: signUpData.user?.id || `cust_${Date.now()}`,
          full_name: fullName.trim() || 'Valued Shopper',
          email: cleanEmail,
          phone: phone.trim(),
          upi_id: upiId.trim(),
        };

        if (typeof window !== 'undefined') {
          localStorage.removeItem('smartcart_user_name');
          localStorage.removeItem('smartcart_user_email');
          localStorage.removeItem('smartcart_user_phone');
          localStorage.removeItem('smartcart_user_upi');
          localStorage.removeItem('smartcart_customer_id');
          sessionStorage.removeItem('smartcart_checkout_key');

          if (activeCustomer.full_name) localStorage.setItem('smartcart_user_name', activeCustomer.full_name);
          if (activeCustomer.email) localStorage.setItem('smartcart_user_email', activeCustomer.email);
          if (activeCustomer.phone) localStorage.setItem('smartcart_user_phone', activeCustomer.phone);
          if (activeCustomer.upi_id) localStorage.setItem('smartcart_user_upi', activeCustomer.upi_id);
          if (activeCustomer.id) localStorage.setItem('smartcart_customer_id', activeCustomer.id);

          window.dispatchEvent(new CustomEvent('smartcart_customer_updated', { detail: activeCustomer }));
          window.dispatchEvent(new CustomEvent('customer-account-updated', { detail: activeCustomer }));
          window.dispatchEvent(new CustomEvent('smartcart_auth_changed', { detail: { action: 'signup', customer: activeCustomer } }));
        }

        setMessage({
          type: 'success',
          text: `Account created for ${activeCustomer.full_name}! Redirecting to your dashboard...`,
        });

        const target = redirectUrl.startsWith('/') && !redirectUrl.startsWith('//') ? redirectUrl : '/';
        setTimeout(() => {
          router.replace(target);
        }, 1000);
      }
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: (err as Error).message || 'Authentication failed. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage(null);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setForgotMessage({ type: 'error', text: 'Please enter a valid email address.' });
      setForgotLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login?reset=success` : undefined,
      });

      if (error) {
        throw new Error(error.message || 'Failed to send password reset instructions.');
      }

      setForgotMessage({
        type: 'success',
        text: `Password reset instructions sent to ${cleanEmail}. Check your inbox.`,
      });
    } catch (err: unknown) {
      setForgotMessage({
        type: 'error',
        text: (err as Error).message || 'Failed to request password reset.',
      });
    } finally {
      setForgotLoading(false);
    }
  };

  if (verifyingSession) {
    return (
      <div className="luxury-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="hero-bg-layer" />
        <div className="hero-overlay-layer" />
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '36px 44px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            borderRadius: '32px',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 25px 60px rgba(59, 130, 246, 0.16)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
            }}
          >
            <RefreshCw className="animate-spin" style={{ width: '26px', height: '26px', color: '#059669' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Verifying Session
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#64748b', margin: 0 }}>
              Connecting securely to SmartCart AI...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="luxury-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="hero-bg-layer" />
      <div className="hero-overlay-layer" />

      {/* Ambient 3D Frosted Water Bubbles */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '12%',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 32% 32%, rgba(255, 255, 255, 0.95), rgba(219, 234, 254, 0.45) 60%, rgba(191, 219, 254, 0.15) 100%)',
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
          width: '290px',
          height: '290px',
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
          left: '7%',
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
          width: '230px',
          height: '230px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(224, 231, 255, 0.4) 60%, rgba(199, 210, 254, 0.1) 100%)',
          filter: 'blur(4px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Luxury Glassmorphic Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(255, 255, 255, 0.84)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderRadius: '40px',
          border: '2px solid rgba(255, 255, 255, 0.96)',
          boxShadow: '0 35px 90px -20px rgba(59, 130, 246, 0.28), inset 0 2px 4px rgba(255, 255, 255, 1), 0 10px 30px rgba(0, 0, 0, 0.04)',
          padding: mode === 'signin' ? '30px 36px 28px' : '26px 36px 24px',
          maxHeight: 'calc(100% - 32px)',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top 3D Cart Badge */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            margin: '0 auto 14px',
            background: 'rgba(255, 255, 255, 0.92)',
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
            alt="SmartCart AI"
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 10px rgba(34, 197, 94, 0.3))',
            }}
          />
        </div>

        {/* Headings */}
        <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#0f172a',
              margin: '0 0 4px',
            }}
          >
            {mode === 'signin' ? 'Welcome to SmartCart' : 'Create Your Account'}
          </h1>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#64748b',
              margin: 0,
            }}
          >
            {mode === 'signin'
              ? 'Sign in to access your autonomous cart & receipts'
              : 'Register your profile for automated checkout'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '5px',
            borderRadius: '9999px',
            background: 'rgba(241, 245, 249, 0.85)',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            marginBottom: '20px',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
            position: 'relative',
            zIndex: 2,
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
              padding: '9px 16px',
              borderRadius: '9999px',
              border: 'none',
              background: mode === 'signin' ? '#ffffff' : 'transparent',
              color: mode === 'signin' ? '#0f172a' : '#64748b',
              fontSize: '13.5px',
              fontWeight: mode === 'signin' ? 800 : 600,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: mode === 'signin' ? '0 4px 14px rgba(0, 0, 0, 0.08)' : 'none',
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
              padding: '9px 16px',
              borderRadius: '9999px',
              border: 'none',
              background: mode === 'signup' ? '#ffffff' : 'transparent',
              color: mode === 'signup' ? '#0f172a' : '#64748b',
              fontSize: '13.5px',
              fontWeight: mode === 'signup' ? 800 : 600,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: mode === 'signup' ? '0 4px 14px rgba(0, 0, 0, 0.08)' : 'none',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '16px',
              marginBottom: '18px',
              background: message.type === 'success' ? 'rgba(236, 253, 245, 0.95)' : 'rgba(254, 242, 242, 0.95)',
              border: `1.5px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {message.type === 'success' ? (
              <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '1px', color: '#059669' }} />
            ) : (
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '1px', color: '#dc2626' }} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 2 }}>
          {mode === 'signup' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Full Name
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1.5px solid rgba(226, 232, 240, 0.9)',
                  borderRadius: '14px',
                  padding: '0 14px',
                }}
              >
                <User style={{ width: '17px', height: '17px', color: '#94a3b8', marginRight: '10px' }} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Akash Sharma"
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Email Address
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1.5px solid rgba(226, 232, 240, 0.9)',
                borderRadius: '14px',
                padding: '0 14px',
              }}
            >
              <Mail style={{ width: '17px', height: '17px', color: '#94a3b8', marginRight: '10px' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '12px 0',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Mobile Number
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1.5px solid rgba(226, 232, 240, 0.9)',
                    borderRadius: '14px',
                    padding: '0 14px',
                  }}
                >
                  <Phone style={{ width: '17px', height: '17px', color: '#94a3b8', marginRight: '10px' }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{
                      width: '100%',
                      padding: '12px 0',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  UPI ID (For AutoPay Checkout)
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1.5px solid rgba(226, 232, 240, 0.9)',
                    borderRadius: '14px',
                    padding: '0 14px',
                  }}
                >
                  <Wallet style={{ width: '17px', height: '17px', color: '#94a3b8', marginRight: '10px' }} />
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    style={{
                      width: '100%',
                      padding: '12px 0',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom: mode === 'signin' ? '12px' : '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#2563eb',
                    cursor: 'pointer',
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1.5px solid rgba(226, 232, 240, 0.9)',
                borderRadius: '14px',
                padding: '0 14px',
              }}
            >
              <Lock style={{ width: '17px', height: '17px', color: '#94a3b8', marginRight: '10px' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create a secure password (min 6 chars)' : 'Enter your password'}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                {showPassword ? <EyeOff style={{ width: '17px', height: '17px' }} /> : <Eye style={{ width: '17px', height: '17px' }} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 12px 28px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s ease',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" style={{ width: '18px', height: '18px' }} />
                <span>{mode === 'signin' ? 'Authenticating...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In to Dashboard' : 'Complete Registration'}</span>
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#64748b',
            fontSize: '12px',
            fontWeight: 600,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <ShieldCheck style={{ width: '15px', height: '15px', color: '#10b981' }} />
          <span>Protected by Supabase Auth & PostgreSQL RLS</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForgotModal(false);
              setForgotMessage(null);
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              background: '#ffffff',
              borderRadius: '28px',
              border: '2px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
              padding: '28px 30px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Reset Password</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>We will email you a password reset link</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMessage(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {forgotMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  marginBottom: '14px',
                  background: forgotMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${forgotMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  color: forgotMessage.type === 'success' ? '#065f46' : '#991b1b',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {forgotMessage.type === 'success' ? (
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#059669', flexShrink: 0, marginTop: '1px' }} />
                ) : (
                  <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
                )}
                <span>{forgotMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Registered Email Address
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0 12px',
                  }}
                >
                  <Mail style={{ width: '16px', height: '16px', color: '#94a3b8', marginRight: '8px' }} />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotMessage(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    opacity: forgotLoading ? 0.75 : 1,
                  }}
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="luxury-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="hero-bg-layer" />
          <div className="hero-overlay-layer" />
          <RefreshCw className="animate-spin" style={{ width: '32px', height: '32px', color: '#10b981' }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
