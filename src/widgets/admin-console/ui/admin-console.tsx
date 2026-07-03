"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, LogOut, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { adminApi } from "@/shared/api/admin-api";
import { authApi } from "@/shared/api/auth-api";
import { ApiError } from "@/shared/api/http-client";
import { useClientReady } from "@/shared/lib/use-client-ready";
import type {
  CreateBranchRequest,
  CreateStaffUserRequest,
  RestaurantBootstrapRequest,
} from "@/shared/types/admin";
import type { AuthenticatedProfile, LoginRequest } from "@/shared/types/auth";
import { useAdminSessionStore } from "@/features/admin-session/model/admin-session.store";
import { BootstrapRestaurantPanel } from "./bootstrap-restaurant-panel";
import { CreateBranchPanel } from "./create-branch-panel";
import { LoginPanel } from "./login-panel";
import { StaffManagementPanel } from "./staff-management-panel";

function hasAdminBranchRole(profile: AuthenticatedProfile) {
  return (
    profile.profileType === "staff" &&
    profile.branchRoles.some((branchRole) => branchRole.role === "ADMIN")
  );
}

function hasNoBranchRoles(profile: AuthenticatedProfile) {
  return profile.profileType === "staff" && profile.branchRoles.length === 0;
}

export function AdminConsole() {
  const t = useTranslations("AdminConsole");
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

  const currentUser = currentUserQuery.data ?? storedUser;
  const canManageStaff = currentUser ? hasAdminBranchRole(currentUser) : false;

  const staffListQuery = useQuery({
    queryKey: ["admin", "staff", accessToken, currentUser?.restaurantId],
    enabled: isClientReady && Boolean(accessToken) && Boolean(currentUser) && canManageStaff,
    retry: false,
    queryFn: () => adminApi.listStaff(accessToken!),
  });

  const refreshCurrentUser = async () => {
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

  const loginMutation = useMutation({
    mutationFn: (values: LoginRequest) => authApi.login(values),
    onSuccess: (response) => {
      setSession(response);
      queryClient.setQueryData(["admin", "me", response.accessToken], response.user);
      toast.success(t("loginSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("loginError"));
    },
  });

  const bootstrapMutation = useMutation({
    mutationFn: (values: RestaurantBootstrapRequest) =>
      adminApi.bootstrapRestaurant(accessToken!, values),
    onSuccess: (response) => {
      toast.success(t("bootstrapSuccess", { name: response.restaurantName }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("bootstrapError"));
    },
  });

  const createBranchMutation = useMutation({
    mutationFn: (values: CreateBranchRequest) => adminApi.createBranch(accessToken!, values),
    onSuccess: async (response) => {
      await refreshCurrentUser();
      toast.success(t("branchSuccess", { name: response.name }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("branchError"));
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: (values: CreateStaffUserRequest) => adminApi.createStaff(accessToken!, values),
    onSuccess: async (staffUser) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "staff"],
      });
      toast.success(
        t("staffSuccess", {
          name: `${staffUser.firstName} ${staffUser.lastName}`,
        })
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("staffError"));
    },
  });

  const handleLogout = () => {
    clearSession();
    queryClient.removeQueries({
      queryKey: ["admin"],
    });
    toast.success(t("logoutSuccess"));
  };

  if (!isClientReady) {
    return (
      <Card className="rounded-[1.75rem] border-border/70 bg-card/80">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {t("preparing")}
        </CardContent>
      </Card>
    );
  }

  if (!accessToken || !currentUser) {
    return (
      <LoginPanel
        isPending={loginMutation.isPending}
        onSubmit={(values) => loginMutation.mutate(values)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SessionSummary
        user={currentUser}
        onLogout={handleLogout}
        logoutLabel={t("logout")}
        noRolesLabel={t("noRoles")}
      />

      {currentUserQuery.isError ? (
        <InlineError
          title={t("refreshTitle")}
          description={
            currentUserQuery.error instanceof Error
              ? currentUserQuery.error.message
              : t("refreshDescription")
          }
        />
      ) : null}

      {currentUser.profileType === "platform_admin" ? (
        <BootstrapRestaurantPanel
          isPending={bootstrapMutation.isPending}
          lastResult={bootstrapMutation.data}
          onSubmit={(values) => bootstrapMutation.mutate(values)}
        />
      ) : null}

      {currentUser.profileType === "staff" && hasNoBranchRoles(currentUser) ? (
        <CreateBranchPanel
          isPending={createBranchMutation.isPending}
          onSubmit={(values) => createBranchMutation.mutate(values)}
        />
      ) : null}

      {currentUser.profileType === "staff" && canManageStaff ? (
        <StaffManagementPanel
          currentUser={currentUser}
          isPending={createStaffMutation.isPending}
          isLoadingList={staffListQuery.isLoading}
          staffUsers={staffListQuery.data ?? []}
          onSubmit={(values) => createStaffMutation.mutate(values)}
        />
      ) : null}

      {currentUser.profileType === "staff" &&
      !hasNoBranchRoles(currentUser) &&
      !canManageStaff ? (
        <InlineError
          title={t("forbiddenTitle")}
          description={t("forbiddenDescription")}
        />
      ) : null}
    </div>
  );
}

type SessionSummaryProps = {
  user: AuthenticatedProfile;
  onLogout: () => void;
  logoutLabel: string;
  noRolesLabel: string;
};

function SessionSummary({
  user,
  onLogout,
  logoutLabel,
  noRolesLabel,
}: SessionSummaryProps) {
  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/82 p-5 shadow-lg shadow-primary/8 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">
              {user.profileType}
            </Badge>
            {user.restaurantId ? <Badge variant="outline">{user.restaurantId}</Badge> : null}
          </div>
          <h2 className="mt-4 text-3xl font-semibold">
            {user.firstName} {user.lastName}
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {user.email}
          </p>
        </div>

        <Button variant="outline" className="rounded-full" onClick={onLogout}>
          <LogOut className="size-4" />
          {logoutLabel}
        </Button>
      </div>

      {user.branchRoles.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {user.branchRoles.map((branchRole) => (
            <Badge key={`${branchRole.branchId}-${branchRole.role}`} variant="secondary">
              {branchRole.branchName} · {branchRole.role}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-primary/12 bg-primary/6 px-4 py-3 text-sm text-muted-foreground">
          {noRolesLabel}
        </div>
      )}
    </section>
  );
}

type InlineErrorProps = {
  title: string;
  description: string;
};

function InlineError({ title, description }: InlineErrorProps) {
  return (
    <section className="rounded-[1.75rem] border border-destructive/20 bg-destructive/8 p-5 text-destructive">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-1 size-5 shrink-0" />
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <p className="mt-2 text-sm leading-7 text-foreground/80">{description}</p>
        </div>
      </div>
    </section>
  );
}
