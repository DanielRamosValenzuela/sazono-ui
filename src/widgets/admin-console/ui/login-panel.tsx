"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/shared/config/public-env";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import type { LoginRequest } from "@/shared/types/auth";

type LoginPanelProps = {
  isPending: boolean;
  onSubmit: (values: LoginRequest) => void;
};

type LoginFormValues = {
  email: string;
  password: string;
  profileType: "" | "platform_admin" | "staff";
  restaurantId: string;
};

export function LoginPanel({ isPending, onSubmit }: LoginPanelProps) {
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
    <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-lg shadow-primary/8 backdrop-blur">
        <Badge variant="outline" className="border-primary/20 text-primary">
          {t("badge")}
        </Badge>
        <h2 className="mt-4 text-4xl font-semibold text-balance">
          {t("title")}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          {t("description", { path: publicEnv.apiBaseUrl })}
        </p>
        <ul className="mt-6 space-y-3 text-sm leading-7 text-muted-foreground">
          <li>{t("step1")}</li>
          <li>{t("step2")}</li>
          <li>{t("step3")}</li>
          <li>{t("step4")}</li>
        </ul>
      </div>

      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({
            email: values.email,
            password: values.password,
            ...(values.profileType ? { profileType: values.profileType } : {}),
            ...(values.restaurantId ? { restaurantId: values.restaurantId } : {}),
          })
        )}
        className="rounded-[1.75rem] border border-border/70 bg-card/85 p-6 shadow-lg shadow-primary/8 backdrop-blur"
      >
        <div className="grid gap-4">
          <FieldGroup>
            <FieldLabel htmlFor="login-email">{t("email")}</FieldLabel>
            <TextInput
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="admin@sazonodemo.cl"
              {...form.register("email")}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="login-password">{t("password")}</FieldLabel>
            <TextInput
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu password"
              {...form.register("password")}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="login-profile-type">{t("profileType")}</FieldLabel>
            <SelectInput id="login-profile-type" {...form.register("profileType")}>
              <option value="staff">staff</option>
              <option value="platform_admin">platform_admin</option>
            </SelectInput>
            <FieldHint>
              {t("profileHint")}
            </FieldHint>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="login-restaurant-id">{t("restaurantId")}</FieldLabel>
            <TextInput
              id="login-restaurant-id"
              type="text"
              placeholder={t("restaurantHint")}
              {...form.register("restaurantId")}
            />
          </FieldGroup>
        </div>

        <Button type="submit" size="lg" className="mt-6 w-full rounded-full" disabled={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </section>
  );
}
