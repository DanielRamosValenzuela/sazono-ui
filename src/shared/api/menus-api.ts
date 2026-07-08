import { apiRequest } from "@/shared/api/http-client";
import type {
  CreatedMenuItem,
  CreateMenuCategoryRequest,
  CreateMenuItemRequest,
  CreateMenuRequest,
  CreatePreparationStationRequest,
  MenuCategory,
  MenuDetail,
  MenuSummary,
  PreparationStation,
  UpdateMenuCategoryRequest,
  UpdateMenuItemRequest,
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
};
