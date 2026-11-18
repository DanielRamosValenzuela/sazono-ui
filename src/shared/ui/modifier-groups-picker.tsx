"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getGroupEffectiveMin, isSingleChoiceGroup } from "@/shared/lib/cart";
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

type PickerCommonProps = {
  selectedIds: string[];
  onToggle: (group: ModifierGroup, optionId: string) => void;
  requiredLabel?: string;
  unavailableLabel?: string;
  missingLabel?: string;
  describeGroup?: (group: ModifierGroup) => string;
};

type ModifierGroupsPickerProps = PickerCommonProps & {
  item: MenuItemDetail;
};

function GroupFieldset({
  group,
  level,
  ...common
}: PickerCommonProps & { group: ModifierGroup; level: number }) {
  const { selectedIds, onToggle, requiredLabel, unavailableLabel, missingLabel, describeGroup } =
    common;
  const ref = useRef<HTMLFieldSetElement>(null);
  const baseId = useId();

  useEffect(() => {
    if (level > 1) {
      ref.current?.scrollIntoView({ block: "nearest" });
    }
  }, [level]);

  const single = isSingleChoiceGroup(group);
  const selectedInGroup = group.options.filter((option) =>
    selectedIds.includes(option.modifierOptionId),
  ).length;
  const atLimit =
    !single && group.maxSelect !== null && selectedInGroup >= group.maxSelect;
  const missing = selectedInGroup < getGroupEffectiveMin(group);
  const hint = describeGroup?.(group);

  return (
    <fieldset
      ref={ref}
      className={cn(
        "min-w-0",
        level > 1 && "ml-3 border-l-2 border-primary/30 pl-2",
      )}
    >
      <legend className="text-xs font-semibold text-foreground">
        {group.name}
        {group.isRequired ? (
          <>
            <span aria-hidden className="ml-1 text-destructive">
              *
            </span>
            {requiredLabel ? (
              <span className="sr-only"> ({requiredLabel})</span>
            ) : null}
          </>
        ) : null}
        {hint ? (
          <span className="ml-2 font-normal text-muted-foreground">{hint}</span>
        ) : null}
        {!single && group.maxSelect !== null ? (
          <span
            className={cn(
              "ml-2 text-xs font-normal tabular-nums",
              atLimit ? "text-primary" : "text-muted-foreground",
            )}
          >
            {selectedInGroup}/{group.maxSelect}
          </span>
        ) : null}
        {missing && missingLabel ? (
          <span className="ml-2 font-normal text-destructive">{missingLabel}</span>
        ) : null}
      </legend>
      <ul className="mt-1.5 space-y-1">
        {group.options.map((option) => {
          const checked = selectedIds.includes(option.modifierOptionId);
          const priceDelta = Number(option.priceDelta);
          const blockedByLimit = atLimit && !checked;
          const blocked = !option.isAvailable || blockedByLimit;
          const childGroups = option.childGroups ?? [];
          const panelId = `${baseId}-${option.modifierOptionId}`;
          const hasPanel = checked && childGroups.length > 0;

          return (
            <li key={option.modifierOptionId}>
              <label
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
                  checked ? "border-primary/50 bg-card" : "border-transparent",
                  blocked && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    type={single ? "radio" : "checkbox"}
                    name={single ? group.modifierGroupId : undefined}
                    checked={checked}
                    disabled={blocked}
                    aria-controls={hasPanel ? panelId : undefined}
                    aria-describedby={hasPanel ? panelId : undefined}
                    onChange={() => onToggle(group, option.modifierOptionId)}
                    onClick={() => {
                      if (single && checked) {
                        onToggle(group, option.modifierOptionId);
                      }
                    }}
                    className="size-4 shrink-0 cursor-pointer accent-primary"
                  />
                  {level === 1 ? <OptionThumb src={option.imageUrl} alt="" /> : null}
                  <span className="min-w-0 break-words">{option.name}</span>
                  {!option.isAvailable && unavailableLabel ? (
                    <span className="text-xs text-muted-foreground">
                      ({unavailableLabel})
                    </span>
                  ) : null}
                </span>
                {priceDelta !== 0 ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {priceDelta > 0 ? "+" : ""}
                    {formatMoney(priceDelta, "CLP")}
                  </span>
                ) : null}
              </label>
              {hasPanel ? (
                <div id={panelId} className="mt-1 space-y-2">
                  {childGroups.map((child) => (
                    <GroupFieldset
                      key={child.modifierGroupId}
                      group={child}
                      level={level + 1}
                      {...common}
                    />
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export function ModifierGroupsPicker({ item, ...common }: ModifierGroupsPickerProps) {
  return (
    <>
      {item.modifierGroups.map((group) => (
        <GroupFieldset
          key={group.modifierGroupId}
          group={group}
          level={1}
          {...common}
        />
      ))}
    </>
  );
}
