"use client";

import { useState, type ComponentProps } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function FieldGroup({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldLabel({
  className,
  ...props
}: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "block text-sm font-medium tracking-[0.01em] text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function FieldHint({
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p className={cn("text-xs leading-6 text-muted-foreground", className)} {...props} />
  );
}

export function TextInput({
  className,
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-background/85 px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  const t = useTranslations("Shared");

  return (
    <div className="relative w-full">
      <input
        type={visible ? "text" : "password"}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border bg-background/85 px-3 pr-11 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground active:scale-90"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function TextArea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex w-full resize-none rounded-xl border border-border bg-background/85 px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function SelectInput({
  className,
  ...props
}: ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          "flex h-11 w-full cursor-pointer appearance-none rounded-xl border border-border bg-background/85 pr-9 pl-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export function CheckboxRow({
  className,
  children,
  ...props
}: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border border-border/80 bg-background/65 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
