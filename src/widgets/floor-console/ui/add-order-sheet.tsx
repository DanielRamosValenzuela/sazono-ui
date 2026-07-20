"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Search, UtensilsCrossed, X } from "lucide-react";
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
  getItemTotalQuantity,
  getLineUnitPrice,
  setCartQuantity,
  type CartLine,
} from "@/shared/lib/cart";
import { formatMoney } from "@/shared/lib/format";
import type { MenuItemDetail } from "@/shared/types/menu";
import { FieldGroup, FieldLabel, TextArea, TextInput } from "@/shared/ui/form-controls";

function isModifierSelectionValid(item: MenuItemDetail, selectedIds: string[]) {
  return item.modifierGroups.every((group) => {
    const selectedInGroup = group.options.filter((option) =>
      selectedIds.includes(option.modifierOptionId)
    ).length;
    const effectiveMin = group.isRequired ? Math.max(group.minSelect, 1) : group.minSelect;

    if (selectedInGroup < effectiveMin) {
      return false;
    }

    return group.maxSelect === null || selectedInGroup <= group.maxSelect;
  });
}

function lineModifierSummary(line: CartLine) {
  return line.item.modifierGroups
    .flatMap((group) => group.options)
    .filter((option) => line.selectedModifierOptionIds.includes(option.modifierOptionId))
    .map((option) => option.name)
    .join(", ");
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const [modifierPickerItemId, setModifierPickerItemId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string[]>([]);

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

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const categories = useMemo(() => {
    const activeCategories = (menuDetailQuery.data?.categories ?? [])
      .filter((category) => category.status === "ACTIVE" && category.items.length > 0)
      .sort((left, right) => left.sortOrder - right.sortOrder);

    if (!normalizedSearch) {
      return activeCategories;
    }

    return activeCategories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) =>
          item.name.toLowerCase().includes(normalizedSearch)
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [menuDetailQuery.data, normalizedSearch]);

  const handleSetQuantity = (item: MenuItemDetail, quantity: number) => {
    setCart((lines) => setCartQuantity(lines, item, quantity));
  };

  const openModifierPicker = (item: MenuItemDetail) => {
    setModifierPickerItemId(item.menuItemId);
    setPendingSelection([]);
  };

  const closeModifierPicker = () => {
    setModifierPickerItemId(null);
    setPendingSelection([]);
  };

  const toggleModifierOption = (
    item: MenuItemDetail,
    groupId: string,
    optionId: string
  ) => {
    const group = item.modifierGroups.find((candidate) => candidate.modifierGroupId === groupId);

    if (!group) {
      return;
    }

    const optionIdsInGroup = group.options.map((option) => option.modifierOptionId);

    setPendingSelection((current) => {
      if (current.includes(optionId)) {
        return current.filter((id) => id !== optionId);
      }

      if (group.maxSelect === 1) {
        return [...current.filter((id) => !optionIdsInGroup.includes(id)), optionId];
      }

      if (group.maxSelect !== null) {
        const countInGroup = current.filter((id) => optionIdsInGroup.includes(id)).length;
        if (countInGroup >= group.maxSelect) {
          return current;
        }
      }

      return [...current, optionId];
    });
  };

  const confirmModifierSelection = (item: MenuItemDetail) => {
    const existingQuantity = getCartQuantity(cart, item.menuItemId, pendingSelection);
    setCart((lines) =>
      setCartQuantity(lines, item, existingQuantity + 1, pendingSelection)
    );
    closeModifierPicker();
  };

  const removeCartLine = (line: CartLine) => {
    setCart((lines) =>
      setCartQuantity(lines, line.item, 0, line.selectedModifierOptionIds)
    );
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
          ...(line.selectedModifierOptionIds.length
            ? { modifierOptionIds: line.selectedModifierOptionIds }
            : {}),
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

        {!isMenuLoading && !hasMenuError && publishedMenuId ? (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <TextInput
              type="search"
              placeholder={t("addOrderSearchPlaceholder")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        ) : null}

        <div className="max-h-[45vh] overflow-y-auto rounded-2xl border border-border/60 bg-background/40 p-3">
          {isMenuLoading ? (
            <div className="space-y-3 p-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : hasMenuError ? (
            <p className="p-3 text-sm text-destructive">{t("addOrderMenuError")}</p>
          ) : !publishedMenuId ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <UtensilsCrossed className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("addOrderMenuEmpty")}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <Search className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("addOrderSearchEmpty")}</p>
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
                      const hasModifiers = item.modifierGroups.length > 0;
                      const quantity = hasModifiers
                        ? getItemTotalQuantity(cart, item.menuItemId)
                        : getCartQuantity(cart, item.menuItemId);
                      const isPickerOpen = modifierPickerItemId === item.menuItemId;
                      const canConfirm =
                        !hasModifiers || isModifierSelectionValid(item, pendingSelection);

                      return (
                        <li
                          key={item.menuItemId}
                          className={cn(
                            "px-1 py-2.5",
                            !item.isAvailable && "opacity-50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatMoney(item.price, "CLP")}
                                {quantity > 0 ? ` · ${t("addOrderItemInCart", { count: quantity })}` : ""}
                              </p>
                            </div>

                            {!item.isAvailable ? (
                              <Badge variant="outline">{t("tableStatus_DISABLED")}</Badge>
                            ) : hasModifiers ? (
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                className="rounded-full"
                                aria-label={item.name}
                                onClick={() =>
                                  isPickerOpen ? closeModifierPicker() : openModifierPicker(item)
                                }
                              >
                                <Plus />
                              </Button>
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
                          </div>

                          {isPickerOpen ? (
                            <div className="mt-3 space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-3.5">
                              {item.modifierGroups.map((group) => (
                                <div key={group.modifierGroupId}>
                                  <p className="text-xs font-semibold text-foreground">
                                    {group.name}
                                    {group.isRequired ? (
                                      <span className="ml-1 text-destructive">*</span>
                                    ) : null}
                                  </p>
                                  <ul className="mt-1.5 space-y-1">
                                    {group.options.map((option) => {
                                      const checked = pendingSelection.includes(
                                        option.modifierOptionId
                                      );
                                      const priceDelta = Number(option.priceDelta);

                                      return (
                                        <li key={option.modifierOptionId}>
                                          <label
                                            className={cn(
                                              "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-sm",
                                              checked
                                                ? "border-primary/50 bg-card"
                                                : "border-transparent"
                                            )}
                                          >
                                            <span className="flex items-center gap-2">
                                              <input
                                                type={group.maxSelect === 1 ? "radio" : "checkbox"}
                                                checked={checked}
                                                disabled={!option.isAvailable}
                                                onChange={() =>
                                                  toggleModifierOption(
                                                    item,
                                                    group.modifierGroupId,
                                                    option.modifierOptionId
                                                  )
                                                }
                                                className="cursor-pointer accent-primary"
                                              />
                                              {option.name}
                                            </span>
                                            {priceDelta !== 0 ? (
                                              <span className="text-xs text-muted-foreground">
                                                {priceDelta > 0 ? "+" : ""}
                                                {formatMoney(priceDelta, "CLP")}
                                              </span>
                                            ) : null}
                                          </label>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              ))}

                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-full"
                                  onClick={closeModifierPicker}
                                >
                                  {t("addOrderCancel")}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="rounded-full"
                                  disabled={!canConfirm}
                                  onClick={() => confirmModifierSelection(item)}
                                >
                                  <Plus className="size-3.5" />
                                  {t("addOrderModifierConfirm")}
                                </Button>
                              </div>
                            </div>
                          ) : null}
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
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("addOrderCartTitle")}
              </p>

              <ul className="space-y-1.5">
                {cart.map((line) => {
                  const modifierSummary = lineModifierSummary(line);

                  return (
                    <li
                      key={`${line.item.menuItemId}-${line.selectedModifierOptionIds.join(",")}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-semibold tabular-nums">{line.quantity}×</span>{" "}
                        {line.item.name}
                        {modifierSummary ? (
                          <span className="text-xs text-muted-foreground"> ({modifierSummary})</span>
                        ) : null}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {formatMoney(getLineUnitPrice(line) * line.quantity, "CLP")}
                        <button
                          type="button"
                          aria-label={t("addOrderRemoveLine")}
                          onClick={() => removeCartLine(line)}
                          className="cursor-pointer text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <p className="text-sm text-foreground">
                  {t("addOrderTotal")}: {formatMoney(cartTotal, "CLP")}
                </p>
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
