export type MenuStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type MenuCategoryStatus = "ACTIVE" | "HIDDEN" | "ARCHIVED";

export type MenuItemType =
  | "FOOD"
  | "DRINK"
  | "DESSERT"
  | "PACKAGED"
  | "SERVICE";

export type PreparationStationType =
  | "KITCHEN"
  | "BAR"
  | "DESSERT"
  | "COFFEE"
  | "OTHER";

export type PreparationStationStatus = "ACTIVE" | "INACTIVE";

export interface PreparationStation {
  preparationStationId: string;
  branchId: string;
  name: string;
  stationType: PreparationStationType;
  status: PreparationStationStatus;
}

export interface PreparationStationSummary {
  preparationStationId: string;
  name: string;
  stationType: PreparationStationType;
  status: PreparationStationStatus;
}

export interface MenuSummary {
  menuId: string;
  branchId: string;
  name: string;
  status: MenuStatus;
  version: number;
  defaultLanguage: string;
  publishedAt: string | null;
  isDefaultMenu: boolean;
  categoryCount: number;
  itemCount: number;
}

export interface MenuTranslation {
  locale: string;
  name: string;
  description: string | null;
}

export type ModifierSelectionType = "ONE" | "MANY";

export interface ModifierOption {
  modifierOptionId: string;
  name: string;
  priceDelta: string;
  isAvailable: boolean;
  sortOrder: number;
}

export interface ModifierGroup {
  modifierGroupId: string;
  branchId: string;
  name: string;
  selectionType: ModifierSelectionType;
  minSelect: number;
  maxSelect: number | null;
  isRequired: boolean;
  sortOrder: number;
  options: ModifierOption[];
}

export interface MenuItemDetail {
  menuItemId: string;
  name: string;
  description: string | null;
  price: string;
  sku: string | null;
  itemType: MenuItemType;
  isAvailable: boolean;
  sortOrder: number;
  imageUrl: string | null;
  translations: MenuTranslation[];
  preparationStation: PreparationStationSummary;
  modifierGroups: ModifierGroup[];
}

export interface MenuCategoryDetail {
  menuCategoryId: string;
  name: string;
  sortOrder: number;
  status: MenuCategoryStatus;
  translations: MenuTranslation[];
  items: MenuItemDetail[];
}

export interface MenuDetail {
  menuId: string;
  branchId: string;
  name: string;
  status: MenuStatus;
  version: number;
  defaultLanguage: string;
  publishedAt: string | null;
  isDefaultMenu: boolean;
  categories: MenuCategoryDetail[];
}

export interface MenuCategory {
  menuCategoryId: string;
  menuId: string;
  name: string;
  sortOrder: number;
  status: MenuCategoryStatus;
}

export interface CreatePreparationStationRequest {
  branchId: string;
  name: string;
  stationType: PreparationStationType;
}

export interface CreateMenuRequest {
  branchId: string;
  name: string;
  defaultLanguage: string;
}

export interface CreateMenuCategoryRequest {
  name: string;
  sortOrder?: number;
}

export interface CreateMenuItemRequest {
  name: string;
  description?: string;
  price: string;
  sku?: string;
  itemType: MenuItemType;
  preparationStationId: string;
  isAvailable?: boolean;
}

export interface CreatedMenuItem extends MenuItemDetail {
  menuCategoryId: string;
}

export interface UpdateMenuCategoryRequest {
  name?: string;
  sortOrder?: number;
  status?: MenuCategoryStatus;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: string;
  sku?: string;
  itemType?: MenuItemType;
  preparationStationId?: string;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface ReorderMenuCategoriesRequest {
  orderedCategoryIds: string[];
}

export interface ReorderMenuItemsRequest {
  orderedItemIds: string[];
}

export interface UpsertCategoryTranslationRequest {
  name: string;
}

export interface UpsertItemTranslationRequest {
  name: string;
  description?: string;
}

export interface CreateModifierGroupRequest {
  branchId: string;
  name: string;
  selectionType: ModifierSelectionType;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
}

export interface UpdateModifierGroupRequest {
  name?: string;
  selectionType?: ModifierSelectionType;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
}

export interface CreateModifierOptionRequest {
  name: string;
  priceDelta?: string;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface UpdateModifierOptionRequest {
  name?: string;
  priceDelta?: string;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface SetMenuItemModifierGroupsRequest {
  modifierGroupIds: string[];
}
