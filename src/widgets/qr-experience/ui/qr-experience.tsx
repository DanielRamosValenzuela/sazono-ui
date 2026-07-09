"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QrCode, SearchX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { qrApi } from "@/shared/api/qr-api";
import { formatMoney } from "@/shared/lib/format";
import type { MenuItemDetail } from "@/shared/types/menu";
import type { OrderResponse } from "@/shared/types/order";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import {
  getCartCount,
  getCartTotal,
  setCartQuantity,
  type CartLine,
} from "@/shared/lib/cart";
import { BillPaySheet } from "./bill-pay-sheet";
import { CartSheet } from "./cart-sheet";
import { MenuView } from "./menu-view";
import { PaymentSheet } from "./payment-sheet";
import { StatusBanner } from "./status-banner";

const ORDERS_REFETCH_INTERVAL = 10_000;
const BILL_REFETCH_INTERVAL = 10_000;

type QrExperienceProps = {
  qrToken?: string;
};

function StatusScreen({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 text-foreground">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        {action}
      </div>
    </main>
  );
}

function MenuSkeleton() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-5 pt-6 text-foreground">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-40 rounded-full" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <Skeleton className="mt-6 h-4 w-24" />
      <Skeleton className="mt-3 h-9 w-56" />
      <Skeleton className="mt-3 h-4 w-64" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-8 space-y-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full max-w-[16rem]" />
          </div>
        ))}
      </div>
    </main>
  );
}

export function QrExperience({ qrToken }: QrExperienceProps) {
  const t = useTranslations("QrPage");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [payingOrder, setPayingOrder] = useState<OrderResponse | null>(null);
  const [billSheetOpen, setBillSheetOpen] = useState(false);

  const menuQuery = useQuery({
    queryKey: ["qr-menu", qrToken, locale],
    queryFn: () => qrApi.getMenu(qrToken as string, locale),
    enabled: Boolean(qrToken),
    retry: 1,
  });

  const ordersQuery = useQuery({
    queryKey: ["qr-orders", qrToken],
    queryFn: () => qrApi.listOrders(qrToken as string),
    enabled: Boolean(qrToken) && menuQuery.isSuccess,
    refetchInterval: ORDERS_REFETCH_INTERVAL,
  });

  const billQuery = useQuery({
    queryKey: ["qr-bill", qrToken],
    queryFn: () => qrApi.getBill(qrToken as string),
    enabled: Boolean(qrToken) && menuQuery.isSuccess,
    refetchInterval: BILL_REFETCH_INTERVAL,
  });

  if (!qrToken) {
    return (
      <StatusScreen
        icon={<QrCode className="size-7" />}
        title={t("noTable_title")}
        description={t("noTable_description")}
      />
    );
  }

  if (menuQuery.isPending) {
    return <MenuSkeleton />;
  }

  if (menuQuery.isError) {
    return (
      <StatusScreen
        icon={<SearchX className="size-7" />}
        title={t("error_title")}
        description={t("error_description")}
        action={
          <Button
            type="button"
            variant="outline"
            className="mt-2 rounded-full"
            onClick={() => menuQuery.refetch()}
          >
            {t("error_retry")}
          </Button>
        }
      />
    );
  }

  const menu = menuQuery.data;
  const cartCount = getCartCount(cart);
  const cartTotal = getCartTotal(cart);
  const showCartBar = cartCount > 0 && !cartOpen && !payingOrder && !billSheetOpen;

  const handleSetQuantity = (item: MenuItemDetail, quantity: number) => {
    setCart((lines) => setCartQuantity(lines, item, quantity));
  };

  const handleOrderCreated = (order: OrderResponse) => {
    setCart([]);
    setCartOpen(false);
    queryClient.invalidateQueries({ queryKey: ["qr-orders", qrToken] });

    if (order.status === "AWAITING_PAYMENT") {
      setPayingOrder(order);
      return;
    }

    toast.success(t("order_createdToast"));
  };

  const handlePaid = () => {
    setPayingOrder(null);
    queryClient.invalidateQueries({ queryKey: ["qr-orders", qrToken] });
    queryClient.invalidateQueries({ queryKey: ["qr-bill", qrToken] });
  };

  const handleBillPaid = () => {
    setBillSheetOpen(false);
    queryClient.invalidateQueries({ queryKey: ["qr-orders", qrToken] });
    queryClient.invalidateQueries({ queryKey: ["qr-bill", qrToken] });
  };

  return (
    <div className="min-h-dvh text-foreground">
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full max-w-md flex-col",
          showCartBar && "pb-28"
        )}
      >
        <header className="px-5 pt-5">
          <div className="flex items-center justify-between gap-3">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            {t("header_eyebrow")}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold leading-tight">
            {menu.name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("header_welcome")}
          </p>

          <StatusBanner
            orders={ordersQuery.data}
            bill={billQuery.data}
            onPayOrder={(order) => setPayingOrder(order)}
            onOpenBill={() => setBillSheetOpen(true)}
          />
        </header>

        <main className="flex-1 pb-10 pt-2">
          <MenuView menu={menu} cart={cart} onSetQuantity={handleSetQuantity} />
        </main>
      </div>

      {showCartBar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-md px-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-card/95 p-3 pl-4 shadow-xl shadow-primary/10 backdrop-blur">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("cart_itemCount", { count: cartCount })}
                </p>
                <p className="font-heading text-lg font-bold text-foreground">
                  {formatMoney(cartTotal, "CLP")}
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                className="rounded-xl px-8"
                onClick={() => setCartOpen(true)}
              >
                {t("cartBar_cta")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <CartSheet
          qrToken={qrToken}
          cart={cart}
          onSetQuantity={handleSetQuantity}
          onClose={() => setCartOpen(false)}
          onCreated={handleOrderCreated}
        />
      ) : null}

      {payingOrder ? (
        <PaymentSheet
          qrToken={qrToken}
          order={payingOrder}
          onClose={() => setPayingOrder(null)}
          onPaid={handlePaid}
        />
      ) : null}

      {billSheetOpen && billQuery.data ? (
        <BillPaySheet
          qrToken={qrToken}
          bill={billQuery.data}
          orders={ordersQuery.data ?? []}
          onClose={() => setBillSheetOpen(false)}
          onPaid={handleBillPaid}
        />
      ) : null}
    </div>
  );
}
