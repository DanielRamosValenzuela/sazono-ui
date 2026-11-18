import type {
  MenuItemDetail,
  ModifierGroup,
  ModifierOption,
} from "@/shared/types/menu";

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

export interface FlatModifierOption {
  option: ModifierOption;
  path: string[];
  isLeaf: boolean;
}

export function flattenOptions(groups: ModifierGroup[]): ModifierOption[] {
  return groups.flatMap((group) =>
    group.options.flatMap((option) => [
      option,
      ...flattenOptions(option.childGroups ?? []),
    ])
  );
}

function collectSelected(
  groups: ModifierGroup[],
  selectedIds: string[],
  parentPath: string[]
): FlatModifierOption[] {
  return groups.flatMap((group) =>
    group.options
      .filter((option) => selectedIds.includes(option.modifierOptionId))
      .flatMap((option) => {
        const path = [...parentPath, option.name];
        const children = collectSelected(option.childGroups ?? [], selectedIds, path);
        const hasChildren = children.length > 0;
        return [{ option, path, isLeaf: !hasChildren }, ...children];
      })
  );
}

export function getLineUnitPrice(line: CartLine) {
  const priceDelta = collectSelected(
    line.item.modifierGroups,
    line.selectedModifierOptionIds,
    []
  ).reduce((total, entry) => total + Number(entry.option.priceDelta), 0);

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

function areGroupsValid(groups: ModifierGroup[], selectedIds: string[]): boolean {
  return groups.every((group) => {
    const selected = group.options.filter((option) =>
      selectedIds.includes(option.modifierOptionId)
    );

    if (selected.length < getGroupEffectiveMin(group)) {
      return false;
    }

    if (group.maxSelect !== null && selected.length > group.maxSelect) {
      return false;
    }

    return selected.every((option) =>
      areGroupsValid(option.childGroups ?? [], selectedIds)
    );
  });
}

export function isModifierSelectionValid(item: MenuItemDetail, selectedIds: string[]) {
  return areGroupsValid(item.modifierGroups, selectedIds);
}

export function getFirstMissingGroup(
  groups: ModifierGroup[],
  selectedIds: string[]
): ModifierGroup | null {
  for (const group of groups) {
    const selected = group.options.filter((option) =>
      selectedIds.includes(option.modifierOptionId)
    );

    if (selected.length < getGroupEffectiveMin(group)) {
      return group;
    }

    for (const option of selected) {
      const missing = getFirstMissingGroup(option.childGroups ?? [], selectedIds);
      if (missing) {
        return missing;
      }
    }
  }

  return null;
}

function withoutDescendants(option: ModifierOption, ids: string[]) {
  const descendants = new Set(
    flattenOptions(option.childGroups ?? []).map((child) => child.modifierOptionId)
  );
  return ids.filter((id) => !descendants.has(id));
}

export function toggleModifierOption(
  group: ModifierGroup,
  current: string[],
  optionId: string
) {
  const option = group.options.find((candidate) => candidate.modifierOptionId === optionId);

  if (current.includes(optionId)) {
    const remaining = current.filter((id) => id !== optionId);
    return option ? withoutDescendants(option, remaining) : remaining;
  }

  const optionIdsInGroup = group.options.map((candidate) => candidate.modifierOptionId);

  if (isSingleChoiceGroup(group)) {
    const replaced = group.options.reduce(
      (ids, candidate) =>
        ids.includes(candidate.modifierOptionId)
          ? withoutDescendants(candidate, ids.filter((id) => id !== candidate.modifierOptionId))
          : ids,
      current
    );
    return [...replaced, optionId];
  }

  if (group.maxSelect !== null) {
    const countInGroup = current.filter((id) => optionIdsInGroup.includes(id)).length;
    if (countInGroup >= group.maxSelect) {
      return current;
    }
  }

  return [...current, optionId];
}

export function getLineModifierPaths(line: CartLine) {
  return collectSelected(line.item.modifierGroups, line.selectedModifierOptionIds, [])
    .filter((entry) => entry.isLeaf)
    .map((entry) => entry.path.join(" > "));
}

export function getLineModifierSummary(line: CartLine) {
  return getLineModifierPaths(line).join(", ");
}

export function getSelectionUnitPrice(item: MenuItemDetail, selectedIds: string[]) {
  return getLineUnitPrice({ item, quantity: 1, selectedModifierOptionIds: selectedIds });
}
