"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

type LocaleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ error, reset }: LocaleErrorProps) {
  const t = useTranslations("AppError");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card p-8 text-center shadow-lg shadow-primary/8">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-2 inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
        >
          {t("retry")}
        </button>
      </div>
    </main>
  );
}
