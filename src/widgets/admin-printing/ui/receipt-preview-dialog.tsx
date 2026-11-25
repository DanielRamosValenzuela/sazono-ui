"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { printingApi } from "@/shared/api/printing-api";
import { JobStatusBadge } from "./printing-shared";

export type PreviewSource =
  | { type: "job"; jobId: string }
  | { type: "sample"; printerId?: string; stationId?: string };

type ReceiptPreviewDialogProps = {
  token: string | null;
  branchId: string;
  source: PreviewSource | null;
  onClose: () => void;
};

const WIDTHS = [
  { mm: 58, columns: 32 },
  { mm: 80, columns: 48 },
] as const;

export function ReceiptPreviewDialog({
  token,
  branchId,
  source,
  onClose,
}: ReceiptPreviewDialogProps) {
  const t = useTranslations("AdminPrinting");
  const [widthMm, setWidthMm] = useState<58 | 80>(58);
  const paper = WIDTHS.find((entry) => entry.mm === widthMm) ?? WIDTHS[0];

  const query = useQuery({
    queryKey: ["printing", "preview", branchId, source, widthMm],
    enabled: Boolean(token) && source !== null,
    queryFn: () =>
      source!.type === "job"
        ? printingApi.jobPreview(token!, branchId, source!.jobId)
        : printingApi.samplePreview(token!, branchId, {
            printerId: source!.printerId,
            stationId: source!.stationId,
            columns: paper.columns,
            paperWidthMm: paper.mm,
          }),
  });

  const preview = query.data;
  const frameWidth = Math.ceil(((preview?.paperWidthMm ?? paper.mm) * 96) / 25.4) + 16;
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState(0);
  const hasPreview = Boolean(preview);

  useEffect(() => {
    const node = boxRef.current;

    if (!node) {
      return;
    }

    const observer = new ResizeObserver(() => setBoxWidth(node.clientWidth - 24));

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasPreview]);

  const scale = boxWidth > 0 ? Math.min(1, boxWidth / frameWidth) : 1;

  return (
    <Dialog open={source !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("preview.title")}</DialogTitle>
          <DialogDescription>
            {source?.type === "job"
              ? t("preview.jobDescription")
              : t("preview.sampleDescription")}
          </DialogDescription>
        </DialogHeader>

        {source?.type === "sample" && !source.printerId ? (
          <div
            role="group"
            aria-label={t("preview.paperWidth")}
            className="grid grid-cols-2 gap-2"
          >
            {WIDTHS.map((entry) => (
              <Button
                key={entry.mm}
                type="button"
                variant={entry.mm === widthMm ? "default" : "outline"}
                className="h-auto min-h-11 rounded-full px-3 py-1.5 text-center leading-tight whitespace-normal"
                aria-pressed={entry.mm === widthMm}
                onClick={() => setWidthMm(entry.mm)}
              >
                {t("preview.paperOption", {
                  mm: entry.mm,
                  columns: entry.columns,
                })}
              </Button>
            ))}
          </div>
        ) : null}

        {preview?.status ? (
          <div className="flex items-center gap-2 text-sm">
            <JobStatusBadge status={preview.status} />
            <span className="text-muted-foreground">
              {t("preview.paperOption", {
                mm: preview.paperWidthMm,
                columns: preview.columns,
              })}
            </span>
          </div>
        ) : null}

        {query.isLoading ? (
          <Skeleton className="h-80 w-full rounded-2xl" />
        ) : query.isError || !preview ? (
          <p role="alert" className="text-sm text-destructive">
            {t("preview.error")}
          </p>
        ) : (
          <div
            ref={boxRef}
            className="flex justify-center overflow-hidden rounded-2xl bg-muted/60 p-3"
          >
            <div
              style={{
                width: frameWidth * scale,
                height: `calc(55dvh * ${scale})`,
              }}
            >
              <iframe
                title={t("preview.frameTitle")}
                sandbox=""
                srcDoc={preview.htmlDocument}
                style={{
                  width: frameWidth,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
                className={cn(
                  "h-[55dvh] rounded-lg border border-border bg-white shadow-sm"
                )}
              />
            </div>
          </div>
        )}

        {preview ? (
          <details className="rounded-xl border border-border/70 p-3 text-sm">
            <summary className="min-h-11 cursor-pointer py-2.5 font-medium">
              {t("preview.supportData")}
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-muted/60 p-3 text-xs break-words whitespace-pre-wrap">
              {JSON.stringify(preview.document, null, 2)}
            </pre>
          </details>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
