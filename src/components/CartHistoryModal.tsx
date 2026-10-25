'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  X,
  ShoppingBag,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  History,
  FileDown,
  AlertCircle,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import { CartAccountSession } from '@/lib/cart-store';
import GlassIcon from '@/components/GlassIcon';
import { generateReceiptPdf } from '@/utils/generateReceiptPdf';

interface CartHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerEmail?: string;
  onStartNewCart: () => void;
  activeCartCode: string;
}

export default function CartHistoryModal({
  isOpen,
  onClose,
  customerEmail,
  onStartNewCart,
  activeCartCode,
}: CartHistoryModalProps) {
  const [history, setHistory] = useState<CartAccountSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);

  const activeEmail = (
    customerEmail ||
    (typeof window !== 'undefined' ? localStorage.getItem('smartcart_user_email') || '' : '')
  ).trim().toLowerCase();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const emailToQuery = (
        customerEmail ||
        (typeof window !== 'undefined' ? localStorage.getItem('smartcart_user_email') || '' : '')
      ).trim().toLowerCase();

      // If an email exists, user is authenticated
      if (emailToQuery) {
        setIsAuthenticated(true);
      }

      const res = await fetch(`/api/cart/history?email=${encodeURIComponent(emailToQuery)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch purchase history from Supabase.');
      }

      setIsAuthenticated(data.authenticated !== false || Boolean(emailToQuery));
      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch (err: unknown) {
      console.error('[CartHistoryModal] Fetch error:', err);
      setError((err as Error).message || 'Unable to retrieve purchase history.');
    } finally {
      setLoading(false);
    }
  }, [customerEmail]);

  const handleDownload = async (cart: CartAccountSession) => {
    try {
      setDownloadingCode(cart.cart_code);
      await generateReceiptPdf(cart, { email: activeEmail });
    } finally {
      setTimeout(() => setDownloadingCode(null), 1200);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  // Re-fetch if customer account changes while modal is open
  useEffect(() => {
    const handleAccountUpdate = () => {
      if (isOpen) {
        fetchHistory();
      }
    };
    window.addEventListener('customer-account-updated', handleAccountUpdate);
    window.addEventListener('smartcart_customer_updated', handleAccountUpdate);
    return () => {
      window.removeEventListener('customer-account-updated', handleAccountUpdate);
      window.removeEventListener('smartcart_customer_updated', handleAccountUpdate);
    };
  }, [isOpen, fetchHistory]);

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

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
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
          maxWidth: '680px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderRadius: '38px',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: '0 30px 80px -15px rgba(59, 130, 246, 0.25), inset 0 1.5px 2px rgba(255, 255, 255, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          position: 'relative',
          padding: '12px',
        }}
      >
        {/* 1. Header Banner: 3D Frosted Blue Gradient with Glass Bubbles */}
        <div
          style={{
            background: 'linear-gradient(135deg, #70b4ff 0%, #3b82f6 50%, #2563eb 100%)',
            borderRadius: '28px',
            padding: '22px 26px',
            position: 'relative',
            color: '#ffffff',
            boxShadow: '0 12px 30px rgba(37, 99, 235, 0.28), inset 0 1.5px 2px rgba(255, 255, 255, 0.8)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Ambient 3D Glass Light Spheres */}
          <div
            style={{
              position: 'absolute',
              top: '-15px',
              left: '20px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-25px',
              right: '90px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Left Title and Glass Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
            <GlassIcon icon={History} color="purple" size={48} glow />

            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Cart & Order History
              </h2>
              {activeEmail && (
                <div style={{ fontSize: '12px', color: '#e0e7ff', marginTop: '3px', fontWeight: 600 }}>
                  Account: {activeEmail}
                </div>
              )}
            </div>
          </div>

          {/* Right Action: Refresh and Circular Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 10 }}>
            <button
              type="button"
              onClick={() => fetchHistory()}
              disabled={loading}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255, 255, 255, 0.8)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'default' : 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.15s ease',
              }}
              title="Refresh History from Supabase"
              aria-label="Refresh History"
            >
              <RefreshCw
                style={{
                  width: '18px',
                  height: '18px',
                  animation: loading ? 'spin 0.8s linear infinite' : 'none',
                }}
              />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              style={{
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
                zIndex: 99,
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              title="Close History"
              aria-label="Close History"
            >
              <X style={{ width: '20px', height: '20px', strokeWidth: 2.8, pointerEvents: 'none' }} />
            </button>
          </div>
        </div>

        {/* 2. Modal Body: History Content / Empty State / Error State */}
        <div style={{ padding: '24px 20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#475569' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  border: '3px solid rgba(37, 99, 235, 0.2)',
                  borderTopColor: '#2563eb',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 16px',
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading verified purchases from Supabase...</span>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: 'rgba(254, 242, 242, 0.8)',
                borderRadius: '20px',
                border: '1.5px solid #fecaca',
              }}
            >
              <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#991b1b', margin: '0 0 6px' }}>
                Unable to Load Purchase History
              </h3>
              <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 16px', maxWidth: '380px', marginInline: 'auto' }}>
                {error}
              </p>
              <button
                type="button"
                onClick={() => fetchHistory()}
                style={{
                  padding: '8px 20px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                }}
              >
                Retry
              </button>
            </div>
          ) : !isAuthenticated && history.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: 'rgba(240, 246, 255, 0.7)',
                borderRadius: '24px',
                border: '1.5px solid #dbeafe',
              }}
            >
              <GlassIcon icon={LogIn} color="blue" size={56} glow style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0' }}>
                Account Authentication Required
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', maxWidth: '380px', marginInline: 'auto', lineHeight: 1.5 }}>
                Sign in to your SmartCart account to sync and view your secure, permanent purchase history from Supabase.
              </p>
              <Link
                href="/login"
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                }}
              >
                Sign In / Register
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </Link>
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center' }}>
              <GlassIcon icon={ShoppingBag} color="blue" size={64} glow style={{ margin: '0 auto 18px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
                No Past Cart Sessions Yet
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, maxWidth: '360px', marginInline: 'auto', lineHeight: 1.5 }}>
                Orders completed and verified will appear here automatically, permanently stored in your Supabase account.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {history.map((cart, idx) => (
                <div
                  key={cart.id || idx}
                  style={{
                    background: 'rgba(240, 246, 255, 0.65)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '22px',
                    border: '1.5px solid rgba(255, 255, 255, 0.95)',
                    padding: '18px',
                    boxShadow: '0 4px 18px rgba(59, 130, 246, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Cart session top info */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                          color: '#1d4ed8',
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255, 255, 255, 0.8)',
                          boxShadow: '0 2px 6px rgba(59, 130, 246, 0.1)',
                        }}
                      >
                        {cart.cart_code}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                        <GlassIcon icon={CalendarDays} color="blue" size={18} shape="circle" />
                        {formatDate(cart.completed_at || cart.created_at)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#059669',
                          background: 'rgba(236, 253, 245, 0.95)',
                          border: '1px solid #6ee7b7',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                        Completed & Saved
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        ₹{cart.grand_total.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Item breakdown preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(226, 232, 240, 0.7)', paddingTop: '12px' }}>
                    {cart.items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: '#334155',
                          background: 'rgba(255, 255, 255, 0.7)',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.9)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#2563eb', fontWeight: 800 }}>{item.quantity}×</span>
                          <span style={{ fontWeight: 600 }}>{item.product_name}</span>
                        </span>
                        <span style={{ fontWeight: 800, color: '#1e293b' }}>
                          ₹{item.line_total.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Action Bar: Item count & Download Receipt button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(226, 232, 240, 0.85)',
                      paddingTop: '12px',
                      marginTop: '12px',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                      <span>{cart.items.reduce((acc, it) => acc + (it.quantity || 1), 0)} items</span>
                      <span style={{ margin: '0 6px', color: '#cbd5e1' }}>&bull;</span>
                      <span>Total: <strong style={{ color: '#0f172a', fontWeight: 800 }}>₹{cart.grand_total.toFixed(0)}</strong></span>
                    </div>

                    <button
                      type="button"
                      disabled={downloadingCode === cart.cart_code}
                      onClick={() => handleDownload(cart)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 16px',
                        borderRadius: '999px',
                        background:
                          downloadingCode === cart.cart_code
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 3px 10px rgba(37, 99, 235, 0.28)',
                        cursor: downloadingCode === cart.cart_code ? 'default' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (downloadingCode !== cart.cart_code) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 5px 14px rgba(37, 99, 235, 0.38)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 3px 10px rgba(37, 99, 235, 0.28)';
                      }}
                    >
                      <FileDown style={{ width: '14px', height: '14px' }} />
                      <span>{downloadingCode === cart.cart_code ? 'Downloading PDF...' : 'Download Receipt (PDF)'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
