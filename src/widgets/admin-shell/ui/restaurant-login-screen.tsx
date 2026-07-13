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
  FieldLabel,
  PasswordInput,
  TextInput,
} from "@/shared/ui/form-controls";
import type { LoginRequest } from "@/shared/types/auth";

type RestaurantLoginScreenProps = {
  restaurantName: string;
  restaurantSlug: string;
  isPending: boolean;
  onSubmit: (values: LoginRequest) => void;
};

type RestaurantLoginFormValues = {
  email: string;
  password: string;
};

export function RestaurantLoginScreen({
  restaurantName,
  restaurantSlug,
  isPending,
  onSubmit,
}: RestaurantLoginScreenProps) {
  const t = useTranslations("RestaurantLoginScreen");
  const form = useForm<RestaurantLoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  return (
    <main className="flex min-h-screen flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
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
              {restaurantName}
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
                profileType: "staff",
                restaurantSlug,
              })
            )}
            className="mt-8 space-y-4 rounded-3xl border border-border/70 bg-card p-6 shadow-lg shadow-primary/8 sm:p-8"
          >
            <FieldGroup>
              <FieldLabel htmlFor="restaurant-login-email">
                {t("email")}
              </FieldLabel>
              <TextInput
                id="restaurant-login-email"
                type="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                required
                {...form.register("email")}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="restaurant-login-password">
                {t("password")}
              </FieldLabel>
              <PasswordInput
                id="restaurant-login-password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                {...form.register("password")}
              />
            </FieldGroup>

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
