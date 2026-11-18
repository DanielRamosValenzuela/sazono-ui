"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  getGroupEffectiveMin,
  getSelectionUnitPrice,
  isModifierSelectionValid,
  toggleModifierOption,
} from "@/shared/lib/cart";
import { formatMoney } from "@/shared/lib/format";
import type { MenuItemDetail, ModifierGroup } from "@/shared/types/menu";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { ModifierGroupsPicker } from "@/shared/ui/modifier-groups-picker";

type ModifierSheetProps = {
  item: MenuItemDetail;
  onConfirm: (
    item: MenuItemDetail,
    selectedModifierOptionIds: string[],
  ) => void;
  onClose: () => void;
};

export function ModifierSheet({
  item,
  onConfirm,
  onClose,
}: ModifierSheetProps) {
  const t = useTranslations("QrPage");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const canConfirm = isModifierSelectionValid(item, selectedIds);
  const unitPrice = getSelectionUnitPrice(item, selectedIds);

  const describeGroup = (group: ModifierGroup) => {
    const min = getGroupEffectiveMin(group);
    const max = group.maxSelect;

    if (max !== null && min === max) {
      return t("modifier_chooseExact", { count: min });
    }

    if (max !== null && min > 0) {
      return t("modifier_chooseRange", { min, max });
    }

    if (max !== null) {
      return t("modifier_chooseUpTo", { max });
    }

    return min > 0
      ? t("modifier_chooseAtLeast", { min })
      : t("modifier_optional");
  };

  return (
    <BottomSheet onClose={onClose} labelledBy="qr-modifier-title">
      <h2
        id="qr-modifier-title"
        className="pr-8 font-heading text-2xl font-bold text-foreground"
      >
        {item.name}
      </h2>
      {item.description ? (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {item.description}
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        <ModifierGroupsPicker
          item={item}
          selectedIds={selectedIds}
          onToggle={(group, optionId) =>
            setSelectedIds((current) =>
              toggleModifierOption(group, current, optionId),
            )
          }
          requiredLabel={t("modifier_required")}
          unavailableLabel={t("modifier_unavailable")}
          missingLabel={t("modifier_missing")}
          describeGroup={describeGroup}
        />
      </div>

      <div className="sticky bottom-0 -mx-5 mt-5 border-t border-border/70 bg-card px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button
          type="button"
          size="lg"
          className="w-full rounded-xl"
          disabled={!canConfirm}
          onClick={() => onConfirm(item, selectedIds)}
        >
          <Plus data-icon="inline-start" />
          {t("modifier_add", { price: formatMoney(unitPrice, "CLP") })}
        </Button>
        {!canConfirm ? (
          <p
            role="status"
            className="mt-2 text-center text-xs text-muted-foreground"
          >
            {t("modifier_completeRequired")}
          </p>
        ) : null}
      </div>
    </BottomSheet>
  );
}
