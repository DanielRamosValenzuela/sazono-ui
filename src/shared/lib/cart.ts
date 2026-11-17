import type { MenuItemDetail, ModifierGroup } from "@/shared/types/menu";

export interface CartLine {
  item: MenuItemDetail;
  quantity: number;
  selectedModifierOptionIds: string[];
}

function getLineKey(menuItemId: string, selectedModifierOptionIds: string[]) {
  return `${menuItemId}::${[...selectedModifierOptionIds].sort().join(",")}`;
}

export function getCartQuantity(
  lines: CartLine[],
  menuItemId: string,
  selectedModifierOptionIds: string[] = []
) {
  const key = getLineKey(menuItemId, selectedModifierOptionIds);
  return (
    lines.find(
      (line) => getLineKey(line.item.menuItemId, line.selectedModifierOptionIds) === key
    )?.quantity ?? 0
  );
}

export function getCartCount(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function getItemTotalQuantity(lines: CartLine[], menuItemId: string) {
  return lines
    .filter((line) => line.item.menuItemId === menuItemId)
    .reduce((total, line) => total + line.quantity, 0);
}

export function getLineUnitPrice(line: CartLine) {
  const priceDelta = line.item.modifierGroups
    .flatMap((group) => group.options)
    .filter((option) => line.selectedModifierOptionIds.includes(option.modifierOptionId))
    .reduce((total, option) => total + Number(option.priceDelta), 0);

  return Number(line.item.price) + priceDelta;
}

export function getCartTotal(lines: CartLine[]) {
  return lines.reduce(
    (total, line) => total + getLineUnitPrice(line) * line.quantity,
    0
  );
}

export function setCartQuantity(
  lines: CartLine[],
  item: MenuItemDetail,
  quantity: number,
  selectedModifierOptionIds: string[] = []
): CartLine[] {
  const key = getLineKey(item.menuItemId, selectedModifierOptionIds);

  if (quantity <= 0) {
    return lines.filter(
      (line) => getLineKey(line.item.menuItemId, line.selectedModifierOptionIds) !== key
    );
  }

  const exists = lines.some(
    (line) => getLineKey(line.item.menuItemId, line.selectedModifierOptionIds) === key
  );

  if (!exists) {
    return [...lines, { item, quantity, selectedModifierOptionIds }];
  }

  return lines.map((line) =>
    getLineKey(line.item.menuItemId, line.selectedModifierOptionIds) === key
      ? { ...line, quantity }
      : line
  );
}

export function isSingleChoiceGroup(group: ModifierGroup) {
  return group.selectionType === "ONE" || group.maxSelect === 1;
}

export function getGroupEffectiveMin(group: ModifierGroup) {
  return group.isRequired ? Math.max(group.minSelect, 1) : group.minSelect;
}

export function isModifierSelectionValid(item: MenuItemDetail, selectedIds: string[]) {
  return item.modifierGroups.every((group) => {
    const selectedInGroup = group.options.filter((option) =>
      selectedIds.includes(option.modifierOptionId)
    ).length;

    if (selectedInGroup < getGroupEffectiveMin(group)) {
      return false;
    }

    return group.maxSelect === null || selectedInGroup <= group.maxSelect;
  });
}

export function toggleModifierOption(
  group: ModifierGroup,
  current: string[],
  optionId: string
) {
  if (current.includes(optionId)) {
    return current.filter((id) => id !== optionId);
  }

  const optionIdsInGroup = group.options.map((option) => option.modifierOptionId);

  if (isSingleChoiceGroup(group)) {
    return [...current.filter((id) => !optionIdsInGroup.includes(id)), optionId];
  }

  if (group.maxSelect !== null) {
    const countInGroup = current.filter((id) => optionIdsInGroup.includes(id)).length;
    if (countInGroup >= group.maxSelect) {
      return current;
    }
  }

  return [...current, optionId];
}

export function getLineModifierSummary(line: CartLine) {
  return line.item.modifierGroups
    .flatMap((group) => group.options)
    .filter((option) => line.selectedModifierOptionIds.includes(option.modifierOptionId))
    .map((option) => option.name)
    .join(", ");
}

export function getSelectionUnitPrice(item: MenuItemDetail, selectedIds: string[]) {
  return getLineUnitPrice({ item, quantity: 1, selectedModifierOptionIds: selectedIds });
}
