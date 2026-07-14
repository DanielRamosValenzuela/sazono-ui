"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthenticatedProfile, AuthResponse } from "@/shared/types/auth";

type AdminSessionState = {
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshToken: string | null;
  user: AuthenticatedProfile | null;
  setSession: (session: AuthResponse) => void;
  syncUser: (user: AuthenticatedProfile) => void;
  clearSession: () => void;
};

function decodeBase64UrlSegment(value: string) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedValue = normalizedValue.padEnd(
    normalizedValue.length + ((4 - (normalizedValue.length % 4 || 4)) % 4),
    "="
  );

  return window.atob(paddedValue);
}

function resolveAccessTokenExpiresAt(session: AuthResponse) {
  if (session.expiresAt) {
    return session.expiresAt;
  }

  try {
    const [, payloadSegment] = session.accessToken.split(".");

    if (!payloadSegment) {
      return null;
    }

    const payload = JSON.parse(decodeBase64UrlSegment(payloadSegment)) as {
      exp?: unknown;
    };

    return typeof payload.exp === "number"
      ? new Date(payload.exp * 1000).toISOString()
      : null;
  } catch {
    return null;
  }
}

export const useAdminSessionStore = create<AdminSessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      accessTokenExpiresAt: null,
      refreshToken: null,
      user: null,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          accessTokenExpiresAt: resolveAccessTokenExpiresAt(session),
          refreshToken: session.refreshToken,
          user: session.user,
        }),
      syncUser: (user) =>
        set((state) => ({
          accessToken: state.accessToken,
          accessTokenExpiresAt: state.accessTokenExpiresAt,
          refreshToken: state.refreshToken,
          user,
        })),
      clearSession: () =>
        set({
          accessToken: null,
          accessTokenExpiresAt: null,
          refreshToken: null,
          user: null,
        }),
    }),
    {
      name: "sazono-admin-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
