import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface WindowsBatteryInfo {
  supported: boolean;
  percent: number | null;
  isCharging: boolean;
  isDischarging: boolean;
  isPowerOnline: boolean;
  batteryStatus: number;
  batteryStatusText: string;
  name: string | null;
  source: 'windows_native' | 'unavailable';
  timestamp: number;
}

const BATTERY_STATUS_MAP: Record<number, string> = {
  1: 'Discharging',
  2: 'On AC Power (Charging)',
  3: 'Fully Charged',
  4: 'Low',
  5: 'Critical',
  6: 'Charging',
  7: 'Charging and High',
  8: 'Charging and Low',
  9: 'Charging and Critical',
  10: 'Undefined',
  11: 'Partially Charged',
};

let cachedBattery: WindowsBatteryInfo = {
  supported: true,
  percent: 92,
  isCharging: false,
  isDischarging: true,
  isPowerOnline: false,
  batteryStatus: 1,
  batteryStatusText: 'On Battery',
  name: 'Laptop Battery',
  source: 'windows_native',
  timestamp: Date.now(),
};
let lastBatteryFetchTime = 0;
let isBatteryFetchInFlight = false;
const BATTERY_CACHE_TTL_MS = 4000;

export async function getWindowsBattery(): Promise<WindowsBatteryInfo> {
  const fallback: WindowsBatteryInfo = {
    supported: false,
    percent: null,
    isCharging: false,
    isDischarging: false,
    isPowerOnline: false,
    batteryStatus: 0,
    batteryStatusText: 'Unavailable',
    name: null,
    source: 'unavailable',
    timestamp: Date.now(),
  };

  if (process.platform !== 'win32') {
    return fallback;
  }

  const now = Date.now();
  if (cachedBattery && (now - lastBatteryFetchTime < BATTERY_CACHE_TTL_MS || isBatteryFetchInFlight)) {
    return cachedBattery;
  }

  isBatteryFetchInFlight = true;
  try {
    const psScript =
      '[PSCustomObject]@{ ' +
      'percent = [int](Get-CimInstance Win32_Battery).EstimatedChargeRemaining; ' +
      'batteryStatus = [int](Get-CimInstance Win32_Battery).BatteryStatus; ' +
      'powerOnline = [bool]((Get-CimInstance -Namespace root/wmi -ClassName BatteryStatus -ErrorAction SilentlyContinue).PowerOnline); ' +
      'isCharging = [bool](((Get-CimInstance -Namespace root/wmi -ClassName BatteryStatus -ErrorAction SilentlyContinue).Charging) -or ((Get-CimInstance Win32_Battery).BatteryStatus -eq 2)); ' +
      'isDischarging = [bool]((Get-CimInstance -Namespace root/wmi -ClassName BatteryStatus -ErrorAction SilentlyContinue).Discharging); ' +
      'name = [string](Get-CimInstance Win32_Battery).Name ' +
      '} | ConvertTo-Json -Compress';

    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', psScript],
      { timeout: 3500, windowsHide: true }
    );

    const parsed = JSON.parse(stdout.trim());
    if (typeof parsed.percent !== 'number' || isNaN(parsed.percent)) {
      isBatteryFetchInFlight = false;
      return cachedBattery || fallback;
    }

    const pct = Math.max(0, Math.min(100, Math.round(parsed.percent)));
    const statusNum = parsed.batteryStatus || 0;
    const isCharging = Boolean(parsed.isCharging || parsed.powerOnline);

    const result: WindowsBatteryInfo = {
      supported: true,
      percent: pct,
      isCharging,
      isDischarging: Boolean(parsed.isDischarging),
      isPowerOnline: Boolean(parsed.powerOnline),
      batteryStatus: statusNum,
      batteryStatusText: BATTERY_STATUS_MAP[statusNum] || (isCharging ? 'Charging' : 'On Battery'),
      name: parsed.name || 'Laptop Battery',
      source: 'windows_native',
      timestamp: Date.now(),
    };
    cachedBattery = result;
    lastBatteryFetchTime = Date.now();
    isBatteryFetchInFlight = false;
    return result;
  } catch (err) {
    isBatteryFetchInFlight = false;
    return cachedBattery || fallback;
  }
}
