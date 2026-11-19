import { apiRequest } from "@/shared/api/http-client";

export type DevicePlatform = "android" | "ios" | "web";

export const deviceTokensApi = {
  register(token: string, fcmToken: string, platform: DevicePlatform) {
    return apiRequest<void>("/notifications/device-tokens", {
      method: "POST",
      token,
      body: { fcmToken, platform },
    });
  },
  unregister(token: string, fcmToken: string) {
    return apiRequest<void>("/notifications/device-tokens", {
      method: "DELETE",
      token,
      body: { fcmToken },
    });
  },
  getSound(token: string, fcmToken: string) {
    return apiRequest<{ soundEnabled: boolean }>(
      `/notifications/device-tokens/me?fcmToken=${encodeURIComponent(fcmToken)}`,
      { token }
    );
  },
  setSound(token: string, fcmToken: string, soundEnabled: boolean) {
    return apiRequest<{ soundEnabled: boolean }>(
      "/notifications/device-tokens/sound",
      { method: "PATCH", token, body: { fcmToken, soundEnabled } }
    );
  },
};
