"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthenticatedProfile, AuthResponse } from "@/shared/types/auth";

type AdminSessionState = {
  accessToken: string | null;
  user: AuthenticatedProfile | null;
  setSession: (session: AuthResponse) => void;
  syncUser: (user: AuthenticatedProfile) => void;
  clearSession: () => void;
};

export const useAdminSessionStore = create<AdminSessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          user: session.user,
        }),
      syncUser: (user) =>
        set((state) => ({
          accessToken: state.accessToken,
          user,
        })),
      clearSession: () =>
        set({
          accessToken: null,
          user: null,
        }),
    }),
    {
      name: "sazono-admin-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);
