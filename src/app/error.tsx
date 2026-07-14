"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RootErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RootError({ error, reset }: RootErrorProps) {
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
          <h1 className="text-xl font-semibold">Algo salió mal</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tuvimos un problema al mostrar esta página. Puedes intentarlo de
            nuevo; si sigue pasando, avísanos.
          </p>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <Button type="button" onClick={reset}>
            Intentar de nuevo
          </Button>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
