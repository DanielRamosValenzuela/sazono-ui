"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { toast } from "sonner";

export function usePushRegistration() {
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
          console.log("[push] FCM registration token:", token.value);
          toast.success("Push registrado", {
            description: token.value,
            duration: 15000,
          });
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

      await PushNotifications.register();
    };

    void setup();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
}
