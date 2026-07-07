"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { adminApi } from "@/shared/api/admin-api";
import type {
  CreateStaffUserRequest,
  StaffUser,
  UpdateStaffUserRequest,
} from "@/shared/types/admin";
import type { BranchRole } from "@/shared/types/auth";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";

const ROLE_OPTIONS: BranchRole[] = [
  "ADMIN",
  "SUPERVISOR",
  "WAITER",
  "KITCHEN",
  "BAR",
  "CASHIER",
];

type StaffFormValues = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  branchId: string;
  role: BranchRole;
};

export function TeamPanel() {
  const t = useTranslations("AdminStaff");
  const tRoles = useTranslations("Shared.roles");
  const tStaffStatus = useTranslations("Shared.staffStatus");
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const adminBranches = session.adminBranches;

  const staffListQuery = useQuery({
    queryKey: [
      "admin",
      "staff",
      session.accessToken,
      session.user?.restaurantId,
    ],
    enabled:
      session.isClientReady &&
      Boolean(session.accessToken) &&
      session.isRestaurantAdmin,
    retry: false,
    queryFn: () => adminApi.listStaff(session.accessToken!),
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({
      staffUserId,
      payload,
    }: {
      staffUserId: string;
      payload: UpdateStaffUserRequest;
    }) => adminApi.updateStaff(session.accessToken!, staffUserId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      toast.success(t("updateSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("updateError"));
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: (values: CreateStaffUserRequest) =>
      adminApi.createStaff(session.accessToken!, values),
    onSuccess: async (staffUser) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      form.reset();
      toast.success(
        t("createSuccess", {
          name: `${staffUser.firstName} ${staffUser.lastName}`,
        })
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("createError"));
    },
  });

  const form = useForm<StaffFormValues>({
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      branchId: adminBranches[0]?.branchId ?? "",
      role: "WAITER",
    },
  });

  const staffUsers = staffListQuery.data ?? [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <form
          onSubmit={form.handleSubmit((values) =>
            createStaffMutation.mutate({
              email: values.email,
              password: values.password || undefined,
              firstName: values.firstName,
              lastName: values.lastName,
              branchRoles: [
                {
                  branchId: values.branchId,
                  role: values.role,
                },
              ],
            })
          )}
          className="self-start rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-xl font-semibold">{t("formTitle")}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {t("formDescription")}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <FieldGroup className="md:col-span-2">
              <FieldLabel htmlFor="staff-email">{t("email")}</FieldLabel>
              <TextInput
                id="staff-email"
                type="email"
                required
                {...form.register("email")}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="staff-first-name">{t("firstName")}</FieldLabel>
              <TextInput
                id="staff-first-name"
                required
                {...form.register("firstName")}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="staff-last-name">{t("lastName")}</FieldLabel>
              <TextInput
                id="staff-last-name"
                required
                {...form.register("lastName")}
              />
            </FieldGroup>

            <FieldGroup className="md:col-span-2">
              <FieldLabel htmlFor="staff-password">{t("password")}</FieldLabel>
              <TextInput
                id="staff-password"
                type="password"
                {...form.register("password")}
              />
              <FieldHint>{t("passwordHint")}</FieldHint>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="staff-branch">{t("branch")}</FieldLabel>
              <SelectInput id="staff-branch" {...form.register("branchId")}>
                {adminBranches.map((branchRole) => (
                  <option key={branchRole.branchId} value={branchRole.branchId}>
                    {branchRole.branchName}
                  </option>
                ))}
              </SelectInput>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="staff-role">{t("role")}</FieldLabel>
              <SelectInput id="staff-role" {...form.register("role")}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {tRoles(role)}
                  </option>
                ))}
              </SelectInput>
            </FieldGroup>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-7 w-full rounded-full sm:w-auto"
            disabled={createStaffMutation.isPending}
          >
            {createStaffMutation.isPending ? (
              <>
                <Spinner />
                {t("submitting")}
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </form>

        <section
          aria-label={t("currentTitle")}
          className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{t("currentTitle")}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {t("currentDescription")}
              </p>
            </div>
            {!staffListQuery.isLoading ? (
              <Badge variant="secondary">
                {t("usersCount", { count: staffUsers.length })}
              </Badge>
            ) : null}
          </div>

          {staffListQuery.isError ? (
            <div className="mt-5 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {t("listError")}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {staffListQuery.isLoading ? (
              <>
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </>
            ) : staffUsers.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                {t("emptyList")}
              </p>
            ) : (
              staffUsers.map((staffUser) => (
                <StaffCard
                  key={staffUser.staffUserId}
                  staffUser={staffUser}
                  roleLabel={(role) => tRoles(role)}
                  statusLabel={(status) => tStaffStatus(status)}
                  hiddenEmailLabel={t("hiddenEmail")}
                  isSelf={staffUser.staffUserId === session.user?.profileId}
                  adminBranches={adminBranches}
                  isSaving={
                    updateStaffMutation.isPending &&
                    updateStaffMutation.variables?.staffUserId ===
                      staffUser.staffUserId
                  }
                  onSave={(payload) =>
                    updateStaffMutation.mutate({
                      staffUserId: staffUser.staffUserId,
                      payload,
                    })
                  }
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

type AdminBranch = {
  branchId: string;
  branchName: string;
};

type StaffCardProps = {
  staffUser: StaffUser;
  roleLabel: (role: BranchRole) => string;
  statusLabel: (status: StaffUser["status"]) => string;
  hiddenEmailLabel: string;
  isSelf: boolean;
  adminBranches: AdminBranch[];
  isSaving: boolean;
  onSave: (payload: UpdateStaffUserRequest) => void;
};

function StaffCard({
  staffUser,
  roleLabel,
  statusLabel,
  hiddenEmailLabel,
  isSelf,
  adminBranches,
  isSaving,
  onSave,
}: StaffCardProps) {
  const t = useTranslations("AdminStaff");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <article className="rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground uppercase">
            {staffUser.firstName.charAt(0)}
            {staffUser.lastName.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {staffUser.firstName} {staffUser.lastName}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {staffUser.email ?? hiddenEmailLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              staffUser.status === "ACTIVE"
                ? "border-transparent bg-secondary text-secondary-foreground"
                : "text-muted-foreground"
            }
          >
            {statusLabel(staffUser.status)}
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isEditing ? t("closeEdit") : t("edit")}
            aria-expanded={isEditing}
            onClick={() => setIsEditing((open) => !open)}
          >
            {isEditing ? <X className="size-4" /> : <Pencil className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {staffUser.branchRoles.map((branchRole) => (
          <Badge
            key={`${staffUser.staffUserId}-${branchRole.branchId}-${branchRole.role}`}
            variant="secondary"
          >
            {branchRole.branchName} · {roleLabel(branchRole.role)}
          </Badge>
        ))}
      </div>

      {isEditing ? (
        <StaffEditor
          staffUser={staffUser}
          roleLabel={roleLabel}
          isSelf={isSelf}
          adminBranches={adminBranches}
          isSaving={isSaving}
          onSave={onSave}
        />
      ) : null}
    </article>
  );
}

type DraftRole = {
  branchId: string;
  branchName: string;
  role: BranchRole;
};

type StaffEditorProps = {
  staffUser: StaffUser;
  roleLabel: (role: BranchRole) => string;
  isSelf: boolean;
  adminBranches: AdminBranch[];
  isSaving: boolean;
  onSave: (payload: UpdateStaffUserRequest) => void;
};

function StaffEditor({
  staffUser,
  roleLabel,
  isSelf,
  adminBranches,
  isSaving,
  onSave,
}: StaffEditorProps) {
  const t = useTranslations("AdminStaff");
  const tStaffStatus = useTranslations("Shared.staffStatus");
  const [firstName, setFirstName] = useState(staffUser.firstName);
  const [lastName, setLastName] = useState(staffUser.lastName);
  const [status, setStatus] = useState<"ACTIVE" | "DISABLED">(
    staffUser.status === "DISABLED" ? "DISABLED" : "ACTIVE"
  );
  const [draftRoles, setDraftRoles] = useState<DraftRole[]>(
    staffUser.branchRoles.map((branchRole) => ({ ...branchRole }))
  );
  const [newBranchId, setNewBranchId] = useState(
    adminBranches[0]?.branchId ?? ""
  );
  const [newRole, setNewRole] = useState<BranchRole>("WAITER");

  const canManageBranch = (branchId: string) =>
    adminBranches.some((branch) => branch.branchId === branchId);

  const handleAddRole = () => {
    const branch = adminBranches.find((entry) => entry.branchId === newBranchId);
    if (!branch) {
      return;
    }

    const isDuplicate = draftRoles.some(
      (entry) => entry.branchId === newBranchId && entry.role === newRole
    );
    if (isDuplicate) {
      toast.error(t("duplicateRole"));
      return;
    }

    setDraftRoles((roles) => [
      ...roles,
      { branchId: branch.branchId, branchName: branch.branchName, role: newRole },
    ]);
  };

  const handleRemoveRole = (branchId: string, role: BranchRole) => {
    setDraftRoles((roles) =>
      roles.filter(
        (entry) => !(entry.branchId === branchId && entry.role === role)
      )
    );
  };

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-border/70 bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor={`edit-first-${staffUser.staffUserId}`}>
            {t("firstName")}
          </FieldLabel>
          <TextInput
            id={`edit-first-${staffUser.staffUserId}`}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor={`edit-last-${staffUser.staffUserId}`}>
            {t("lastName")}
          </FieldLabel>
          <TextInput
            id={`edit-last-${staffUser.staffUserId}`}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </FieldGroup>
      </div>

      <FieldGroup>
        <FieldLabel htmlFor={`edit-status-${staffUser.staffUserId}`}>
          {t("statusLabel")}
        </FieldLabel>
        <SelectInput
          id={`edit-status-${staffUser.staffUserId}`}
          value={status}
          disabled={isSelf}
          onChange={(event) =>
            setStatus(event.target.value as "ACTIVE" | "DISABLED")
          }
        >
          <option value="ACTIVE">{tStaffStatus("ACTIVE")}</option>
          <option value="DISABLED">{tStaffStatus("DISABLED")}</option>
        </SelectInput>
        {isSelf ? <FieldHint>{t("selfStatusHint")}</FieldHint> : null}
      </FieldGroup>

      <div>
        <p className="text-sm font-medium">{t("rolesTitle")}</p>
        <FieldHint className="mt-0.5">{t("rolesHint")}</FieldHint>

        {draftRoles.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("noRoles")}</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {draftRoles.map((entry) => (
              <li key={`${entry.branchId}-${entry.role}`}>
                <Badge variant="secondary" className="gap-1.5 py-1 pr-1">
                  {entry.branchName} · {roleLabel(entry.role)}
                  {canManageBranch(entry.branchId) ? (
                    <button
                      type="button"
                      aria-label={t("removeRole")}
                      className="flex size-5 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
                      onClick={() => handleRemoveRole(entry.branchId, entry.role)}
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="min-w-36 flex-1">
            <SelectInput
              aria-label={t("branch")}
              className="h-9 rounded-lg"
              value={newBranchId}
              onChange={(event) => setNewBranchId(event.target.value)}
            >
              {adminBranches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </SelectInput>
          </div>
          <div className="min-w-32 flex-1">
            <SelectInput
              aria-label={t("role")}
              className="h-9 rounded-lg"
              value={newRole}
              onChange={(event) => setNewRole(event.target.value as BranchRole)}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </SelectInput>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddRole}>
            <Plus className="size-3.5" />
            {t("addRole")}
          </Button>
        </div>
      </div>

      <Button
        type="button"
        className="w-full rounded-full sm:w-auto"
        disabled={isSaving || !firstName.trim() || !lastName.trim()}
        onClick={() =>
          onSave({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            status,
            branchRoles: draftRoles.map((entry) => ({
              branchId: entry.branchId,
              role: entry.role,
            })),
          })
        }
      >
        {isSaving ? (
          <>
            <Spinner />
            {t("saving")}
          </>
        ) : (
          t("saveChanges")
        )}
      </Button>
    </div>
  );
}
