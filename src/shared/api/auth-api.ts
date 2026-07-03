import { apiRequest } from "@/shared/api/http-client";
import type {
  AuthenticatedProfile,
  AuthResponse,
  LoginRequest,
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
};
