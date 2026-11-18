export type StatementStatus = "DRAFT" | "ISSUED" | "PAID" | "WAIVED" | "VOID";

export type StatementRow = {
  restaurantId: string;
  restaurantName: string;
  legalName: string | null;
  taxId: string | null;
  period: string;
  branches: { branchId: string; name: string; netSales: string }[];
  grossSales: string;
  tipsTotal: string;
  refunds: string;
  discounts: string;
  carryOver: string;
  netSales: string;
  feeBps: number;
  feeAmount: string;
  status: StatementStatus;
  frozen: boolean;
  notes: string | null;
  issuedAt: string | null;
  paidAt: string | null;
};

export type StatementTotals = {
  grossSales: string;
  tipsTotal: string;
  refunds: string;
  discounts: string;
  carryOver: string;
  netSales: string;
  feeAmount: string;
};

export type StatementsList = {
  period: string;
  rows: StatementRow[];
  totals: StatementTotals;
};

export type StatementGroup = {
  key: string;
  grossSales: string;
  tipsTotal: string;
  refunds: string;
  netSales: string;
};

export type StatementBranch = StatementGroup & {
  branchId: string;
  name: string;
};

export type StatementDetail = {
  statement: StatementRow;
  branches: StatementBranch[];
  days: StatementGroup[];
  methods: StatementGroup[];
};

export type FinalizeResult = {
  period: string;
  finalized: number;
  alreadyFrozen: number;
};

export type StatementStatusUpdate = {
  status: "PAID" | "WAIVED" | "VOID";
  notes?: string;
};
