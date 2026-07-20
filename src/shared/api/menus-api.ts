import { apiRequest } from "@/shared/api/http-client";
import type {
  CreatedMenuItem,
  CreateMenuCategoryRequest,
  CreateMenuItemRequest,
  CreateMenuRequest,
  CreateModifierGroupRequest,
  CreateModifierOptionRequest,
  CreatePreparationStationRequest,
  MenuCategory,
  MenuDetail,
  MenuSummary,
  MenuTranslation,
  ModifierGroup,
  ModifierOption,
  PreparationStation,
  ReorderMenuCategoriesRequest,
  ReorderMenuItemsRequest,
  SetMenuItemModifierGroupsRequest,
  UpdateMenuCategoryRequest,
  UpdateMenuItemRequest,
  UpdateModifierGroupRequest,
  UpdateModifierOptionRequest,
  UpsertCategoryTranslationRequest,
  UpsertItemTranslationRequest,
} from "@/shared/types/menu";

export const menusApi = {
  listPreparationStations(token: string, branchId: string) {
    return apiRequest<PreparationStation[]>(
      `/menus/preparation-stations?branchId=${encodeURIComponent(branchId)}`,
      {
        token,
      }
    );
  },
  createPreparationStation(
    token: string,
    payload: CreatePreparationStationRequest
  ) {
    return apiRequest<PreparationStation>("/menus/preparation-stations", {
      method: "POST",
      token,
      body: payload,
    });
  },
  listMenus(token: string, branchId: string) {
    return apiRequest<MenuSummary[]>(
      `/menus?branchId=${encodeURIComponent(branchId)}`,
      {
        token,
      }
    );
  },
  createMenu(token: string, payload: CreateMenuRequest) {
    return apiRequest<MenuSummary>("/menus", {
      method: "POST",
      token,
      body: payload,
    });
  },
  getMenuDetail(token: string, menuId: string) {
    return apiRequest<MenuDetail>(`/menus/${menuId}`, {
      token,
    });
  },
  createMenuCategory(
    token: string,
    menuId: string,
    payload: CreateMenuCategoryRequest
  ) {
    return apiRequest<MenuCategory>(`/menus/${menuId}/categories`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  createMenuItem(
    token: string,
    menuCategoryId: string,
    payload: CreateMenuItemRequest
  ) {
    return apiRequest<CreatedMenuItem>(
      `/menus/categories/${menuCategoryId}/items`,
      {
        method: "POST",
        token,
        body: payload,
      }
    );
  },
  publishMenu(token: string, menuId: string) {
    return apiRequest<MenuDetail>(`/menus/${menuId}/publish`, {
      method: "POST",
      token,
    });
  },
  updateMenuCategory(
    token: string,
    menuCategoryId: string,
    payload: UpdateMenuCategoryRequest
  ) {
    return apiRequest<MenuCategory>(`/menus/categories/${menuCategoryId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  updateMenuItem(
    token: string,
    menuItemId: string,
    payload: UpdateMenuItemRequest
  ) {
    return apiRequest<CreatedMenuItem>(`/menus/items/${menuItemId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  reorderMenuCategories(
    token: string,
    menuId: string,
    payload: ReorderMenuCategoriesRequest
  ) {
    return apiRequest<{ reorderedCount: number }>(
      `/menus/${menuId}/categories/reorder`,
      {
        method: "PATCH",
        token,
        body: payload,
      }
    );
  },
  reorderMenuItems(
    token: string,
    menuCategoryId: string,
    payload: ReorderMenuItemsRequest
  ) {
    return apiRequest<{ reorderedCount: number }>(
      `/menus/categories/${menuCategoryId}/items/reorder`,
      {
        method: "PATCH",
        token,
        body: payload,
      }
    );
  },
  uploadMenuItemImage(token: string, menuItemId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<CreatedMenuItem>(`/menus/items/${menuItemId}/media`, {
      method: "POST",
      token,
      body: formData,
    });
  },
  removeMenuItemImage(token: string, menuItemId: string) {
    return apiRequest<CreatedMenuItem>(`/menus/items/${menuItemId}/media`, {
      method: "DELETE",
      token,
    });
  },
  upsertMenuCategoryTranslation(
    token: string,
    menuCategoryId: string,
    locale: string,
    payload: UpsertCategoryTranslationRequest
  ) {
    return apiRequest<MenuTranslation>(
      `/menus/categories/${menuCategoryId}/translations/${locale}`,
      {
        method: "PUT",
        token,
        body: payload,
      }
    );
  },
  upsertMenuItemTranslation(
    token: string,
    menuItemId: string,
    locale: string,
    payload: UpsertItemTranslationRequest
  ) {
    return apiRequest<MenuTranslation>(
      `/menus/items/${menuItemId}/translations/${locale}`,
      {
        method: "PUT",
        token,
        body: payload,
      }
    );
  },
  listModifierGroups(token: string, branchId: string) {
    return apiRequest<ModifierGroup[]>(
      `/menus/modifier-groups?branchId=${encodeURIComponent(branchId)}`,
      {
        token,
      }
    );
  },
  createModifierGroup(token: string, payload: CreateModifierGroupRequest) {
    return apiRequest<ModifierGroup>("/menus/modifier-groups", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateModifierGroup(
    token: string,
    modifierGroupId: string,
    payload: UpdateModifierGroupRequest
  ) {
    return apiRequest<ModifierGroup>(`/menus/modifier-groups/${modifierGroupId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  createModifierOption(
    token: string,
    modifierGroupId: string,
    payload: CreateModifierOptionRequest
  ) {
    return apiRequest<ModifierOption>(
      `/menus/modifier-groups/${modifierGroupId}/options`,
      {
        method: "POST",
        token,
        body: payload,
      }
    );
  },
  updateModifierOption(
    token: string,
    modifierOptionId: string,
    payload: UpdateModifierOptionRequest
  ) {
    return apiRequest<ModifierOption>(`/menus/modifier-options/${modifierOptionId}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  setMenuItemModifierGroups(
    token: string,
    menuItemId: string,
    payload: SetMenuItemModifierGroupsRequest
  ) {
    return apiRequest<ModifierGroup[]>(
      `/menus/items/${menuItemId}/modifier-groups`,
      {
        method: "PUT",
        token,
        body: payload,
      }
    );
  },
};
