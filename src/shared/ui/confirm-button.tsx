"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ConfirmButtonProps = {
  /** Texto mostrado tras el primer clic, pidiendo confirmar. */
  confirmLabel: string;
  onConfirm: () => void;
  children: ReactNode;
} & Omit<ComponentProps<typeof Button>, "onClick" | "children">;

/**
 * Botón de dos pasos para acciones delicadas: el primer clic arma la
 * confirmación (se desarma solo a los 4 segundos), el segundo la ejecuta.
 */
export function ConfirmButton({
  confirmLabel,
  onConfirm,
  children,
  variant,
  ...props
}: ConfirmButtonProps) {
  const [isArmed, setIsArmed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (isArmed) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsArmed(false);
      onConfirm();
      return;
    }

    setIsArmed(true);
    timeoutRef.current = setTimeout(() => setIsArmed(false), 4000);
  };

  return (
    <Button
      {...props}
      variant={isArmed ? "destructive" : variant}
      onClick={handleClick}
    >
      {isArmed ? confirmLabel : children}
    </Button>
  );
}
