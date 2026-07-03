"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  FieldGroup,
  FieldHint,
  FieldLabel,
  TextInput,
} from "@/shared/ui/form-controls";
import type { CreateBranchRequest } from "@/shared/types/admin";

type CreateBranchPanelProps = {
  isPending: boolean;
  onSubmit: (values: CreateBranchRequest) => void;
};

type CreateBranchFormValues = {
  name: string;
  address: string;
  qrOrderingEnabled: boolean;
  qrPaymentMode: string;
  splitBillEnabled: boolean;
  partialDeliveryEnabled: boolean;
};

export function CreateBranchPanel({
  isPending,
  onSubmit,
}: CreateBranchPanelProps) {
  const t = useTranslations("AdminBranch");
  const form = useForm<CreateBranchFormValues>({
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
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({
            name: values.name,
            address: values.address || undefined,
            settings: {
              qrOrderingEnabled: values.qrOrderingEnabled,
              qrPaymentMode: values.qrPaymentMode,
              splitBillEnabled: values.splitBillEnabled,
              partialDeliveryEnabled: values.partialDeliveryEnabled,
            },
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

        <div className="mt-6 grid gap-4">
          <FieldGroup>
            <FieldLabel htmlFor="branch-name">{t("name")}</FieldLabel>
            <TextInput id="branch-name" {...form.register("name")} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="branch-address">{t("address")}</FieldLabel>
            <TextInput id="branch-address" {...form.register("address")} />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="branch-payment-mode">{t("paymentMode")}</FieldLabel>
            <TextInput
              id="branch-payment-mode"
              {...form.register("qrPaymentMode")}
            />
            <FieldHint>
              {t("paymentHint")}
            </FieldHint>
          </FieldGroup>

          <div className="grid gap-3 md:grid-cols-2">
            <CheckboxRow>
              <input type="checkbox" {...form.register("qrOrderingEnabled")} />
              <span>{t("qrOrdering")}</span>
            </CheckboxRow>

            <CheckboxRow>
              <input type="checkbox" {...form.register("splitBillEnabled")} />
              <span>{t("splitBill")}</span>
            </CheckboxRow>

            <CheckboxRow className="md:col-span-2">
              <input
                type="checkbox"
                {...form.register("partialDeliveryEnabled")}
              />
              <span>{t("partialDelivery")}</span>
            </CheckboxRow>
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-8 rounded-full" disabled={isPending}>
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>

      <aside className="rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-lg shadow-primary/8 backdrop-blur">
        <h3 className="text-lg font-semibold">{t("afterTitle")}</h3>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
          <li>{t("after1")}</li>
          <li>{t("after2")}</li>
          <li>{t("after3")}</li>
          <li>{t("after4")}</li>
        </ul>
      </aside>
    </section>
  );
}
