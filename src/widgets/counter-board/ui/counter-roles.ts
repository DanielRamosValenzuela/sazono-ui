import type { BranchRole } from "@/shared/types/auth";

export const COUNTER_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "WAITER", "CASHIER"];
export const COUNTER_PAY_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "CASHIER", "WAITER"];
export const COUNTER_CLOSE_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "CASHIER", "WAITER"];
export const COUNTER_ABANDON_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "CASHIER", "WAITER"];
export const COUNTER_DELIVER_ROLES: BranchRole[] = ["ADMIN", "SUPERVISOR", "CASHIER", "WAITER"];
