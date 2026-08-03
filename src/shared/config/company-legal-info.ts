export const companyLegalInfo = {
  legalName: null as string | null,
  rut: null as string | null,
  address: null as string | null,
  privacyContactEmail: null as string | null,
  jurisdictionCity: null as string | null,
};

export function legalField(
  value: string | null,
  pendingLabel: string
): string {
  return value ?? pendingLabel;
}
