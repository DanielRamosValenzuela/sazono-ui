export type LoginProfileType = "platform_admin" | "staff";

export type BranchRole =
  | "ADMIN"
  | "SUPERVISOR"
  | "WAITER"
  | "KITCHEN"
  | "BAR"
  | "CASHIER";

export type StaffBranchRole = {
  branchId: string;
  branchName: string;
  role: BranchRole;
};

export type AuthenticatedProfile = {
  authIdentityId: string;
  profileType: LoginProfileType;
  profileId: string;
  email: string;
  firstName: string;
  lastName: string;
  restaurantId: string | null;
  branchRoles: StaffBranchRole[];
};

export type AuthResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  user: AuthenticatedProfile;
};

export type LoginRequest = {
  email: string;
  password: string;
  profileType?: LoginProfileType;
  restaurantId?: string;
};
