"use client";

import { useForm } from "react-hook-form";
import { ChefHat, CupSoda, Coffee, Cake, Boxes, Flame } from "lucide-react";
import { useTranslations } from "next-intl";
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
import type {
  CreatePreparationStationRequest,
  PreparationStation,
  PreparationStationType,
} from "@/shared/types/menu";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { EmptyHint } from "./studio-primitives";

const STATION_TYPES: PreparationStationType[] = [
  "KITCHEN",
  "BAR",
  "DESSERT",
  "COFFEE",
  "OTHER",
];

const STATION_ICONS: Record<PreparationStationType, typeof ChefHat> = {
  KITCHEN: ChefHat,
  BAR: CupSoda,
  DESSERT: Cake,
  COFFEE: Coffee,
  OTHER: Boxes,
};

type StationFormValues = {
  name: string;
  stationType: PreparationStationType;
};

type StationsPanelProps = {
  branchId: string;
  stations: PreparationStation[];
  isLoading: boolean;
  isCreating: boolean;
  onCreate: (payload: CreatePreparationStationRequest) => void;
};

export function StationsPanel({
  branchId,
  stations,
  isLoading,
  isCreating,
  onCreate,
}: StationsPanelProps) {
  const t = useTranslations("MenuStudio");
  const form = useForm<StationFormValues>({
    defaultValues: {
      name: "",
      stationType: "KITCHEN",
    },
  });

  return (
    <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <Flame className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em]">
            {t("stationsEyebrow")}
          </p>
        </div>
        <CardTitle className="text-2xl">{t("stationsTitle")}</CardTitle>
        <CardDescription className="leading-7">
          {t("stationsDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="grid gap-3">
            <span className="sr-only">{t("stationsLoading")}</span>
            <Skeleton className="h-16 w-full rounded-[1.4rem]" />
            <Skeleton className="h-16 w-full rounded-[1.4rem]" />
            <Skeleton className="h-16 w-full rounded-[1.4rem]" />
          </div>
        ) : stations.length ? (
          <ul className="grid gap-3">
            {stations.map((station) => {
              const Icon = STATION_ICONS[station.stationType] ?? Boxes;

              return (
                <li
                  key={station.preparationStationId}
                  className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-border/70 bg-background/55 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium">{station.name}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {t(`stationType_${station.stationType}`)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "border-0",
                      station.status === "ACTIVE"
                        ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {t(`stationStatus_${station.status}`)}
                  </Badge>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyHint>{t("stationsEmpty")}</EmptyHint>
        )}

        <form
          onSubmit={form.handleSubmit((values) => {
            onCreate({
              branchId,
              name: values.name.trim(),
              stationType: values.stationType,
            });
            form.reset({ name: "", stationType: values.stationType });
          })}
          className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/50 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t("stationCreateEyebrow")}
          </p>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <FieldGroup>
              <FieldLabel htmlFor="station-name">{t("stationNameLabel")}</FieldLabel>
              <TextInput
                id="station-name"
                placeholder={t("stationNamePlaceholder")}
                disabled={isCreating}
                {...form.register("name", { required: true })}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="station-type">{t("stationTypeLabel")}</FieldLabel>
              <SelectInput
                id="station-type"
                disabled={isCreating}
                {...form.register("stationType")}
              >
                {STATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`stationType_${type}`)}
                  </option>
                ))}
              </SelectInput>
            </FieldGroup>
          </div>

          <FieldHint>{t("stationCreateHint")}</FieldHint>

          <Button
            type="submit"
            className="justify-self-start rounded-full"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Spinner />
                {t("stationCreateSubmitting")}
              </>
            ) : (
              t("stationCreateSubmit")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
