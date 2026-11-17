import type { MenuCategoryStatus } from "@/shared/types/menu";

export const MAX_CATEGORY_DEPTH = 3;

type TreeCategory = { menuCategoryId: string; parentId: string | null };

type VisibleCategory = TreeCategory & {
  status: MenuCategoryStatus;
  sortOrder: number;
  items: unknown[];
};

export type CategoryNode<T extends TreeCategory> = T & {
  children: CategoryNode<T>[];
};

export type ParentOption = { id: string; name: string; depth: number };

export function buildCategoryTree<T extends TreeCategory>(
  categories: T[]
): CategoryNode<T>[] {
  const nodes = new Map<string, CategoryNode<T>>(
    categories.map((category) => [
      category.menuCategoryId,
      { ...category, children: [] },
    ])
  );
  const roots: CategoryNode<T>[] = [];

  for (const category of categories) {
    const node = nodes.get(category.menuCategoryId)!;
    const parent = category.parentId ? nodes.get(category.parentId) : undefined;
    (parent ? parent.children : roots).push(node);
  }

  return roots;
}

export function buildVisibleCategoryTree<T extends VisibleCategory>(
  categories: T[]
): CategoryNode<T>[] {
  const prune = (nodes: CategoryNode<T>[]): CategoryNode<T>[] =>
    nodes
      .filter((node) => node.status === "ACTIVE")
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((node) => ({ ...node, children: prune(node.children) }))
      .filter((node) => node.items.length > 0 || node.children.length > 0);

  return prune(buildCategoryTree(categories));
}

export type FlatCategory<T extends TreeCategory> = CategoryNode<T> & {
  depth: number;
};

export function flattenCategoryTree<T extends TreeCategory>(
  nodes: CategoryNode<T>[],
  depth = 0
): FlatCategory<T>[] {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenCategoryTree(node.children, depth + 1),
  ]);
}

export function hasPublishableContent<T extends VisibleCategory>(
  categories: T[]
) {
  return flattenCategoryTree(buildVisibleCategoryTree(categories)).some(
    (node) => node.items.length > 0
  );
}

function subtreeHeight<T extends TreeCategory>(node: CategoryNode<T>): number {
  return 1 + Math.max(0, ...node.children.map(subtreeHeight));
}

export function listParentOptions<T extends TreeCategory & { name: string }>(
  categories: T[],
  editingId: string | null
): ParentOption[] {
  const options: ParentOption[] = [];
  const editingHeight = (() => {
    if (!editingId) {
      return 1;
    }
    const editing = flattenCategoryTree(buildCategoryTree(categories)).find(
      (node) => node.menuCategoryId === editingId
    );
    return editing ? subtreeHeight(editing) : 1;
  })();

  const walk = (nodes: CategoryNode<T>[], depth: number) => {
    for (const node of nodes) {
      if (node.menuCategoryId === editingId) {
        continue;
      }
      if (depth + editingHeight <= MAX_CATEGORY_DEPTH) {
        options.push({ id: node.menuCategoryId, name: node.name, depth });
      }
      walk(node.children, depth + 1);
    }
  };

  walk(buildCategoryTree(categories), 1);

  return options;
}

export function reorderSiblings(
  categories: TreeCategory[],
  parentId: string | null,
  activeId: string,
  overId: string
) {
  const siblingIds = categories
    .filter((category) => category.parentId === parentId)
    .map((category) => category.menuCategoryId);
  const from = siblingIds.indexOf(activeId);
  const to = siblingIds.indexOf(overId);

  if (from === -1 || to === -1) {
    return null;
  }

  const moved = [...siblingIds];
  moved.splice(to, 0, ...moved.splice(from, 1));
  const siblingSet = new Set(siblingIds);
  let cursor = 0;

  return categories.map((category) =>
    siblingSet.has(category.menuCategoryId)
      ? moved[cursor++]
      : category.menuCategoryId
  );
}
