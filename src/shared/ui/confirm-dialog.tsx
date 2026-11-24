"use client";

import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type ConfirmTone = "destructive" | "primary" | "warning";

const toneClass: Record<ConfirmTone, string> = {
  destructive: "bg-destructive text-white hover:bg-destructive/90",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  warning: "bg-amber-600 text-white hover:bg-amber-600/90",
};

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  impact?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  isPending?: boolean;
  requireReason?: boolean;
  optionalReason?: boolean;
  maxReasonLength?: number;
  typedWord?: string;
  onConfirm: (reason?: string) => void | Promise<unknown>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  impact,
  confirmLabel,
  cancelLabel,
  tone = "primary",
  isPending = false,
  requireReason = false,
  optionalReason = false,
  maxReasonLength = 500,
  typedWord,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTranslations("Confirm");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [running, setRunning] = useState(false);
  const busy = isPending || running;
  const valid =
    (!requireReason || reason.trim().length >= 3) &&
    (!typedWord || typed.trim().toLowerCase() === typedWord.toLowerCase());

  const handleOpenChange = (next: boolean) => {
    if (busy && !next) {return;}
    if (!next) {
      setReason("");
      setTyped("");
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (busy || !valid) {return;}
    setRunning(true);
    try {
      await onConfirm(
        requireReason || optionalReason ? reason.trim() || undefined : undefined
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        initialFocus={cancelRef}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {impact ? (
          <div className="rounded-lg bg-muted/60 p-3 text-sm leading-6 text-foreground">
            {impact}
          </div>
        ) : null}
        {requireReason || optionalReason ? (
          <label className="grid gap-1.5 text-sm font-medium">
            {t(requireReason ? "reasonLabel" : "optionalLabel")}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
              rows={3}
              maxLength={maxReasonLength}
              placeholder={t(requireReason ? "reasonHint" : "optionalHint")}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-base font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm"
            />
            <span className="text-xs font-normal text-muted-foreground">
              {t("reasonCounter", { count: reason.length, max: maxReasonLength })}
            </span>
          </label>
        ) : null}
        {typedWord ? (
          <label className="grid gap-1.5 text-sm font-medium">
            {t("typedHint", { word: typedWord })}
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={busy}
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-border bg-background px-2.5 text-base font-normal outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-10 sm:text-sm"
            />
          </label>
        ) : null}
        <DialogFooter className="flex-col-reverse gap-3 sm:flex-row-reverse sm:justify-start">
          <Button
            type="button"
            size="lg"
            disabled={busy || !valid}
            onClick={handleConfirm}
            className={cn("w-full sm:w-auto", toneClass[tone])}
          >
            {busy ? <Spinner /> : null}
            {confirmLabel ?? t("confirm")}
          </Button>
          <Button
            ref={cancelRef}
            type="button"
            size="lg"
            variant="outline"
            disabled={busy}
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto"
          >
            {cancelLabel ?? t("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  "open" | "onOpenChange" | "onConfirm" | "isPending"
>;

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [lastOptions, setLastOptions] = useState<ConfirmOptions>({ title: "" });
  const resolver = useRef<((v: false | { reason?: string }) => void) | null>(
    null
  );

  const settle = useCallback((v: false | { reason?: string }) => {
    resolver.current?.(v);
    resolver.current = null;
    setOptions(null);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<false | { reason?: string }>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOptions(opts);
        setLastOptions(opts);
      }),
    []
  );

  const dialog = (
    <ConfirmDialog
      {...(options ?? lastOptions)}
      open={options !== null}
      onOpenChange={(o) => {
        if (!o) {settle(false);}
      }}
      onConfirm={(reason) => settle({ reason })}
    />
  );

  return { confirm, dialog };
}
