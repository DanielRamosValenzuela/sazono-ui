"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  TextInput,
} from "@/shared/ui/form-controls";
import type {
  RestaurantBootstrapRequest,
  RestaurantBootstrapResponse,
} from "@/shared/types/admin";

type BootstrapRestaurantPanelProps = {
  isPending: boolean;
  lastResult?: RestaurantBootstrapResponse;
  onSubmit: (values: RestaurantBootstrapRequest) => void;
};

type BootstrapFormValues = {
  restaurantName: string;
  legalName: string;
  defaultLanguage: string;
  timezone: string;
  currency: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
};

export function BootstrapRestaurantPanel({
  isPending,
  lastResult,
  onSubmit,
}: BootstrapRestaurantPanelProps) {
  const t = useTranslations("AdminBootstrap");
  const form = useForm<BootstrapFormValues>({
    defaultValues: {
      restaurantName: "",
      legalName: "",
      defaultLanguage: "es",
      timezone: "America/Santiago",
      currency: "CLP",
      adminEmail: "",
      adminPassword: "",
      adminFirstName: "",
      adminLastName: "",
    },
  });

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({
            restaurant: {
              name: values.restaurantName,
              legalName: values.legalName || undefined,
              defaultLanguage: values.defaultLanguage,
              timezone: values.timezone,
              currency: values.currency,
            },
            admin: {
              email: values.adminEmail,
              password: values.adminPassword,
              firstName: values.adminFirstName,
              lastName: values.adminLastName,
            },
          })
        )}
        className="rounded-[1.75rem] border border-border/70 bg-card/85 p-6 shadow-lg shadow-primary/8 backdrop-blur"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="border-primary/20 text-primary">
              {t("badge")}
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold text-balance">
              {t("title")}
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FieldGroup className="md:col-span-2">
            <FieldLabel htmlFor="restaurant-name">{t("name")}</FieldLabel>
            <TextInput id="restaurant-name" {...form.register("restaurantName")} />
          </FieldGroup>

          <FieldGroup className="md:col-span-2">
            <FieldLabel htmlFor="restaurant-legal-name">{t("legalName")}</FieldLabel>
            <TextInput id="restaurant-legal-name" {...form.register("legalName")} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="restaurant-language">{t("language")}</FieldLabel>
            <TextInput id="restaurant-language" {...form.register("defaultLanguage")} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="restaurant-currency">{t("currency")}</FieldLabel>
            <TextInput id="restaurant-currency" {...form.register("currency")} />
          </FieldGroup>

          <FieldGroup className="md:col-span-2">
            <FieldLabel htmlFor="restaurant-timezone">{t("timezone")}</FieldLabel>
            <TextInput id="restaurant-timezone" {...form.register("timezone")} />
          </FieldGroup>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <FieldGroup className="md:col-span-2">
            <FieldLabel htmlFor="admin-email">{t("adminEmail")}</FieldLabel>
            <TextInput id="admin-email" type="email" {...form.register("adminEmail")} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="admin-first-name">{t("adminFirstName")}</FieldLabel>
            <TextInput id="admin-first-name" {...form.register("adminFirstName")} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="admin-last-name">{t("adminLastName")}</FieldLabel>
            <TextInput id="admin-last-name" {...form.register("adminLastName")} />
          </FieldGroup>

          <FieldGroup className="md:col-span-2">
            <FieldLabel htmlFor="admin-password">{t("adminPassword")}</FieldLabel>
            <TextInput
              id="admin-password"
              type="password"
              {...form.register("adminPassword")}
            />
            <FieldHint>
              {t("passwordHint")}
            </FieldHint>
          </FieldGroup>
        </div>

        <Button type="submit" size="lg" className="mt-8 rounded-full" disabled={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <aside className="rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-lg shadow-primary/8 backdrop-blur">
        <h3 className="text-lg font-semibold">{t("expected")}</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {t("expectedDescription")}
        </p>

        {lastResult ? (
          <div className="mt-6 space-y-3 rounded-2xl border border-primary/15 bg-primary/6 p-4 text-sm">
            <p className="font-medium text-foreground">{lastResult.restaurantName}</p>
            <p className="font-mono text-xs text-muted-foreground">
              restaurantId: {lastResult.restaurantId}
            </p>
            <p className="text-muted-foreground">
              {t("firstAdmin")}: {lastResult.firstAdmin.firstName}{" "}
              {lastResult.firstAdmin.lastName}
            </p>
          </div>
        ) : null}
      </aside>
    </section>
  );
}
