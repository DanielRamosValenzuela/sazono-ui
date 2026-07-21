"use client";

import { Delete } from "lucide-react";
import { useTranslations } from "next-intl";

type PinPadProps = {
  value: string;
  maxLength: number;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

const KEY_SIZE_CLASS = "size-16 sm:size-18";

export function PinPad({ value, maxLength, disabled, onChange }: PinPadProps) {
  const t = useTranslations("PinLogin");

  const handleDigit = (digit: string) => {
    if (disabled || value.length >= maxLength) {
      return;
    }

    navigator.vibrate?.(10);
    onChange(value + digit);
  };

  const handleBackspace = () => {
    if (disabled || value.length === 0) {
      return;
    }

    navigator.vibrate?.(10);
    onChange(value.slice(0, -1));
  };

  return (
    <div className="mx-auto grid w-fit grid-cols-3 gap-4">
      {PAD_KEYS.map((key, index) => {
        if (key === "") {
          return <div key={`spacer-${index}`} className={KEY_SIZE_CLASS} />;
        }

        if (key === "del") {
          return (
            <button
              key="del"
              type="button"
              disabled={disabled}
              onClick={handleBackspace}
              aria-label={t("backspace")}
              className={`${KEY_SIZE_CLASS} flex items-center justify-center rounded-full text-muted-foreground transition-all duration-150 select-none [-webkit-tap-highlight-color:transparent] hover:bg-muted active:scale-90 active:bg-muted disabled:opacity-50`}
              style={{ touchAction: "manipulation" }}
            >
              <Delete className="size-5" />
            </button>
          );
        }

        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(key)}
            className={`${KEY_SIZE_CLASS} flex items-center justify-center rounded-full border border-border/70 bg-card text-2xl font-semibold text-foreground shadow-sm transition-all duration-150 select-none [-webkit-tap-highlight-color:transparent] hover:border-primary/40 hover:bg-primary/5 active:scale-90 active:border-primary/50 active:bg-primary/10 disabled:opacity-50`}
            style={{ touchAction: "manipulation" }}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
