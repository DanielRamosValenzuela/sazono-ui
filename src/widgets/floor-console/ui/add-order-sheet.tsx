"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { menusApi } from "@/shared/api/menus-api";
import { ordersApi } from "@/shared/api/orders-api";
import {
  getCartCount,
  getCartQuantity,
  getCartTotal,
  setCartQuantity,
  type CartLine,
} from "@/shared/lib/cart";
import { formatMoney } from "@/shared/lib/format";
import type { MenuItemDetail } from "@/shared/types/menu";
import { FieldGroup, FieldLabel, TextArea } from "@/shared/ui/form-controls";

type AddOrderSheetProps = {
  accessToken: string;
  branchId: string;
  tableSessionId: string;
  onClose: () => void;
};

export function AddOrderSheet({
  accessToken,
  branchId,
  tableSessionId,
  onClose,
}: AddOrderSheetProps) {
  const t = useTranslations("FloorConsole");
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");

  const menusQuery = useQuery({
    queryKey: ["orders", "publishable-menus", accessToken, branchId],
    queryFn: () => menusApi.listMenus(accessToken, branchId),
  });

  const publishedMenuId = menusQuery.data?.find(
    (menu) => menu.status === "PUBLISHED"
  )?.menuId;

  const menuDetailQuery = useQuery({
    queryKey: ["orders", "publishable-menu-detail", accessToken, publishedMenuId],
    queryFn: () => menusApi.getMenuDetail(accessToken, publishedMenuId as string),
    enabled: Boolean(publishedMenuId),
  });

  const categories = useMemo(
    () =>
      (menuDetailQuery.data?.categories ?? [])
        .filter((category) => category.status === "ACTIVE" && category.items.length > 0)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [menuDetailQuery.data]
  );

  const handleSetQuantity = (item: MenuItemDetail, quantity: number) => {
    setCart((lines) => setCartQuantity(lines, item, quantity));
  };

  const cartCount = getCartCount(cart);
  const cartTotal = getCartTotal(cart);

  const createOrderMutation = useMutation({
    mutationFn: () =>
      ordersApi.createWaiterOrder(accessToken, {
        tableSessionId,
        items: cart.map((line) => ({
          menuItemId: line.item.menuItemId,
          quantity: line.quantity,
        })),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    onSuccess: () => {
      toast.success(t("addOrderSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["billing", "current-bill"] });
      void queryClient.invalidateQueries({ queryKey: ["orders", "session"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("addOrderError"));
    },
  });

  const isMenuLoading = menusQuery.isPending || (Boolean(publishedMenuId) && menuDetailQuery.isPending);
  const hasMenuError = menusQuery.isError || menuDetailQuery.isError;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl gap-5">
        <DialogHeader>
          <DialogTitle>{t("addOrderTitle")}</DialogTitle>
          <DialogDescription>{t("addOrderDescription")}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[45vh] overflow-y-auto rounded-2xl border border-border/60 bg-background/40 p-3">
          {isMenuLoading ? (
            <div className="space-y-3 p-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : hasMenuError ? (
            <p className="p-3 text-sm text-destructive">{t("addOrderMenuError")}</p>
          ) : !publishedMenuId || categories.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <UtensilsCrossed className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("addOrderMenuEmpty")}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {categories.map((category) => (
                <div key={category.menuCategoryId}>
                  <h3 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {category.name}
                  </h3>
                  <ul className="mt-1 divide-y divide-border/50">
                    {category.items.map((item) => {
                      const quantity = getCartQuantity(cart, item.menuItemId);

                      return (
                        <li
                          key={item.menuItemId}
                          className={cn(
                            "flex items-center justify-between gap-3 px-1 py-2.5",
                            !item.isAvailable && "opacity-50"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatMoney(item.price, "CLP")}
                            </p>
                          </div>

                          {!item.isAvailable ? (
                            <Badge variant="outline">{t("tableStatus_DISABLED")}</Badge>
                          ) : quantity === 0 ? (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              className="rounded-full"
                              aria-label={item.name}
                              onClick={() => handleSetQuantity(item, 1)}
                            >
                              <Plus />
                            </Button>
                          ) : (
                            <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-1 py-0.5">
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                className="rounded-full"
                                onClick={() => handleSetQuantity(item, quantity - 1)}
                              >
                                <Minus />
                              </Button>
                              <span className="min-w-4 text-center text-sm font-semibold tabular-nums text-foreground">
                                {quantity}
                              </span>
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                className="rounded-full"
                                onClick={() => handleSetQuantity(item, quantity + 1)}
                              >
                                <Plus />
                              </Button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <FieldGroup>
          <FieldLabel htmlFor="add-order-notes">{t("addOrderNotesLabel")}</FieldLabel>
          <TextArea
            id="add-order-notes"
            rows={2}
            placeholder={t("addOrderNotesPlaceholder")}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </FieldGroup>

        <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
          {cartCount === 0 ? (
            <p className="text-sm text-muted-foreground">{t("addOrderCartEmpty")}</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("addOrderCartTitle")}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {t("addOrderTotal")}: {formatMoney(cartTotal, "CLP")}
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                className="rounded-full"
                disabled={createOrderMutation.isPending}
                onClick={() => createOrderMutation.mutate()}
              >
                {createOrderMutation.isPending ? <Spinner /> : null}
                {createOrderMutation.isPending
                  ? t("addOrderSubmitting")
                  : t("addOrderSubmit")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
