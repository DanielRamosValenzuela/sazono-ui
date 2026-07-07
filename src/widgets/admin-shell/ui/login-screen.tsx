"use client";

import { ChefHat } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import type { LoginRequest } from "@/shared/types/auth";

type LoginScreenProps = {
  isPending: boolean;
  onSubmit: (values: LoginRequest) => void;
};

type LoginFormValues = {
  email: string;
  password: string;
  profileType: "platform_admin" | "staff";
  restaurantId: string;
};

export function LoginScreen({ isPending, onSubmit }: LoginScreenProps) {
  const t = useTranslations("AdminLogin");
  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
      profileType: "staff",
      restaurantId: "",
    },
  });

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex items-center justify-end gap-2 px-6 pt-6">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <ChefHat className="size-7" />
            </div>
            <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          <form
            onSubmit={form.handleSubmit((values) =>
              onSubmit({
                email: values.email,
                password: values.password,
                profileType: values.profileType,
                ...(values.restaurantId
                  ? { restaurantId: values.restaurantId }
                  : {}),
              })
            )}
            className="mt-8 space-y-4 rounded-3xl border border-border/70 bg-card p-6 shadow-lg shadow-primary/8 sm:p-8"
          >
            <FieldGroup>
              <FieldLabel htmlFor="login-profile-type">
                {t("profileType")}
              </FieldLabel>
              <SelectInput
                id="login-profile-type"
                {...form.register("profileType")}
              >
                <option value="staff">{t("profileStaff")}</option>
                <option value="platform_admin">{t("profilePlatform")}</option>
              </SelectInput>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="login-email">{t("email")}</FieldLabel>
              <TextInput
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                required
                {...form.register("email")}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="login-password">{t("password")}</FieldLabel>
              <TextInput
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                {...form.register("password")}
              />
            </FieldGroup>

            <details className="group rounded-xl border border-border/70 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors select-none hover:text-foreground">
                {t("advanced")}
              </summary>
              <FieldGroup className="mt-3 pb-1">
                <FieldLabel htmlFor="login-restaurant-id">
                  {t("restaurantId")}
                </FieldLabel>
                <TextInput
                  id="login-restaurant-id"
                  type="text"
                  {...form.register("restaurantId")}
                />
                <FieldHint>{t("restaurantHint")}</FieldHint>
              </FieldGroup>
            </details>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full"
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
        </div>
      </div>
    </main>
  );
}
