"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authApi } from "@/shared/api/auth-api";
import { ApiError } from "@/shared/api/http-client";
import { Skeleton } from "@/components/ui/skeleton";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import type { AuthResponse, LoginRequest } from "@/shared/types/auth";
import { useRouter } from "@/i18n/navigation";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { RestaurantLoginScreen } from "@/widgets/admin-shell/ui/restaurant-login-screen";
import {
  getPinLoginCandidate,
  savePinLoginCandidate,
  type PinLoginCandidate,
} from "@/features/pin-login/model/pin-login-preferences";
import { PinPadScreen } from "@/features/pin-login/ui/pin-pad-screen";
import { SetupPinScreen } from "@/features/pin-login/ui/setup-pin-screen";

type RestaurantLoginProps = {
  slug: string;
};

type LoginMode = "password" | "pin-login" | "setup-pin";

export function RestaurantLogin({ slug }: RestaurantLoginProps) {
  const t = useTranslations("RestaurantLoginScreen");
  const tShell = useTranslations("AdminShell");
  const router = useRouter();
  const session = useAdminSession();

  const [mode, setMode] = useState<LoginMode>("password");
  const [candidate, setCandidate] = useState<PinLoginCandidate | null>(null);
  const [pinLoginError, setPinLoginError] = useState<string | null>(null);
  const [pendingAuthResponse, setPendingAuthResponse] =
    useState<AuthResponse | null>(null);

  const restaurantQuery = useQuery({
    queryKey: ["restaurant-by-slug", slug],
    queryFn: () => authApi.getRestaurantBySlug(slug),
    retry: false,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let cancelled = false;

    void getPinLoginCandidate().then((stored) => {
      if (cancelled || !stored) {
        return;
      }

      if (stored.restaurantSlug === slug && stored.hasPin) {
        setCandidate(stored);
        setMode("pin-login");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const loginMutation = useMutation({
    mutationFn: (values: LoginRequest) => authApi.login(values),
    onSuccess: async (response) => {
      if (!Capacitor.isNativePlatform()) {
        session.setSession(response);
        toast.success(tShell("loginSuccess"));
        router.push("/staff");
        return;
      }

      const stored = await getPinLoginCandidate();
      const nextCandidate: PinLoginCandidate = {
        staffUserId: response.user.profileId,
        restaurantSlug: slug,
        firstName: response.user.firstName,
        hasPin:
          stored?.staffUserId === response.user.profileId
            ? stored.hasPin
            : false,
      };

      await savePinLoginCandidate(nextCandidate);
      session.setSession(response);

      if (nextCandidate.hasPin) {
        toast.success(tShell("loginSuccess"));
        router.push("/staff");
        return;
      }

      setCandidate(nextCandidate);
      setPendingAuthResponse(response);
      setMode("setup-pin");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : tShell("loginError")
      );
    },
  });

  const pinLoginMutation = useMutation({
    mutationFn: (pin: string) => {
      if (!candidate) {
        return Promise.reject(new Error("No hay un staffUserId recordado."));
      }

      return authApi.pinLogin(candidate.staffUserId, pin);
    },
    onSuccess: (response) => {
      setPinLoginError(null);
      session.setSession(response);
      toast.success(tShell("loginSuccess"));
      router.push("/staff");
    },
    onError: (error) => {
      setPinLoginError(
        error instanceof ApiError ? error.message : tShell("loginError")
      );
    },
  });

  const setPinMutation = useMutation({
    mutationFn: (pin: string) => {
      if (!pendingAuthResponse) {
        return Promise.reject(new Error("No hay una sesion pendiente."));
      }

      return authApi.setPin(pin, pendingAuthResponse.accessToken);
    },
    onSuccess: async () => {
      if (candidate) {
        await savePinLoginCandidate({ ...candidate, hasPin: true });
      }

      toast.success(t("pinSetupSuccess"));
      router.push("/staff");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : tShell("loginError")
      );
    },
  });

  useEffect(() => {
    if (
      session.accessToken &&
      session.user?.profileType === "staff" &&
      mode !== "setup-pin"
    ) {
      router.replace("/staff");
    }
  }, [router, session.accessToken, session.user, mode]);

  if (restaurantQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="mx-auto h-14 w-14 rounded-2xl" />
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </main>
    );
  }

  if (
    restaurantQuery.isError ||
    !restaurantQuery.data ||
    !restaurantQuery.data.isActive
  ) {
    const notFound =
      restaurantQuery.error instanceof ApiError &&
      restaurantQuery.error.status === 404;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="flex items-center justify-end gap-2 self-end px-6">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold">
          {notFound ? t("notFoundTitle") : t("inactiveTitle")}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {notFound ? t("notFoundDescription") : t("inactiveDescription")}
        </p>
      </main>
    );
  }

  if (mode === "pin-login" && candidate) {
    return (
      <PinPadScreen
        firstName={candidate.firstName}
        isPending={pinLoginMutation.isPending}
        errorMessage={pinLoginError}
        onSubmit={(pin) => pinLoginMutation.mutate(pin)}
        onUsePassword={() => {
          setPinLoginError(null);
          setMode("password");
        }}
      />
    );
  }

  if (mode === "setup-pin" && candidate) {
    return (
      <SetupPinScreen
        firstName={candidate.firstName}
        isPending={setPinMutation.isPending}
        onSubmit={(pin) => setPinMutation.mutate(pin)}
        onSkip={() => router.push("/staff")}
      />
    );
  }

  return (
    <RestaurantLoginScreen
      restaurantName={restaurantQuery.data.name}
      restaurantSlug={slug}
      isPending={loginMutation.isPending}
      onSubmit={(values) => loginMutation.mutate(values)}
    />
  );
}
