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

type SetupPinScreenProps = {
  firstName: string;
  isPending: boolean;
  errorMessage?: string | null;
  onSubmit: (pin: string) => void;
  onSkip: () => void;
};

export function SetupPinScreen({
  firstName,
  isPending,
  errorMessage,
  onSubmit,
  onSkip,
}: SetupPinScreenProps) {
  const t = useTranslations("PinLogin");
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPin] = useState("");
  const [mismatch, setMismatch] = useState(false);

  const handlePinChange = (nextPin: string) => {
    setPin(nextPin);

    if (nextPin.length !== PIN_LENGTH) {
      return;
    }

    if (step === "create") {
      setMismatch(false);
      setFirstPin(nextPin);
      setPin("");
      setStep("confirm");
      return;
    }

    if (nextPin !== firstPin) {
      setMismatch(true);
      setPin("");
      setFirstPin("");
      setStep("create");
      return;
    }

    onSubmit(nextPin);
    setPin("");
    setFirstPin("");
    setStep("create");
  };

  const subtitle =
    step === "create" ? t("setupCreateSubtitle") : t("setupConfirmSubtitle");

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
          {t("setupGreeting", { firstName })}
        </h1>
        <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
          {subtitle}
        </p>

        <div className="mt-8">
          <PinDots
            length={PIN_LENGTH}
            filled={pin.length}
            hasError={mismatch}
          />
        </div>

        <p className="mt-3 min-h-5 text-sm text-destructive">
          {mismatch ? t("setupMismatch") : (errorMessage ?? "")}
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
          onClick={onSkip}
          disabled={isPending}
        >
          {t("setupSkip")}
        </Button>
      </div>
    </main>
  );
}
