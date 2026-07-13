"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  PasswordInput,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import type { RestaurantBootstrapRequest } from "@/shared/types/admin";

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

type RegisterRestaurantFormProps = {
  isPending: boolean;
  onSubmit: (values: RestaurantBootstrapRequest) => void;
};

type RegisterFormValues = {
  restaurantName: string;
  legalName: string;
  branchQuota: number;
  defaultLanguage: string;
  timezone: string;
  currency: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
};

export function RegisterRestaurantForm({
  isPending,
  onSubmit,
}: RegisterRestaurantFormProps) {
  const t = useTranslations("AdminBootstrap");
  const form = useForm<RegisterFormValues>({
    defaultValues: {
      restaurantName: "",
      legalName: "",
      branchQuota: 1,
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
    <form
      onSubmit={form.handleSubmit((values) =>
        onSubmit({
          restaurant: {
            name: values.restaurantName,
            legalName: values.legalName || undefined,
            branchQuota: Number(values.branchQuota),
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
      className="rounded-3xl border border-primary/20 bg-card p-6 shadow-lg shadow-primary/8 sm:p-8"
    >
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
        {t("expectedDescription")}
      </p>

      <fieldset className="mt-7">
        <legend className="text-sm font-semibold tracking-wide text-primary">
          {t("sectionRestaurant")}
        </legend>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="restaurant-name">{t("name")}</FieldLabel>
            <TextInput
              id="restaurant-name"
              required
              {...form.register("restaurantName")}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="restaurant-legal-name">
              {t("legalName")}
            </FieldLabel>
            <TextInput id="restaurant-legal-name" {...form.register("legalName")} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="restaurant-branch-quota">
              {t("branchQuota")}
            </FieldLabel>
            <TextInput
              id="restaurant-branch-quota"
              type="number"
              min={1}
              required
              {...form.register("branchQuota", { valueAsNumber: true })}
            />
            <FieldHint>{t("branchQuotaHint")}</FieldHint>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="restaurant-language">{t("language")}</FieldLabel>
            <SelectInput
              id="restaurant-language"
              {...form.register("defaultLanguage")}
            >
              <option value="es">{t("languageEs")}</option>
              <option value="en">{t("languageEn")}</option>
            </SelectInput>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="restaurant-currency">{t("currency")}</FieldLabel>
            <SelectInput id="restaurant-currency" {...form.register("currency")}>
              {CURRENCY_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code} · {t(`currencies.${code}`)}
                </option>
              ))}
            </SelectInput>
          </FieldGroup>

          <FieldGroup className="md:col-span-2">
            <FieldLabel htmlFor="restaurant-timezone">{t("timezone")}</FieldLabel>
            <SelectInput id="restaurant-timezone" {...form.register("timezone")}>
              {TIMEZONE_OPTIONS.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replaceAll("_", " ")}
                </option>
              ))}
            </SelectInput>
            <FieldHint>{t("timezoneHint")}</FieldHint>
          </FieldGroup>
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="text-sm font-semibold tracking-wide text-primary">
          {t("sectionAdmin")}
        </legend>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FieldGroup className="md:col-span-2">
            <FieldLabel htmlFor="admin-email">{t("adminEmail")}</FieldLabel>
            <TextInput
              id="admin-email"
              type="email"
              required
              {...form.register("adminEmail")}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="admin-first-name">{t("adminFirstName")}</FieldLabel>
            <TextInput
              id="admin-first-name"
              required
              {...form.register("adminFirstName")}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="admin-last-name">{t("adminLastName")}</FieldLabel>
            <TextInput
              id="admin-last-name"
              required
              {...form.register("adminLastName")}
            />
          </FieldGroup>

          <FieldGroup className="md:col-span-2">
            <FieldLabel htmlFor="admin-password">{t("adminPassword")}</FieldLabel>
            <PasswordInput
              id="admin-password"
              required
              minLength={8}
              {...form.register("adminPassword")}
            />
            <FieldHint>{t("passwordHint")}</FieldHint>
          </FieldGroup>
        </div>
      </fieldset>

      <Button
        type="submit"
        size="lg"
        className="mt-8 w-full rounded-full sm:w-auto"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Spinner />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}
