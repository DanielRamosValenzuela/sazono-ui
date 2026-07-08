"use client";

import { useEffect, useMemo, useState } from "react";
import { CookingPot, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCartQuantity, type CartLine } from "@/shared/lib/cart";
import { formatMoney } from "@/shared/lib/format";
import type { MenuDetail, MenuItemDetail } from "@/shared/types/menu";

type MenuViewProps = {
  menu: MenuDetail;
  cart: CartLine[];
  onSetQuantity: (item: MenuItemDetail, quantity: number) => void;
};

function categoryAnchorId(menuCategoryId: string) {
  return `qr-category-${menuCategoryId}`;
}

export function MenuView({ menu, cart, onSetQuantity }: MenuViewProps) {
  const t = useTranslations("QrPage");

  const categories = useMemo(
    () =>
      menu.categories
        .filter(
          (category) => category.status === "ACTIVE" && category.items.length > 0
        )
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [menu.categories]
  );

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    categories[0]?.menuCategoryId ?? null
  );

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategoryId(entry.target.getAttribute("data-category-id"));
          }
        }
      },
      { rootMargin: "-96px 0px -70% 0px" }
    );

    for (const category of categories) {
      const section = document.getElementById(
        categoryAnchorId(category.menuCategoryId)
      );

      if (section) {
        observer.observe(section);
      }
    }

    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CookingPot className="size-6" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          {t("menu_empty_title")}
        </h2>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
          {t("menu_empty_description")}
        </p>
      </div>
    );
  }

  const scrollToCategory = (menuCategoryId: string) => {
    setActiveCategoryId(menuCategoryId);
    document
      .getElementById(categoryAnchorId(menuCategoryId))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <nav
        aria-label={t("tab_menu")}
        className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur"
      >
        <div className="flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category.menuCategoryId}
              type="button"
              onClick={() => scrollToCategory(category.menuCategoryId)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors",
                activeCategoryId === category.menuCategoryId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </nav>

      <div className="space-y-8 px-5 pt-6">
        {categories.map((category) => (
          <section
            key={category.menuCategoryId}
            id={categoryAnchorId(category.menuCategoryId)}
            data-category-id={category.menuCategoryId}
            className="scroll-mt-16"
          >
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {category.name}
              </h2>
              <span
                aria-hidden
                className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent"
              />
            </div>

            <ul className="mt-1 divide-y divide-border/60">
              {category.items.map((item) => {
                const quantity = getCartQuantity(cart, item.menuItemId);

                return (
                  <li
                    key={item.menuItemId}
                    className={cn("py-4", !item.isAvailable && "opacity-55")}
                  >
                    <div className="flex items-baseline gap-2.5">
                      <h3 className="text-[0.95rem] font-medium text-foreground">
                        {item.name}
                      </h3>
                      <span
                        aria-hidden
                        className="min-w-4 flex-1 self-end border-b border-dotted border-border"
                      />
                      <span className="font-heading text-base font-bold text-foreground">
                        {formatMoney(item.price, "CLP")}
                      </span>
                    </div>

                    {item.description ? (
                      <p className="mt-1 max-w-[34ch] text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}

                    <div className="mt-2.5 flex justify-end">
                      {!item.isAvailable ? (
                        <Badge variant="outline">{t("menu_unavailable")}</Badge>
                      ) : quantity === 0 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                          onClick={() => onSetQuantity(item, 1)}
                        >
                          <Plus data-icon="inline-start" />
                          {t("menu_add")}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-1 py-0.5">
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            className="rounded-full"
                            aria-label={t("menu_removeOne", { name: item.name })}
                            onClick={() => onSetQuantity(item, quantity - 1)}
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
                            aria-label={t("menu_addOne", { name: item.name })}
                            onClick={() => onSetQuantity(item, quantity + 1)}
                          >
                            <Plus />
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
