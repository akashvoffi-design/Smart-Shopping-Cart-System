'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Pencil,
  Save,
  LogOut,
  Database,
  CreditCard,
  Zap,
} from 'lucide-react';
import GlassIcon from '@/components/GlassIcon';
import { createClient } from '@/utils/supabase/client';

export interface CustomerData {
  id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  upi_id?: string;
  created_at?: string;
  last_login_at?: string;
  verified?: boolean;
}

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: CustomerData;
  onCustomerUpdated?: (updated: CustomerData) => void;
}

export default function CustomerProfileModal({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated,
}: CustomerProfileModalProps) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState(customer?.full_name || 'Akash Sharma');
  const [email, setEmail] = useState(customer?.email || 'akash.sharma@example.com');
  const [phone, setPhone] = useState(customer?.phone || '+91 98765 43210');
  const [upiId, setUpiId] = useState(customer?.upi_id || 'akash@okhdfcbank');

  // Sync state whenever customer prop changes or modal opens
  useEffect(() => {
    if (customer) {
      if (customer.full_name) setFullName(customer.full_name);
      if (customer.email) setEmail(customer.email);
      if (customer.phone) setPhone(customer.phone);
      if (customer.upi_id) setUpiId(customer.upi_id);
    }
  }, [customer, isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'AS';
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          upi_id: upiId.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update customer details.');
      }

      const updatedCustomer: CustomerData = data.customer;

      // Update browser local storage
      if (typeof window !== 'undefined') {
        if (updatedCustomer.full_name) localStorage.setItem('smartcart_user_name', updatedCustomer.full_name);
        if (updatedCustomer.upi_id) localStorage.setItem('smartcart_user_upi', updatedCustomer.upi_id);
        if (updatedCustomer.email) localStorage.setItem('smartcart_user_email', updatedCustomer.email);
        if (updatedCustomer.phone) localStorage.setItem('smartcart_user_phone', updatedCustomer.phone);

        window.dispatchEvent(
          new CustomEvent('customer-account-updated', { detail: updatedCustomer })
        );
      }

      if (onCustomerUpdated) {
        onCustomerUpdated(updatedCustomer);
      }

      setSuccessMsg('Account details saved & synced to Supabase!');
      setIsEditing(false);

      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => {});
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.removeItem('smartcart_user_name');
      localStorage.removeItem('smartcart_user_upi');
      localStorage.removeItem('smartcart_user_email');
      localStorage.removeItem('smartcart_user_phone');
      localStorage.removeItem('smartcart_customer_id');
      sessionStorage.removeItem('smartcart_checkout_key');

      window.dispatchEvent(
        new CustomEvent('customer-account-updated', { detail: { full_name: 'Guest Shopper', email: '', phone: '', upi_id: '' } })
      );
      window.dispatchEvent(new CustomEvent('smartcart_auth_changed', { detail: { action: 'logout' } }));
    }
    onClose();
    router.push('/auth');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Outer Frosted Glass Card Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderRadius: '38px',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 30px 80px -15px rgba(59, 130, 246, 0.25), inset 0 1.5px 2px rgba(255, 255, 255, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '12px',
        }}
      >
        {/* 1. Header Banner: 3D Frosted Blue Gradient with Glass Bubbles */}
        <div
          style={{
            background: 'linear-gradient(135deg, #70b4ff 0%, #3b82f6 50%, #2563eb 100%)',
            borderRadius: '28px',
            padding: '24px 26px',
            position: 'relative',
            color: '#ffffff',
            boxShadow: '0 12px 30px rgba(37, 99, 235, 0.28), inset 0 1.5px 2px rgba(255, 255, 255, 0.8)',
            overflow: 'hidden',
          }}
        >
          {/* Ambient 3D Glass Light Spheres */}
          <div
            style={{
              position: 'absolute',
              top: '-15px',
              left: '10px',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-25px',
              right: '25px',
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Close button with circular glass frosted look */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 99,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.95)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(239, 68, 68, 0.45), 0 2px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.15s ease',
              pointerEvents: 'auto',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title="Close Profile"
            aria-label="Close Profile"
          >
            <X style={{ width: '20px', height: '20px', strokeWidth: 2.8, pointerEvents: 'none' }} />
          </button>

          {/* Avatar and Shopper Credentials */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative', zIndex: 2 }}>
            {/* Glowing 3D Water Bubble Glass Avatar */}
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.75) 0%, rgba(147, 197, 253, 0.5) 45%, rgba(37, 99, 235, 0.8) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: '#ffffff',
                boxShadow: '0 10px 24px rgba(29, 78, 216, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(255, 255, 255, 0.8)',
                position: 'relative',
              }}
            >
              {getInitials(fullName)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  {fullName}
                </h2>
                <span
                  style={{
                    background: 'rgba(236, 253, 245, 0.95)',
                    border: '1px solid #6ee7b7',
                    backdropFilter: 'blur(8px)',
                    color: '#059669',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <ShieldCheck style={{ width: '12px', height: '12px', strokeWidth: 2.5 }} />
                  Verified Shopper
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#eff6ff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <Database style={{ width: '13px', height: '13px', color: '#dbeafe' }} />
                Supabase Backend Synced • Cart #SC-01
              </p>
            </div>
          </div>
        </div>

        {/* 2. Modal Body: Account Information Section */}
        <div style={{ padding: '20px 18px 12px', overflowY: 'auto', maxHeight: '68vh' }}>
          {/* Notifications */}
          {successMsg && (
            <div
              style={{
                background: 'rgba(236, 253, 245, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid #a7f3d0',
                color: '#065f46',
                borderRadius: '16px',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0 }} />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                background: 'rgba(254, 242, 242, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid #fecaca',
                color: '#991b1b',
                borderRadius: '16px',
                padding: '12px 16px',
                marginBottom: '16px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0 }} />
              {errorMsg}
            </div>
          )}

          {/* Section Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              padding: '0 4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GlassIcon icon={UserRound} color="purple" size={36} glow />
              <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                Account Information
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              style={{
                background: isEditing ? '#e2e8f0' : 'rgba(255, 255, 255, 0.95)',
                border: '1.5px solid rgba(219, 234, 254, 0.9)',
                borderRadius: '14px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                color: isEditing ? '#0f172a' : '#2563eb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)',
                transition: 'all 0.15s ease',
              }}
            >
              <Edit3 style={{ width: '13px', height: '13px' }} />
              {isEditing ? 'Cancel Editing' : 'Edit Profile'}
            </button>
          </div>

          {/* 3. Form Inputs with Inset Raised Glassy Badges */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Field 1: Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', paddingLeft: '4px' }}>
                Full Name
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: isEditing ? '#ffffff' : 'rgba(240, 246, 255, 0.65)',
                  border: isEditing ? '1.5px solid #3b82f6' : '1.5px solid rgba(255, 255, 255, 0.95)',
                  borderRadius: '18px',
                  boxShadow: isEditing ? '0 0 0 3px rgba(59, 130, 246, 0.18)' : '0 2px 10px rgba(59, 130, 246, 0.04), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
                  padding: '5px',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Glassmorphic Icon Badge */}
                <GlassIcon icon={UserRound} color="blue" size={38} />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Akash Sharma"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1e293b',
                  }}
                />
              </div>
            </div>

            {/* Field 2: Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', paddingLeft: '4px' }}>
                Email Address <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>(Supabase Auth Identifier)</span>
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: isEditing ? '#ffffff' : 'rgba(240, 246, 255, 0.65)',
                  border: isEditing ? '1.5px solid #3b82f6' : '1.5px solid rgba(255, 255, 255, 0.95)',
                  borderRadius: '18px',
                  boxShadow: isEditing ? '0 0 0 3px rgba(59, 130, 246, 0.18)' : '0 2px 10px rgba(59, 130, 246, 0.04), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
                  padding: '5px',
                  transition: 'all 0.2s ease',
                }}
              >
                <GlassIcon icon={Mail} color="blue" size={38} />
                <input
                  type="email"
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="akash.sharma@example.com"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1e293b',
                  }}
                />
              </div>
            </div>

            {/* Field 3: Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px', paddingLeft: '4px' }}>
                Phone Number
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: isEditing ? '#ffffff' : 'rgba(240, 246, 255, 0.65)',
                  border: isEditing ? '1.5px solid #3b82f6' : '1.5px solid rgba(255, 255, 255, 0.95)',
                  borderRadius: '18px',
                  boxShadow: isEditing ? '0 0 0 3px rgba(59, 130, 246, 0.18)' : '0 2px 10px rgba(59, 130, 246, 0.04), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
                  padding: '5px',
                  transition: 'all 0.2s ease',
                }}
              >
                <GlassIcon icon={Phone} color="blue" size={38} />
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1e293b',
                  }}
                />
              </div>
            </div>

            {/* Field 4: UPI ID (Pay via UPI) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', padding: '0 4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  UPI ID <span style={{ color: '#64748b', fontWeight: 500 }}>(Pay via UPI)</span>
                </label>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#059669',
                    fontWeight: 700,
                    background: 'rgba(236, 253, 245, 0.95)',
                    border: '1px solid #6ee7b7',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Auto-Checkout Enabled
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: isEditing ? '#ffffff' : 'rgba(240, 246, 255, 0.65)',
                  border: isEditing ? '1.5px solid #3b82f6' : '1.5px solid rgba(255, 255, 255, 0.95)',
                  borderRadius: '18px',
                  boxShadow: isEditing ? '0 0 0 3px rgba(59, 130, 246, 0.18)' : '0 2px 10px rgba(59, 130, 246, 0.04), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
                  padding: '5px',
                  transition: 'all 0.2s ease',
                }}
              >
                <GlassIcon icon={Zap} color="purple" size={38} glow />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="akash@okhdfcbank"
                  style={{
                    flex: 1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    padding: '8px 12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1e293b',
                  }}
                />
              </div>
            </div>

            {/* Action buttons when editing */}
            {isEditing && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '13px 18px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    border: 'none',
                    borderRadius: '16px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                  }}
                >
                  <Save style={{ width: '16px', height: '16px' }} />
                  {loading ? 'Saving to Supabase...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '13px 18px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1.5px solid rgba(226, 232, 240, 0.9)',
                    borderRadius: '16px',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>

          {/* 4. Footer Bar */}
          <div
            style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(226, 232, 240, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '4px',
              paddingRight: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Active Cloud Session</span>
            </div>

            <button
              onClick={handleSignOut}
              style={{
                background: 'rgba(254, 242, 242, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(254, 202, 202, 0.8)',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px 6px 8px',
                borderRadius: '9999px',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.08)',
                transition: 'all 0.15s ease',
              }}
            >
              <GlassIcon icon={LogOut} color="pink" size={24} shape="circle" />
              Switch Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
