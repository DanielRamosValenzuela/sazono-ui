"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getThemeBootstrapScript } from "@/shared/lib/theme-config";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function GlobalError({ error, unstable_retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <body className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground antialiased">
        <script
          dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }}
        />
        <main className="flex max-w-md flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card p-8 text-center shadow-lg shadow-primary/8">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Algo salió mal</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Tuvimos un problema para cargar la aplicación. Puedes
              intentarlo de nuevo; si sigue pasando, avísanos.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className={cn(buttonVariants())}
            >
              Intentar de nuevo
            </button>
            <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
              Volver al inicio
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
