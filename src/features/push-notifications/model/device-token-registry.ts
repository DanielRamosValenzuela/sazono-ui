import { useSyncExternalStore } from "react";

let currentFcmToken: string | null = null;
let soundEnabled = true;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function setCurrentFcmToken(token: string | null) {
  currentFcmToken = token;
  listeners.forEach((listener) => listener());
}

export function getCurrentFcmToken(): string | null {
  return currentFcmToken;
}

export function setPushSoundEnabled(value: boolean) {
  soundEnabled = value;
}

export function isPushSoundEnabled(): boolean {
  return soundEnabled;
}

export function useCurrentFcmToken(): string | null {
  return useSyncExternalStore(subscribe, getCurrentFcmToken, () => null);
}
