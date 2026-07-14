"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type StaffErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StaffError({ error, reset }: StaffErrorProps) {
  const t = useTranslations("AppError");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card px-8 py-12 text-center shadow-lg shadow-primary/8">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <Button type="button" onClick={reset} className="mt-2">
        {t("retry")}
      </Button>
    </div>
  );
}
