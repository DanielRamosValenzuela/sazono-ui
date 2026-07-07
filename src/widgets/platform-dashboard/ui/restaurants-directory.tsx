"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Plus, Store, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/shared/api/admin-api";
import type { RestaurantBootstrapRequest } from "@/shared/types/admin";
import type { RestaurantSummary } from "@/shared/types/analytics";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { RegisterRestaurantForm } from "./register-restaurant-form";

export function RestaurantsDirectory() {
  const t = useTranslations("RestaurantsDirectory");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { accessToken, isClientReady } = useAdminSession();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const restaurantsQuery = useQuery({
    queryKey: ["admin", "restaurants", accessToken],
    enabled: isClientReady && Boolean(accessToken),
    queryFn: () => adminApi.listRestaurants(accessToken!),
  });

  const bootstrapMutation = useMutation({
    mutationFn: (values: RestaurantBootstrapRequest) =>
      adminApi.bootstrapRestaurant(accessToken!, values),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "restaurants"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "platform-metrics"],
      });
      setIsFormOpen(false);
      toast.success(t("registerSuccess", { name: response.restaurantName }));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("registerError")
      );
    },
  });

  const restaurants = restaurantsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button
          size="lg"
          className="rounded-full"
          onClick={() => setIsFormOpen((open) => !open)}
        >
          {isFormOpen ? <X /> : <Plus />}
          {isFormOpen ? t("closeForm") : t("registerCta")}
        </Button>
      </header>

      {isFormOpen ? (
        <RegisterRestaurantForm
          isPending={bootstrapMutation.isPending}
          onSubmit={(values) => bootstrapMutation.mutate(values)}
        />
      ) : null}

      {restaurantsQuery.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {t("loadError")}
        </div>
      ) : null}

      {restaurantsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      ) : restaurants.length === 0 && !restaurantsQuery.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border/80 px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Store className="size-6" />
          </span>
          <p className="font-medium">{t("emptyTitle")}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.restaurantId}
              restaurant={restaurant}
              locale={locale}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

type RestaurantCardProps = {
  restaurant: RestaurantSummary;
  locale: string;
};

function RestaurantCard({ restaurant, locale }: RestaurantCardProps) {
  const t = useTranslations("RestaurantsDirectory");
  const createdAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(restaurant.createdAt));

  return (
    <li>
      <Link
        href={`/admin/restaurants/${restaurant.restaurantId}`}
        aria-label={t("viewDetail", { name: restaurant.name })}
        className="group block cursor-pointer rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
      >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{restaurant.name}</h2>
          {restaurant.legalName ? (
            <p className="truncate text-sm text-muted-foreground">
              {restaurant.legalName}
            </p>
          ) : null}
        </div>
        <Badge
          variant={restaurant.status === "ACTIVE" ? "secondary" : "outline"}
          className={
            restaurant.status === "ACTIVE"
              ? "border-transparent bg-secondary text-secondary-foreground"
              : "text-muted-foreground"
          }
        >
          {restaurant.status === "ACTIVE" ? t("statusActive") : t("statusInactive")}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t("branches")}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {restaurant.branchCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("staff")}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {restaurant.staffCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("currency")}</dt>
          <dd className="mt-0.5 font-semibold">{restaurant.currency}</dd>
        </div>
      </dl>

      <p className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        {t("since", { date: createdAt })}
        <span className="inline-flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {t("manage")}
          <ChevronRight className="size-3.5" />
        </span>
      </p>
      </Link>
    </li>
  );
}
