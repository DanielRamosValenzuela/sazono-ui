"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, Smartphone, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { printingApi } from "@/shared/api/printing-api";
import type {
  PairingResult,
  PrintDevice,
  PrintDeviceKind,
  Printer,
} from "@/shared/types/printing";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  CheckboxRow,
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { formatReportDateTime } from "@/widgets/reports/ui/report-range";
import {
  CopyButton,
  SectionCard,
  usePrintingErrorMessage,
} from "./printing-shared";

const KINDS: PrintDeviceKind[] = ["ANDROID_APP", "BROWSER"];

const COMPATIBLE: Record<PrintDeviceKind, Printer["transport"][]> = {
  ANDROID_APP: ["APP_BRIDGE", "BROWSER"],
  BROWSER: ["BROWSER"],
  AGENT: ["AGENT"],
};

type TabProps = {
  token: string | null;
  branchId: string;
};

export function DevicesTab({ token, branchId }: TabProps) {
  const t = useTranslations("AdminPrinting");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const describeError = usePrintingErrorMessage();
  const [createOpen, setCreateOpen] = useState(false);
  const [pairing, setPairing] = useState<PairingResult | null>(null);
  const [revoking, setRevoking] = useState<PrintDevice | null>(null);
  const [repairing, setRepairing] = useState<PrintDevice | null>(null);

  const devicesQuery = useQuery({
    queryKey: ["printing", "devices", branchId],
    enabled: Boolean(token),
    refetchInterval: 15_000,
    queryFn: () => printingApi.listDevices(token!, branchId),
  });
  const printersQuery = useQuery({
    queryKey: ["printing", "printers", branchId],
    enabled: Boolean(token),
    queryFn: () => printingApi.listPrinters(token!, branchId),
  });

  const devices = (devicesQuery.data ?? []).filter((entry) => entry.active);
  const printers = printersQuery.data ?? [];

  const revokeMutation = useMutation({
    mutationFn: (deviceId: string) =>
      printingApi.revokeDevice(token!, branchId, deviceId),
    onSuccess: () => {
      toast.success(t("devices.revoked"));
      setRevoking(null);
      void queryClient.invalidateQueries({ queryKey: ["printing"] });
    },
    onError: (error) => {
      setRevoking(null);
      toast.error(describeError(error, t("devices.revokeError")));
    },
  });

  const codeMutation = useMutation({
    mutationFn: (deviceId: string) =>
      printingApi.newPairingCode(token!, branchId, deviceId),
    onSuccess: (result) => {
      setRepairing(null);
      setPairing(result);
      void queryClient.invalidateQueries({ queryKey: ["printing", "devices"] });
    },
    onError: (error) => {
      setRepairing(null);
      toast.error(describeError(error, t("devices.codeError")));
    },
  });

  const requestCode = (device: PrintDevice) => {
    if (device.paired) {
      setRepairing(device);
    } else {
      codeMutation.mutate(device.id);
    }
  };

  const printerNames = (device: PrintDevice) =>
    device.printerIds
      .map((id) => printers.find((entry) => entry.id === id)?.name)
      .filter(Boolean)
      .join(", ");

  return (
    <SectionCard
      title={t("devices.title")}
      description={t("devices.description")}
      actions={
        <Button
          type="button"
          className="h-11 w-full rounded-full sm:w-auto"
          onClick={() => setCreateOpen(true)}
        >
          <Plus />
          {t("devices.pair")}
        </Button>
      }
    >
      {devicesQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : devicesQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t("devices.error")}
        </p>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 p-6 text-center">
          <Smartphone className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("devices.empty")}</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {devices.map((device) => (
            <li
              key={device.id}
              className="space-y-3 rounded-2xl border border-border/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    {device.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`devices.kind.${device.kind}`)}
                    {device.appVersion ? ` · v${device.appVersion}` : ""}
                  </p>
                </div>
                {device.paired ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    <span
                      aria-hidden="true"
                      className={
                        device.online
                          ? "size-2.5 rounded-full bg-emerald-500"
                          : "size-2.5 rounded-full bg-destructive"
                      }
                    />
                    {device.online
                      ? t("devices.online")
                      : t("devices.offline")}
                  </span>
                ) : (
                  <Badge variant="secondary">{t("devices.waitingPairing")}</Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {device.lastSeenAt
                  ? t("lastSeen", {
                      date: formatReportDateTime(device.lastSeenAt, locale),
                    })
                  : t("neverSeen")}
                {" · "}
                {printerNames(device) || t("devices.noPrinters")}
              </p>

              {device.pairingPending && device.pairingExpiresAt ? (
                <p className="text-xs text-muted-foreground">
                  {t("devices.codeValidUntil", {
                    date: formatReportDateTime(device.pairingExpiresAt, locale),
                  })}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full sm:h-10"
                  disabled={codeMutation.isPending}
                  onClick={() => requestCode(device)}
                >
                  {codeMutation.isPending &&
                  codeMutation.variables === device.id ? (
                    <Spinner />
                  ) : (
                    <KeyRound />
                  )}
                  {t("devices.newCode")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full text-destructive sm:h-10"
                  onClick={() => setRevoking(device)}
                >
                  <Trash2 />
                  {t("devices.revoke")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CreateDeviceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        token={token}
        branchId={branchId}
        printers={printers}
        onCreated={(result) => {
          setCreateOpen(false);
          setPairing(result);
        }}
      />

      <PairingCodeDialog result={pairing} onClose={() => setPairing(null)} />

      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRevoking(null);
          }
        }}
        title={t("devices.revokeConfirm.title", { name: revoking?.name ?? "" })}
        description={t("devices.revokeConfirm.description")}
        impact={t("devices.revokeConfirm.impact")}
        confirmLabel={t("devices.revokeConfirm.confirm")}
        tone="destructive"
        isPending={revokeMutation.isPending}
        onConfirm={() => {
          if (revoking) {
            revokeMutation.mutate(revoking.id);
          }
        }}
      />

      <ConfirmDialog
        open={repairing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRepairing(null);
          }
        }}
        title={t("devices.repairConfirm.title", { name: repairing?.name ?? "" })}
        description={t("devices.repairConfirm.description")}
        impact={t("devices.repairConfirm.impact")}
        confirmLabel={t("devices.repairConfirm.confirm")}
        tone="warning"
        isPending={codeMutation.isPending}
        onConfirm={() => {
          if (repairing) {
            codeMutation.mutate(repairing.id);
          }
        }}
      />
    </SectionCard>
  );
}

function CreateDeviceDialog({
  open,
  onClose,
  token,
  branchId,
  printers,
  onCreated,
}: TabProps & {
  open: boolean;
  onClose: () => void;
  printers: Printer[];
  onCreated: (result: PairingResult) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        {open ? (
          <CreateDeviceForm
            onClose={onClose}
            token={token}
            branchId={branchId}
            printers={printers}
            onCreated={onCreated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CreateDeviceForm({
  onClose,
  token,
  branchId,
  printers,
  onCreated,
}: TabProps & {
  onClose: () => void;
  printers: Printer[];
  onCreated: (result: PairingResult) => void;
}) {
  const t = useTranslations("AdminPrinting");
  const queryClient = useQueryClient();
  const describeError = usePrintingErrorMessage();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PrintDeviceKind>("ANDROID_APP");
  const [printerIds, setPrinterIds] = useState<string[]>([]);

  const compatible = printers.filter(
    (printer) => printer.active && COMPATIBLE[kind].includes(printer.transport)
  );
  const selected = printerIds.filter((id) =>
    compatible.some((printer) => printer.id === id)
  );

  const mutation = useMutation({
    mutationFn: () =>
      printingApi.createDevice(token!, branchId, {
        name: name.trim() || undefined,
        kind,
        printerIds: selected,
      }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["printing"] });
      onCreated(result);
    },
    onError: (error) => {
      toast.error(describeError(error, t("devices.createError")));
    },
  });

  const toggle = (id: string) =>
    setPrinterIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id]
    );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{t("devices.createTitle")}</DialogTitle>
        <DialogDescription>{t("devices.createDescription")}</DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <FieldLabel htmlFor="device-name">{t("devices.name")}</FieldLabel>
        <TextInput
          id="device-name"
          value={name}
          maxLength={60}
          placeholder={t("devices.namePlaceholder")}
          onChange={(event) => setName(event.target.value)}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="device-kind">{t("devices.kindLabel")}</FieldLabel>
        <SelectInput
          id="device-kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as PrintDeviceKind)}
        >
          {KINDS.map((entry) => (
            <option key={entry} value={entry}>
              {t(`devices.kind.${entry}`)}
            </option>
          ))}
        </SelectInput>
        <FieldHint>{t(`devices.kindHint.${kind}`)}</FieldHint>
      </FieldGroup>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">
          {t("devices.servesPrinters")}
        </legend>
        {compatible.length === 0 ? (
          <FieldHint>{t("devices.noCompatiblePrinters")}</FieldHint>
        ) : (
          compatible.map((printer) => (
            <CheckboxRow key={printer.id} className="min-h-11">
              <input
                type="checkbox"
                className="size-5"
                checked={selected.includes(printer.id)}
                onChange={() => toggle(printer.id)}
              />
              {printer.name}
            </CheckboxRow>
          ))
        )}
      </fieldset>

      <div className="flex flex-col-reverse gap-3 sm:flex-row-reverse sm:justify-start">
        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="w-full rounded-full sm:w-auto"
        >
          {mutation.isPending ? <Spinner /> : null}
          {t("devices.generateCode")}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={mutation.isPending}
          onClick={onClose}
          className="w-full rounded-full sm:w-auto"
        >
          {t("form.cancel")}
        </Button>
      </div>
    </form>
  );
}

function PairingCodeDialog({
  result,
  onClose,
}: {
  result: PairingResult | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={result !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {result ? <PairingCodeBody key={result.pairingCode} result={result} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function PairingCodeBody({ result }: { result: PairingResult }) {
  const t = useTranslations("AdminPrinting");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(
    0,
    Math.floor((new Date(result.expiresAt).getTime() - now) / 1000)
  );
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("devices.codeTitle")}</DialogTitle>
        <DialogDescription>
          {t("devices.codeDescription", { name: result.device.name })}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 rounded-2xl bg-muted/60 p-4 text-center">
        <p
          className="font-mono text-4xl font-bold tracking-[0.3em]"
          aria-label={t("devices.codeAria", {
            code: result.pairingCode.split("").join(" "),
          })}
        >
          {result.pairingCode}
        </p>
        <p
          role="timer"
          className={
            remaining === 0
              ? "text-sm font-medium text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {remaining === 0
            ? t("devices.codeExpired")
            : t("devices.codeExpiresIn", { time: `${minutes}:${seconds}` })}
        </p>
        <CopyButton value={result.pairingCode} label={t("devices.copyCode")} />
      </div>

      <FieldHint>{t("devices.codeHowTo")}</FieldHint>
    </>
  );
}
