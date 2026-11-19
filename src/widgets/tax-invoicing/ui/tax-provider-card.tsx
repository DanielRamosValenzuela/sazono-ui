"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/shared/api/http-client";
import { taxDocumentsApi } from "@/shared/api/tax-documents-api";
import type { TaxProviderEnvironment } from "@/shared/types/tax-documents";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  PasswordInput,
  SelectInput,
} from "@/shared/ui/form-controls";
import { formatReportDateTime } from "@/widgets/reports/ui/report-range";

type TaxProviderCardProps = {
  token: string | null;
  branchId: string;
};

const KNOWN_ERRORS = [
  "TAX_PROVIDER_INVALID_API_KEY",
  "TAX_PROVIDER_RUT_MISMATCH",
  "TAX_FISCAL_DATA_INCOMPLETE",
  "TAX_PROVIDER_UNAVAILABLE",
] as const;

export function TaxProviderCard({ token, branchId }: TaxProviderCardProps) {
  const t = useTranslations("TaxInvoicing");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [pickedEnvironment, setEnvironment] =
    useState<TaxProviderEnvironment | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const queryKey = ["tax-provider", branchId];

  const query = useQuery({
    queryKey,
    enabled: Boolean(token),
    queryFn: () => taxDocumentsApi.getProvider(token!, branchId),
  });
  const state = query.data;
  const active = Boolean(state?.configured && state.status === "ACTIVE");
  const environment: TaxProviderEnvironment =
    pickedEnvironment ?? state?.environment ?? "SANDBOX";

  const describeError = (error: unknown) => {
    if (!(error instanceof ApiError)) {
      return t("errors.generic");
    }

    const raw = JSON.stringify(error.details ?? "");
    const code = KNOWN_ERRORS.find((entry) => raw.includes(entry));

    if (code) {
      return t(`errors.${code}`);
    }

    return error.status === 429 ? t("errors.rateLimited") : error.message;
  };

  const connectMutation = useMutation({
    mutationFn: () =>
      taxDocumentsApi.connectProvider(token!, branchId, {
        apiKey: apiKey.trim(),
        environment,
      }),
    onSuccess: () => {
      setApiKey("");
      setFormError(null);
      toast.success(t("connectSuccess"));
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => setFormError(describeError(error)),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => taxDocumentsApi.disconnectProvider(token!, branchId),
    onSuccess: () => {
      toast.success(t("disconnectSuccess"));
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  if (query.isLoading) {
    return <Skeleton className="h-64 w-full rounded-3xl" />;
  }

  if (query.isError || !state) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("loadError")}
      </p>
    );
  }

  return (
    <section className="space-y-5 rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t("providerTitle")}</h2>
        {active ? (
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="size-3.5" />
            {t("configured")}
          </Badge>
        ) : (
          <Badge variant="secondary">{t("notConfigured")}</Badge>
        )}
        {active && state.environment ? (
          <Badge variant="secondary">{t(`environment.${state.environment}`)}</Badge>
        ) : null}
      </div>

      {active ? (
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            {state.lastVerifiedAt
              ? t("lastVerified", {
                  date: formatReportDateTime(state.lastVerifiedAt, locale),
                })
              : t("neverVerified")}
          </p>
          <p>
            {t("queueSummary", {
              pending: state.pendingDocuments,
              stuck: state.stuckDocuments,
            })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("providerDescription")}</p>
      )}

      {active && state.lastErrorMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm break-words text-destructive"
        >
          {state.lastErrorMessage}
        </p>
      ) : null}

      {state.missingFiscalData.length > 0 ? (
        <div
          role="alert"
          className="flex gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p>
            {t("missingFiscal", {
              fields: state.missingFiscalData
                .map((field) =>
                  t.has(`fiscal.${field}`) ? t(`fiscal.${field}`) : field
                )
                .join(", "),
            })}
          </p>
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setFormError(null);
          connectMutation.mutate();
        }}
      >
        <FieldGroup>
          <FieldLabel htmlFor="tax-env">{t("environmentLabel")}</FieldLabel>
          <SelectInput
            id="tax-env"
            value={environment}
            onChange={(event) =>
              setEnvironment(event.target.value as TaxProviderEnvironment)
            }
          >
            <option value="SANDBOX">{t("environment.SANDBOX")}</option>
            <option value="PRODUCTION">{t("environment.PRODUCTION")}</option>
          </SelectInput>
        </FieldGroup>

        {environment === "PRODUCTION" ? (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
            {t("productionWarning")}
          </p>
        ) : (
          <FieldHint>{t("sandboxHint")}</FieldHint>
        )}

        <FieldGroup>
          <FieldLabel htmlFor="tax-api-key">{t("apiKeyLabel")}</FieldLabel>
          <PasswordInput
            id="tax-api-key"
            autoComplete="off"
            required
            value={apiKey}
            placeholder={active ? t("apiKeySavedPlaceholder") : ""}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <FieldHint>{t("apiKeyHint")}</FieldHint>
        </FieldGroup>

        {formError ? (
          <p role="alert" className="text-sm break-words text-destructive">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            className="h-11 w-full rounded-full sm:w-auto"
            disabled={connectMutation.isPending || apiKey.trim().length < 8}
          >
            {connectMutation.isPending ? <Spinner /> : null}
            {connectMutation.isPending
              ? t("verifying")
              : active
                ? t("replaceKey")
                : t("verifyAndSave")}
          </Button>
          {active ? (
            <ConfirmButton
              type="button"
              variant="outline"
              className="h-11 w-full rounded-full sm:w-auto"
              confirmLabel={t("disconnectConfirm")}
              disabled={disconnectMutation.isPending}
              onConfirm={() => disconnectMutation.mutate()}
            >
              {t("disconnect")}
            </ConfirmButton>
          ) : null}
        </div>
      </form>
    </section>
  );
}
