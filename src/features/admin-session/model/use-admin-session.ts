"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/shared/api/auth-api";
import { ApiError } from "@/shared/api/http-client";
import { useClientReady } from "@/shared/lib/use-client-ready";
import { useAdminSessionStore } from "./admin-session.store";

/**
 * Sesión compartida del área admin: hidrata el perfil desde el backend,
 * limpia la sesión en 401 y expone helpers de rol.
 */
export function useAdminSession() {
  const queryClient = useQueryClient();
  const isClientReady = useClientReady();
  const accessToken = useAdminSessionStore((state) => state.accessToken);
  const storedUser = useAdminSessionStore((state) => state.user);
  const setSession = useAdminSessionStore((state) => state.setSession);
  const syncUser = useAdminSessionStore((state) => state.syncUser);
  const clearSession = useAdminSessionStore((state) => state.clearSession);

  const currentUserQuery = useQuery({
    queryKey: ["admin", "me", accessToken],
    enabled: isClientReady && Boolean(accessToken),
    retry: false,
    initialData: storedUser ?? undefined,
    queryFn: async () => {
      try {
        const nextUser = await authApi.getCurrentUser(accessToken!);
        syncUser(nextUser);
        return nextUser;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
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

  const refreshUser = async () => {
    if (!accessToken) {
      return null;
    }

    const nextUser = await queryClient.fetchQuery({
      queryKey: ["admin", "me", accessToken],
      queryFn: () => authApi.getCurrentUser(accessToken),
    });

    syncUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    clearSession();
    queryClient.removeQueries({ queryKey: ["admin"] });
  };

  return {
    isClientReady,
    accessToken,
    user,
    userError: currentUserQuery.isError ? currentUserQuery.error : null,
    isPlatformAdmin,
    isRestaurantAdmin: adminBranches.length > 0,
    hasNoBranchRoles:
      user?.profileType === "staff" && user.branchRoles.length === 0,
    adminBranches,
    supervisorBranches,
    setSession,
    refreshUser,
    logout,
  };
}
