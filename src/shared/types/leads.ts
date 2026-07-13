export type LeadIntent = "DEMO_REQUEST" | "GENERAL_INQUIRY";
export type LeadStatus = "NEW" | "CONTACTED" | "CLOSED";

export type CreateLeadRequest = {
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  intent: LeadIntent;
  message?: string;
};

export type Lead = {
  leadId: string;
  name: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  intent: LeadIntent;
  message: string | null;
  status: LeadStatus;
  createdAt: string;
};
