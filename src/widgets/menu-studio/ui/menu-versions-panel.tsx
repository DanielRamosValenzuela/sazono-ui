"use client";

import { useForm } from "react-hook-form";
import { BookOpenText, CheckCircle2, FileClock, Archive } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { CreateMenuRequest, MenuStatus, MenuSummary } from "@/shared/types/menu";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { EmptyHint, formatDateTime } from "./studio-primitives";

const MENU_LANGUAGES = ["es", "en"];

function getMenuStatusTone(status: MenuStatus) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300";
    case "DRAFT":
      return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
    case "ARCHIVED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

function getMenuStatusIcon(status: MenuStatus) {
  switch (status) {
    case "PUBLISHED":
      return CheckCircle2;
    case "ARCHIVED":
      return Archive;
    default:
      return FileClock;
  }
}

type MenuFormValues = {
  name: string;
  defaultLanguage: string;
};

type MenuVersionsPanelProps = {
  branchId: string;
  menus: MenuSummary[];
  selectedMenuId: string;
  isLoading: boolean;
  isCreating: boolean;
  onSelect: (menuId: string) => void;
  onCreate: (payload: CreateMenuRequest) => void;
};

export function MenuVersionsPanel({
  branchId,
  menus,
  selectedMenuId,
  isLoading,
  isCreating,
  onSelect,
  onCreate,
}: MenuVersionsPanelProps) {
  const t = useTranslations("MenuStudio");
  const locale = useLocale();
  const form = useForm<MenuFormValues>({
    defaultValues: {
      name: "",
      defaultLanguage: locale,
    },
  });

  return (
    <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <BookOpenText className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em]">
            {t("versionsEyebrow")}
          </p>
        </div>
        <CardTitle className="text-2xl">{t("versionsTitle")}</CardTitle>
        <CardDescription className="leading-7">
          {t("versionsDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="grid gap-3">
            <span className="sr-only">{t("versionsLoading")}</span>
            <Skeleton className="h-20 w-full rounded-[1.4rem]" />
            <Skeleton className="h-20 w-full rounded-[1.4rem]" />
            <Skeleton className="h-20 w-full rounded-[1.4rem]" />
          </div>
        ) : menus.length ? (
          <ul className="grid gap-3">
            {menus.map((menu) => {
              const StatusIcon = getMenuStatusIcon(menu.status);
              const isSelected = menu.menuId === selectedMenuId;

              return (
                <li key={menu.menuId}>
                  <button
                    type="button"
                    onClick={() => onSelect(menu.menuId)}
                    className={cn(
                      "w-full cursor-pointer rounded-[1.4rem] border p-4 text-left transition",
                      isSelected
                        ? "border-primary/35 bg-primary/7 shadow-lg shadow-primary/10"
                        : "border-border/70 bg-background/55 hover:border-primary/25 hover:bg-background/70"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="size-4 text-primary" />
                        <p className="font-medium">{menu.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {menu.isDefaultMenu ? (
                          <Badge variant="outline" className="border-primary/25 text-primary">
                            {t("versionDefault")}
                          </Badge>
                        ) : null}
                        <Badge className={cn("border-0", getMenuStatusTone(menu.status))}>
                          {t(`menuStatus_${menu.status}`)}
                        </Badge>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      {t("versionMeta", {
                        version: menu.version,
                        categories: menu.categoryCount,
                        items: menu.itemCount,
                      })}
                      {menu.publishedAt
                        ? ` · ${t("versionPublishedAt", {
                            publishedAt: formatDateTime(locale, menu.publishedAt),
                          })}`
                        : ""}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyHint>{t("versionsEmpty")}</EmptyHint>
        )}

        <form
          onSubmit={form.handleSubmit((values) => {
            onCreate({
              branchId,
              name: values.name.trim(),
              defaultLanguage: values.defaultLanguage,
            });
            form.reset({ name: "", defaultLanguage: values.defaultLanguage });
          })}
          className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/50 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t("versionCreateEyebrow")}
          </p>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <FieldGroup>
              <FieldLabel htmlFor="menu-name">{t("versionNameLabel")}</FieldLabel>
              <TextInput
                id="menu-name"
                placeholder={t("versionNamePlaceholder")}
                disabled={isCreating}
                {...form.register("name", { required: true })}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="menu-language">{t("versionLanguageLabel")}</FieldLabel>
              <SelectInput
                id="menu-language"
                disabled={isCreating}
                {...form.register("defaultLanguage")}
              >
                {MENU_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language.toUpperCase()}
                  </option>
                ))}
              </SelectInput>
            </FieldGroup>
          </div>

          <FieldHint>{t("versionCreateHint")}</FieldHint>

          <Button
            type="submit"
            className="justify-self-start rounded-full"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Spinner />
                {t("versionCreateSubmitting")}
              </>
            ) : (
              t("versionCreateSubmit")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
