"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Clock3, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { paymentAccountsApi } from "@/shared/api/payment-accounts-api";
import { formatMoney } from "@/shared/lib/format";
import { consumePaymentRedirectReturnPath } from "@/shared/lib/payment-redirect-return-path";
import { Spinner } from "@/components/ui/spinner";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

type PaymentReturnProps = {
  tokenWs?: string;
  tbkToken?: string;
  tbkOrdenCompra?: string;
  tbkIdSesion?: string;
};

export function PaymentReturn({
  tokenWs,
  tbkToken,
  tbkOrdenCompra,
  tbkIdSesion,
}: PaymentReturnProps) {
  const t = useTranslations("PaymentReturn");
  const [returnPath, setReturnPath] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setReturnPath(consumePaymentRedirectReturnPath());
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const confirmQuery = useQuery({
    queryKey: [
      "payment-return",
      tokenWs ?? null,
      tbkToken ?? null,
      tbkOrdenCompra ?? null,
      tbkIdSesion ?? null,
    ],
    queryFn: () =>
      paymentAccountsApi.confirmTransbankReturn({
        token_ws: tokenWs,
        TBK_TOKEN: tbkToken,
        TBK_ORDEN_COMPRA: tbkOrdenCompra,
        TBK_ID_SESION: tbkIdSesion,
      }),
    retry: false,
  });

  return (
    <main className="flex min-h-dvh flex-col text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-5">
        <div className="flex items-center justify-between gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-16 text-center">
          {confirmQuery.isPending ? (
            <ReturnStatus
              icon={<Spinner className="size-7" />}
              title={t("loadingTitle")}
              description={t("loadingDescription")}
            />
          ) : confirmQuery.isError ? (
            <ReturnStatus
              icon={<CircleAlert className="size-7" />}
              title={t("errorTitle")}
              description={t("errorDescription")}
            />
          ) : (
            <ResultStatus
              status={confirmQuery.data.status}
              failureReason={confirmQuery.data.failureReason}
              amount={confirmQuery.data.payment?.amount}
              currency={confirmQuery.data.payment?.currency}
            />
          )}

          <Link
            href={returnPath ?? "/qr"}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            {returnPath ? t("backToTableButton") : t("backHomeButton")}
          </Link>
        </div>
      </div>
    </main>
  );
}

function ReturnStatus({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h1 className="font-heading text-2xl font-bold">{title}</h1>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

type ResultStatusProps = {
  status: "APPROVED" | "REJECTED" | "ABORTED" | "TIMEOUT";
  failureReason?: string;
  amount?: string;
  currency?: string;
};

function ResultStatus({
  status,
  failureReason,
  amount,
  currency,
}: ResultStatusProps) {
  const t = useTranslations("PaymentReturn");

  if (status === "APPROVED") {
    return (
      <ReturnStatus
        icon={<CheckCircle2 className="size-7" />}
        title={t("approvedTitle")}
        description={
          amount
            ? t("approvedDescriptionWithAmount", {
                amount: formatMoney(amount, currency ?? "CLP"),
              })
            : t("approvedDescription")
        }
      />
    );
  }

  if (status === "ABORTED") {
    return (
      <ReturnStatus
        icon={<XCircle className="size-7" />}
        title={t("abortedTitle")}
        description={t("abortedDescription")}
      />
    );
  }

  if (status === "TIMEOUT") {
    return (
      <ReturnStatus
        icon={<Clock3 className="size-7" />}
        title={t("timeoutTitle")}
        description={t("timeoutDescription")}
      />
    );
  }

  return (
    <ReturnStatus
      icon={<CircleAlert className="size-7" />}
      title={t("rejectedTitle")}
      description={failureReason || t("rejectedDescription")}
    />
  );
}
