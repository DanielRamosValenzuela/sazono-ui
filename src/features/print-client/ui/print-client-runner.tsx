"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePrintClientStore } from "../model/print-client.store";
import { usePrintClientRunner } from "../model/use-print-client";

function PrintToasts() {
  const t = useTranslations("PrintClient");
  const lastJob = usePrintClientStore((state) => state.lastJob);
  const seen = useRef<number | null>(null);

  useEffect(() => {
    if (!lastJob || seen.current === lastJob.at) {
      return;
    }
    const first = seen.current === null;

    seen.current = lastJob.at;
    if (first && Date.now() - lastJob.at > 2000) {
      return;
    }
    if (lastJob.ok) {
      toast.success(t("toastPrinted", { number: lastJob.number }));
    } else {
      toast.error(t("toastFailed", { number: lastJob.number }), {
        description: lastJob.error ?? undefined,
      });
    }
  }, [lastJob, t]);

  return null;
}

function PreviewDialog() {
  const t = useTranslations("PrintClient");
  const preview = usePrintClientStore((state) => state.preview);
  const setPreview = usePrintClientStore((state) => state.setPreview);

  return (
    <Dialog
      open={Boolean(preview)}
      onOpenChange={(open) => {
        if (!open) {
          setPreview(null);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("previewDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("previewDialogDescription", {
              width: preview?.widthMm ?? 0,
            })}
          </DialogDescription>
        </DialogHeader>
        {preview?.html ? (
          <iframe
            title={t("previewDialogTitle")}
            sandbox=""
            srcDoc={preview.html}
            className="h-[60dvh] w-full rounded-xl border border-border bg-white"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function PrintClientRunner() {
  usePrintClientRunner();

  return (
    <>
      <PrintToasts />
      <PreviewDialog />
    </>
  );
}
