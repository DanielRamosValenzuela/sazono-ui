"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import type { CreateStaffUserRequest, StaffUser } from "@/shared/types/admin";
import type { AuthenticatedProfile, BranchRole } from "@/shared/types/auth";

type StaffManagementPanelProps = {
  currentUser: AuthenticatedProfile;
  isPending: boolean;
  isLoadingList: boolean;
  staffUsers: StaffUser[];
  onSubmit: (values: CreateStaffUserRequest) => void;
};

const roleOptions: BranchRole[] = [
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

export function StaffManagementPanel({
  currentUser,
  isPending,
  isLoadingList,
  staffUsers,
  onSubmit,
}: StaffManagementPanelProps) {
  const t = useTranslations("AdminStaff");
  const adminBranches = currentUser.branchRoles.filter(
    (branchRole) => branchRole.role === "ADMIN"
  );

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

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({
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
        className="rounded-[1.75rem] border border-border/70 bg-card/85 p-6 shadow-lg shadow-primary/8 backdrop-blur"
      >
        <Badge variant="outline" className="border-primary/20 text-primary">
          {t("badge")}
        </Badge>
        <h2 className="mt-4 text-3xl font-semibold text-balance">
          {t("title")}
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {t("description")}
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FieldGroup className="md:col-span-2">
            <FieldLabel htmlFor="staff-email">{t("email")}</FieldLabel>
            <TextInput id="staff-email" type="email" {...form.register("email")} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="staff-first-name">{t("firstName")}</FieldLabel>
            <TextInput id="staff-first-name" {...form.register("firstName")} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="staff-last-name">{t("lastName")}</FieldLabel>
            <TextInput id="staff-last-name" {...form.register("lastName")} />
          </FieldGroup>

          <FieldGroup className="md:col-span-2">
            <FieldLabel htmlFor="staff-password">{t("password")}</FieldLabel>
            <TextInput
              id="staff-password"
              type="password"
              {...form.register("password")}
            />
            <FieldHint>
              {t("passwordHint")}
            </FieldHint>
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
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </SelectInput>
          </FieldGroup>
        </div>

        <Button type="submit" size="lg" className="mt-8 rounded-full" disabled={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-lg shadow-primary/8 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{t("currentTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("currentDescription")}
            </p>
          </div>
          <Badge variant="secondary">
            {isLoadingList ? t("loading") : t("usersCount", {count: staffUsers.length})}
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          {staffUsers.map((staffUser) => (
            <article
              key={staffUser.staffUserId}
              className="rounded-[1.4rem] border border-border/70 bg-background/75 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {staffUser.firstName} {staffUser.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {staffUser.email ?? t("hiddenEmail")}
                  </p>
                </div>
                <Badge variant="outline">{staffUser.status}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {staffUser.branchRoles.map((branchRole) => (
                  <Badge key={`${staffUser.staffUserId}-${branchRole.branchId}-${branchRole.role}`} variant="secondary">
                    {branchRole.branchName} · {branchRole.role}
                  </Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
