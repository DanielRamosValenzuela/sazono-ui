import { apiRequest } from "@/shared/api/http-client";
import type {
  AuthenticatedProfile,
  AuthResponse,
  LoginRequest,
  RestaurantBySlug,
  RestaurantSearchResult,
} from "@/shared/types/auth";

export const authApi = {
  login(payload: LoginRequest) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
  },
  getCurrentUser(token: string) {
    return apiRequest<AuthenticatedProfile>("/auth/me", {
      token,
    });
  },
  refresh(refreshToken: string) {
    return apiRequest<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
  },
  setPin(pin: string, token: string) {
    return apiRequest<void>("/auth/pin/set", {
      method: "POST",
      token,
      body: { pin },
    });
  },
  pinLogin(staffUserId: string, pin: string) {
    return apiRequest<AuthResponse>("/auth/pin/login", {
      method: "POST",
      body: { staffUserId, pin },
    });
  },
  getRestaurantBySlug(slug: string) {
    return apiRequest<RestaurantBySlug>(
      `/restaurants/by-slug/${encodeURIComponent(slug)}`
    );
  },
  searchRestaurants(query: string) {
    return apiRequest<RestaurantSearchResult[]>(
      `/restaurants/search?q=${encodeURIComponent(query)}`
    );
  },
};
