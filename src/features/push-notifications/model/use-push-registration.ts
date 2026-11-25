"use client";

import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  PushNotifications,
  type PushNotificationSchema,
} from "@capacitor/push-notifications";
import { toast } from "sonner";
import {
  deviceTokensApi,
  type DevicePlatform,
} from "@/shared/api/device-tokens-api";
import { useAdminSessionStore } from "@/features/admin-session/model/admin-session.store";
import { ApiError } from "@/shared/api/http-client";
import {
  isPushSoundEnabled,
  setCurrentFcmToken,
  setPushSoundEnabled,
} from "./device-token-registry";

let nextLocalNotificationId = 1;

function resolveNotificationText(notification: PushNotificationSchema) {
  const title = notification.title ?? notification.data?.title ?? "Sazono";
  const body = notification.body ?? notification.data?.body ?? "";

  return { title, body };
}

export function usePushRegistration() {
  const accessToken = useAdminSessionStore((state) => state.accessToken);
  const staffProfileId = useAdminSessionStore((state) =>
    state.user?.profileType === "staff" ? state.user.profileId : null
  );

  const accessTokenRef = useRef(accessToken);
  const staffProfileIdRef = useRef(staffProfileId);
  const fcmTokenRef = useRef<string | null>(null);
  const registeredForProfileIdRef = useRef<string | null>(null);

  const registerDeviceTokenIfPending = () => {
    const currentAccessToken = accessTokenRef.current;
    const currentStaffProfileId = staffProfileIdRef.current;
    const currentFcmToken = fcmTokenRef.current;

    if (
      !currentAccessToken ||
      !currentFcmToken ||
      !currentStaffProfileId ||
      registeredForProfileIdRef.current === currentStaffProfileId
    ) {
      return;
    }

    registeredForProfileIdRef.current = currentStaffProfileId;

    void deviceTokensApi
      .register(
        currentAccessToken,
        currentFcmToken,
        Capacitor.getPlatform() as DevicePlatform
      )
      .then(() => deviceTokensApi.getSound(currentAccessToken, currentFcmToken))
      .then((preference) => setPushSoundEnabled(preference.soundEnabled))
      .catch((error) => {
        registeredForProfileIdRef.current = null;
        if (error instanceof ApiError && error.status === 401) {
          return;
        }
        console.error("[push] device token registration error:", error);
      });
  };

  useEffect(() => {
    accessTokenRef.current = accessToken;
    staffProfileIdRef.current = staffProfileId;
    registerDeviceTokenIfPending();
  }, [accessToken, staffProfileId]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const setup = async () => {
      const registrationListener = await PushNotifications.addListener(
        "registration",
        (token) => {
          fcmTokenRef.current = token.value;
          setCurrentFcmToken(token.value);
          if (process.env.NODE_ENV !== "production") {
            console.log("[push] FCM registration token:", token.value);
            toast.success("Push registrado", {
              description: token.value,
              duration: 15000,
            });
          }
          registerDeviceTokenIfPending();
        }
      );

      const registrationErrorListener = await PushNotifications.addListener(
        "registrationError",
        (error) => {
          console.error("[push] registration error:", error);
          toast.error("Error registrando push", {
            description: JSON.stringify(error),
          });
        }
      );

      const receivedListener = await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("[push] notification received:", notification);

          const pushType = notification.data?.type;

          if (pushType === "PRINT_WAKE" || pushType === "order.created") {
            window.dispatchEvent(new CustomEvent("sazono:print-wake"));
          }

          if (pushType === "PRINT_WAKE") {
            return;
          }

          const { title, body } = resolveNotificationText(notification);

          void LocalNotifications.schedule({
            notifications: [
              {
                id: nextLocalNotificationId++,
                title,
                body,
                channelId: isPushSoundEnabled()
                  ? "sazono_alerts"
                  : "sazono_silent",
                extra: notification.data,
              },
            ],
          }).catch((error) => {
            console.error("[push] local notification schedule error:", error);
          });
        }
      );

      const actionListener = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (notification) => {
          console.log("[push] notification action performed:", notification);
        }
      );

      if (cancelled) {
        registrationListener.remove();
        registrationErrorListener.remove();
        receivedListener.remove();
        actionListener.remove();
        return;
      }

      cleanup = () => {
        registrationListener.remove();
        registrationErrorListener.remove();
        receivedListener.remove();
        actionListener.remove();
      };

      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        console.warn("[push] permission not granted:", permStatus.receive);
        return;
      }

      let localPermStatus = await LocalNotifications.checkPermissions();

      if (localPermStatus.display === "prompt") {
        localPermStatus = await LocalNotifications.requestPermissions();
      }

      if (localPermStatus.display !== "granted") {
        console.warn(
          "[push] local notification permission not granted:",
          localPermStatus.display
        );
      }

      if (Capacitor.getPlatform() === "android") {
        try {
          await PushNotifications.createChannel({
            id: "sazono_alerts",
            name: "Avisos con sonido",
            importance: 4,
            vibration: true,
          });
          await PushNotifications.createChannel({
            id: "sazono_silent",
            name: "Avisos silenciosos",
            importance: 2,
            vibration: false,
          });
        } catch (error) {
          console.error("[push] create channel error:", error);
        }
      }

      await PushNotifications.register();
    };

    void setup();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
