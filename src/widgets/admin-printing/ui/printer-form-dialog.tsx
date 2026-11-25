"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { printingApi } from "@/shared/api/printing-api";
import type {
  PrintStation,
  Printer,
  PrinterCodepage,
  PrinterInput,
  PrinterTransport,
} from "@/shared/types/printing";
import {
  CheckboxRow,
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { usePrintingErrorMessage } from "./printing-shared";

const TRANSPORTS: PrinterTransport[] = [
  "SIMULATED",
  "BROWSER",
  "APP_BRIDGE",
  "TCP",
];
const COLUMNS = [32, 35, 42, 48];
const CODEPAGES: PrinterCodepage[] = [
  "cp858",
  "windows1252",
  "cp850",
  "cp437",
];

type PrinterFormDialogProps = {
  open: boolean;
  onClose: () => void;
  token: string | null;
  branchId: string;
  printer: Printer | null;
  stations: PrintStation[];
};

export function PrinterFormDialog({
  open,
  onClose,
  token,
  branchId,
  printer,
  stations,
}: PrinterFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        {open ? (
          <PrinterForm
            key={printer?.id ?? "new"}
            onClose={onClose}
            token={token}
            branchId={branchId}
            printer={printer}
            stations={stations}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PrinterForm({
  onClose,
  token,
  branchId,
  printer,
  stations,
}: Omit<PrinterFormDialogProps, "open">) {
  const t = useTranslations("AdminPrinting");
  const queryClient = useQueryClient();
  const describeError = usePrintingErrorMessage();
  const conn = printer?.connection ?? {};

  const [name, setName] = useState(printer?.name ?? "");
  const [transport, setTransport] = useState<PrinterTransport>(
    printer?.transport ?? "SIMULATED"
  );
  const [via, setVia] = useState<"tcp" | "bluetooth">(conn.via ?? "tcp");
  const [host, setHost] = useState(conn.host ?? "");
  const [port, setPort] = useState(String(conn.port ?? 9100));
  const [address, setAddress] = useState(conn.address ?? "");
  const [paperWidthMm, setPaperWidthMm] = useState(printer?.paperWidthMm ?? 58);
  const [columns, setColumns] = useState(printer?.columns ?? 32);
  const [codepage, setCodepage] = useState<PrinterCodepage>(
    printer?.codepage ?? "cp858"
  );
  const [copies, setCopies] = useState(printer?.copies ?? 1);
  const [autoCut, setAutoCut] = useState(printer?.autoCut ?? true);
  const [printVoidSlips, setPrintVoidSlips] = useState(
    printer?.printVoidSlips ?? true
  );
  const [active, setActive] = useState(printer?.active ?? true);
  const [stationIds, setStationIds] = useState<string[]>(
    printer?.stationIds ?? []
  );

  const [nameError, setNameError] = useState(false);
  const [portError, setPortError] = useState(false);

  const usesNetwork =
    transport === "TCP" || (transport === "APP_BRIDGE" && via === "tcp");
  const usesBluetooth = transport === "APP_BRIDGE" && via === "bluetooth";

  const mutation = useMutation({
    mutationFn: async (payload: PrinterInput) => {
      if (!printer) {
        return printingApi.createPrinter(token!, branchId, payload);
      }

      const { stationIds: nextStationIds, ...fields } = payload;
      const current = printer.stationIds ?? [];
      const stationsChanged =
        nextStationIds !== undefined &&
        (nextStationIds.length !== current.length ||
          nextStationIds.some((id) => !current.includes(id)));
      const updated = await printingApi.updatePrinter(
        token!,
        branchId,
        printer.id,
        fields
      );

      return stationsChanged
        ? printingApi.setPrinterStations(
            token!,
            branchId,
            printer.id,
            nextStationIds
          )
        : updated;
    },
    onSuccess: () => {
      toast.success(printer ? t("printerSaved") : t("printerCreated"));
      void queryClient.invalidateQueries({ queryKey: ["printing"] });
      onClose();
    },
    onError: (error) => {
      toast.error(describeError(error, t("printerSaveError")));
    },
  });

  const changePaperWidth = (mm: number) => {
    setPaperWidthMm(mm);
    setColumns(mm === 80 ? 48 : 32);
  };

  const toggleStation = (id: string) =>
    setStationIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id]
    );

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setNameError(true);

      return;
    }

    if (usesNetwork && !/^\d{4,5}$/.test(port.trim())) {
      setPortError(true);

      return;
    }

    if (usesNetwork && (Number(port) < 9100 || Number(port) > 9110)) {
      setPortError(true);

      return;
    }

    const connection =
      transport === "TCP"
        ? { host: host.trim(), port: Number(port) }
        : transport === "APP_BRIDGE"
          ? via === "bluetooth"
            ? { via, address: address.trim() }
            : { via, host: host.trim(), port: Number(port) }
          : {};

    mutation.mutate({
      name: name.trim(),
      transport,
      connection,
      paperWidthMm,
      columns,
      codepage,
      copies,
      autoCut,
      printVoidSlips,
      active,
      stationIds,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>
          {printer ? t("form.editTitle") : t("form.createTitle")}
        </DialogTitle>
        <DialogDescription>{t("form.description")}</DialogDescription>
      </DialogHeader>

      <FieldGroup>
        <FieldLabel htmlFor="printer-name">{t("form.name")}</FieldLabel>
        <TextInput
          id="printer-name"
          value={name}
          maxLength={60}
          aria-invalid={nameError && !name.trim()}
          placeholder={t("form.namePlaceholder")}
          onChange={(event) => {
            setName(event.target.value);
            setNameError(false);
          }}
        />
        {nameError && !name.trim() ? (
          <p role="alert" className="text-xs text-destructive">
            {t("form.nameRequired")}
          </p>
        ) : null}
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="printer-transport">
          {t("form.transport")}
        </FieldLabel>
        <SelectInput
          id="printer-transport"
          value={transport}
          onChange={(event) =>
            setTransport(event.target.value as PrinterTransport)
          }
        >
          {TRANSPORTS.map((entry) => (
            <option key={entry} value={entry}>
              {t(`transport.${entry}`)}
            </option>
          ))}
        </SelectInput>
        <FieldHint>{t(`transportHint.${transport}`)}</FieldHint>
      </FieldGroup>

      {transport === "APP_BRIDGE" ? (
        <FieldGroup>
          <FieldLabel htmlFor="printer-via">{t("form.via")}</FieldLabel>
          <SelectInput
            id="printer-via"
            value={via}
            onChange={(event) =>
              setVia(event.target.value as "tcp" | "bluetooth")
            }
          >
            <option value="tcp">{t("form.viaTcp")}</option>
            <option value="bluetooth">{t("form.viaBluetooth")}</option>
          </SelectInput>
        </FieldGroup>
      ) : null}

      {usesNetwork ? (
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
          <FieldGroup>
            <FieldLabel htmlFor="printer-host">{t("form.host")}</FieldLabel>
            <TextInput
              id="printer-host"
              value={host}
              required
              inputMode="decimal"
              autoComplete="off"
              placeholder="192.168.1.50"
              onChange={(event) => setHost(event.target.value)}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="printer-port">{t("form.port")}</FieldLabel>
            <TextInput
              id="printer-port"
              value={port}
              inputMode="numeric"
              aria-invalid={portError}
              onChange={(event) => {
                setPort(event.target.value);
                setPortError(false);
              }}
            />
            {portError ? (
              <p role="alert" className="text-xs text-destructive">
                {t("form.portInvalid")}
              </p>
            ) : (
              <FieldHint>{t("form.portHint")}</FieldHint>
            )}
          </FieldGroup>
        </div>
      ) : null}

      {usesBluetooth ? (
        <FieldGroup>
          <FieldLabel htmlFor="printer-address">
            {t("form.bluetoothAddress")}
          </FieldLabel>
          <TextInput
            id="printer-address"
            value={address}
            required
            autoComplete="off"
            placeholder="AA:BB:CC:DD:EE:FF"
            onChange={(event) => setAddress(event.target.value)}
          />
        </FieldGroup>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <FieldLabel htmlFor="printer-paper">{t("form.paperWidth")}</FieldLabel>
          <SelectInput
            id="printer-paper"
            value={paperWidthMm}
            onChange={(event) => changePaperWidth(Number(event.target.value))}
          >
            <option value={58}>58 mm</option>
            <option value={80}>80 mm</option>
          </SelectInput>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="printer-columns">{t("form.columns")}</FieldLabel>
          <SelectInput
            id="printer-columns"
            value={columns}
            onChange={(event) => setColumns(Number(event.target.value))}
          >
            {COLUMNS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </SelectInput>
        </FieldGroup>
      </div>
      <FieldHint className="-mt-2">{t("form.columnsHint")}</FieldHint>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup>
          <FieldLabel htmlFor="printer-codepage">
            {t("form.codepage")}
          </FieldLabel>
          <SelectInput
            id="printer-codepage"
            value={codepage}
            onChange={(event) =>
              setCodepage(event.target.value as PrinterCodepage)
            }
          >
            {CODEPAGES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </SelectInput>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="printer-copies">{t("form.copies")}</FieldLabel>
          <SelectInput
            id="printer-copies"
            value={copies}
            onChange={(event) => setCopies(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </SelectInput>
        </FieldGroup>
      </div>
      <FieldHint className="-mt-2">{t("form.codepageHint")}</FieldHint>

      <div className="grid gap-2">
        <CheckboxRow className="min-h-11">
          <input
            type="checkbox"
            className="size-5"
            checked={autoCut}
            onChange={(event) => setAutoCut(event.target.checked)}
          />
          {t("form.autoCut")}
        </CheckboxRow>
        <CheckboxRow className="min-h-11">
          <input
            type="checkbox"
            className="size-5"
            checked={printVoidSlips}
            onChange={(event) => setPrintVoidSlips(event.target.checked)}
          />
          {t("form.printVoidSlips")}
        </CheckboxRow>
        <CheckboxRow className="min-h-11">
          <input
            type="checkbox"
            className="size-5"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />
          {t("form.active")}
        </CheckboxRow>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">{t("form.stations")}</legend>
        <FieldHint>{t("form.stationsHint")}</FieldHint>
        {stations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noStations")}</p>
        ) : (
          stations.map((station) => (
            <CheckboxRow key={station.stationId} className="min-h-11">
              <input
                type="checkbox"
                className="size-5"
                checked={stationIds.includes(station.stationId)}
                onChange={() => toggleStation(station.stationId)}
              />
              {station.name}
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
          {t("form.save")}
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
