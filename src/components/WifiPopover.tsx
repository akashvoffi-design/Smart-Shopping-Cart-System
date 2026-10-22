'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  Unlock,
  Check,
  X,
  Radio,
  Signal,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import GlassIcon from '@/components/GlassIcon';

export interface WifiNetworkItem {
  ssid: string;
  signalPercent: number | null;
  authentication: string;
  encryption: string;
  bssid?: string;
  isCurrent: boolean;
  hasProfile: boolean;
}

export interface WifiPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  isOnline: boolean;
  currentSsid: string | null;
  signalPercent: number | null;
  hasAdapter: boolean;
  adapterName: string | null;
  onNetworkChanged?: () => void;
}

export default function WifiPopover({
  isOpen,
  onClose,
  isConnected,
  isOnline,
  currentSsid,
  signalPercent,
  hasAdapter,
  adapterName,
  onNetworkChanged,
}: WifiPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [networks, setNetworks] = useState<WifiNetworkItem[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Connection Dialog State
  const [selectedNetwork, setSelectedNetwork] = useState<WifiNetworkItem | null>(null);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connectMessage, setConnectMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Disconnect State
  const [disconnecting, setDisconnecting] = useState<boolean>(false);

  // Load networks when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchNetworks();
    } else {
      setSelectedNetwork(null);
      setPassword('');
      setConnectMessage(null);
    }
  }, [isOpen]);

  // Close on Escape or Outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNetworks = async () => {
    setScanning(true);
    setScanError(null);
    try {
      const res = await fetch('/api/system/wifi?scan=true');
      const data = await res.json();
      if (data.success) {
        setNetworks(data.networks || []);
        if (data.networks?.length === 0 && !data.hasAdapter) {
          setScanError('No wireless network adapter detected.');
        }
      } else {
        setScanError(data.error || 'Failed to scan Wi-Fi networks.');
      }
    } catch (err: any) {
      setScanError(err.message || 'Error communicating with network service.');
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork) return;

    setConnecting(true);
    setConnectMessage({ type: 'info', text: `Connecting to ${selectedNetwork.ssid}...` });

    try {
      const res = await fetch('/api/system/wifi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          ssid: selectedNetwork.ssid,
          password: password.trim() ? password : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConnectMessage({ type: 'success', text: data.message || 'Connected successfully!' });
        setTimeout(() => {
          setSelectedNetwork(null);
          setPassword('');
          fetchNetworks();
          if (onNetworkChanged) onNetworkChanged();
        }, 1500);
      } else {
        setConnectMessage({
          type: 'error',
          text: data.message || 'Failed to connect. Check password or permissions.',
        });
      }
    } catch (err: any) {
      setConnectMessage({ type: 'error', text: err.message || 'Connection request failed.' });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch('/api/system/wifi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchNetworks();
        if (onNetworkChanged) onNetworkChanged();
      }
    } catch {
      // ignore
    } finally {
      setDisconnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 14px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '360px',
        maxHeight: '520px',
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(30px) saturate(190%)',
        WebkitBackdropFilter: 'blur(30px) saturate(190%)',
        borderRadius: '26px',
        border: '2px solid rgba(255, 255, 255, 0.98)',
        boxShadow:
          '0 20px 50px rgba(15, 23, 42, 0.18), 0 0 25px rgba(59, 130, 246, 0.15), inset 0 2px 4px #ffffff',
        padding: '20px 20px 18px',
        zIndex: 100,
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        animation: 'paymentPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Wi-Fi Network Manager"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GlassIcon icon={isConnected ? Wifi : WifiOff} color={isConnected ? 'blue' : 'slate'} size={28} />
          <div>
            <h4
              style={{
                fontSize: '13.5px',
                fontWeight: 800,
                color: '#0f172a',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Wi-Fi Management
            </h4>
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748b' }}>
              {adapterName || (hasAdapter ? 'Wireless Adapter' : 'No Wireless Adapter')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={fetchNetworks}
            disabled={scanning}
            type="button"
            title="Scan / Refresh Networks"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(238, 245, 255, 0.85)',
              border: '1px solid rgba(191, 219, 254, 0.8)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw
              style={{
                width: '13px',
                height: '13px',
                animation: scanning ? 'spin 0.8s linear infinite' : 'none',
              }}
            />
          </button>

          <button
            onClick={onClose}
            type="button"
            aria-label="Close Wi-Fi settings"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X style={{ width: '14px', height: '14px', strokeWidth: 2.5 }} />
          </button>
        </div>
      </div>

      {/* Current Connection Card */}
      <div
        style={{
          background: isConnected
            ? 'linear-gradient(135deg, rgba(236, 253, 245, 0.85) 0%, rgba(209, 250, 229, 0.65) 100%)'
            : 'rgba(241, 245, 249, 0.7)',
          borderRadius: '16px',
          padding: '12px 14px',
          border: `1.5px solid ${isConnected ? 'rgba(134, 239, 172, 0.8)' : 'rgba(226, 232, 240, 0.9)'}`,
          marginBottom: '14px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isConnected ? '#10b981' : '#94a3b8',
                  boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {isConnected ? 'Active Network' : 'Not Connected'}
              </span>
            </div>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#0f172a',
                display: 'block',
              }}
            >
              {currentSsid || (isConnected ? 'Wi-Fi Network' : 'Disconnected')}
            </span>
            {signalPercent !== null && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a' }}>
                Signal: {signalPercent}% · Internet {isOnline ? 'Active' : 'Offline'}
              </span>
            )}
          </div>

          {isConnected && (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              type="button"
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                background: '#ffffff',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#dc2626',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {disconnecting ? '...' : 'Disconnect'}
            </button>
          )}
        </div>
      </div>

      {/* Selected Network Connect Form (when user clicked a network) */}
      {selectedNetwork && (
        <form
          onSubmit={handleConnect}
          style={{
            background: 'rgba(238, 245, 255, 0.9)',
            borderRadius: '16px',
            padding: '12px 14px',
            border: '1.5px solid rgba(191, 219, 254, 0.95)',
            marginBottom: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e3a8a' }}>
              Connect to: {selectedNetwork.ssid}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedNetwork(null);
                setPassword('');
                setConnectMessage(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              Cancel
            </button>
          </div>

          {selectedNetwork.hasProfile ? (
            <p style={{ fontSize: '11.5px', color: '#475569', margin: '0 0 10px' }}>
              Saved network profile detected. Connect directly or provide a new password.
            </p>
          ) : (
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Network Security Key (Password)"
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(191, 219, 254, 0.9)',
                  background: '#ffffff',
                  padding: '0 36px 0 12px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff style={{ width: '14px', height: '14px' }} /> : <Eye style={{ width: '14px', height: '14px' }} />}
              </button>
            </div>
          )}

          {connectMessage && (
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color:
                  connectMessage.type === 'success'
                    ? '#16a34a'
                    : connectMessage.type === 'error'
                    ? '#dc2626'
                    : '#2563eb',
                marginBottom: '8px',
              }}
            >
              {connectMessage.text}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={connecting}
              style={{
                flex: 1,
                height: '36px',
                borderRadius: '9999px',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {connecting ? 'Connecting...' : 'Connect to Network'}
            </button>
          </div>
        </form>
      )}

      {/* Available Networks List */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Available Wi-Fi Networks ({networks.length})
        </span>
        {scanning && <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 700 }}>Scanning...</span>}
      </div>

      <div
        className="catalog-scroll-clean"
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          maxHeight: '220px',
          paddingRight: '2px',
        }}
      >
        {scanError ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              background: 'rgba(254, 242, 242, 0.7)',
              borderRadius: '14px',
              border: '1px solid rgba(252, 165, 165, 0.5)',
              color: '#b91c1c',
              fontSize: '12px',
            }}
          >
            <AlertCircle style={{ width: '18px', height: '18px', margin: '0 auto 6px', color: '#dc2626' }} />
            <span>{scanError}</span>
          </div>
        ) : networks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '12px' }}>
            {scanning ? 'Scanning nearby Wi-Fi networks...' : 'No networks found. Try clicking refresh.'}
          </div>
        ) : (
          networks.map((net) => {
            const isThisCurrent = Boolean(
              net.isCurrent || (currentSsid && currentSsid.toLowerCase() === net.ssid.toLowerCase())
            );

            return (
              <div
                key={net.ssid}
                onClick={() => {
                  if (!isThisCurrent) {
                    setSelectedNetwork(net);
                    setConnectMessage(null);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '14px',
                  background: isThisCurrent
                    ? 'rgba(236, 253, 245, 0.9)'
                    : selectedNetwork?.ssid === net.ssid
                    ? 'rgba(238, 245, 255, 0.95)'
                    : 'rgba(248, 250, 252, 0.8)',
                  border: isThisCurrent
                    ? '1.5px solid rgba(134, 239, 172, 0.9)'
                    : selectedNetwork?.ssid === net.ssid
                    ? '1.5px solid rgba(191, 219, 254, 0.95)'
                    : '1px solid rgba(226, 232, 240, 0.8)',
                  cursor: isThisCurrent ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Radio style={{ width: '15px', height: '15px', color: isThisCurrent ? '#10b981' : '#64748b' }} />
                  <div>
                    <span
                      style={{
                        fontSize: '12.5px',
                        fontWeight: isThisCurrent ? 800 : 700,
                        color: isThisCurrent ? '#15803d' : '#0f172a',
                        display: 'block',
                        lineHeight: 1.2,
                      }}
                    >
                      {net.ssid}
                    </span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      {net.authentication || 'Secured'}
                      {net.signalPercent !== null ? ` · ${net.signalPercent}%` : ''}
                      {net.hasProfile && !isThisCurrent ? ' · Saved' : ''}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isThisCurrent ? (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        color: '#15803d',
                        background: '#dcfce7',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Check style={{ width: '11px', height: '11px' }} />
                      Connected
                    </span>
                  ) : (
                    <ChevronRight style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
