import { apiRequest } from "@/shared/api/http-client";
import type {
  BranchSummary,
  CreateBranchRequest,
  CreateBranchResponse,
  CreateStaffUserRequest,
  RestaurantBootstrapRequest,
  RestaurantBootstrapResponse,
  StaffUser,
  UpdateBranchRequest,
  UpdateStaffUserRequest,
} from "@/shared/types/admin";
import type {
  BranchAnalyticsRange,
  BranchAnalyticsSummary,
  PlatformMetrics,
  RestaurantDetail,
  RestaurantSummary,
  UpdateRestaurantRequest,
} from "@/shared/types/analytics";
export const adminApi = {
  listRestaurants(token: string) {
    return apiRequest<RestaurantSummary[]>("/restaurants", {
      token,
    });
  },
  getRestaurantDetail(token: string, restaurantId: string) {
    return apiRequest<RestaurantDetail>(`/restaurants/${restaurantId}`, {
      token,
    });
  },
  updateRestaurant(
    token: string,
    restaurantId: string,
    payload: UpdateRestaurantRequest
  ) {
    return apiRequest<RestaurantSummary>(`/restaurants/${restaurantId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  updateStaff(
    token: string,
    staffUserId: string,
    payload: UpdateStaffUserRequest
  ) {
    return apiRequest<StaffUser>(`/staff/${staffUserId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  getPlatformMetrics(token: string) {
    return apiRequest<PlatformMetrics>("/restaurants/platform-metrics", {
      token,
    });
  },
  getBranchAnalytics(
    token: string,
    branchId: string,
    range?: BranchAnalyticsRange
  ) {
    const query = range
      ? `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`
      : "";
    return apiRequest<BranchAnalyticsSummary>(
      `/analytics/branches/${branchId}/summary${query}`,
      {
        token,
      }
    );
  },
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
  listBranches(token: string) {
    return apiRequest<BranchSummary[]>("/branches", {
      token,
    });
  },
  updateBranch(token: string, branchId: string, payload: UpdateBranchRequest) {
    return apiRequest<BranchSummary>(`/branches/${branchId}`, {
      method: "PATCH",
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
