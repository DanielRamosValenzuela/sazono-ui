import { apiRequest } from "@/shared/api/http-client";
import type {
  CreateBranchRequest,
  CreateBranchResponse,
  CreateStaffUserRequest,
  RestaurantBootstrapRequest,
  RestaurantBootstrapResponse,
  StaffUser,
} from "@/shared/types/admin";
export const adminApi = {
  bootstrapRestaurant(token: string, payload: RestaurantBootstrapRequest) {
    return apiRequest<RestaurantBootstrapResponse>("/restaurants/bootstrap", {
      method: "POST",
      token,
      body: payload,
    });
  },
  createBranch(token: string, payload: CreateBranchRequest) {
    return apiRequest<CreateBranchResponse>("/branches", {
      method: "POST",
      token,
      body: payload,
    });
  },
  listStaff(token: string) {
    return apiRequest<StaffUser[]>("/staff", {
      token,
    });
  },
  createStaff(token: string, payload: CreateStaffUserRequest) {
    return apiRequest<StaffUser>("/staff", {
      method: "POST",
      token,
      body: payload,
    });
  },
};
