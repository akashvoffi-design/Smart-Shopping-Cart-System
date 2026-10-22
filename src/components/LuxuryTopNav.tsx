'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ChevronDown,
  UserRound,
  ShoppingBag,
  BatteryCharging,
  Battery,
  BatteryMedium,
  BatteryLow,
  Zap,
  Wifi,
  WifiOff,
  Wallet,
} from 'lucide-react';
import { IoTTelemetry } from '@/types';
import CustomerProfileModal, { CustomerData } from '@/components/CustomerProfileModal';
import GlassIcon, { GlassColor } from '@/components/GlassIcon';
import BatteryPopover from '@/components/BatteryPopover';
import WifiPopover from '@/components/WifiPopover';

interface LuxuryTopNavProps {
  telemetry: IoTTelemetry;
  itemCount: number;
  grandTotal: number;
  onOpenScanner?: () => void;
  onOpenHardwareConsole?: () => void;
  onOpenCatalogue?: () => void;
  userName?: string;
  upiId?: string;
  customer?: CustomerData;
  onCustomerUpdated?: (updated: CustomerData) => void;
  cartCode?: string;
}

export default function LuxuryTopNav({
  telemetry,
  itemCount,
  grandTotal,
  onOpenScanner,
  onOpenHardwareConsole,
  onOpenCatalogue,
  userName = 'Akash v',
  upiId,
  customer,
  onCustomerUpdated,
  cartCode = '#SC-01',
}: LuxuryTopNavProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentName, setCurrentName] = useState(userName);
  const [currentUpi, setCurrentUpi] = useState(upiId || '');

  // Popover state
  const [isBatteryPopoverOpen, setIsBatteryPopoverOpen] = useState(false);
  const [isWifiPopoverOpen, setIsWifiPopoverOpen] = useState(false);

  // Helpers to retrieve cached values synchronously from localStorage for 0ms instant display on refresh
  const getInitialBattery = () => {
    if (typeof window === 'undefined') {
      return { percent: 92, isCharging: false, statusText: 'On Battery' };
    }
    try {
      const storedPct = localStorage.getItem('smartcart_last_battery_pct');
      const storedCharging = localStorage.getItem('smartcart_last_battery_charging');
      const storedText = localStorage.getItem('smartcart_last_battery_text');
      return {
        percent: storedPct !== null ? Number(storedPct) : 92,
        isCharging: storedCharging === 'true',
        statusText: storedText || (storedCharging === 'true' ? 'Charging' : 'On Battery'),
      };
    } catch {
      return { percent: 92, isCharging: false, statusText: 'On Battery' };
    }
  };

  const getInitialWifi = () => {
    if (typeof window === 'undefined') {
      return { ssid: 'AndroidAP', state: 'connected' as const, signal: 88 };
    }
    try {
      const storedSsid = localStorage.getItem('smartcart_last_wifi_ssid');
      const storedState = (localStorage.getItem('smartcart_last_wifi_state') as any) || 'connected';
      const storedSignal = localStorage.getItem('smartcart_last_wifi_signal');
      return {
        ssid: storedSsid || 'AndroidAP',
        state: (storedState as 'connected' | 'disconnected' | 'disabled' | 'unavailable') || 'connected',
        signal: storedSignal !== null ? Number(storedSignal) : 88,
      };
    } catch {
      return { ssid: 'AndroidAP', state: 'connected' as const, signal: 88 };
    }
  };

  // --- PART 1: REAL-TIME BATTERY STATE (Instant hydration with zero-delay fallback) ---
  const initialBattery = getInitialBattery();
  const [batteryPercent, setBatteryPercent] = useState<number | null>(initialBattery.percent);
  const [isCharging, setIsCharging] = useState<boolean>(initialBattery.isCharging);
  const [isFullyCharged, setIsFullyCharged] = useState<boolean>(initialBattery.percent >= 99 && initialBattery.isCharging);
  const [powerOnline, setPowerOnline] = useState<boolean>(initialBattery.isCharging);
  const [batteryStatusText, setBatteryStatusText] = useState<string>(initialBattery.statusText);
  const [batterySource, setBatterySource] = useState<'browser_api' | 'windows_native' | 'unavailable'>('windows_native');
  const [batteryName, setBatteryName] = useState<string | null>(null);

  // Sync battery from Windows Native Backend
  const syncWindowsBattery = useCallback(async () => {
    try {
      const res = await fetch('/api/system/battery');
      const data = await res.json();
      if (data && data.supported && typeof data.percent === 'number') {
        setBatteryPercent(data.percent);
        setIsCharging(Boolean(data.isCharging));
        setIsFullyCharged(data.percent >= 99 && Boolean(data.isPowerOnline || data.isCharging));
        setPowerOnline(Boolean(data.isPowerOnline || data.isCharging));
        const statusText = data.batteryStatusText || (data.isCharging ? 'Charging' : 'On Battery');
        setBatteryStatusText(statusText);
        setBatterySource('windows_native');
        if (data.name) setBatteryName(data.name);

        // Cache locally for instant 0ms restoration upon browser refresh
        try {
          localStorage.setItem('smartcart_last_battery_pct', String(data.percent));
          localStorage.setItem('smartcart_last_battery_charging', String(Boolean(data.isCharging)));
          localStorage.setItem('smartcart_last_battery_text', statusText);
        } catch {}

        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  // Battery monitoring setup
  useEffect(() => {
    let batteryObj: any = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const setupBrowserBattery = async () => {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        try {
          batteryObj = await (navigator as any).getBattery();

          const updateFromBrowser = () => {
            const pct = Math.round(batteryObj.level * 100);
            const charging = Boolean(batteryObj.charging);
            setBatteryPercent(pct);
            setIsCharging(charging);
            setPowerOnline(charging);
            setIsFullyCharged(pct >= 99 && charging);
            setBatteryStatusText(
              pct >= 99 && charging
                ? 'Fully Charged'
                : charging
                ? 'Charging'
                : 'On Battery'
            );
            setBatterySource('browser_api');
          };

          updateFromBrowser();
          batteryObj.addEventListener('levelchange', updateFromBrowser);
          batteryObj.addEventListener('chargingchange', updateFromBrowser);
          return;
        } catch {
          // fallback to native
        }
      }

      // If browser battery API is unsupported or fails, use Windows Native API
      await syncWindowsBattery();
      // Periodically refresh native battery (every 6 seconds, lightweight local query)
      fallbackInterval = setInterval(syncWindowsBattery, 6000);
    };

    setupBrowserBattery();

    return () => {
      if (batteryObj) {
        try {
          batteryObj.removeEventListener('levelchange', () => {});
          batteryObj.removeEventListener('chargingchange', () => {});
        } catch {}
      }
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [syncWindowsBattery]);

  // --- PART 2: REAL WI-FI STATE (Instant hydration with zero-delay fallback) ---
  const initialWifi = getInitialWifi();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [hasWifiAdapter, setHasWifiAdapter] = useState<boolean>(true);
  const [wifiState, setWifiState] = useState<'connected' | 'disconnected' | 'disabled' | 'unavailable'>(initialWifi.state);
  const [wifiSsid, setWifiSsid] = useState<string | null>(initialWifi.ssid);
  const [wifiSignal, setWifiSignal] = useState<number | null>(initialWifi.signal);
  const [wifiAdapterName, setWifiAdapterName] = useState<string | null>(null);

  // Sync Wi-Fi status from OS backend
  const syncWifiStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/wifi');
      const data = await res.json();
      if (data && data.success) {
        setHasWifiAdapter(Boolean(data.hasAdapter));
        setWifiState(data.state);
        setWifiSsid(data.ssid);
        setWifiSignal(data.signalPercent);
        setWifiAdapterName(data.adapterDescription || data.adapterName);

        // Cache locally for instant 0ms restoration upon browser refresh
        try {
          if (data.ssid) localStorage.setItem('smartcart_last_wifi_ssid', data.ssid);
          if (data.state) localStorage.setItem('smartcart_last_wifi_state', data.state);
          if (data.signalPercent !== null && data.signalPercent !== undefined) {
            localStorage.setItem('smartcart_last_wifi_signal', String(data.signalPercent));
          }
        } catch {}
      } else {
        setHasWifiAdapter(false);
        setWifiState('unavailable');
        setWifiSsid(null);
      }
    } catch {
      setWifiState('unavailable');
    }
  }, []);

  // Monitor network online/offline and OS Wi-Fi
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        syncWifiStatus();
      };
      const handleOffline = () => {
        setIsOnline(false);
        syncWifiStatus();
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Initial Wi-Fi sync
      syncWifiStatus();

      // Poll interface status every 8s
      const wifiInterval = setInterval(syncWifiStatus, 8000);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(wifiInterval);
      };
    }
  }, [syncWifiStatus]);

  // Keep in sync with props
  useEffect(() => {
    if (customer?.full_name) setCurrentName(customer.full_name);
    else if (userName) setCurrentName(userName);

    if (customer?.upi_id) setCurrentUpi(customer.upi_id);
    else if (upiId) setCurrentUpi(upiId);
  }, [userName, upiId, customer]);

  // Listen for account updates across window
  useEffect(() => {
    const handleAccountUpdate = (e: any) => {
      if (e?.detail) {
        if (e.detail.full_name) setCurrentName(e.detail.full_name);
        if (e.detail.upi_id) setCurrentUpi(e.detail.upi_id);
      }
    };
    window.addEventListener('customer-account-updated', handleAccountUpdate);
    return () => window.removeEventListener('customer-account-updated', handleAccountUpdate);
  }, []);

  const activeCustomerObj: CustomerData = {
    full_name: currentName,
    upi_id: currentUpi,
    email:
      customer?.email ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('smartcart_user_email') || 'akash@gmail.com'
        : 'akash@gmail.com'),
    phone:
      customer?.phone ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('smartcart_user_phone') || '6369135512'
        : '6369135512'),
  };

  // Battery icon computation
  const isBatteryLow = batteryPercent !== null && batteryPercent <= 20;
  const isBatteryMedium = batteryPercent !== null && batteryPercent > 20 && batteryPercent <= 50;
  const batteryColor: GlassColor = isBatteryLow ? 'red' : isBatteryMedium ? 'amber' : 'green';

  const BatteryIconComponent = isCharging
    ? BatteryCharging
    : isBatteryLow
    ? BatteryLow
    : isBatteryMedium
    ? BatteryMedium
    : Battery;

  // Wi-Fi icon computation: Must be connected via OS Wi-Fi AND online
  const isWifiConnected = wifiState === 'connected' && Boolean(wifiSsid);
  const wifiColor: GlassColor = isWifiConnected ? 'blue' : 'slate';

  return (
    <>
      <header className="top-nav-center-cover-wrapper">
        <div className="top-nav-rectangle-cover">
          {/* 1. Left: User Profile (Click to View & Edit) */}
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="cover-nav-section cover-nav-left"
            title="Click to View & Edit Customer Profile"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <GlassIcon icon={UserRound} color="purple" size={32} />

            <div>
              <span
                style={{
                  fontSize: '14.5px',
                  fontWeight: 800,
                  color: '#171b29',
                  display: 'block',
                  lineHeight: 1.25,
                }}
              >
                {currentName}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
                {currentUpi ? `UPI: ${currentUpi}` : 'Verified Shopper'}
              </span>
            </div>
          </button>

          {/* Divider */}
          <div className="top-nav-divider" />

          {/* 2. Center: Cart ID, Charge icon, and Wi-fi symbol */}
          <div className="cover-nav-center" style={{ gap: '18px' }}>
            {/* Item 1: Cart ID */}
            <div
              className="pill-dropdown-item"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'default' }}
              title="IoT Autonomous Cart Identifier"
            >
              <GlassIcon icon={ShoppingBag} color="purple" size={32} />
              <div>
                <span className="pill-dropdown-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                  Cart ID
                </span>
                <span className="pill-dropdown-value" style={{ fontSize: '13.5px', fontWeight: 800 }}>
                  {cartCode} <ChevronDown style={{ width: '12px', height: '12px', color: '#888' }} />
                </span>
              </div>
            </div>

            {/* Sub-Divider */}
            <div className="top-nav-divider" />

            {/* Item 2: Charge icon (Live Battery with Charging Plug & Popover trigger) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setIsBatteryPopoverOpen((prev) => !prev);
                  setIsWifiPopoverOpen(false);
                  syncWindowsBattery();
                }}
                className="pill-dropdown-item"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}
                title={`Laptop Battery: ${batteryPercent !== null ? `${batteryPercent}%` : 'Unknown'} • ${
                  isCharging ? 'Charging (Plugged In)' : 'On Battery'
                } (Click for details)`}
                aria-expanded={isBatteryPopoverOpen}
                aria-haspopup="dialog"
              >
                <div style={{ position: 'relative' }}>
                  <GlassIcon
                    icon={BatteryIconComponent}
                    color={batteryColor}
                    size={32}
                    className={isCharging ? 'battery-charging-pulse' : ''}
                  />
                  {isCharging && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        right: '-3px',
                        width: '15px',
                        height: '15px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: '1.5px solid #ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.45)',
                        animation: 'pulse-dot 1.5s infinite',
                      }}
                      title="AC Power Connected"
                    >
                      <Zap style={{ width: '9px', height: '9px', color: '#ffffff', fill: '#ffffff' }} />
                    </div>
                  )}
                </div>

                <div>
                  <span
                    className="pill-dropdown-label"
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>Charge</span>
                    {isCharging && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          color: '#059669',
                          background: '#d1fae5',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Charging
                      </span>
                    )}
                  </span>
                  <span className="pill-dropdown-value" style={{ fontSize: '13.5px', fontWeight: 800 }}>
                    <span className="nav-scrolling-container" style={{ maxWidth: '85px' }}>
                      <span
                        className={(batteryPercent !== null && isCharging) ? 'nav-scrolling-text' : 'nav-static-text'}
                        style={{
                          color: isBatteryLow ? '#ef4444' : isBatteryMedium ? '#d97706' : '#10b981',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                        }}
                      >
                        {batteryPercent !== null ? `${batteryPercent}%` : '--'}
                      </span>
                    </span>
                    <ChevronDown
                      style={{
                        width: '12px',
                        height: '12px',
                        color: '#888',
                        transform: isBatteryPopoverOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </span>
                </div>
              </button>

              {/* Battery Popover */}
              <BatteryPopover
                isOpen={isBatteryPopoverOpen}
                onClose={() => setIsBatteryPopoverOpen(false)}
                percent={batteryPercent}
                isCharging={isCharging}
                isFullyCharged={isFullyCharged}
                powerOnline={powerOnline}
                batteryStatusText={batteryStatusText}
                source={batterySource}
                batteryName={batteryName}
              />
            </div>

            {/* Sub-Divider */}
            <div className="top-nav-divider" />

            {/* Item 3: Wi-Fi symbol (Real Wi-Fi status & Network Manager Popover) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setIsWifiPopoverOpen((prev) => !prev);
                  setIsBatteryPopoverOpen(false);
                  syncWifiStatus();
                }}
                className="pill-dropdown-item"
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                title={`Wi-Fi: ${
                  isWifiConnected ? `${wifiSsid} (Connected)` : 'Disconnected'
                } • Internet: ${isOnline ? 'Online' : 'Offline'} (Click to manage networks)`}
                aria-expanded={isWifiPopoverOpen}
                aria-haspopup="dialog"
              >
                <GlassIcon icon={isWifiConnected ? Wifi : WifiOff} color={wifiColor} size={32} />
                <div>
                  <span className="pill-dropdown-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                    Wi-Fi
                  </span>
                  <span className="pill-dropdown-value" style={{ fontSize: '13.5px', fontWeight: 800 }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: isWifiConnected ? '#10b981' : '#94a3b8',
                        boxShadow: isWifiConnected ? '0 0 8px #10b981' : 'none',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span className="nav-scrolling-container" style={{ maxWidth: '100px' }}>
                      <span
                        className={
                          (wifiSsid && wifiSsid.length > 9)
                            ? 'nav-scrolling-text'
                            : 'nav-static-text'
                        }
                      >
                        {isWifiConnected ? wifiSsid || 'Connected' : 'Offline'}
                      </span>
                    </span>
                    <ChevronDown
                      style={{
                        width: '12px',
                        height: '12px',
                        color: '#888',
                        transform: isWifiPopoverOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </span>
                </div>
              </button>

              {/* Wi-Fi Network Manager Popover */}
              <WifiPopover
                isOpen={isWifiPopoverOpen}
                onClose={() => setIsWifiPopoverOpen(false)}
                isConnected={isWifiConnected}
                isOnline={isOnline}
                currentSsid={wifiSsid}
                signalPercent={wifiSignal}
                hasAdapter={hasWifiAdapter}
                adapterName={wifiAdapterName}
                onNetworkChanged={syncWifiStatus}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="top-nav-divider" />

          {/* 3. Right: Checkout with Amount */}
          <Link
            href="/checkout"
            className="cover-nav-section cover-nav-right"
            style={{ padding: '8px 18px', gap: '10px', fontSize: '14.5px', fontWeight: 800 }}
            title="Proceed to Autonomous Payment Dashboard"
          >
            <GlassIcon icon={Wallet} color="green" size={32} />
            <span>Checkout ₹{grandTotal.toFixed(0)}</span>
            <ArrowUpRight style={{ width: '17px', height: '17px', color: '#10b981', strokeWidth: 2.5 }} />
          </Link>
        </div>
      </header>

      {/* Customer Profile & Edit Modal */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        customer={activeCustomerObj}
        onCustomerUpdated={(updated) => {
          setCurrentName(updated.full_name);
          if (updated.upi_id) setCurrentUpi(updated.upi_id);
          if (onCustomerUpdated) onCustomerUpdated(updated);
        }}
      />
    </>
  );
}
