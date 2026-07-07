"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Power } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { adminApi } from "@/shared/api/admin-api";
import { ApiError } from "@/shared/api/http-client";
import type { UpdateRestaurantRequest } from "@/shared/types/analytics";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import {
  FieldGroup,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { Link } from "@/i18n/navigation";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";

const CURRENCY_OPTIONS = ["CLP", "USD", "EUR", "MXN", "COP", "PEN", "ARS", "UYU"] as const;

const TIMEZONE_OPTIONS = [
  "America/Santiago",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  "America/New_York",
  "Europe/Madrid",
] as const;

type EditFormValues = {
  name: string;
  legalName: string;
  defaultLanguage: string;
  timezone: string;
  currency: string;
};

type RestaurantDetailProps = {
  restaurantId: string;
};

export function RestaurantDetail({ restaurantId }: RestaurantDetailProps) {
  const t = useTranslations("RestaurantDetail");
  const tBootstrap = useTranslations("AdminBootstrap");
  const tDirectory = useTranslations("RestaurantsDirectory");
  const tRoles = useTranslations("Shared.roles");
  const tStaffStatus = useTranslations("Shared.staffStatus");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const session = useAdminSession();

  const detailQuery = useQuery({
    queryKey: ["admin", "restaurants", "detail", restaurantId, session.accessToken],
    enabled: session.isClientReady && Boolean(session.accessToken),
    retry: false,
    queryFn: () =>
      adminApi.getRestaurantDetail(session.accessToken!, restaurantId),
  });

  const restaurant = detailQuery.data;

  const form = useForm<EditFormValues>({
    defaultValues: {
      name: "",
      legalName: "",
      defaultLanguage: "es",
      timezone: "America/Santiago",
      currency: "CLP",
    },
  });

  useEffect(() => {
    if (restaurant) {
      form.reset({
        name: restaurant.name,
        legalName: restaurant.legalName ?? "",
        defaultLanguage: restaurant.defaultLanguage,
        timezone: restaurant.timezone,
        currency: restaurant.currency,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] });
    await queryClient.invalidateQueries({
      queryKey: ["admin", "platform-metrics"],
    });
  };

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateRestaurantRequest) =>
      adminApi.updateRestaurant(session.accessToken!, restaurantId, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success(t("updateSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("updateError"));
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "INACTIVE") =>
      adminApi.updateRestaurant(session.accessToken!, restaurantId, { status }),
    onSuccess: async () => {
      await invalidate();
      toast.success(t("statusUpdateSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("updateError"));
    },
  });

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Skeleton className="h-96 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !restaurant) {
    const isNotFound =
      detailQuery.error instanceof ApiError && detailQuery.error.status === 404;

    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card px-6 py-14 text-center shadow-sm">
        <p className="font-medium">
          {isNotFound ? t("notFound") : t("loadError")}
        </p>
        <BackLink label={t("backToList")} />
      </div>
    );
  }

  const isActive = restaurant.status === "ACTIVE";
  const createdAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
  }).format(new Date(restaurant.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <BackLink label={t("backToList")} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {restaurant.name}
          </h1>
          <Badge
            variant={isActive ? "secondary" : "outline"}
            className={
              isActive
                ? "border-transparent bg-secondary text-secondary-foreground"
                : "text-muted-foreground"
            }
          >
            {isActive ? tDirectory("statusActive") : tDirectory("statusInactive")}
          </Badge>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {tDirectory("since", { date: createdAt })}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <form
          onSubmit={form.handleSubmit((values) =>
            updateMutation.mutate({
              name: values.name,
              legalName: values.legalName || null,
              defaultLanguage: values.defaultLanguage,
              timezone: values.timezone,
              currency: values.currency,
            })
          )}
          className="self-start rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-xl font-semibold">{t("editTitle")}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {t("editDescription")}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FieldGroup>
              <FieldLabel htmlFor="detail-name">{tBootstrap("name")}</FieldLabel>
              <TextInput id="detail-name" required {...form.register("name")} />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="detail-legal-name">
                {tBootstrap("legalName")}
              </FieldLabel>
              <TextInput id="detail-legal-name" {...form.register("legalName")} />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="detail-language">
                {tBootstrap("language")}
              </FieldLabel>
              <SelectInput
                id="detail-language"
                {...form.register("defaultLanguage")}
              >
                <option value="es">{tBootstrap("languageEs")}</option>
                <option value="en">{tBootstrap("languageEn")}</option>
              </SelectInput>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="detail-currency">
                {tBootstrap("currency")}
              </FieldLabel>
              <SelectInput id="detail-currency" {...form.register("currency")}>
                {CURRENCY_OPTIONS.map((code) => (
                  <option key={code} value={code}>
                    {code} · {tBootstrap(`currencies.${code}`)}
                  </option>
                ))}
              </SelectInput>
            </FieldGroup>

            <FieldGroup className="md:col-span-2">
              <FieldLabel htmlFor="detail-timezone">
                {tBootstrap("timezone")}
              </FieldLabel>
              <SelectInput id="detail-timezone" {...form.register("timezone")}>
                {TIMEZONE_OPTIONS.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replaceAll("_", " ")}
                  </option>
                ))}
              </SelectInput>
            </FieldGroup>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-7 w-full rounded-full sm:w-auto"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Spinner />
                {t("saving")}
              </>
            ) : (
              t("save")
            )}
          </Button>
        </form>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Power className="size-5" />
              </span>
              <h2 className="text-lg font-semibold">{t("statusCardTitle")}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isActive
                ? t("statusActiveDescription")
                : t("statusInactiveDescription")}
            </p>
            <ConfirmButton
              variant="outline"
              size="lg"
              className="mt-5 w-full rounded-full"
              confirmLabel={t("confirmAction")}
              disabled={statusMutation.isPending}
              onConfirm={() =>
                statusMutation.mutate(isActive ? "INACTIVE" : "ACTIVE")
              }
            >
              {statusMutation.isPending ? (
                <Spinner />
              ) : isActive ? (
                t("deactivate")
              ) : (
                t("activate")
              )}
            </ConfirmButton>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t("branchesTitle")}</h2>
            {restaurant.branches.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("branchesEmpty")}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {restaurant.branches.map((branch) => (
                  <li
                    key={branch.branchId}
                    className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <MapPin className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{branch.name}</p>
                      {branch.address ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {branch.address}
                        </p>
                      ) : null}
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        branch.status === "ACTIVE"
                          ? "border-transparent bg-secondary text-secondary-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {branch.status === "ACTIVE"
                        ? tDirectory("statusActive")
                        : tDirectory("statusInactive")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t("membersTitle")}</h2>
          <Badge variant="secondary">
            {t("membersCount", { count: restaurant.staff.length })}
          </Badge>
        </div>

        {restaurant.staff.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("membersEmpty")}
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {restaurant.staff.map((member) => (
              <li
                key={member.staffUserId}
                className="rounded-2xl border border-border/70 bg-background/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground uppercase">
                      {member.firstName.charAt(0)}
                      {member.lastName.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {member.email ?? t("hiddenEmail")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      member.status === "ACTIVE"
                        ? "border-transparent bg-secondary text-secondary-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {tStaffStatus(member.status)}
                  </Badge>
                </div>

                {member.branchRoles.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.branchRoles.map((branchRole) => (
                      <Badge
                        key={`${member.staffUserId}-${branchRole.branchId}-${branchRole.role}`}
                        variant="secondary"
                      >
                        {branchRole.branchName} · {tRoles(branchRole.role)}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link
      href="/admin/restaurants"
      className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  );
}
