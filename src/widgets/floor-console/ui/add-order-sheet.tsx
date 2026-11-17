"use client";

import { useMemo, useRef, useState } from "react";
import { CategoryHeading } from "@/shared/ui/category-heading";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, UtensilsCrossed, X } from "lucide-react";
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
  getLineModifierSummary,
  getLineUnitPrice,
  isModifierSelectionValid,
  toggleModifierOption as toggleModifierOptionInSelection,
  setCartQuantity,
  type CartLine,
} from "@/shared/lib/cart";
import { formatMoney } from "@/shared/lib/format";
import {
  buildVisibleCategoryTree,
  flattenCategoryTree,
} from "@/shared/lib/menu-tree";
import type { MenuItemDetail, ModifierGroup } from "@/shared/types/menu";
import {
  FieldGroup,
  FieldLabel,
  NumberStepper,
  TextArea,
  TextInput,
} from "@/shared/ui/form-controls";
import { ModifierGroupsPicker } from "@/shared/ui/modifier-groups-picker";

type AddOrderSheetProps = {
  accessToken: string;
  branchId: string;
  tableSessionId: string;
  counterTicketNumber?: number;
  onClose: () => void;
};

export function AddOrderSheet({
  accessToken,
  branchId,
  tableSessionId,
  counterTicketNumber,
  onClose,
}: AddOrderSheetProps) {
  const t = useTranslations("FloorConsole");
  const queryClient = useQueryClient();
  const popupRef = useRef<HTMLDivElement>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modifierPickerItemId, setModifierPickerItemId] = useState<
    string | null
  >(null);
  const [pendingSelection, setPendingSelection] = useState<string[]>([]);

  const menusQuery = useQuery({
    queryKey: ["orders", "publishable-menus", accessToken, branchId],
    queryFn: () => menusApi.listMenus(accessToken, branchId),
  });

  const publishedMenuId = menusQuery.data?.find(
    (menu) => menu.status === "PUBLISHED",
  )?.menuId;

  const menuDetailQuery = useQuery({
    queryKey: [
      "orders",
      "publishable-menu-detail",
      accessToken,
      publishedMenuId,
    ],
    queryFn: () =>
      menusApi.getMenuDetail(accessToken, publishedMenuId as string),
    enabled: Boolean(publishedMenuId),
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const categories = useMemo(() => {
    const allCategories = menuDetailQuery.data?.categories ?? [];
    const searched = normalizedSearch
      ? allCategories.map((category) => ({
          ...category,
          items: category.items.filter((item) =>
            item.name.toLowerCase().includes(normalizedSearch),
          ),
        }))
      : allCategories;

    return flattenCategoryTree(buildVisibleCategoryTree(searched));
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

  const toggleModifierOption = (group: ModifierGroup, optionId: string) => {
    setPendingSelection((current) =>
      toggleModifierOptionInSelection(group, current, optionId),
    );
  };

  const confirmModifierSelection = (item: MenuItemDetail) => {
    const existingQuantity = getCartQuantity(
      cart,
      item.menuItemId,
      pendingSelection,
    );
    setCart((lines) =>
      setCartQuantity(lines, item, existingQuantity + 1, pendingSelection),
    );
    closeModifierPicker();
  };

  const removeCartLine = (line: CartLine) => {
    setCart((lines) =>
      setCartQuantity(lines, line.item, 0, line.selectedModifierOptionIds),
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
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["billing", "current-bill"],
        }),
        queryClient.invalidateQueries({ queryKey: ["orders", "session"] }),
        queryClient.invalidateQueries({
          queryKey: ["floor", "counter-sessions"],
        }),
        queryClient.invalidateQueries({ queryKey: ["billing", "open-bills"] }),
        queryClient.invalidateQueries({
          queryKey: ["orders", "branch-ready-summary"],
        }),
      ]);
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("addOrderError"));
    },
  });

  const isMenuLoading =
    menusQuery.isPending ||
    (Boolean(publishedMenuId) && menuDetailQuery.isPending);
  const hasMenuError = menusQuery.isError || menuDetailQuery.isError;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={popupRef}
        initialFocus={popupRef}
        className="max-h-[94dvh] max-w-5xl gap-5 overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {counterTicketNumber === undefined
              ? t("addOrderTitle")
              : t("addOrderCounterTitle", { ticket: counterTicketNumber })}
          </DialogTitle>
          <DialogDescription>
            {counterTicketNumber === undefined
              ? t("addOrderDescription")
              : t("addOrderCounterDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="grid min-w-0 content-start gap-3">
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

            <div className="max-h-[45vh] overflow-y-auto lg:max-h-[62vh] rounded-2xl border border-border/60 bg-background/40 p-3">
              {isMenuLoading ? (
                <div className="space-y-3 p-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : hasMenuError ? (
                <p className="p-3 text-sm text-destructive">
                  {t("addOrderMenuError")}
                </p>
              ) : !publishedMenuId ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center">
                  <UtensilsCrossed className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t("addOrderMenuEmpty")}
                  </p>
                </div>
              ) : categories.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center">
                  <Search className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {t("addOrderSearchEmpty")}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {categories.map((category) => (
                    <div key={category.menuCategoryId}>
                      <CategoryHeading
                        depth={category.depth}
                        className={cn(
                          "px-1 text-sm font-semibold tracking-wide text-muted-foreground",
                          category.depth === 0 && "uppercase",
                        )}
                        style={{ paddingLeft: category.depth * 14 + 4 }}
                      >
                        {category.name}
                      </CategoryHeading>
                      <ul
                        className="mt-1 divide-y divide-border/50"
                        style={{ marginLeft: category.depth * 14 }}
                      >
                        {category.items.map((item) => {
                          const hasModifiers = item.modifierGroups.length > 0;
                          const quantity = hasModifiers
                            ? getItemTotalQuantity(cart, item.menuItemId)
                            : getCartQuantity(cart, item.menuItemId);
                          const isPickerOpen =
                            modifierPickerItemId === item.menuItemId;
                          const canConfirm =
                            !hasModifiers ||
                            isModifierSelectionValid(item, pendingSelection);

                          return (
                            <li
                              key={item.menuItemId}
                              className={cn(
                                "px-1 py-2.5",
                                !item.isAvailable && "opacity-50",
                              )}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatMoney(item.price, "CLP")}
                                    {quantity > 0
                                      ? ` · ${t("addOrderItemInCart", { count: quantity })}`
                                      : ""}
                                  </p>
                                </div>

                                {!item.isAvailable ? (
                                  <Badge variant="outline">
                                    {t("tableStatus_DISABLED")}
                                  </Badge>
                                ) : hasModifiers ? (
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="outline"
                                    className="rounded-full"
                                    aria-label={item.name}
                                    onClick={() =>
                                      isPickerOpen
                                        ? closeModifierPicker()
                                        : openModifierPicker(item)
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
                                  <NumberStepper
                                    value={quantity}
                                    onChange={(next) =>
                                      handleSetQuantity(item, next)
                                    }
                                    min={0}
                                  />
                                )}
                              </div>

                              {isPickerOpen ? (
                                <div className="mt-3 space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-3.5">
                                  <ModifierGroupsPicker
                                    item={item}
                                    selectedIds={pendingSelection}
                                    onToggle={(group, optionId) =>
                                      toggleModifierOption(group, optionId)
                                    }
                                  />

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
                                      onClick={() =>
                                        confirmModifierSelection(item)
                                      }
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
          </div>
          <div className="grid min-w-0 content-start gap-4">
            <FieldGroup>
              <FieldLabel htmlFor="add-order-notes">
                {t("addOrderNotesLabel")}
              </FieldLabel>
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
                <p className="text-sm text-muted-foreground">
                  {t("addOrderCartEmpty")}
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("addOrderCartTitle")}
                  </p>

                  <ul className="space-y-1.5">
                    {cart.map((line) => {
                      const modifierSummary = getLineModifierSummary(line);

                      return (
                        <li
                          key={`${line.item.menuItemId}-${line.selectedModifierOptionIds.join(",")}`}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            <span className="font-semibold tabular-nums">
                              {line.quantity}×
                            </span>{" "}
                            {line.item.name}
                            {modifierSummary ? (
                              <span className="text-xs text-muted-foreground">
                                {" "}
                                ({modifierSummary})
                              </span>
                            ) : null}
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            {formatMoney(
                              getLineUnitPrice(line) * line.quantity,
                              "CLP",
                            )}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
