import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export type DeviceCredentials = {
  deviceId: string;
  token: string;
  branchId: string;
  name: string;
};

export type PendingAck = {
  jobId: string;
  printedAt: string;
};

const CREDENTIALS_KEY = "sazono.printDevice";
const PENDING_ACKS_KEY = "sazono.printPendingAcks";
const PREVIEW_KEY = "sazono.printPreview";
const MAX_PENDING_ACKS = 50;
export const PREVIEW_TTL_MS = 4 * 60 * 60 * 1000;

async function readRaw(key: string): Promise<string | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key });

      return value;
    }

    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function writeRaw(key: string, value: string | null): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      if (value === null) {
        await Preferences.remove({ key });
      } else {
        await Preferences.set({ key, value });
      }

      return;
    }

    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {}
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function loadCredentials(): Promise<DeviceCredentials | null> {
  const value = parseJson<Partial<DeviceCredentials>>(
    await readRaw(CREDENTIALS_KEY),
  );

  if (
    value &&
    typeof value.token === "string" &&
    typeof value.deviceId === "string" &&
    typeof value.branchId === "string"
  ) {
    return {
      deviceId: value.deviceId,
      token: value.token,
      branchId: value.branchId,
      name: typeof value.name === "string" ? value.name : "",
    };
  }

  return null;
}

export function saveCredentials(credentials: DeviceCredentials) {
  return writeRaw(CREDENTIALS_KEY, JSON.stringify(credentials));
}

export function clearCredentials() {
  return writeRaw(CREDENTIALS_KEY, null);
}

export async function loadPendingAcks(): Promise<PendingAck[]> {
  const value = parseJson<PendingAck[]>(await readRaw(PENDING_ACKS_KEY));

  return Array.isArray(value) ? value : [];
}

export function savePendingAcks(acks: PendingAck[]) {
  return writeRaw(
    PENDING_ACKS_KEY,
    acks.length === 0 ? null : JSON.stringify(acks.slice(-MAX_PENDING_ACKS)),
  );
}

export async function loadPreviewRemainingMs(): Promise<number> {
  const expiresAt = Number(await readRaw(PREVIEW_KEY));

  return Number.isFinite(expiresAt) ? Math.max(0, expiresAt - Date.now()) : 0;
}

export function savePreviewMode(enabled: boolean) {
  return writeRaw(
    PREVIEW_KEY,
    enabled ? String(Date.now() + PREVIEW_TTL_MS) : null,
  );
}
