"use client";

import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type BottomSheetProps = PropsWithChildren<{
  onClose: () => void;
  labelledBy: string;
}>;

export function BottomSheet({ onClose, labelledBy, children }: BottomSheetProps) {
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
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-3xl border border-b-0 border-border/80 bg-card shadow-2xl shadow-primary/10 transition-transform duration-300 ease-out",
          visible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
        <div className="max-h-[80dvh] overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
