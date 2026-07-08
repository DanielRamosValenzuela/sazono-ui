export type RestaurantStatus = "ACTIVE" | "INACTIVE";

export type RestaurantSummary = {
  restaurantId: string;
  name: string;
  legalName: string | null;
  status: RestaurantStatus;
  currency: string;
  timezone: string;
  defaultLanguage: string;
  createdAt: string;
  branchCount: number;
  staffCount: number;
};

export type RestaurantBranchSummary = {
  branchId: string;
  name: string;
  address: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export type RestaurantStaffMember = {
  staffUserId: string;
  email: string | null;
  firstName: string;
  lastName: string;
  status: "INVITED" | "ACTIVE" | "DISABLED";
  branchRoles: {
    branchId: string;
    branchName: string;
    role: string;
  }[];
};

export type RestaurantDetail = {
  restaurantId: string;
  name: string;
  legalName: string | null;
  status: RestaurantStatus;
  currency: string;
  timezone: string;
  defaultLanguage: string;
  createdAt: string;
  branches: RestaurantBranchSummary[];
  staff: RestaurantStaffMember[];
};

export type UpdateRestaurantRequest = {
  name?: string;
  legalName?: string | null;
  defaultLanguage?: string;
  timezone?: string;
  currency?: string;
  status?: RestaurantStatus;
};

export type MonthlyPaymentsPoint = {
  month: string;
  amount: string;
  count: number;
};

export type TopRestaurant = {
  restaurantId: string;
  name: string;
  amount: string;
  count: number;
};

export type PlatformMetrics = {
  totals: {
    restaurants: number;
    activeRestaurants: number;
    branches: number;
    staffUsers: number;
    paymentsAmount: string;
    paymentsCount: number;
  };
  monthlyPayments: MonthlyPaymentsPoint[];
  topRestaurants: TopRestaurant[];
};

export type DailyPaymentsPoint = {
  date: string;
  amount: string;
  count: number;
};

export type OrdersByStatusPoint = {
  status: string;
  count: number;
};

export type TopItemPoint = {
  name: string;
  quantity: number;
  amount: string;
};

export type BranchAnalyticsSummary = {
  branchId: string;
  totalTables: number;
  occupiedTables: number;
  openSessions: number;
  todayRevenue: string;
  todayPaymentsCount: number;
  averageTicket: string;
  dailySeries: DailyPaymentsPoint[];
  ordersByStatus: OrdersByStatusPoint[];
  topItems: TopItemPoint[];
};

export type BranchAnalyticsRange = {
  from: string;
  to: string;
};
