"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { qrApi } from "@/shared/api/qr-api";
import { formatMoney } from "@/shared/lib/format";
import type { MenuItemDetail } from "@/shared/types/menu";
import type { OrderResponse } from "@/shared/types/order";
import { FieldGroup, FieldLabel } from "@/shared/ui/form-controls";
import { getCartTotal, type CartLine } from "../model/cart";
import { BottomSheet } from "./bottom-sheet";

type CartSheetProps = {
  qrToken: string;
  cart: CartLine[];
  onSetQuantity: (item: MenuItemDetail, quantity: number) => void;
  onClose: () => void;
  onCreated: (order: OrderResponse) => void;
};

export function CartSheet({
  qrToken,
  cart,
  onSetQuantity,
  onClose,
  onCreated,
}: CartSheetProps) {
  const t = useTranslations("QrPage");
  const [notes, setNotes] = useState("");

  const total = getCartTotal(cart);

  const createOrder = useMutation({
    mutationFn: () =>
      qrApi.createOrder(qrToken, {
        items: cart.map((line) => ({
          menuItemId: line.item.menuItemId,
          quantity: line.quantity,
        })),
        notes: notes.trim() === "" ? undefined : notes.trim(),
      }),
    onSuccess: (order) => {
      onCreated(order);
    },
    onError: () => {
      toast.error(t("cart_submitError"));
    },
  });

  return (
    <BottomSheet onClose={onClose} labelledBy="qr-cart-title">
      <h2
        id="qr-cart-title"
        className="font-heading text-2xl font-bold text-foreground"
      >
        {t("cart_title")}
      </h2>

      {cart.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {t("cart_empty")}
        </p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-border/60">
            {cart.map((line) => (
              <li
                key={line.item.menuItemId}
                className="flex items-center gap-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {line.item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(line.item.price, "CLP")}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-border/80 px-1 py-0.5">
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    className="rounded-full"
                    aria-label={t("menu_removeOne", { name: line.item.name })}
                    onClick={() => onSetQuantity(line.item, line.quantity - 1)}
                  >
                    <Minus />
                  </Button>
                  <span className="min-w-4 text-center text-sm font-semibold tabular-nums text-foreground">
                    {line.quantity}
                  </span>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    className="rounded-full"
                    aria-label={t("menu_addOne", { name: line.item.name })}
                    onClick={() => onSetQuantity(line.item, line.quantity + 1)}
                  >
                    <Plus />
                  </Button>
                </div>

                <p className="w-20 text-right text-sm font-semibold tabular-nums text-foreground">
                  {formatMoney(
                    Number(line.item.price) * line.quantity,
                    "CLP"
                  )}
                </p>
              </li>
            ))}
          </ul>

          <FieldGroup className="mt-5">
            <FieldLabel htmlFor="qr-cart-notes">{t("cart_notesLabel")}</FieldLabel>
            <textarea
              id="qr-cart-notes"
              value={notes}
              maxLength={500}
              rows={3}
              placeholder={t("cart_notesPlaceholder")}
              onChange={(event) => setNotes(event.target.value)}
              className="flex w-full resize-none rounded-xl border border-border bg-background/85 px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/25"
            />
          </FieldGroup>

          <div className="mt-5 flex items-baseline justify-between border-t border-border/60 pt-4">
            <p className="text-sm font-medium text-muted-foreground">
              {t("cart_total")}
            </p>
            <p className="font-heading text-2xl font-bold text-foreground">
              {formatMoney(total, "CLP")}
            </p>
          </div>
        </>
      )}

      <div className="mt-5 space-y-2">
        <Button
          type="button"
          size="lg"
          className="w-full rounded-xl"
          disabled={cart.length === 0 || createOrder.isPending}
          onClick={() => createOrder.mutate()}
        >
          {createOrder.isPending ? <Spinner /> : null}
          {t("cart_submit")}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="w-full rounded-xl"
          onClick={onClose}
        >
          {t("cart_continue")}
        </Button>
      </div>
    </BottomSheet>
  );
}
