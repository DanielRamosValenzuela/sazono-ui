"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { adminApi } from "@/shared/api/admin-api";
import { printingApi } from "@/shared/api/printing-api";
import type { Printer, PrintStation } from "@/shared/types/printing";
import {
  CheckboxRow,
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { SectionCard, usePrintingErrorMessage } from "./printing-shared";

const DEFAULT_BUSINESS_DAY_START = 4;

type TabProps = {
  token: string | null;
  branchId: string;
};

export function StationsTab({ token, branchId }: TabProps) {
  const t = useTranslations("AdminPrinting");

  const stationsQuery = useQuery({
    queryKey: ["printing", "stations", branchId],
    enabled: Boolean(token),
    queryFn: () => printingApi.listStations(token!, branchId),
  });
  const printersQuery = useQuery({
    queryKey: ["printing", "printers", branchId],
    enabled: Boolean(token),
    queryFn: () => printingApi.listPrinters(token!, branchId),
  });

  const stations = stationsQuery.data ?? [];
  const printers = printersQuery.data ?? [];

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("stationsTitle")}
        description={t("stationsDescription")}
      >
        <div className="space-y-2 rounded-2xl bg-muted/60 p-4 text-sm leading-6">
          <p className="font-medium">{t("numberFormat.title")}</p>
          <p className="font-mono text-2xl font-bold tracking-wide">
            {t("numberFormat.example")}
          </p>
          <p className="text-muted-foreground">{t("numberFormat.explain")}</p>
        </div>

        {stationsQuery.isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : stationsQuery.isError ? (
          <p role="alert" className="text-sm text-destructive">
            {t("stationsError")}
          </p>
        ) : stations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("noStations")}
          </p>
        ) : (
          <ul className="grid gap-3">
            {stations.map((station) => (
              <StationRow
                key={`${station.stationId}:${station.printCode ?? ""}:${station.printerIds.join(",")}`}
                station={station}
                printers={printers}
                token={token}
                branchId={branchId}
              />
            ))}
          </ul>
        )}
      </SectionCard>

      <BusinessDayCard token={token} branchId={branchId} />
    </div>
  );
}

function StationRow({
  station,
  printers,
  token,
  branchId,
}: {
  station: PrintStation;
  printers: Printer[];
  token: string | null;
  branchId: string;
}) {
  const t = useTranslations("AdminPrinting");
  const queryClient = useQueryClient();
  const describeError = usePrintingErrorMessage();
  const [code, setCode] = useState(station.printCode ?? "");
  const [printerIds, setPrinterIds] = useState<string[]>(station.printerIds);

  const normalized = code.trim().toUpperCase();
  const dirty =
    normalized !== (station.printCode ?? "") ||
    [...printerIds].sort().join() !== [...station.printerIds].sort().join();

  const mutation = useMutation({
    mutationFn: () =>
      printingApi.updateStation(token!, branchId, station.stationId, {
        printCode: normalized || null,
        printerIds,
      }),
    onSuccess: () => {
      toast.success(t("stationSaved"));
      void queryClient.invalidateQueries({ queryKey: ["printing"] });
    },
    onError: (error) => {
      toast.error(describeError(error, t("stationSaveError")));
    },
  });

  const toggle = (id: string) =>
    setPrinterIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id]
    );

  const exampleCode = normalized || t("autoCodeExample");

  return (
    <li className="space-y-3 rounded-2xl border border-border/70 p-4">
      <p className="text-base font-semibold">{station.name}</p>

      <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-end gap-3">
        <FieldGroup>
          <FieldLabel htmlFor={`code-${station.stationId}`}>
            {t("printCode")}
          </FieldLabel>
          <TextInput
            id={`code-${station.stationId}`}
            value={code}
            maxLength={4}
            autoComplete="off"
            placeholder={t("printCodeAuto")}
            className="font-mono uppercase"
            onChange={(event) =>
              setCode(event.target.value.replace(/[^a-zA-Z0-9]/g, ""))
            }
          />
        </FieldGroup>
        <div className="pb-2">
          <p className="text-xs text-muted-foreground">{t("liveExample")}</p>
          <p
            className="font-mono text-xl font-bold"
            aria-label={t("liveExample")}
          >
            {`#${exampleCode}-023`}
          </p>
        </div>
      </div>
      <FieldHint>{t("printCodeHint")}</FieldHint>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{t("printsOn")}</legend>
        {printers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("printersEmpty")}</p>
        ) : (
          printers.map((printer) => (
            <CheckboxRow key={printer.id} className="min-h-11">
              <input
                type="checkbox"
                className="size-5"
                checked={printerIds.includes(printer.id)}
                onChange={() => toggle(printer.id)}
              />
              {printer.name}
            </CheckboxRow>
          ))
        )}
        {printerIds.length === 0 ? (
          <FieldHint>{t("stationNoPrinter")}</FieldHint>
        ) : null}
      </fieldset>

      <Button
        type="button"
        size="lg"
        className="w-full rounded-full sm:w-auto"
        disabled={!dirty || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? <Spinner /> : null}
        {t("saveStation")}
      </Button>
    </li>
  );
}

function BusinessDayCard({ token, branchId }: TabProps) {
  const t = useTranslations("AdminPrinting");
  const queryClient = useQueryClient();

  const branchQuery = useQuery({
    queryKey: ["printing", "branch-settings", branchId],
    enabled: Boolean(token),
    queryFn: async () => {
      const branches = await adminApi.listBranches(token!);
      return branches.find((entry) => entry.branchId === branchId) ?? null;
    },
  });

  const saved =
    branchQuery.data?.settings?.businessDayStartHour ??
    DEFAULT_BUSINESS_DAY_START;

  return (
    <SectionCard
      title={t("businessDay.title")}
      description={t("businessDay.description")}
    >
      {branchQuery.isLoading ? (
        <Skeleton className="h-16 w-full rounded-2xl" />
      ) : branchQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t("businessDay.loadError")}
        </p>
      ) : (
        <BusinessDayForm
          key={saved}
          saved={saved}
          onSave={(hour) =>
            adminApi
              .updateBranch(token!, branchId, {
                settings: { businessDayStartHour: hour },
              })
              .then(() => {
                queryClient.setQueryData(
                  ["printing", "branch-settings", branchId],
                  (current: typeof branchQuery.data) =>
                    current
                      ? {
                          ...current,
                          settings: {
                            ...current.settings,
                            businessDayStartHour: hour,
                          },
                        }
                      : current
                );

                return queryClient.invalidateQueries({
                  queryKey: ["printing", "branch-settings"],
                });
              })
          }
        />
      )}
    </SectionCard>
  );
}

function BusinessDayForm({
  saved,
  onSave,
}: {
  saved: number;
  onSave: (hour: number) => Promise<unknown>;
}) {
  const t = useTranslations("AdminPrinting");
  const [hour, setHour] = useState(saved);

  const mutation = useMutation({
    mutationFn: () => onSave(hour),
    onSuccess: () => toast.success(t("businessDay.saved")),
    onError: () => toast.error(t("businessDay.saveError")),
  });

  const label = (value: number) => `${String(value).padStart(2, "0")}:00`;

  return (
    <div className="space-y-3">
      <FieldGroup className="sm:w-64">
        <FieldLabel htmlFor="business-day-hour">
          {t("businessDay.label")}
        </FieldLabel>
        <SelectInput
          id="business-day-hour"
          value={hour}
          disabled={mutation.isPending}
          onChange={(event) => setHour(Number(event.target.value))}
        >
          {Array.from({ length: 24 }, (_, value) => (
            <option key={value} value={value}>
              {label(value)}
            </option>
          ))}
        </SelectInput>
      </FieldGroup>
      <FieldHint>
        {t("businessDay.hint", { start: label(hour) })}
      </FieldHint>
      <Button
        type="button"
        size="lg"
        className="w-full rounded-full sm:w-auto"
        disabled={hour === saved || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? <Spinner /> : null}
        {t("businessDay.save")}
      </Button>
    </div>
  );
}
