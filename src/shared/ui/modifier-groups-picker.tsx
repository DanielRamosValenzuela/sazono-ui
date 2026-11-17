"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { isSingleChoiceGroup } from "@/shared/lib/cart";
import { formatMoney } from "@/shared/lib/format";
import type { MenuItemDetail, ModifierGroup } from "@/shared/types/menu";

function OptionThumb({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-10 shrink-0 rounded-lg object-cover"
    />
  );
}

type ModifierGroupsPickerProps = {
  item: MenuItemDetail;
  selectedIds: string[];
  onToggle: (group: ModifierGroup, optionId: string) => void;
  requiredLabel?: string;
  unavailableLabel?: string;
  describeGroup?: (group: ModifierGroup) => string;
};

export function ModifierGroupsPicker({
  item,
  selectedIds,
  onToggle,
  requiredLabel,
  unavailableLabel,
  describeGroup,
}: ModifierGroupsPickerProps) {
  return (
    <>
      {item.modifierGroups.map((group) => {
        const single = isSingleChoiceGroup(group);
        const hint = describeGroup?.(group);

        return (
          <fieldset key={group.modifierGroupId} className="min-w-0">
            <legend className="text-xs font-semibold text-foreground">
              {group.name}
              {group.isRequired ? (
                <>
                  <span aria-hidden className="ml-1 text-destructive">
                    *
                  </span>
                  {requiredLabel ? <span className="sr-only"> ({requiredLabel})</span> : null}
                </>
              ) : null}
              {hint ? (
                <span className="ml-2 font-normal text-muted-foreground">{hint}</span>
              ) : null}
            </legend>
            <ul className="mt-1.5 space-y-1">
              {group.options.map((option) => {
                const checked = selectedIds.includes(option.modifierOptionId);
                const priceDelta = Number(option.priceDelta);

                return (
                  <li key={option.modifierOptionId}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
                        checked ? "border-primary/50 bg-card" : "border-transparent",
                        !option.isAvailable && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type={single ? "radio" : "checkbox"}
                          name={single ? group.modifierGroupId : undefined}
                          checked={checked}
                          disabled={!option.isAvailable}
                          onChange={() => onToggle(group, option.modifierOptionId)}
                          onClick={() => {
                            if (single && checked) {
                              onToggle(group, option.modifierOptionId);
                            }
                          }}
                          className="size-4 cursor-pointer accent-primary"
                        />
                        <OptionThumb src={option.imageUrl} alt="" />
                        {option.name}
                        {!option.isAvailable && unavailableLabel ? (
                          <span className="text-xs text-muted-foreground">
                            ({unavailableLabel})
                          </span>
                        ) : null}
                      </span>
                      {priceDelta !== 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {priceDelta > 0 ? "+" : ""}
                          {formatMoney(priceDelta, "CLP")}
                        </span>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}
    </>
  );
}
