"use client";

import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type BottomSheetProps = PropsWithChildren<{
  onClose: () => void;
  labelledBy: string;
  showCloseButton?: boolean;
}>;

export function BottomSheet({
  onClose,
  labelledBy,
  showCloseButton = true,
  children,
}: BottomSheetProps) {
  const [visible, setVisible] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        onClick={onClose}
        className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-4"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "relative w-full max-w-md rounded-t-3xl border border-b-0 border-border/80 bg-card shadow-2xl shadow-primary/10 transition-all duration-300 ease-out sm:rounded-3xl sm:border-b",
            visible
              ? "translate-y-0 opacity-100 sm:scale-100"
              : "translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
          )}
        >
          <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-full bg-border sm:hidden" />
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 cursor-pointer rounded-lg p-1 text-muted-foreground opacity-70 transition-opacity outline-none hover:bg-muted hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Cerrar</span>
            </button>
          ) : null}
          <div className="max-h-[80dvh] overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 sm:max-h-[85vh] sm:pb-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
