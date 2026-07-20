import type { BranchRole } from "@/shared/types/auth";

export type RestaurantBootstrapRequest = {
  restaurant: {
    name: string;
    legalName?: string;
    defaultLanguage: string;
    timezone: string;
    currency: string;
    branchQuota?: number;
  };
  admin: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
};

export type RestaurantBootstrapResponse = {
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  branchQuota: number;
  firstAdmin: {
    authUserId: string;
    staffUserId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

export type BranchSettings = {
  qrOrderingEnabled: boolean;
  qrPaymentMode: string;
  splitBillEnabled: boolean;
  partialDeliveryEnabled: boolean;
  autoDeliverAfterMinutes: number | null;
};

export type CreateBranchRequest = {
  name: string;
  address?: string;
  settings?: Partial<BranchSettings>;
};

export type BranchSummary = {
  branchId: string;
  restaurantId: string;
  name: string;
  address: string | null;
  status: "ACTIVE" | "INACTIVE";
  settings: BranchSettings | null;
};

export type UpdateBranchRequest = {
  name?: string;
  address?: string | null;
  status?: "ACTIVE" | "INACTIVE";
  settings?: Partial<BranchSettings>;
};

export type CreateBranchResponse = {
  branchId: string;
  restaurantId: string;
  name: string;
  address: string | null;
  assignedRole: BranchRole;
  settings: BranchSettings;
};

export type StaffUserStatus = "INVITED" | "ACTIVE" | "DISABLED";

export type StaffUser = {
  staffUserId: string;
  authUserId: string;
  restaurantId: string;
  email: string | null;
  firstName: string;
  lastName: string;
  status: StaffUserStatus;
  branchRoles: {
    branchId: string;
    branchName: string;
    role: BranchRole;
  }[];
};

export type UpdateStaffUserRequest = {
  firstName?: string;
  lastName?: string;
  status?: "ACTIVE" | "DISABLED";
  branchRoles?: {
    branchId: string;
    role: BranchRole;
  }[];
};

export type CreateStaffUserRequest = {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  branchRoles: {
    branchId: string;
    role: BranchRole;
  }[];
};
