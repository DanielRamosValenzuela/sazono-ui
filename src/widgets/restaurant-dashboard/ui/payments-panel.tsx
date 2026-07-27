"use client";

import { Suspense, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Clock3, CreditCard, Unlink } from "lucide-react";
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
import type { PaymentAccountStatusResponse } from "@/shared/types/payments";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";

const PAYMENT_ACCOUNT_QUERY_KEY = ["admin", "payment-accounts", "mercado-pago"];

type CardStatus = PaymentAccountStatusResponse["status"] | "NOT_CONNECTED";

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
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);

  const statusQuery = useQuery({
    queryKey: [...PAYMENT_ACCOUNT_QUERY_KEY, session.accessToken],
    enabled: session.isClientReady && Boolean(session.accessToken),
    queryFn: () =>
      paymentAccountsApi.getMercadoPagoStatus(session.accessToken!),
  });

  const handleCallbackStatus = (status: string) => {
    if (status === "connected") {
      toast.success(t("callbackConnected"));
    } else if (status === "error") {
      toast.error(t("callbackError"));
    }

    void queryClient.invalidateQueries({
      queryKey: PAYMENT_ACCOUNT_QUERY_KEY,
    });
  };

  const connectMutation = useMutation({
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

  const disconnectMutation = useMutation({
    mutationFn: () =>
      paymentAccountsApi.disconnectMercadoPago(session.accessToken!),
    onSuccess: async () => {
      setIsDisconnectDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: PAYMENT_ACCOUNT_QUERY_KEY,
      });
      toast.success(t("disconnectSuccess"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("disconnectError")
      );
    },
  });

  const account = statusQuery.data ?? null;

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

      {statusQuery.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {t("listError")}
        </div>
      ) : null}

      {statusQuery.isLoading ? (
        <Skeleton className="h-56 w-full rounded-3xl" />
      ) : (
        <MercadoPagoCard
          account={account}
          isConnecting={connectMutation.isPending}
          onConnect={() => connectMutation.mutate()}
          onRequestDisconnect={() => setIsDisconnectDialogOpen(true)}
        />
      )}

      <Dialog
        open={isDisconnectDialogOpen}
        onOpenChange={setIsDisconnectDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Unlink className="size-5" />
              </div>
              <div>
                <DialogTitle>{t("disconnectDialogTitle")}</DialogTitle>
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
              onClick={() => setIsDisconnectDialogOpen(false)}
            >
              {t("disconnectDialogCancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              disabled={disconnectMutation.isPending}
              onClick={() => disconnectMutation.mutate()}
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

type MercadoPagoCardProps = {
  account: PaymentAccountStatusResponse | null;
  isConnecting: boolean;
  onConnect: () => void;
  onRequestDisconnect: () => void;
};

function MercadoPagoCard({
  account,
  isConnecting,
  onConnect,
  onRequestDisconnect,
}: MercadoPagoCardProps) {
  const t = useTranslations("AdminPayments");
  const locale = useLocale();
  const status: CardStatus = account?.status ?? "NOT_CONNECTED";
  const isConnected = status === "CONNECTED";
  const statusMeta = getStatusMeta(status, t);

  return (
    <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <CreditCard className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold">{t("mercadoPagoTitle")}</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
              {t("mercadoPagoDescription")}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={statusMeta.badgeClassName}>
          <statusMeta.Icon className="size-3.5" />
          {statusMeta.label}
        </Badge>
      </div>

      {account?.status === "ERROR" && account.lastErrorMessage ? (
        <div className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {account.lastErrorMessage}
        </div>
      ) : null}

      {isConnected ? (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("environmentLabel")}
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {account?.liveMode
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

      <div className="mt-6">
        {isConnected ? (
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            onClick={onRequestDisconnect}
          >
            <Unlink className="size-4" />
            {t("disconnectButton")}
          </Button>
        ) : (
          <Button
            type="button"
            className="rounded-full"
            disabled={isConnecting}
            onClick={onConnect}
          >
            {isConnecting ? <Spinner /> : null}
            {isConnecting ? t("connecting") : t("connectButton")}
          </Button>
        )}
      </div>
    </section>
  );
}
