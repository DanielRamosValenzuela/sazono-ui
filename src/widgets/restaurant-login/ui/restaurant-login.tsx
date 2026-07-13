"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authApi } from "@/shared/api/auth-api";
import { ApiError } from "@/shared/api/http-client";
import { Skeleton } from "@/components/ui/skeleton";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import type { LoginRequest } from "@/shared/types/auth";
import { useRouter } from "@/i18n/navigation";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { RestaurantLoginScreen } from "@/widgets/admin-shell/ui/restaurant-login-screen";

type RestaurantLoginProps = {
  slug: string;
};

export function RestaurantLogin({ slug }: RestaurantLoginProps) {
  const t = useTranslations("RestaurantLoginScreen");
  const tShell = useTranslations("AdminShell");
  const router = useRouter();
  const session = useAdminSession();

  const restaurantQuery = useQuery({
    queryKey: ["restaurant-by-slug", slug],
    queryFn: () => authApi.getRestaurantBySlug(slug),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginRequest) => authApi.login(values),
    onSuccess: (response) => {
      session.setSession(response);
      toast.success(tShell("loginSuccess"));
      router.push("/staff");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : tShell("loginError")
      );
    },
  });

  useEffect(() => {
    if (session.accessToken && session.user?.profileType === "staff") {
      router.replace("/staff");
    }
  }, [router, session.accessToken, session.user]);

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

  return (
    <RestaurantLoginScreen
      restaurantName={restaurantQuery.data.name}
      restaurantSlug={slug}
      isPending={loginMutation.isPending}
      onSubmit={(values) => loginMutation.mutate(values)}
    />
  );
}
