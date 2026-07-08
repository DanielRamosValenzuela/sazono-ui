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

export interface MenuItemDetail {
  menuItemId: string;
  name: string;
  description: string | null;
  price: string;
  sku: string | null;
  itemType: MenuItemType;
  isAvailable: boolean;
  preparationStation: PreparationStationSummary;
}

export interface MenuCategoryDetail {
  menuCategoryId: string;
  name: string;
  sortOrder: number;
  status: MenuCategoryStatus;
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
}
