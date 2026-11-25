"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Printer } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { usePrintErrorText } from "@/shared/lib/print-error";
import { ApiError } from "@/shared/api/http-client";
import { printDeviceApi } from "@/shared/api/print-device-api";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  CheckboxRow,
  FieldGroup,
  FieldHint,
  FieldLabel,
  TextInput,
} from "@/shared/ui/form-controls";
import { usePrintClientStore } from "../model/print-client.store";
import {
  choosePrintPrinters,
  pairPrintDevice,
  printLocalTest,
  setPrintPreviewMode,
  unpairPrintDevice,
} from "../model/use-print-client";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 sm:p-6">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function PairForm() {
  const t = useTranslations("PrintClient");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const mutation = useMutation({
    mutationFn: () => pairPrintDevice(code, name.trim()),
    onSuccess: () => toast.success(t("pairedToast")),
    onError: (error) =>
      toast.error(
        error instanceof ApiError && error.status === 429
          ? t("pairTooMany")
          : t("pairError"),
      ),
  });
  const ready = /^\d{6}$/.test(code) && name.trim().length > 0;

  return (
    <Section title={t("pairTitle")}>
      <p className="text-sm leading-6 text-muted-foreground">
        {t("pairDescription")}
      </p>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (ready && !mutation.isPending) {
            mutation.mutate();
          }
        }}
      >
        <FieldGroup>
          <FieldLabel htmlFor="print-code">{t("codeLabel")}</FieldLabel>
          <TextInput
            id="print-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="text-center font-mono text-xl tracking-[0.4em]"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="print-name">{t("nameLabel")}</FieldLabel>
          <TextInput
            id="print-name"
            maxLength={60}
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FieldGroup>
        <Button
          type="submit"
          className="h-11 w-full"
          disabled={!ready || mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Printer className="size-4" />
          )}
          {t("pairAction")}
        </Button>
      </form>
    </Section>
  );
}

function StatusPanel() {
  const t = useTranslations("PrintClient");
  const describePrintError = usePrintErrorText();
  const format = useFormatter();
  const credentials = usePrintClientStore((state) => state.credentials);
  const status = usePrintClientStore((state) => state.status);
  const lastError = usePrintClientStore((state) => state.lastError);
  const lastJob = usePrintClientStore((state) => state.lastJob);
  const queue = usePrintClientStore((state) => state.queue);
  const printedCount = usePrintClientStore((state) => state.printedCount);

  const rows: [string, string][] = [
    [t("deviceName"), credentials?.name ?? ""],
    [
      t("lastJob"),
      lastJob
        ? `${lastJob.number} · ${format.dateTime(new Date(lastJob.at), { timeStyle: "short" })} · ${lastJob.ok ? t("jobOk") : t("jobFailed")}`
        : t("none"),
    ],
    [t("queue"), String(queue)],
    [t("printedCount"), String(printedCount)],
    [t("lastError"), lastError ? describePrintError(lastError) : t("none")],
  ];

  return (
    <Section title={t("deviceTitle")}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span
          aria-hidden
          className={
            status === "connected"
              ? "size-3 rounded-full bg-emerald-500"
              : "size-3 rounded-full bg-amber-500"
          }
        />
        {t(`status.${status}`)}
      </div>
      {Capacitor.isNativePlatform() ? (
        <p
          role="status"
          className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm font-medium text-amber-800 dark:text-amber-300"
        >
          {t("backgroundWarning")}
        </p>
      ) : null}
      {status === "standby" ? (
        <p className="text-sm text-muted-foreground">{t("standbyHint")}</p>
      ) : null}
      <dl className="grid gap-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-0.5">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function PrintersPanel() {
  const t = useTranslations("PrintClient");
  const queryClient = useQueryClient();
  const token = usePrintClientStore(
    (state) => state.credentials?.token ?? null,
  );
  const printers = usePrintClientStore((state) => state.printers);
  const [override, setOverride] = useState<string[] | null>(null);
  const meQuery = useQuery({
    queryKey: ["print-device", "me", token],
    queryFn: () => printDeviceApi.me(token!),
    enabled: Boolean(token),
  });
  const available = meQuery.data?.availablePrinters ?? [];
  const selected = override ?? printers.map((printer) => printer.id);
  const saveMutation = useMutation({
    mutationFn: () => choosePrintPrinters(selected),
    onSuccess: async () => {
      setOverride(null);
      await queryClient.invalidateQueries({ queryKey: ["print-device", "me"] });
      toast.success(t("savedToast"));
    },
    onError: () => toast.error(t("saveError")),
  });
  const describePrintError = usePrintErrorText();
  const testMutation = useMutation({
    mutationFn: async () => {
      const target = printers[0];

      if (!target) {
        return { ok: false, error: "NO_PRINTER" };
      }

      return printLocalTest(target, t("testTitleLine"));
    },
    onSuccess: (result) =>
      result.ok
        ? toast.success(t("testSent"))
        : toast.error(t("testFailed"), {
            description: result.error
              ? describePrintError(result.error)
              : undefined,
          }),
  });

  const toggle = (id: string) =>
    setOverride(
      selected.includes(id)
        ? selected.filter((value) => value !== id)
        : [...selected, id],
    );

  return (
    <Section title={t("printersTitle")}>
      <p className="text-sm leading-6 text-muted-foreground">
        {t("printersDescription")}
      </p>
      {meQuery.isPending ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : available.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("printersEmpty")}</p>
      ) : (
        <div className="space-y-2">
          {available.map((printer) => (
            <CheckboxRow key={printer.id} className="min-h-11">
              <input
                type="checkbox"
                className="size-5"
                checked={selected.includes(printer.id)}
                onChange={() => toggle(printer.id)}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {printer.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t("printerMeta", {
                    width: printer.paperWidthMm,
                    columns: printer.columns,
                    transport: printer.transport,
                  })}
                </span>
              </span>
            </CheckboxRow>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="h-11"
          disabled={override === null || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {t("savePrinters")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={printers.length === 0 || testMutation.isPending}
          onClick={() => testMutation.mutate()}
        >
          {testMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Printer className="size-4" />
          )}
          {t("testPrint")}
        </Button>
      </div>
    </Section>
  );
}

function SettingsPanel() {
  const t = useTranslations("PrintClient");
  const previewMode = usePrintClientStore((state) => state.previewMode);
  const [unpairOpen, setUnpairOpen] = useState(false);

  return (
    <Section title={t("settingsTitle")}>
      <CheckboxRow className="min-h-11">
        <input
          type="checkbox"
          className="size-5"
          checked={previewMode}
          onChange={(event) => void setPrintPreviewMode(event.target.checked)}
        />
        <span>{t("previewLabel")}</span>
      </CheckboxRow>
      <FieldHint>
        {t("previewHint")} {t("previewAutoOff")}
      </FieldHint>
      {previewMode ? (
        <p
          role="status"
          className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm font-medium text-amber-800 dark:text-amber-300"
        >
          {t("previewActive")}
        </p>
      ) : null}
      <div className="space-y-1 rounded-xl bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
        <p className="font-medium text-foreground">{t("kioskTitle")}</p>
        <p>{t("kioskBody")}</p>
        <p>{t("kioskPaper")}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full text-destructive sm:w-auto"
        onClick={() => setUnpairOpen(true)}
      >
        {t("unpair")}
      </Button>
      <ConfirmDialog
        open={unpairOpen}
        onOpenChange={setUnpairOpen}
        title={t("unpairTitle")}
        impact={t("unpairImpact")}
        confirmLabel={t("unpairConfirm")}
        tone="destructive"
        onConfirm={async () => {
          const remoteOk = await unpairPrintDevice();

          setUnpairOpen(false);
          if (remoteOk) {
            toast.success(t("unpairedToast"));
          } else {
            toast.warning(t("unpairFailed"));
          }
        }}
      />
    </Section>
  );
}

export function PrintDevicePanel() {
  const hydrated = usePrintClientStore((state) => state.hydrated);
  const paired = usePrintClientStore((state) => Boolean(state.credentials));

  if (!hydrated) {
    return <Loader2 className="size-6 animate-spin text-muted-foreground" />;
  }

  if (!paired) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <PairForm />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4">
      <StatusPanel />
      <PrintersPanel />
      <SettingsPanel />
    </div>
  );
}
