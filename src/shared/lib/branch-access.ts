import type { AuthenticatedProfile, BranchRole } from "@/shared/types/auth";

export interface BranchAccess {
  branchId: string;
  branchName: string;
  roles: BranchRole[];
}

export function getBranchAccessList(profile: AuthenticatedProfile): BranchAccess[] {
  const branchMap = new Map<string, BranchAccess>();

  for (const branchRole of profile.branchRoles) {
    const current = branchMap.get(branchRole.branchId);

    if (!current) {
      branchMap.set(branchRole.branchId, {
        branchId: branchRole.branchId,
        branchName: branchRole.branchName,
        roles: [branchRole.role],
      });
      continue;
    }

    if (!current.roles.includes(branchRole.role)) {
      current.roles.push(branchRole.role);
    }
  }

  return Array.from(branchMap.values()).sort((left, right) =>
    left.branchName.localeCompare(right.branchName)
  );
}

export function hasBranchPermission(
  branchAccess: BranchAccess | null,
  roles: BranchRole[]
) {
  return branchAccess
    ? branchAccess.roles.some((role) => roles.includes(role))
    : false;
}
