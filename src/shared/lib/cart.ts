import type { MenuItemDetail } from "@/shared/types/menu";

export interface CartLine {
  item: MenuItemDetail;
  quantity: number;
}

export function getCartQuantity(lines: CartLine[], menuItemId: string) {
  return lines.find((line) => line.item.menuItemId === menuItemId)?.quantity ?? 0;
}

export function getCartCount(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function getCartTotal(lines: CartLine[]) {
  return lines.reduce(
    (total, line) => total + Number(line.item.price) * line.quantity,
    0
  );
}

export function setCartQuantity(
  lines: CartLine[],
  item: MenuItemDetail,
  quantity: number
): CartLine[] {
  if (quantity <= 0) {
    return lines.filter((line) => line.item.menuItemId !== item.menuItemId);
  }

  const exists = lines.some((line) => line.item.menuItemId === item.menuItemId);

  if (!exists) {
    return [...lines, { item, quantity }];
  }

  return lines.map((line) =>
    line.item.menuItemId === item.menuItemId ? { ...line, quantity } : line
  );
}
