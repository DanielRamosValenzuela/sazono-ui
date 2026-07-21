import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { StateStorage } from "zustand/middleware";

const nativeSecureStorage: StateStorage = {
  getItem: async (name) => {
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: async (name, value) => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name) => {
    await Preferences.remove({ key: name });
  },
};

const webLocalStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

export function resolveSessionStorage(): StateStorage {
  return Capacitor.isNativePlatform() ? nativeSecureStorage : webLocalStorage;
}
