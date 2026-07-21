"use client";

import { useState } from "react";
import { ChefHat } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { PinDots } from "./pin-dots";
import { PinPad } from "./pin-pad";

const PIN_LENGTH = 4;

type PinPadScreenProps = {
  firstName: string;
  isPending: boolean;
  errorMessage?: string | null;
  onSubmit: (pin: string) => void;
  onUsePassword: () => void;
};

export function PinPadScreen({
  firstName,
  isPending,
  errorMessage,
  onSubmit,
  onUsePassword,
}: PinPadScreenProps) {
  const t = useTranslations("PinLogin");
  const [pin, setPin] = useState("");

  const handlePinChange = (nextPin: string) => {
    setPin(nextPin);

    if (nextPin.length === PIN_LENGTH && !isPending) {
      onSubmit(nextPin);
      setPin("");
    }
  };

  return (
    <main className="flex min-h-screen flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-end gap-2 px-6 pt-6">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <ChefHat className="size-7" />
        </div>
        <h1 className="mt-5 text-center font-heading text-2xl font-bold tracking-tight">
          {t("greeting", { firstName })}
        </h1>
        <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
          {t("loginSubtitle")}
        </p>

        <div className="mt-8">
          <PinDots
            length={PIN_LENGTH}
            filled={pin.length}
            hasError={Boolean(errorMessage)}
          />
        </div>

        <p className="mt-3 min-h-5 text-sm text-destructive">
          {errorMessage ?? ""}
        </p>

        <div className="mt-4">
          <PinPad
            value={pin}
            maxLength={PIN_LENGTH}
            disabled={isPending}
            onChange={handlePinChange}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          className="mt-8"
          onClick={onUsePassword}
        >
          {t("usePassword")}
        </Button>
      </div>
    </main>
  );
}
