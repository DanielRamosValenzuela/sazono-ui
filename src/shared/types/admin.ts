import type { BranchRole } from "@/shared/types/auth";

export type RestaurantBootstrapRequest = {
  restaurant: {
    name: string;
    legalName?: string;
    defaultLanguage: string;
    timezone: string;
    currency: string;
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
};

export type CreateBranchRequest = {
  name: string;
  address?: string;
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
