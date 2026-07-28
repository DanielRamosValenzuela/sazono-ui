"use client";

import { Suspense, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  PauseCircle,
  Star,
  Unlink,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { paymentAccountsApi } from "@/shared/api/payment-accounts-api";
import type {
  ConnectTransbankAccountRequest,
  PaymentAccountStatusResponse,
  PaymentGatewayProvider,
  TransbankEnvironment,
} from "@/shared/types/payments";
import { FieldGroup, FieldLabel, SelectInput, TextInput } from "@/shared/ui/form-controls";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";

const MERCADO_PAGO_QUERY_KEY = ["admin", "payment-accounts", "mercado-pago"];
const TRANSBANK_QUERY_KEY = ["admin", "payment-accounts", "transbank"];

type CardStatus = PaymentAccountStatusResponse["status"] | "NOT_CONNECTED";

function isActiveStatus(status: PaymentAccountStatusResponse["status"]): boolean {
  return status === "CONNECTED" || status === "PAUSED";
}

type PaymentsCallbackWatcherProps = {
  onStatus: (status: string) => void;
};

function PaymentsCallbackWatcher({ onStatus }: PaymentsCallbackWatcherProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const status = searchParams.get("status");
    if (!status) {
      return;
    }

    onStatus(status);
    router.replace(pathname);
  }, [searchParams, onStatus, router, pathname]);

  return null;
}

export function PaymentsPanel() {
  const t = useTranslations("AdminPayments");
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const [disconnectTarget, setDisconnectTarget] =
    useState<PaymentGatewayProvider | null>(null);

  const mercadoPagoQuery = useQuery({
    queryKey: [...MERCADO_PAGO_QUERY_KEY, session.accessToken],
    enabled: session.isClientReady && Boolean(session.accessToken),
    queryFn: () =>
      paymentAccountsApi.getMercadoPagoStatus(session.accessToken!),
  });

  const transbankQuery = useQuery({
    queryKey: [...TRANSBANK_QUERY_KEY, session.accessToken],
    enabled: session.isClientReady && Boolean(session.accessToken),
    queryFn: () => paymentAccountsApi.getTransbankStatus(session.accessToken!),
  });

  const invalidateAccounts = () => {
    void queryClient.invalidateQueries({ queryKey: MERCADO_PAGO_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: TRANSBANK_QUERY_KEY });
  };

  const handleCallbackStatus = (status: string) => {
    if (status === "connected") {
      toast.success(t("callbackConnected"));
    } else if (status === "error") {
      toast.error(t("callbackError"));
    }

    invalidateAccounts();
  };

  const connectMercadoPagoMutation = useMutation({
    mutationFn: () =>
      paymentAccountsApi.getMercadoPagoAuthorizationUrl(
        session.accessToken!
      ),
    onSuccess: (response) => {
      window.location.href = response.authorizationUrl;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("connectError"));
    },
  });

  const connectTransbankMutation = useMutation({
    mutationFn: (payload: ConnectTransbankAccountRequest) =>
      paymentAccountsApi.connectTransbank(session.accessToken!, payload),
    onSuccess: () => {
      invalidateAccounts();
      toast.success(t("connectTransbankSuccess"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("connectTransbankError")
      );
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (provider: PaymentGatewayProvider) =>
      provider === "MERCADO_PAGO"
        ? paymentAccountsApi.disconnectMercadoPago(session.accessToken!)
        : paymentAccountsApi.disconnectTransbank(session.accessToken!),
    onSuccess: () => {
      setDisconnectTarget(null);
      invalidateAccounts();
      toast.success(t("disconnectSuccess"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("disconnectError")
      );
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (provider: PaymentGatewayProvider) =>
      paymentAccountsApi.pauseAccount(session.accessToken!, provider),
    onSuccess: () => {
      invalidateAccounts();
      toast.success(t("pauseSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("pauseError"));
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (provider: PaymentGatewayProvider) =>
      paymentAccountsApi.resumeAccount(session.accessToken!, provider),
    onSuccess: () => {
      invalidateAccounts();
      toast.success(t("resumeSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("resumeError"));
    },
  });

  const preferredMutation = useMutation({
    mutationFn: (provider: PaymentGatewayProvider) =>
      paymentAccountsApi.setPreferredAccount(session.accessToken!, provider),
    onSuccess: () => {
      invalidateAccounts();
      toast.success(t("preferredSuccess"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("preferredError")
      );
    },
  });

  const mercadoPagoAccount = mercadoPagoQuery.data ?? null;
  const transbankAccount = transbankQuery.data ?? null;

  const topPriority = [mercadoPagoAccount, transbankAccount].reduce(
    (max, account) =>
      account && isActiveStatus(account.status)
        ? Math.max(max, account.displayPriority)
        : max,
    Number.NEGATIVE_INFINITY
  );

  const isPreferred = (account: PaymentAccountStatusResponse | null) =>
    Boolean(
      account &&
        isActiveStatus(account.status) &&
        account.displayPriority === topPriority
    );

  const disconnectLabel =
    disconnectTarget === "TRANSBANK"
      ? t("transbankTitle")
      : t("mercadoPagoTitle");

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <PaymentsCallbackWatcher onStatus={handleCallbackStatus} />
      </Suspense>

      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("pageDescription")}
        </p>
      </header>

      {mercadoPagoQuery.isError || transbankQuery.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {t("listError")}
        </div>
      ) : null}

      <div className="space-y-6">
        {mercadoPagoQuery.isLoading ? (
          <Skeleton className="h-56 w-full rounded-3xl" />
        ) : (
          <PaymentProviderCard
            provider="MERCADO_PAGO"
            icon={CreditCard}
            title={t("mercadoPagoTitle")}
            description={t("mercadoPagoDescription")}
            account={mercadoPagoAccount}
            isPreferred={isPreferred(mercadoPagoAccount)}
            isPausing={
              pauseMutation.isPending &&
              pauseMutation.variables === "MERCADO_PAGO"
            }
            isResuming={
              resumeMutation.isPending &&
              resumeMutation.variables === "MERCADO_PAGO"
            }
            isSettingPreferred={
              preferredMutation.isPending &&
              preferredMutation.variables === "MERCADO_PAGO"
            }
            onPause={() => pauseMutation.mutate("MERCADO_PAGO")}
            onResume={() => resumeMutation.mutate("MERCADO_PAGO")}
            onSetPreferred={() => preferredMutation.mutate("MERCADO_PAGO")}
            onRequestDisconnect={() => setDisconnectTarget("MERCADO_PAGO")}
            connectSlot={
              <Button
                type="button"
                className="rounded-full"
                disabled={connectMercadoPagoMutation.isPending}
                onClick={() => connectMercadoPagoMutation.mutate()}
              >
                {connectMercadoPagoMutation.isPending ? <Spinner /> : null}
                {connectMercadoPagoMutation.isPending
                  ? t("connecting")
                  : t("connectButton")}
              </Button>
            }
          />
        )}

        {transbankQuery.isLoading ? (
          <Skeleton className="h-56 w-full rounded-3xl" />
        ) : (
          <PaymentProviderCard
            provider="TRANSBANK"
            icon={Building2}
            title={t("transbankTitle")}
            description={t("transbankDescription")}
            account={transbankAccount}
            isPreferred={isPreferred(transbankAccount)}
            isPausing={
              pauseMutation.isPending &&
              pauseMutation.variables === "TRANSBANK"
            }
            isResuming={
              resumeMutation.isPending &&
              resumeMutation.variables === "TRANSBANK"
            }
            isSettingPreferred={
              preferredMutation.isPending &&
              preferredMutation.variables === "TRANSBANK"
            }
            onPause={() => pauseMutation.mutate("TRANSBANK")}
            onResume={() => resumeMutation.mutate("TRANSBANK")}
            onSetPreferred={() => preferredMutation.mutate("TRANSBANK")}
            onRequestDisconnect={() => setDisconnectTarget("TRANSBANK")}
            connectSlot={
              <TransbankConnectForm
                isSubmitting={connectTransbankMutation.isPending}
                onSubmit={(payload) =>
                  connectTransbankMutation.mutate(payload)
                }
              />
            }
          />
        )}
      </div>

      <Dialog
        open={disconnectTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDisconnectTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Unlink className="size-5" />
              </div>
              <div>
                <DialogTitle>
                  {t("disconnectDialogTitle", { provider: disconnectLabel })}
                </DialogTitle>
                <DialogDescription>
                  {t("disconnectDialogDescription")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => setDisconnectTarget(null)}
            >
              {t("disconnectDialogCancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={disconnectMutation.isPending}
              onClick={() =>
                disconnectTarget && disconnectMutation.mutate(disconnectTarget)
              }
            >
              {disconnectMutation.isPending ? <Spinner /> : null}
              {disconnectMutation.isPending
                ? t("disconnecting")
                : t("disconnectDialogConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type StatusMeta = {
  label: string;
  Icon: typeof CheckCircle2;
  badgeClassName: string;
};

function getStatusMeta(
  status: CardStatus,
  t: ReturnType<typeof useTranslations>
): StatusMeta {
  switch (status) {
    case "CONNECTED":
      return {
        label: t("statusConnected"),
        Icon: CheckCircle2,
        badgeClassName: "border-transparent bg-secondary text-secondary-foreground",
      };
    case "PAUSED":
      return {
        label: t("statusPaused"),
        Icon: PauseCircle,
        badgeClassName: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
    case "PENDING":
      return {
        label: t("statusPending"),
        Icon: Clock3,
        badgeClassName: "text-muted-foreground",
      };
    case "ERROR":
      return {
        label: t("statusError"),
        Icon: CircleAlert,
        badgeClassName: "border-destructive/30 bg-destructive/10 text-destructive",
      };
    case "DISCONNECTED":
      return {
        label: t("statusDisconnected"),
        Icon: CircleAlert,
        badgeClassName: "text-muted-foreground",
      };
    default:
      return {
        label: t("statusNotConnected"),
        Icon: CircleAlert,
        badgeClassName: "text-muted-foreground",
      };
  }
}

type PaymentProviderCardProps = {
  provider: PaymentGatewayProvider;
  icon: typeof CreditCard;
  title: string;
  description: string;
  account: PaymentAccountStatusResponse | null;
  isPreferred: boolean;
  isPausing: boolean;
  isResuming: boolean;
  isSettingPreferred: boolean;
  onPause: () => void;
  onResume: () => void;
  onSetPreferred: () => void;
  onRequestDisconnect: () => void;
  connectSlot: React.ReactNode;
};

function PaymentProviderCard({
  icon: Icon,
  title,
  description,
  account,
  isPreferred,
  isPausing,
  isResuming,
  isSettingPreferred,
  onPause,
  onResume,
  onSetPreferred,
  onRequestDisconnect,
  connectSlot,
}: PaymentProviderCardProps) {
  const t = useTranslations("AdminPayments");
  const locale = useLocale();
  const status: CardStatus = account?.status ?? "NOT_CONNECTED";
  const isActive = account !== null && isActiveStatus(account.status);
  const statusMeta = getStatusMeta(status, t);

  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isActive && isPreferred ? (
            <Badge className="border-transparent bg-primary/10 text-primary">
              <Star className="size-3.5" />
              {t("preferredBadge")}
            </Badge>
          ) : null}
          <Badge variant="outline" className={statusMeta.badgeClassName}>
            <statusMeta.Icon className="size-3.5" />
            {statusMeta.label}
          </Badge>
        </div>
      </div>

      {account?.status === "ERROR" && account.lastErrorMessage ? (
        <div className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {account.lastErrorMessage}
        </div>
      ) : null}

      {isActive ? (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("environmentLabel")}
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {account?.environment === "production"
                ? t("environmentLive")
                : t("environmentSandbox")}
            </dd>
          </div>
          {account?.externalAccountId ? (
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("accountIdLabel")}
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {account.externalAccountId}
              </dd>
            </div>
          ) : null}
          {account?.childCommerceCode ? (
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("childCommerceCodeLabel")}
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {account.childCommerceCode}
              </dd>
            </div>
          ) : null}
          {account?.connectedAt ? (
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("connectedAtLabel")}
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {new Date(account.connectedAt).toLocaleString(locale)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground">
          {t("notConnectedHint")}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {isActive ? (
          <>
            {account?.status === "CONNECTED" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={isPausing}
                onClick={onPause}
              >
                {isPausing ? <Spinner /> : null}
                {isPausing ? t("pausing") : t("pauseButton")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={isResuming}
                onClick={onResume}
              >
                {isResuming ? <Spinner /> : null}
                {isResuming ? t("resuming") : t("resumeButton")}
              </Button>
            )}

            {!isPreferred ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                disabled={isSettingPreferred}
                onClick={onSetPreferred}
              >
                {isSettingPreferred ? <Spinner /> : null}
                {isSettingPreferred
                  ? t("markingPreferred")
                  : t("preferredButton")}
              </Button>
            ) : null}

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-full"
              onClick={onRequestDisconnect}
            >
              <Unlink className="size-4" />
              {t("disconnectButton")}
            </Button>
          </>
        ) : (
          connectSlot
        )}
      </div>
    </section>
  );
}

type TransbankConnectFormProps = {
  isSubmitting: boolean;
  onSubmit: (payload: ConnectTransbankAccountRequest) => void;
};

function TransbankConnectForm({
  isSubmitting,
  onSubmit,
}: TransbankConnectFormProps) {
  const t = useTranslations("AdminPayments");
  const [childCommerceCode, setChildCommerceCode] = useState("");
  const [environment, setEnvironment] =
    useState<TransbankEnvironment>("integration");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!childCommerceCode.trim()) {
      return;
    }

    onSubmit({ childCommerceCode: childCommerceCode.trim(), environment });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-4 rounded-2xl border border-border/70 bg-background/60 p-4"
    >
      <FieldGroup>
        <FieldLabel htmlFor="transbank-child-commerce-code">
          {t("childCommerceCodeLabel")}
        </FieldLabel>
        <TextInput
          id="transbank-child-commerce-code"
          value={childCommerceCode}
          onChange={(event) => setChildCommerceCode(event.target.value)}
          placeholder={t("childCommerceCodePlaceholder")}
          maxLength={12}
          required
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="transbank-environment">
          {t("environmentFieldLabel")}
        </FieldLabel>
        <SelectInput
          id="transbank-environment"
          value={environment}
          onChange={(event) =>
            setEnvironment(event.target.value as TransbankEnvironment)
          }
        >
          <option value="integration">{t("environmentIntegration")}</option>
          <option value="production">{t("environmentProduction")}</option>
        </SelectInput>
      </FieldGroup>

      <Button
        type="submit"
        className="rounded-full"
        disabled={isSubmitting || !childCommerceCode.trim()}
      >
        {isSubmitting ? <Spinner /> : null}
        {isSubmitting ? t("connecting") : t("connectTransbankSubmit")}
      </Button>
    </form>
  );
}
