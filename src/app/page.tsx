'use client';

import React, { useState, useEffect } from 'react';
import LuxuryTopNav from '@/components/LuxuryTopNav';
import LuxurySideNav from '@/components/LuxurySideNav';
import AutonomousDashboardView from '@/components/AutonomousDashboardView';
import CameraScanner from '@/components/CameraScanner';
import HardwareSimulatorPanel from '@/components/HardwareSimulatorPanel';
import CartList from '@/components/CartList';
import ProductCatalogModal from '@/components/ProductCatalogModal';
import CartHistoryModal from '@/components/CartHistoryModal';
import { Product, CartSummary, IoTTelemetry } from '@/types';
import { getStoredCart, calculateCartSummary, addItemToCart, clearCart } from '@/lib/cart-store';
import { iotSimulator } from '@/lib/iot-simulator';
import { X, CheckCircle2 } from 'lucide-react';

export default function GroceryDashboard() {
  const [telemetry, setTelemetry] = useState<IoTTelemetry>({
    device_id: 'ESP32_DEV_CART01',
    weight_g: 0.0,
    delta_g: 0.0,
    stable: true,
    status: 'simulated',
    timestamp: Date.now(),
  });

  const [cartSummary, setCartSummary] = useState<CartSummary>({
    items: [],
    item_count: 0,
    subtotal_mrp: 0,
    discount_total: 0,
    grand_total: 0,
    total_weight_g: 0,
    savings_pct: 0,
  });

  // Active Cart Code (#SC-01, #SC-02, etc.)
  const [activeCartCode, setActiveCartCode] = useState<string>('#SC-01');
  const [cartToastMsg, setCartToastMsg] = useState<string | null>(null);

  // Customer account state (fetched from backend)
  const [customer, setCustomer] = useState<{ full_name: string; upi_id?: string; email?: string }>({
    full_name: 'Akash v',
    upi_id: '6369135512@sbi',
  });

  // Modal overlay state
  const [activeModal, setActiveModal] = useState<'none' | 'scanner' | 'catalogue' | 'cart' | 'hardware' | 'history'>('none');
  const [webcamScanTrigger, setWebcamScanTrigger] = useState<number>(0);

  useEffect(() => {
    // 1. Instant local state hydrate
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('smartcart_user_name');
      const storedUpi = localStorage.getItem('smartcart_user_upi');
      const storedEmail = localStorage.getItem('smartcart_user_email');
      if (storedName || storedEmail || storedUpi) {
        setCustomer((prev) => ({
          ...prev,
          full_name: storedName || prev.full_name,
          upi_id: storedUpi || prev.upi_id,
          email: storedEmail || prev.email,
        }));
      }

      // Check if redirected with ?open=history
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('open') === 'history') {
        setActiveModal('history');
        window.history.replaceState({}, '', '/');
      }
    }

    // 2. Fetch customer account from backend
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.customer) {
          setCustomer(data.customer);
          if (typeof window !== 'undefined') {
            if (data.customer.full_name) localStorage.setItem('smartcart_user_name', data.customer.full_name);
            if (data.customer.upi_id) localStorage.setItem('smartcart_user_upi', data.customer.upi_id);
            if (data.customer.email) localStorage.setItem('smartcart_user_email', data.customer.email);
          }
        }
      })
      .catch(() => {});

    const handleCustomerEvent = (e: CustomEvent) => {
      if (e.detail) {
        setCustomer({
          full_name: e.detail.full_name || 'Akash v',
          upi_id: e.detail.upi_id || '6369135512@sbi',
          email: e.detail.email || '',
        });
      }
    };

    const handleAuthChanged = (e: CustomEvent) => {
      if (e.detail?.action === 'logout') {
        setCustomer({
          full_name: 'Guest Shopper',
          upi_id: '',
          email: '',
        });
      } else if (e.detail?.customer) {
        setCustomer(e.detail.customer);
      }
    };

    window.addEventListener('smartcart_customer_updated', handleCustomerEvent as EventListener);
    window.addEventListener('customer-account-updated', handleCustomerEvent as EventListener);
    window.addEventListener('smartcart_auth_changed', handleAuthChanged as EventListener);
    return () => {
      window.removeEventListener('smartcart_customer_updated', handleCustomerEvent as EventListener);
      window.removeEventListener('customer-account-updated', handleCustomerEvent as EventListener);
      window.removeEventListener('smartcart_auth_changed', handleAuthChanged as EventListener);
    };
  }, []);

  useEffect(() => {
    const stored = getStoredCart();
    setCartSummary(calculateCartSummary(stored));

    const handleCartEvent = () => {
      const updated = getStoredCart();
      setCartSummary(calculateCartSummary(updated));
    };

    window.addEventListener('smartcart_updated', handleCartEvent);
    return () => window.removeEventListener('smartcart_updated', handleCartEvent);
  }, []);

  useEffect(() => {
    const unsub = iotSimulator.subscribe((t) => {
      setTelemetry(t);
    });
    return () => unsub();
  }, []);

  const handleItemValidated = (product: Product, quantity: number = 1) => {
    const res = addItemToCart(product, quantity);
    setCartSummary(res.summary);
  };

  const handleNewCartAccount = async () => {
    try {
      const res = await fetch('/api/cart/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: customer.email,
          customer_name: customer.full_name,
          current_items: cartSummary.items.map((item) => ({
            barcode: item.barcode,
            product_name: item.product.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            weight_g: item.total_weight_g,
          })),
          grand_total: cartSummary.grand_total,
        }),
      });

      const data = await res.json();
      if (data.success && data.new_cart_code) {
        setActiveCartCode(data.new_cart_code);
        clearCart();
        setCartSummary({
          items: [],
          item_count: 0,
          subtotal_mrp: 0,
          discount_total: 0,
          grand_total: 0,
          total_weight_g: 0,
          savings_pct: 0,
        });
        setCartToastMsg(`✨ New Cart Account ${data.new_cart_code} Activated! Previous session archived in backend history.`);
        setTimeout(() => setCartToastMsg(null), 5000);
      }
    } catch {
      setActiveCartCode((prev) => {
        const num = parseInt(prev.replace('#SC-0', '')) || 1;
        return `#SC-0${num + 1}`;
      });
      clearCart();
      setCartSummary({
        items: [],
        item_count: 0,
        subtotal_mrp: 0,
        discount_total: 0,
        grand_total: 0,
        total_weight_g: 0,
        savings_pct: 0,
      });
      setCartToastMsg('✨ New Cart Account Activated! Cart refreshed.');
      setTimeout(() => setCartToastMsg(null), 5000);
    }
  };

  return (
    <div className="luxury-container">
      {/* Background Architectural Layer & Gradient Overlay */}
      <div className="hero-bg-layer" />
      <div className="hero-overlay-layer" />

      {/* Floating Status Notification Toast */}
      {cartToastMsg && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981' }} />
          {cartToastMsg}
        </div>
      )}

      {/* Top Floating Pill Navigation with Live Customer Data */}
      <LuxuryTopNav
        telemetry={telemetry}
        itemCount={cartSummary.item_count}
        grandTotal={cartSummary.grand_total}
        userName={customer.full_name}
        upiId={customer.upi_id}
        customer={customer}
        cartCode={activeCartCode}
        onCustomerUpdated={(updated) => setCustomer(updated)}
        onOpenScanner={() => setActiveModal('scanner')}
        onOpenHardwareConsole={() => setActiveModal('hardware')}
        onOpenCatalogue={() => setActiveModal('catalogue')}
      />

      {/* Left Vertical Dock Navigation */}
      <LuxurySideNav
        activeView={activeModal === 'none' ? 'home' : activeModal}
        itemCount={cartSummary.item_count}
        onOpenScanner={() => setActiveModal('scanner')}
        onOpenCatalogue={() => setActiveModal('catalogue')}
        onOpenCart={() => setActiveModal('cart')}
        onOpenHardwareConsole={() => setActiveModal('hardware')}
        onNewCartAccount={handleNewCartAccount}
        onOpenHistory={() => setActiveModal('history')}
      />

      {/* Main Autonomous Shopping Dashboard View (Camera Scanner + Catalog Grid + Live Cart) */}
      <AutonomousDashboardView
        summary={cartSummary}
        telemetry={telemetry}
        onAddItem={handleItemValidated}
        onOpenCatalogueModal={() => setActiveModal('catalogue')}
        autoStartWebcamTrigger={webcamScanTrigger}
      />

      {/* MODAL 1: Dual-Sensor Camera & Barcode Scanner */}
      {activeModal === 'scanner' && (
        <div className="modal-backdrop-luxury" onClick={() => setActiveModal('none')}>
          <div className="modal-window-luxury" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveModal('none')}
              className="modal-close-btn"
              title="Close Scanner"
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
            <CameraScanner
              telemetry={telemetry}
              onItemValidated={handleItemValidated}
            />
          </div>
        </div>
      )}

      {/* MODAL 2: Product Catalogue Explorer (Matching Dashboard Aspect Ratio) */}
      {activeModal === 'catalogue' && (
        <div className="modal-backdrop-luxury" onClick={() => setActiveModal('none')}>
          <div
            style={{
              maxWidth: '1360px',
              width: '95vw',
              height: '88vh',
              maxHeight: '860px',
              padding: 0,
              overflow: 'hidden',
              borderRadius: '38px',
              border: '2px solid rgba(255, 255, 255, 0.98)',
              boxShadow: '0 30px 80px -15px rgba(59, 130, 246, 0.28), inset 0 2px 4px #ffffff',
              background: 'rgba(255, 255, 255, 0.92)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ProductCatalogModal
              onProductSelected={(prod, qty) => handleItemValidated(prod, qty || 1)}
              onClose={() => setActiveModal('none')}
              onOpenScanner={() => setActiveModal('scanner')}
              onScanRedirectToWebcam={() => {
                setActiveModal('none');
                setWebcamScanTrigger(Date.now());
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL 3: ESP32 Hardware Console & Tare */}
      {activeModal === 'hardware' && (
        <div className="modal-backdrop-luxury" onClick={() => setActiveModal('none')}>
          <div className="modal-window-luxury" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveModal('none')}
              className="modal-close-btn"
              title="Close Console"
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
            <HardwareSimulatorPanel telemetry={telemetry} />
          </div>
        </div>
      )}

      {/* MODAL 4: Cart Items Sheet */}
      {activeModal === 'cart' && (
        <div className="modal-backdrop-luxury" onClick={() => setActiveModal('none')}>
          <div className="modal-window-luxury" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveModal('none')}
              className="modal-close-btn"
              title="Close Cart"
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
            <CartList
              summary={cartSummary}
              onCartChanged={(newSummary) => setCartSummary(newSummary)}
            />
          </div>
        </div>
      )}

      {/* MODAL 5: Cart & Order History */}
      <CartHistoryModal
        isOpen={activeModal === 'history'}
        onClose={() => setActiveModal('none')}
        customerEmail={customer.email}
        onStartNewCart={handleNewCartAccount}
        activeCartCode={activeCartCode}
      />
    </div>
  );
}
