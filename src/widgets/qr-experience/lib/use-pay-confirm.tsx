"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useConfirm } from "@/shared/ui/confirm-dialog";
import { formatMoney } from "@/shared/lib/format";

const HIGH_TIP_PERCENT = 30;

export function usePayConfirm(base: number, tip: number, isCustomTip: boolean) {
  const tOffline = useTranslations("ConfirmActions.qr.qr-pay-offline");
  const tTip = useTranslations("ConfirmActions.qr.qr-tip-custom");
  const { confirm, dialog } = useConfirm();
  const [asking, setAsking] = useState(false);

  const ask = async (opts: Parameters<typeof confirm>[0]) => {
    setAsking(true);
    try {
      return (await confirm(opts)) !== false;
    } finally {
      setAsking(false);
    }
  };

  const isHighTip = isCustomTip && base > 0 && tip * 100 > base * HIGH_TIP_PERCENT;

  const confirmTip = async () => {
    if (!isHighTip) {
      return true;
    }

    return ask({
      title: tTip("title"),
      description: tTip("description"),
      confirmLabel: tTip("confirm"),
      tone: "warning",
      impact: tTip("impact", {
        tip: formatMoney(tip, "CLP"),
        percent: Math.round((tip * 100) / base),
        total: formatMoney(base + tip, "CLP"),
      }),
    });
  };

  const confirmOffline = async () => {
    if (!(await confirmTip())) {
      return false;
    }

    return ask({
      title: tOffline("title"),
      description: tOffline("description"),
      confirmLabel: tOffline("confirm"),
      tone: "warning",
      impact: tOffline("impact", { total: formatMoney(base + tip, "CLP") }),
    });
  };

  return { dialog, asking, confirmTip, confirmOffline };
}
