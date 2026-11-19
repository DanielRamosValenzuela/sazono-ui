"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { deviceTokensApi } from "@/shared/api/device-tokens-api";
import {
  setPushSoundEnabled,
  useCurrentFcmToken,
} from "../model/device-token-registry";

const STORAGE_KEY = "sazono.pushSoundEnabled";

function readStoredValue(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function storeValue(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {}
}

export function SoundToggle() {
  const t = useTranslations("KitchenBoard");
  const accessToken = useAdminSession().accessToken;
  const fcmToken = useCurrentFcmToken();
  const [enabled, setEnabled] = useState(readStoredValue);
  const [busy, setBusy] = useState(false);
  const available = Boolean(accessToken && fcmToken);

  useEffect(() => {
    if (!accessToken || !fcmToken) {
      return;
    }
    let cancelled = false;
    deviceTokensApi
      .getSound(accessToken, fcmToken)
      .then(({ soundEnabled }) => {
        if (cancelled) {
          return;
        }
        setEnabled(soundEnabled);
        setPushSoundEnabled(soundEnabled);
        storeValue(soundEnabled);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accessToken, fcmToken]);

  const toggle = async () => {
    if (!accessToken || !fcmToken || busy) {
      return;
    }
    const next = !enabled;
    setBusy(true);
    try {
      await deviceTokensApi.setSound(accessToken, fcmToken, next);
      setEnabled(next);
      setPushSoundEnabled(next);
      storeValue(next);
      toast.success(t(next ? "soundOnToast" : "soundOffToast"));
    } catch {
      toast.error(t("soundError"));
    } finally {
      setBusy(false);
    }
  };

  const label = !available
    ? t("soundUnavailable")
    : t(enabled ? "soundOn" : "soundOff");
  const Icon = available && !enabled ? VolumeOff : Volume2;

  return (
    <Button
      type="button"
      variant="outline"
      className="size-11 p-0"
      title={label}
      aria-label={label}
      disabled={!available || busy}
      onClick={() => void toggle()}
    >
      <Icon className="size-5" />
    </Button>
  );
}
