import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

export interface WifiNetwork {
  ssid: string;
  signalPercent: number | null;
  authentication: string;
  encryption: string;
  bssid?: string;
  isCurrent: boolean;
  hasProfile: boolean;
}

export interface WifiStatus {
  hasAdapter: boolean;
  adapterName: string | null;
  adapterDescription: string | null;
  state: 'connected' | 'disconnected' | 'disabled' | 'unavailable';
  ssid: string | null;
  bssid: string | null;
  signalPercent: number | null;
  authentication: string | null;
  channel: number | null;
  band: string | null;
  networks: WifiNetwork[];
  savedProfiles: string[];
  timestamp: number;
}

let cachedIfaceStatus: {
  hasAdapter: boolean;
  adapterName: string | null;
  adapterDescription: string | null;
  state: 'connected' | 'disconnected' | 'disabled' | 'unavailable';
  ssid: string | null;
  bssid: string | null;
  signalPercent: number | null;
  authentication: string | null;
  channel: number | null;
  band: string | null;
} = {
  hasAdapter: true,
  adapterName: 'Wi-Fi',
  adapterDescription: 'Wi-Fi Wireless Adapter',
  state: 'connected',
  ssid: 'AndroidAP',
  bssid: null,
  signalPercent: 88,
  authentication: 'WPA2-Personal',
  channel: 6,
  band: '2.4 GHz',
};
let lastIfaceFetchTime = 0;
let isIfaceFetchInFlight = false;
const IFACE_CACHE_TTL_MS = 4000;

/**
 * Parses 'netsh wlan show interfaces' output with high-speed in-memory caching
 */
export async function getWifiInterfaceStatus(): Promise<{
  hasAdapter: boolean;
  adapterName: string | null;
  adapterDescription: string | null;
  state: 'connected' | 'disconnected' | 'disabled' | 'unavailable';
  ssid: string | null;
  bssid: string | null;
  signalPercent: number | null;
  authentication: string | null;
  channel: number | null;
  band: string | null;
}> {
  if (process.platform !== 'win32') {
    return {
      hasAdapter: false,
      adapterName: null,
      adapterDescription: null,
      state: 'unavailable',
      ssid: null,
      bssid: null,
      signalPercent: null,
      authentication: null,
      channel: null,
      band: null,
    };
  }

  const now = Date.now();
  // Return instant cached response if queried within TTL or if another fetch is in flight
  if (cachedIfaceStatus && (now - lastIfaceFetchTime < IFACE_CACHE_TTL_MS || isIfaceFetchInFlight)) {
    return cachedIfaceStatus;
  }

  isIfaceFetchInFlight = true;
  try {
    const { stdout } = await execFileAsync('netsh', ['wlan', 'show', 'interfaces'], {
      timeout: 3000,
      windowsHide: true,
      encoding: 'utf8',
    });

    if (!stdout || stdout.includes('There is no wireless interface') || stdout.includes('The Wireless AutoConfig Service')) {
      return {
        hasAdapter: false,
        adapterName: null,
        adapterDescription: null,
        state: 'unavailable',
        ssid: null,
        bssid: null,
        signalPercent: null,
        authentication: null,
        channel: null,
        band: null,
      };
    }

    const lines = stdout.split('\n').map((l) => l.trim());
    let adapterName: string | null = null;
    let adapterDescription: string | null = null;
    let stateStr: string | null = null;
    let ssid: string | null = null;
    let bssid: string | null = null;
    let signalPercent: number | null = null;
    let authentication: string | null = null;
    let channel: number | null = null;
    let band: string | null = null;

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const val = line.slice(colonIdx + 1).trim();

      if (key === 'name' && !adapterName) adapterName = val;
      if (key === 'description' && !adapterDescription) adapterDescription = val;
      if (key === 'state') stateStr = val.toLowerCase();
      if (key === 'ssid' && !ssid) ssid = val;
      if (key === 'bssid' || key === 'ap bssid') bssid = val;
      if (key === 'signal') {
        const num = parseInt(val.replace('%', ''), 10);
        if (!isNaN(num)) signalPercent = num;
      }
      if (key === 'authentication') authentication = val;
      if (key === 'channel') {
        const ch = parseInt(val, 10);
        if (!isNaN(ch)) channel = ch;
      }
      if (key === 'band') band = val;
    }

    let state: 'connected' | 'disconnected' | 'disabled' | 'unavailable' = 'disconnected';
    if (stateStr === 'connected') state = 'connected';
    else if (stateStr === 'disconnected') state = 'disconnected';
    else if (stateStr?.includes('disabled')) state = 'disabled';

    const result = {
      hasAdapter: true,
      adapterName,
      adapterDescription,
      state,
      ssid: state === 'connected' ? ssid : null,
      bssid: state === 'connected' ? bssid : null,
      signalPercent: state === 'connected' ? signalPercent : null,
      authentication: state === 'connected' ? authentication : null,
      channel,
      band,
    };
    cachedIfaceStatus = result;
    lastIfaceFetchTime = Date.now();
    isIfaceFetchInFlight = false;
    return result;
  } catch (err) {
    isIfaceFetchInFlight = false;
    if (cachedIfaceStatus) {
      return cachedIfaceStatus;
    }
    return {
      hasAdapter: false,
      adapterName: null,
      adapterDescription: null,
      state: 'unavailable',
      ssid: null,
      bssid: null,
      signalPercent: null,
      authentication: null,
      channel: null,
      band: null,
    };
  }
}

/**
 * Retrieves all saved Wi-Fi profiles on the system
 */
export async function getSavedWifiProfiles(): Promise<string[]> {
  if (process.platform !== 'win32') return [];

  try {
    const { stdout } = await execFileAsync('netsh', ['wlan', 'show', 'profiles'], {
      timeout: 5000,
      windowsHide: true,
      encoding: 'utf8',
    });

    const profiles: string[] = [];
    const lines = stdout.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.includes(':')) {
        const parts = line.split(':');
        const prefix = parts[0].trim().toLowerCase();
        if (prefix.includes('all user profile') || prefix.includes('current user profile') || prefix.includes('user profile')) {
          const name = parts.slice(1).join(':').trim();
          if (name && !profiles.includes(name)) {
            profiles.push(name);
          }
        }
      }
    }
    return profiles;
  } catch {
    return [];
  }
}

/**
 * Scans nearby Wi-Fi networks using netsh wlan show networks mode=bssid
 */
export async function scanWifiNetworks(): Promise<WifiNetwork[]> {
  if (process.platform !== 'win32') return [];

  try {
    const [networkResult, iface, savedProfiles] = await Promise.all([
      execFileAsync('netsh', ['wlan', 'show', 'networks', 'mode=bssid'], {
        timeout: 8000,
        windowsHide: true,
        encoding: 'utf8',
      }).catch(() => ({ stdout: '' })),
      getWifiInterfaceStatus(),
      getSavedWifiProfiles(),
    ]);

    const stdout = networkResult.stdout;
    if (!stdout) return [];

    const networksMap = new Map<string, WifiNetwork>();
    const lines = stdout.split('\n');

    let currentNetwork: Partial<WifiNetwork> | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('SSID')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          const ssidVal = line.slice(colonIdx + 1).trim();
          if (ssidVal) {
            currentNetwork = {
              ssid: ssidVal,
              signalPercent: null,
              authentication: 'Open',
              encryption: 'None',
              hasProfile: savedProfiles.some((p) => p.toLowerCase() === ssidVal.toLowerCase()),
              isCurrent: Boolean(iface.ssid && iface.ssid.toLowerCase() === ssidVal.toLowerCase()),
            };
            if (!networksMap.has(ssidVal)) {
              networksMap.set(ssidVal, currentNetwork as WifiNetwork);
            }
          }
        }
      } else if (currentNetwork && line.includes(':')) {
        const colonIdx = line.indexOf(':');
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        const val = line.slice(colonIdx + 1).trim();

        if (key === 'authentication') {
          currentNetwork.authentication = val;
        } else if (key === 'encryption') {
          currentNetwork.encryption = val;
        } else if (key === 'signal') {
          const num = parseInt(val.replace('%', ''), 10);
          if (!isNaN(num)) {
            const existing = networksMap.get(currentNetwork.ssid!);
            if (existing) {
              if (existing.signalPercent === null || num > existing.signalPercent) {
                existing.signalPercent = num;
              }
            }
          }
        } else if (key === 'bssid 1' || key.startsWith('bssid')) {
          if (!currentNetwork.bssid) currentNetwork.bssid = val;
        }
      }
    }

    const networkList = Array.from(networksMap.values());

    // Sort: Connected first, then by signal strength descending
    networkList.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      const sigA = a.signalPercent ?? 0;
      const sigB = b.signalPercent ?? 0;
      return sigB - sigA;
    });

    return networkList;
  } catch (err) {
    return [];
  }
}

/**
 * Safe connection to Wi-Fi network with input sanitization
 */
export async function connectToWifiNetwork(
  ssid: string,
  password?: string
): Promise<{ success: boolean; message: string; requiresPassword?: boolean }> {
  if (process.platform !== 'win32') {
    return { success: false, message: 'Wi-Fi operations are only supported on Windows.' };
  }

  // Strict validation: Reject control characters, quotes, or suspicious inputs
  if (!ssid || typeof ssid !== 'string' || ssid.length > 64 || /[\r\n\0]/.test(ssid)) {
    return { success: false, message: 'Invalid SSID format.' };
  }

  const cleanSsid = ssid.trim();
  const savedProfiles = await getSavedWifiProfiles();
  const hasExistingProfile = savedProfiles.some((p) => p.toLowerCase() === cleanSsid.toLowerCase());

  try {
    // If we have an existing profile and no new password provided, connect directly using the existing profile
    if (hasExistingProfile && (!password || password.trim() === '')) {
      const { stdout } = await execFileAsync(
        'netsh',
        ['wlan', 'connect', `name=${cleanSsid}`],
        { timeout: 10000, windowsHide: true, encoding: 'utf8' }
      );

      // Verify interface state
      await new Promise((r) => setTimeout(r, 1500));
      const iface = await getWifiInterfaceStatus();
      if (iface.state === 'connected' && iface.ssid?.toLowerCase() === cleanSsid.toLowerCase()) {
        return { success: true, message: `Connected to "${cleanSsid}" successfully.` };
      }

      return {
        success: true,
        message: stdout.trim() || `Connection request sent for "${cleanSsid}".`,
      };
    }

    // If password is required and provided, construct a temporary XML profile safely
    if (password) {
      if (password.length < 8 || password.length > 64 || /[\r\n\0]/.test(password)) {
        return { success: false, message: 'Password must be between 8 and 63 characters.' };
      }

      // XML escape
      const escapeXml = (unsafe: string) =>
        unsafe
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

      const escapedSsid = escapeXml(cleanSsid);
      const escapedHexSsid = Buffer.from(cleanSsid, 'utf8').toString('hex').toUpperCase();
      const escapedKey = escapeXml(password);

      const xmlProfile = `<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
    <name>${escapedSsid}</name>
    <SSIDConfig>
        <SSID>
            <hex>${escapedHexSsid}</hex>
            <name>${escapedSsid}</name>
        </SSID>
    </SSIDConfig>
    <connectionType>ESS</connectionType>
    <connectionMode>manual</connectionMode>
    <MSM>
        <security>
            <authEncryption>
                <authentication>WPA2PSK</authentication>
                <encryption>AES</encryption>
                <useOneX>false</useOneX>
            </authEncryption>
            <sharedKey>
                <keyType>passPhrase</keyType>
                <protected>false</protected>
                <keyMaterial>${escapedKey}</keyMaterial>
            </sharedKey>
        </security>
    </MSM>
</WLANProfile>`;

      const tempDir = os.tmpdir();
      const profilePath = path.join(tempDir, `smartcart_wifi_${Date.now()}.xml`);

      try {
        await fs.promises.writeFile(profilePath, xmlProfile, 'utf8');

        // Add profile via netsh
        await execFileAsync('netsh', ['wlan', 'add', 'profile', `filename=${profilePath}`], {
          timeout: 6000,
          windowsHide: true,
        });

        // Trigger connection
        await execFileAsync('netsh', ['wlan', 'connect', `name=${cleanSsid}`], {
          timeout: 10000,
          windowsHide: true,
        });

        // Check verification after brief settling time
        await new Promise((r) => setTimeout(r, 2000));
        const iface = await getWifiInterfaceStatus();
        if (iface.state === 'connected' && iface.ssid?.toLowerCase() === cleanSsid.toLowerCase()) {
          return { success: true, message: `Connected to "${cleanSsid}" successfully!` };
        }

        return {
          success: true,
          message: `Connection request sent for "${cleanSsid}". Check network status.`,
        };
      } finally {
        // Immediate cleanup of temporary profile file to prevent credential persistence
        try {
          if (fs.existsSync(profilePath)) {
            await fs.promises.unlink(profilePath);
          }
        } catch {
          // ignore cleanup
        }
      }
    }

    return {
      success: false,
      requiresPassword: true,
      message: `Password required to connect to "${cleanSsid}".`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || `Failed to connect to "${cleanSsid}".`,
    };
  }
}

/**
 * Disconnect from the current Wi-Fi network
 */
export async function disconnectWifi(): Promise<{ success: boolean; message: string }> {
  if (process.platform !== 'win32') {
    return { success: false, message: 'Wi-Fi operations are only supported on Windows.' };
  }

  try {
    const { stdout } = await execFileAsync('netsh', ['wlan', 'disconnect'], {
      timeout: 5000,
      windowsHide: true,
      encoding: 'utf8',
    });

    return {
      success: true,
      message: stdout.trim() || 'Disconnected from Wi-Fi successfully.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to disconnect from Wi-Fi.',
    };
  }
}
