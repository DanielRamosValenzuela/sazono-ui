"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { adminApi } from "@/shared/api/admin-api";
import type {
  BranchSummary,
  CreateBranchRequest,
  StaffUser,
  UpdateBranchRequest,
} from "@/shared/types/admin";
import type { BranchRole } from "@/shared/types/auth";
import {
  CheckboxRow,
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";

const QR_PAYMENT_MODES = ["prepaid_order", "postpaid_bill"] as const;

type BranchFormValues = {
  name: string;
  address: string;
  qrOrderingEnabled: boolean;
  qrPaymentMode: string;
  splitBillEnabled: boolean;
  partialDeliveryEnabled: boolean;
};

type BranchFormProps = {
  isPending: boolean;
  onSubmit: (values: CreateBranchRequest) => void;
  variant?: "first" | "additional";
};

function BranchForm({
  isPending,
  onSubmit,
  variant = "first",
}: BranchFormProps) {
  const t = useTranslations("AdminBranch");
  const form = useForm<BranchFormValues>({
    defaultValues: {
      name: "",
      address: "",
      qrOrderingEnabled: true,
      qrPaymentMode: "prepaid_order",
      splitBillEnabled: true,
      partialDeliveryEnabled: true,
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        onSubmit({
          name: values.name,
          address: values.address || undefined,
          settings: {
            qrOrderingEnabled: values.qrOrderingEnabled,
            qrPaymentMode: values.qrPaymentMode,
            splitBillEnabled: values.splitBillEnabled,
            partialDeliveryEnabled: values.partialDeliveryEnabled,
          },
        });
        form.reset();
      })}
      className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-xl font-semibold">
        {variant === "first" ? t("title") : t("additionalTitle")}
      </h2>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
        {variant === "first" ? t("description") : t("additionalDescription")}
      </p>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="branch-name">{t("name")}</FieldLabel>
            <TextInput id="branch-name" required {...form.register("name")} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="branch-address">{t("address")}</FieldLabel>
            <TextInput id="branch-address" {...form.register("address")} />
          </FieldGroup>
        </div>

        <FieldGroup>
          <FieldLabel htmlFor="branch-payment-mode">{t("paymentMode")}</FieldLabel>
          <SelectInput id="branch-payment-mode" {...form.register("qrPaymentMode")}>
            {QR_PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(`paymentModes.${mode}`)}
              </option>
            ))}
          </SelectInput>
          <FieldHint>{t("paymentHint")}</FieldHint>
        </FieldGroup>

        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxRow>
            <input
              type="checkbox"
              className="cursor-pointer"
              {...form.register("qrOrderingEnabled")}
            />
            <span>{t("qrOrdering")}</span>
          </CheckboxRow>

          <CheckboxRow>
            <input
              type="checkbox"
              className="cursor-pointer"
              {...form.register("splitBillEnabled")}
            />
            <span>{t("splitBill")}</span>
          </CheckboxRow>

          <CheckboxRow className="md:col-span-2">
            <input
              type="checkbox"
              className="cursor-pointer"
              {...form.register("partialDeliveryEnabled")}
            />
            <span>{t("partialDelivery")}</span>
          </CheckboxRow>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-7 w-full rounded-full sm:w-auto"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Spinner />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
}

function useCreateBranchMutation() {
  const t = useTranslations("AdminConsole");
  const queryClient = useQueryClient();
  const session = useAdminSession();

  return useMutation({
    mutationFn: (values: CreateBranchRequest) =>
      adminApi.createBranch(session.accessToken!, values),
    onSuccess: async (response) => {
      await session.refreshUser();
      await queryClient.invalidateQueries({ queryKey: ["admin", "branches"] });
      toast.success(t("branchSuccess", { name: response.name }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("branchError"));
    },
  });
}

export function FirstBranchWelcome() {
  const t = useTranslations("AdminBranch");
  const createBranchMutation = useCreateBranchMutation();

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-3xl border border-primary/20 bg-primary/6 p-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {t("welcomeTitle")}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("welcomeDescription")}
          </p>
        </div>
      </div>

      <BranchForm
        variant="first"
        isPending={createBranchMutation.isPending}
        onSubmit={(values) => createBranchMutation.mutate(values)}
      />
    </div>
  );
}

export function BranchesPanel() {
  const t = useTranslations("AdminBranch");
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const createBranchMutation = useCreateBranchMutation();

  const branchesQuery = useQuery({
    queryKey: ["admin", "branches", session.accessToken],
    enabled: session.isClientReady && Boolean(session.accessToken),
    queryFn: () => adminApi.listBranches(session.accessToken!),
  });

  const staffQuery = useQuery({
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

  const updateBranchMutation = useMutation({
    mutationFn: ({
      branchId,
      payload,
    }: {
      branchId: string;
      payload: UpdateBranchRequest;
    }) => adminApi.updateBranch(session.accessToken!, branchId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "branches"] });
      await session.refreshUser();
      toast.success(t("updateSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("updateError"));
    },
  });

  const adminBranchIds = new Set(
    session.adminBranches.map((branch) => branch.branchId)
  );
  const branches = branchesQuery.data ?? [];
  const staffUsers = staffQuery.data ?? [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("pageDescription")}
        </p>
      </header>

      {branchesQuery.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {t("listError")}
        </div>
      ) : null}

      <section aria-label={t("currentTitle")} className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t("currentTitle")}
        </h2>

        {branchesQuery.isLoading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        ) : (
          <ul className="grid gap-4 xl:grid-cols-2">
            {branches.map((branch) => (
              <BranchCard
                key={branch.branchId}
                branch={branch}
                canEdit={adminBranchIds.has(branch.branchId)}
                members={staffUsers.filter((staffUser) =>
                  staffUser.branchRoles.some(
                    (branchRole) => branchRole.branchId === branch.branchId
                  )
                )}
                isSaving={
                  updateBranchMutation.isPending &&
                  updateBranchMutation.variables?.branchId === branch.branchId
                }
                onSave={(payload) =>
                  updateBranchMutation.mutate({
                    branchId: branch.branchId,
                    payload,
                  })
                }
              />
            ))}
          </ul>
        )}
      </section>

      <BranchForm
        variant="additional"
        isPending={createBranchMutation.isPending}
        onSubmit={(values) => createBranchMutation.mutate(values)}
      />
    </div>
  );
}

type BranchCardProps = {
  branch: BranchSummary;
  canEdit: boolean;
  members: StaffUser[];
  isSaving: boolean;
  onSave: (payload: UpdateBranchRequest) => void;
};

function BranchCard({
  branch,
  canEdit,
  members,
  isSaving,
  onSave,
}: BranchCardProps) {
  const t = useTranslations("AdminBranch");
  const tRoles = useTranslations("Shared.roles");
  const [isEditing, setIsEditing] = useState(false);
  const isActive = branch.status === "ACTIVE";

  return (
    <li className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <MapPin className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{branch.name}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {branch.address ?? t("noAddress")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              isActive
                ? "border-transparent bg-secondary text-secondary-foreground"
                : "text-muted-foreground"
            }
          >
            {isActive ? t("statusActive") : t("statusInactive")}
          </Badge>
          {canEdit ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={isEditing ? t("closeEdit") : t("editBranch")}
              aria-expanded={isEditing}
              onClick={() => setIsEditing((open) => !open)}
            >
              {isEditing ? (
                <X className="size-4" />
              ) : (
                <Pencil className="size-4" />
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {branch.settings ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary">
            {(QR_PAYMENT_MODES as readonly string[]).includes(
              branch.settings.qrPaymentMode
            )
              ? t(`paymentModes.${branch.settings.qrPaymentMode}`)
              : branch.settings.qrPaymentMode}
          </Badge>
          {branch.settings.qrOrderingEnabled ? (
            <Badge variant="outline">{t("qrOrdering")}</Badge>
          ) : null}
          {branch.settings.splitBillEnabled ? (
            <Badge variant="outline">{t("splitBill")}</Badge>
          ) : null}
        </div>
      ) : null}

      {isEditing && canEdit ? (
        <BranchEditor branch={branch} isSaving={isSaving} onSave={onSave} />
      ) : null}

      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="text-sm font-semibold">
          {t("membersTitle")}{" "}
          <span className="font-normal text-muted-foreground">
            · {t("membersCount", { count: members.length })}
          </span>
        </p>
        {members.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("membersEmpty")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {members.map((member) => {
              const rolesHere = member.branchRoles
                .filter((branchRole) => branchRole.branchId === branch.branchId)
                .map((branchRole) => tRoles(branchRole.role as BranchRole));

              return (
                <li
                  key={member.staffUserId}
                  className="flex items-center gap-3 rounded-xl bg-background/60 px-3 py-2"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground uppercase">
                    {member.firstName.charAt(0)}
                    {member.lastName.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {member.firstName} {member.lastName}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {rolesHere.join(" · ")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </li>
  );
}

type BranchEditorProps = {
  branch: BranchSummary;
  isSaving: boolean;
  onSave: (payload: UpdateBranchRequest) => void;
};

function BranchEditor({ branch, isSaving, onSave }: BranchEditorProps) {
  const t = useTranslations("AdminBranch");
  const [name, setName] = useState(branch.name);
  const [address, setAddress] = useState(branch.address ?? "");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(branch.status);
  const [qrOrderingEnabled, setQrOrderingEnabled] = useState(
    branch.settings?.qrOrderingEnabled ?? true
  );
  const [qrPaymentMode, setQrPaymentMode] = useState(
    branch.settings?.qrPaymentMode ?? "prepaid_order"
  );
  const [splitBillEnabled, setSplitBillEnabled] = useState(
    branch.settings?.splitBillEnabled ?? true
  );
  const [partialDeliveryEnabled, setPartialDeliveryEnabled] = useState(
    branch.settings?.partialDeliveryEnabled ?? true
  );
  const [autoDeliverEnabled, setAutoDeliverEnabled] = useState(
    (branch.settings?.autoDeliverAfterMinutes ?? null) !== null
  );
  const [autoDeliverMinutes, setAutoDeliverMinutes] = useState(
    branch.settings?.autoDeliverAfterMinutes ?? 5
  );

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor={`branch-edit-name-${branch.branchId}`}>
            {t("name")}
          </FieldLabel>
          <TextInput
            id={`branch-edit-name-${branch.branchId}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor={`branch-edit-address-${branch.branchId}`}>
            {t("address")}
          </FieldLabel>
          <TextInput
            id={`branch-edit-address-${branch.branchId}`}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </FieldGroup>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldGroup>
          <FieldLabel htmlFor={`branch-edit-status-${branch.branchId}`}>
            {t("statusLabel")}
          </FieldLabel>
          <SelectInput
            id={`branch-edit-status-${branch.branchId}`}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "ACTIVE" | "INACTIVE")
            }
          >
            <option value="ACTIVE">{t("statusActive")}</option>
            <option value="INACTIVE">{t("statusInactive")}</option>
          </SelectInput>
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor={`branch-edit-payment-${branch.branchId}`}>
            {t("paymentMode")}
          </FieldLabel>
          <SelectInput
            id={`branch-edit-payment-${branch.branchId}`}
            value={qrPaymentMode}
            onChange={(event) => setQrPaymentMode(event.target.value)}
          >
            {QR_PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {t(`paymentModes.${mode}`)}
              </option>
            ))}
          </SelectInput>
        </FieldGroup>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxRow>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={qrOrderingEnabled}
            onChange={(event) => setQrOrderingEnabled(event.target.checked)}
          />
          <span>{t("qrOrdering")}</span>
        </CheckboxRow>
        <CheckboxRow>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={splitBillEnabled}
            onChange={(event) => setSplitBillEnabled(event.target.checked)}
          />
          <span>{t("splitBill")}</span>
        </CheckboxRow>
        <CheckboxRow className="sm:col-span-2">
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={partialDeliveryEnabled}
            onChange={(event) => setPartialDeliveryEnabled(event.target.checked)}
          />
          <span>{t("partialDelivery")}</span>
        </CheckboxRow>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxRow>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={autoDeliverEnabled}
            onChange={(event) => setAutoDeliverEnabled(event.target.checked)}
          />
          <span>{t("autoDeliverEnabled")}</span>
        </CheckboxRow>
        {autoDeliverEnabled ? (
          <FieldGroup>
            <FieldLabel htmlFor={`branch-edit-auto-deliver-${branch.branchId}`}>
              {t("autoDeliverMinutes")}
            </FieldLabel>
            <TextInput
              id={`branch-edit-auto-deliver-${branch.branchId}`}
              type="number"
              min={1}
              value={autoDeliverMinutes}
              onChange={(event) =>
                setAutoDeliverMinutes(Number(event.target.value) || 1)
              }
            />
          </FieldGroup>
        ) : (
          <FieldHint className="self-center">{t("autoDeliverHint")}</FieldHint>
        )}
      </div>

      <Button
        type="button"
        className="w-full rounded-full sm:w-auto"
        disabled={isSaving || !name.trim()}
        onClick={() =>
          onSave({
            name: name.trim(),
            address: address.trim() || null,
            status,
            settings: {
              qrOrderingEnabled,
              qrPaymentMode,
              splitBillEnabled,
              partialDeliveryEnabled,
              autoDeliverAfterMinutes: autoDeliverEnabled ? autoDeliverMinutes : null,
            },
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
