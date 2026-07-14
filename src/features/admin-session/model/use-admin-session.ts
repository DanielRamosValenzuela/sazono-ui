"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authApi } from "@/shared/api/auth-api";
import { ApiError } from "@/shared/api/http-client";
import { useClientReady } from "@/shared/lib/use-client-ready";
import { useAdminSessionStore } from "./admin-session.store";

const SESSION_STALE_TIME_MS = 5 * 60_000;
const SESSION_REFRESH_MARGIN_MS = 60_000;

export function useAdminSession() {
  const t = useTranslations("AdminShell");
  const queryClient = useQueryClient();
  const isClientReady = useClientReady();
  const accessToken = useAdminSessionStore((state) => state.accessToken);
  const accessTokenExpiresAt = useAdminSessionStore(
    (state) => state.accessTokenExpiresAt
  );
  const refreshToken = useAdminSessionStore((state) => state.refreshToken);
  const storedUser = useAdminSessionStore((state) => state.user);
  const setSession = useAdminSessionStore((state) => state.setSession);
  const syncUser = useAdminSessionStore((state) => state.syncUser);
  const clearSession = useAdminSessionStore((state) => state.clearSession);
  const accessTokenExpiresAtMs = accessTokenExpiresAt
    ? Date.parse(accessTokenExpiresAt)
    : Number.NaN;
  const hasSessionExpiration = Number.isFinite(accessTokenExpiresAtMs);

  const clearActiveSession = useCallback(() => {
    clearSession();
    queryClient.clear();
  }, [clearSession, queryClient]);

  const handleSessionExpired = useCallback(() => {
    clearActiveSession();
    toast.error(t("sessionExpired"));
  }, [clearActiveSession, t]);

  const refreshSession = useCallback(async () => {
    if (!refreshToken) {
      handleSessionExpired();
      return false;
    }

    try {
      const response = await authApi.refresh(refreshToken);
      setSession(response);
      return true;
    } catch {
      handleSessionExpired();
      return false;
    }
  }, [handleSessionExpired, refreshToken, setSession]);

  useEffect(() => {
    if (!isClientReady || !accessToken) {
      return;
    }

    if (!hasSessionExpiration) {
      if (refreshToken) {
        void refreshSession();
      }
      return;
    }

    const msUntilRefresh =
      accessTokenExpiresAtMs - Date.now() - SESSION_REFRESH_MARGIN_MS;

    if (msUntilRefresh <= 0) {
      void refreshSession();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void refreshSession();
    }, msUntilRefresh);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    accessToken,
    accessTokenExpiresAtMs,
    hasSessionExpiration,
    isClientReady,
    refreshSession,
    refreshToken,
  ]);

  const currentUserQuery = useQuery({
    queryKey: ["session", "me", accessToken],
    enabled: isClientReady && Boolean(accessToken),
    retry: false,
    initialData: storedUser ?? undefined,
    initialDataUpdatedAt: 0,
    staleTime: SESSION_STALE_TIME_MS,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      try {
        const nextUser = await authApi.getCurrentUser(accessToken!);
        syncUser(nextUser);
        return nextUser;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await refreshSession();
        }

        throw error;
      }
    },
  });

  const user = currentUserQuery.data ?? storedUser;

  const isPlatformAdmin = user?.profileType === "platform_admin";
  const adminBranches =
    user?.profileType === "staff"
      ? user.branchRoles.filter((branchRole) => branchRole.role === "ADMIN")
      : [];
  const supervisorBranches =
    user?.profileType === "staff"
      ? user.branchRoles.filter(
          (branchRole) =>
            branchRole.role === "ADMIN" || branchRole.role === "SUPERVISOR"
        )
      : [];

  const hasAnyRole = (roles: string[]) =>
    user?.profileType === "staff"
      ? user.branchRoles.some((branchRole) => roles.includes(branchRole.role))
      : false;

  const canAccessFloor = hasAnyRole([
    "ADMIN",
    "SUPERVISOR",
    "WAITER",
    "CASHIER",
  ]);
  const canAccessMenuStudio = hasAnyRole(["ADMIN"]);
  const canAccessKitchen = hasAnyRole([
    "ADMIN",
    "SUPERVISOR",
    "KITCHEN",
    "BAR",
  ]);

  const refreshUser = async () => {
    if (!accessToken || !hasSessionExpiration) {
      return null;
    }

    const nextUser = await queryClient.fetchQuery({
      queryKey: ["session", "me", accessToken],
      queryFn: () => authApi.getCurrentUser(accessToken),
      staleTime: 0,
    });

    syncUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    clearActiveSession();
  };

  return {
    isClientReady,
    accessToken,
    accessTokenExpiresAt: accessToken ? accessTokenExpiresAt : null,
    user,
    userError: currentUserQuery.isError ? currentUserQuery.error : null,
    isPlatformAdmin,
    isRestaurantAdmin: adminBranches.length > 0,
    hasNoBranchRoles:
      user?.profileType === "staff" && user.branchRoles.length === 0,
    adminBranches,
    supervisorBranches,
    canAccessFloor,
    canAccessMenuStudio,
    canAccessKitchen,
    setSession,
    refreshUser,
    logout,
  };
}
