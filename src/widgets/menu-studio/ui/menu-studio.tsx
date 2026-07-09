"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotebookPen } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSessionStore } from "@/features/admin-session/model/admin-session.store";
import { authApi } from "@/shared/api/auth-api";
import { ApiError } from "@/shared/api/http-client";
import { menusApi } from "@/shared/api/menus-api";
import { useClientReady } from "@/shared/lib/use-client-ready";
import type { AuthenticatedProfile } from "@/shared/types/auth";
import type {
  CreateMenuCategoryRequest,
  CreateMenuItemRequest,
  CreateMenuRequest,
  CreatePreparationStationRequest,
  ReorderMenuCategoriesRequest,
  ReorderMenuItemsRequest,
  UpdateMenuCategoryRequest,
  UpdateMenuItemRequest,
  UpsertCategoryTranslationRequest,
  UpsertItemTranslationRequest,
} from "@/shared/types/menu";
import { FieldGroup, FieldHint, FieldLabel, SelectInput } from "@/shared/ui/form-controls";
import { MenuEditorPanel } from "./menu-editor-panel";
import { MenuVersionsPanel } from "./menu-versions-panel";
import { StationsPanel } from "./stations-panel";
import { InlineError, NoticeCard } from "./studio-primitives";

interface AdminBranch {
  branchId: string;
  branchName: string;
}

function getAdminBranches(profile: AuthenticatedProfile): AdminBranch[] {
  const branchMap = new Map<string, AdminBranch>();

  for (const branchRole of profile.branchRoles) {
    if (branchRole.role !== "ADMIN") {
      continue;
    }

    branchMap.set(branchRole.branchId, {
      branchId: branchRole.branchId,
      branchName: branchRole.branchName,
    });
  }

  return Array.from(branchMap.values()).sort((left, right) =>
    left.branchName.localeCompare(right.branchName)
  );
}

export function MenuStudio() {
  const t = useTranslations("MenuStudio");
  const queryClient = useQueryClient();
  const isClientReady = useClientReady();
  const accessToken = useAdminSessionStore((state) => state.accessToken);
  const storedUser = useAdminSessionStore((state) => state.user);
  const syncUser = useAdminSessionStore((state) => state.syncUser);
  const clearSession = useAdminSessionStore((state) => state.clearSession);

  const { data: currentUserData } = useQuery({
    queryKey: ["staff", "me", accessToken],
    enabled: isClientReady && Boolean(accessToken),
    retry: false,
    initialData: storedUser ?? undefined,
    queryFn: async () => {
      try {
        const nextUser = await authApi.getCurrentUser(accessToken!);
        syncUser(nextUser);
        return nextUser;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
        }

        throw error;
      }
    },
  });

  const currentUser = currentUserData ?? storedUser;
  const adminBranches = useMemo(
    () => (currentUser ? getAdminBranches(currentUser) : []),
    [currentUser]
  );

  const [rawSelectedBranchId, setSelectedBranchId] = useState("");
  const selectedBranchId = adminBranches.some(
    (branch) => branch.branchId === rawSelectedBranchId
  )
    ? rawSelectedBranchId
    : adminBranches[0]?.branchId ?? "";

  const [rawSelectedMenuId, setSelectedMenuId] = useState("");

  const canQuery =
    isClientReady && Boolean(accessToken) && Boolean(selectedBranchId);

  const {
    data: stationsData,
    isLoading: isStationsLoading,
    isError: isStationsError,
    error: stationsError,
  } = useQuery({
    queryKey: ["menus", "stations", accessToken, selectedBranchId],
    enabled: canQuery,
    retry: false,
    queryFn: () => menusApi.listPreparationStations(accessToken!, selectedBranchId),
  });

  const {
    data: menusData,
    isLoading: isMenusLoading,
    isError: isMenusError,
    error: menusError,
  } = useQuery({
    queryKey: ["menus", "list", accessToken, selectedBranchId],
    enabled: canQuery,
    retry: false,
    queryFn: () => menusApi.listMenus(accessToken!, selectedBranchId),
  });

  const stations = useMemo(() => stationsData ?? [], [stationsData]);
  const menus = useMemo(() => menusData ?? [], [menusData]);

  const selectedMenuId =
    rawSelectedMenuId ||
    menus.find((menu) => menu.status === "DRAFT")?.menuId ||
    menus[0]?.menuId ||
    "";

  const { data: menuDetail, isLoading: isMenuDetailLoading } = useQuery({
    queryKey: ["menus", "detail", accessToken, selectedMenuId],
    enabled: canQuery && Boolean(selectedMenuId),
    retry: false,
    queryFn: () => menusApi.getMenuDetail(accessToken!, selectedMenuId),
  });

  const invalidateMenus = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["menus", "list"] }),
      queryClient.invalidateQueries({ queryKey: ["menus", "detail"] }),
    ]);

  const createStationMutation = useMutation({
    mutationFn: (payload: CreatePreparationStationRequest) =>
      menusApi.createPreparationStation(accessToken!, payload),
    onSuccess: (station) => {
      void queryClient.invalidateQueries({ queryKey: ["menus", "stations"] });
      toast.success(t("stationCreateSuccess", { name: station.name }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("stationCreateError"));
    },
  });

  const createMenuMutation = useMutation({
    mutationFn: (payload: CreateMenuRequest) =>
      menusApi.createMenu(accessToken!, payload),
    onSuccess: (menu) => {
      setSelectedMenuId(menu.menuId);
      void invalidateMenus();
      toast.success(t("versionCreateSuccess", { name: menu.name }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("versionCreateError"));
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: ({
      menuId,
      payload,
    }: {
      menuId: string;
      payload: CreateMenuCategoryRequest;
    }) => menusApi.createMenuCategory(accessToken!, menuId, payload),
    onSuccess: (category) => {
      void invalidateMenus();
      toast.success(t("categorySuccess", { name: category.name }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("categoryError"));
    },
  });

  const createItemMutation = useMutation({
    mutationFn: ({
      menuCategoryId,
      payload,
    }: {
      menuCategoryId: string;
      payload: CreateMenuItemRequest;
    }) => menusApi.createMenuItem(accessToken!, menuCategoryId, payload),
    onSuccess: (item) => {
      void invalidateMenus();
      toast.success(t("itemSuccess", { name: item.name }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("itemError"));
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      menuCategoryId,
      payload,
    }: {
      menuCategoryId: string;
      payload: UpdateMenuCategoryRequest;
    }) => menusApi.updateMenuCategory(accessToken!, menuCategoryId, payload),
    onSuccess: (category) => {
      void invalidateMenus();
      toast.success(t("categoryUpdateSuccess", { name: category.name }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("categoryUpdateError"));
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      menuItemId,
      payload,
    }: {
      menuItemId: string;
      payload: UpdateMenuItemRequest;
    }) => menusApi.updateMenuItem(accessToken!, menuItemId, payload),
    onSuccess: (item) => {
      void invalidateMenus();
      toast.success(t("itemUpdateSuccess", { name: item.name }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("itemUpdateError"));
    },
  });

  const reorderCategoriesMutation = useMutation({
    mutationFn: ({
      menuId,
      payload,
    }: {
      menuId: string;
      payload: ReorderMenuCategoriesRequest;
    }) => menusApi.reorderMenuCategories(accessToken!, menuId, payload),
    onSuccess: () => {
      void invalidateMenus();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("categoryReorderError"));
    },
  });

  const reorderItemsMutation = useMutation({
    mutationFn: ({
      menuCategoryId,
      payload,
    }: {
      menuCategoryId: string;
      payload: ReorderMenuItemsRequest;
    }) => menusApi.reorderMenuItems(accessToken!, menuCategoryId, payload),
    onSuccess: () => {
      void invalidateMenus();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("itemReorderError"));
    },
  });

  const uploadItemImageMutation = useMutation({
    mutationFn: ({
      menuItemId,
      file,
    }: {
      menuItemId: string;
      file: File;
    }) => menusApi.uploadMenuItemImage(accessToken!, menuItemId, file),
    onSuccess: () => {
      void invalidateMenus();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("itemImageUploadError"));
    },
  });

  const removeItemImageMutation = useMutation({
    mutationFn: (menuItemId: string) =>
      menusApi.removeMenuItemImage(accessToken!, menuItemId),
    onSuccess: () => {
      void invalidateMenus();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("itemImageRemoveError"));
    },
  });

  const upsertCategoryTranslationMutation = useMutation({
    mutationFn: ({
      menuCategoryId,
      locale,
      payload,
    }: {
      menuCategoryId: string;
      locale: string;
      payload: UpsertCategoryTranslationRequest;
    }) =>
      menusApi.upsertMenuCategoryTranslation(
        accessToken!,
        menuCategoryId,
        locale,
        payload
      ),
    onSuccess: () => {
      void invalidateMenus();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("categoryTranslationError")
      );
    },
  });

  const upsertItemTranslationMutation = useMutation({
    mutationFn: ({
      menuItemId,
      locale,
      payload,
    }: {
      menuItemId: string;
      locale: string;
      payload: UpsertItemTranslationRequest;
    }) =>
      menusApi.upsertMenuItemTranslation(accessToken!, menuItemId, locale, payload),
    onSuccess: () => {
      void invalidateMenus();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("itemTranslationError")
      );
    },
  });

  const publishMenuMutation = useMutation({
    mutationFn: (menuId: string) => menusApi.publishMenu(accessToken!, menuId),
    onSuccess: (menu) => {
      void invalidateMenus();
      toast.success(t("publishSuccess", { name: menu.name }));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("publishError"));
    },
  });

  if (!isClientReady) {
    return (
      <Card className="rounded-[1.75rem] border-border/70 bg-card/82 shadow-lg shadow-primary/8">
        <CardContent className="space-y-3 p-6">
          <span className="sr-only">{t("preparing")}</span>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!accessToken || !currentUser) {
    return (
      <NoticeCard
        title={t("requireLoginTitle")}
        description={t("requireLoginDescription")}
        actionHref="/admin"
        actionLabel={t("goAdmin")}
      />
    );
  }

  if (currentUser.profileType !== "staff") {
    return (
      <NoticeCard
        title={t("wrongProfileTitle")}
        description={t("wrongProfileDescription")}
        actionHref="/admin"
        actionLabel={t("goAdmin")}
      />
    );
  }

  if (!adminBranches.length) {
    return (
      <NoticeCard
        title={t("noAdminRoleTitle")}
        description={t("noAdminRoleDescription")}
        actionHref="/staff"
        actionLabel={t("goStaff")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.9rem] border border-border/70 bg-card/86 shadow-xl shadow-primary/10 backdrop-blur">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">
                {t("workspaceBadge")}
              </Badge>
              <Badge variant="outline">
                {currentUser.firstName} {currentUser.lastName}
              </Badge>
            </div>

            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                {t("workspaceTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                {t("workspaceDescription")}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <NotebookPen className="size-4 text-primary" />
              {t("workspaceFlow")}
            </div>
          </div>

          <FieldGroup className="self-center">
            <FieldLabel htmlFor="menu-branch">{t("branchLabel")}</FieldLabel>
            <SelectInput
              id="menu-branch"
              value={selectedBranchId}
              onChange={(event) => {
                setSelectedBranchId(event.target.value);
                setSelectedMenuId("");
              }}
            >
              {adminBranches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </SelectInput>
            <FieldHint>{t("branchHint")}</FieldHint>
          </FieldGroup>
        </CardContent>
      </Card>

      {isStationsError ? (
        <InlineError
          title={t("stationsErrorTitle")}
          description={
            stationsError instanceof Error
              ? stationsError.message
              : t("stationsErrorDescription")
          }
        />
      ) : null}

      {isMenusError ? (
        <InlineError
          title={t("versionsErrorTitle")}
          description={
            menusError instanceof Error
              ? menusError.message
              : t("versionsErrorDescription")
          }
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-6">
          <StationsPanel
            branchId={selectedBranchId}
            stations={stations}
            isLoading={isStationsLoading}
            isCreating={createStationMutation.isPending}
            onCreate={(payload) => createStationMutation.mutate(payload)}
          />

          <MenuVersionsPanel
            branchId={selectedBranchId}
            menus={menus}
            selectedMenuId={selectedMenuId}
            isLoading={isMenusLoading}
            isCreating={createMenuMutation.isPending}
            onSelect={setSelectedMenuId}
            onCreate={(payload) => createMenuMutation.mutate(payload)}
          />
        </div>

        <MenuEditorPanel
          menu={menuDetail ?? null}
          stations={stations}
          isLoading={isMenuDetailLoading && Boolean(selectedMenuId)}
          isAddingCategory={createCategoryMutation.isPending}
          isAddingItem={createItemMutation.isPending}
          isUpdatingCategory={updateCategoryMutation.isPending}
          isUpdatingItem={updateItemMutation.isPending}
          isReorderingCategories={reorderCategoriesMutation.isPending}
          isReorderingItems={reorderItemsMutation.isPending}
          isUploadingItemImage={uploadItemImageMutation.isPending}
          isRemovingItemImage={removeItemImageMutation.isPending}
          isUpsertingCategoryTranslation={upsertCategoryTranslationMutation.isPending}
          isUpsertingItemTranslation={upsertItemTranslationMutation.isPending}
          isPublishing={publishMenuMutation.isPending}
          onAddCategory={(menuId, payload) =>
            createCategoryMutation.mutate({ menuId, payload })
          }
          onAddItem={(menuCategoryId, payload) =>
            createItemMutation.mutate({ menuCategoryId, payload })
          }
          onUpdateCategory={(menuCategoryId, payload) =>
            updateCategoryMutation.mutate({ menuCategoryId, payload })
          }
          onUpdateItem={(menuItemId, payload) =>
            updateItemMutation.mutate({ menuItemId, payload })
          }
          onReorderCategories={(menuId, orderedCategoryIds) =>
            reorderCategoriesMutation.mutate({
              menuId,
              payload: { orderedCategoryIds },
            })
          }
          onReorderItems={(menuCategoryId, orderedItemIds) =>
            reorderItemsMutation.mutate({
              menuCategoryId,
              payload: { orderedItemIds },
            })
          }
          onUploadItemImage={(menuItemId, file) =>
            uploadItemImageMutation.mutate({ menuItemId, file })
          }
          onRemoveItemImage={(menuItemId) =>
            removeItemImageMutation.mutate(menuItemId)
          }
          onUpsertCategoryTranslation={(menuCategoryId, locale, payload) =>
            upsertCategoryTranslationMutation.mutate({
              menuCategoryId,
              locale,
              payload,
            })
          }
          onUpsertItemTranslation={(menuItemId, locale, payload) =>
            upsertItemTranslationMutation.mutate({ menuItemId, locale, payload })
          }
          onPublish={(menuId) => publishMenuMutation.mutate(menuId)}
        />
      </section>
    </div>
  );
}
