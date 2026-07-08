"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  LayoutList,
  PackagePlus,
  Pencil,
  Rocket,
  UtensilsCrossed,
  EyeOff,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/shared/lib/format";
import type {
  CreateMenuCategoryRequest,
  CreateMenuItemRequest,
  MenuCategoryDetail,
  MenuCategoryStatus,
  MenuDetail,
  MenuItemDetail,
  MenuItemType,
  PreparationStation,
  UpdateMenuCategoryRequest,
  UpdateMenuItemRequest,
} from "@/shared/types/menu";
import {
  CheckboxRow,
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { EmptyHint } from "./studio-primitives";

const ITEM_TYPES: MenuItemType[] = [
  "FOOD",
  "DRINK",
  "DESSERT",
  "PACKAGED",
  "SERVICE",
];

type CategoryFormValues = {
  name: string;
};

type ItemFormValues = {
  name: string;
  description: string;
  price: string;
  itemType: MenuItemType;
  preparationStationId: string;
  isAvailable: boolean;
};

const CATEGORY_STATUSES: MenuCategoryStatus[] = ["ACTIVE", "HIDDEN", "ARCHIVED"];

type MenuEditorPanelProps = {
  menu: MenuDetail | null;
  stations: PreparationStation[];
  isLoading: boolean;
  isAddingCategory: boolean;
  isAddingItem: boolean;
  isUpdatingCategory: boolean;
  isUpdatingItem: boolean;
  isPublishing: boolean;
  onAddCategory: (menuId: string, payload: CreateMenuCategoryRequest) => void;
  onAddItem: (menuCategoryId: string, payload: CreateMenuItemRequest) => void;
  onUpdateCategory: (
    menuCategoryId: string,
    payload: UpdateMenuCategoryRequest
  ) => void;
  onUpdateItem: (menuItemId: string, payload: UpdateMenuItemRequest) => void;
  onPublish: (menuId: string) => void;
};

export function MenuEditorPanel({
  menu,
  stations,
  isLoading,
  isAddingCategory,
  isAddingItem,
  isUpdatingCategory,
  isUpdatingItem,
  isPublishing,
  onAddCategory,
  onAddItem,
  onUpdateCategory,
  onUpdateItem,
  onPublish,
}: MenuEditorPanelProps) {
  const t = useTranslations("MenuStudio");

  const categoryForm = useForm<CategoryFormValues>({
    defaultValues: { name: "" },
  });

  const isDraft = menu?.status === "DRAFT";
  const activeStations = stations.filter((station) => station.status === "ACTIVE");
  const hasPublishableContent = Boolean(
    menu?.categories.some(
      (category) => category.status === "ACTIVE" && category.items.length > 0
    )
  );

  if (isLoading) {
    return (
      <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
        <CardContent className="space-y-5 p-6">
          <span className="sr-only">{t("editorLoading")}</span>
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-32 w-full rounded-[1.6rem]" />
          <Skeleton className="h-32 w-full rounded-[1.6rem]" />
        </CardContent>
      </Card>
    );
  }

  if (!menu) {
    return (
      <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
        <CardContent className="p-6">
          <EmptyHint>{t("editorEmpty")}</EmptyHint>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <LayoutList className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em]">
                {t("editorEyebrow")}
              </p>
            </div>
            <CardTitle className="mt-2 text-2xl">{menu.name}</CardTitle>
            <CardDescription className="mt-1 leading-7">
              {isDraft ? t("editorDraftDescription") : t("editorReadonlyDescription")}
            </CardDescription>
          </div>

          {isDraft ? (
            <div className="flex flex-col items-end gap-2">
              <Button
                type="button"
                size="lg"
                className="rounded-full"
                disabled={!hasPublishableContent || isPublishing}
                onClick={() => onPublish(menu.menuId)}
              >
                {isPublishing ? <Spinner /> : <Rocket className="size-4" />}
                {isPublishing ? t("publishSubmitting") : t("publishSubmit")}
              </Button>
              {!hasPublishableContent ? (
                <p className="max-w-52 text-right text-xs leading-5 text-muted-foreground">
                  {t("publishBlockedHint")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {menu.categories.length ? (
          <div className="space-y-5">
            {menu.categories.map((category) => (
              <CategorySection
                key={category.menuCategoryId}
                category={category}
                canEdit={isDraft}
                stations={activeStations}
                isAddingItem={isAddingItem}
                isUpdatingCategory={isUpdatingCategory}
                isUpdatingItem={isUpdatingItem}
                onAddItem={onAddItem}
                onUpdateCategory={onUpdateCategory}
                onUpdateItem={onUpdateItem}
              />
            ))}
          </div>
        ) : (
          <EmptyHint>{t("categoriesEmpty")}</EmptyHint>
        )}

        {isDraft ? (
          <form
            onSubmit={categoryForm.handleSubmit((values) => {
              onAddCategory(menu.menuId, {
                name: values.name.trim(),
                sortOrder: menu.categories.length,
              });
              categoryForm.reset({ name: "" });
            })}
            className="flex flex-wrap items-end gap-4 rounded-[1.5rem] border border-border/70 bg-background/50 p-4"
          >
            <FieldGroup className="min-w-56 flex-1">
              <FieldLabel htmlFor="category-name">{t("categoryNameLabel")}</FieldLabel>
              <TextInput
                id="category-name"
                placeholder={t("categoryNamePlaceholder")}
                disabled={isAddingCategory}
                {...categoryForm.register("name", { required: true })}
              />
            </FieldGroup>

            <Button type="submit" className="rounded-full" disabled={isAddingCategory}>
              {isAddingCategory ? (
                <>
                  <Spinner />
                  {t("categorySubmitting")}
                </>
              ) : (
                t("categorySubmit")
              )}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

type CategoryEditFormValues = {
  name: string;
  status: MenuCategoryStatus;
};

type CategorySectionProps = {
  category: MenuCategoryDetail;
  canEdit: boolean;
  stations: PreparationStation[];
  isAddingItem: boolean;
  isUpdatingCategory: boolean;
  isUpdatingItem: boolean;
  onAddItem: (menuCategoryId: string, payload: CreateMenuItemRequest) => void;
  onUpdateCategory: (
    menuCategoryId: string,
    payload: UpdateMenuCategoryRequest
  ) => void;
  onUpdateItem: (menuItemId: string, payload: UpdateMenuItemRequest) => void;
};

function CategorySection({
  category,
  canEdit,
  stations,
  isAddingItem,
  isUpdatingCategory,
  isUpdatingItem,
  onAddItem,
  onUpdateCategory,
  onUpdateItem,
}: CategorySectionProps) {
  const t = useTranslations("MenuStudio");
  const [isFormOpen, setFormOpen] = useState(false);
  const [isEditingCategory, setEditingCategory] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemDetail | null>(null);

  const itemForm = useForm<ItemFormValues>({
    defaultValues: {
      name: "",
      description: "",
      price: "",
      itemType: "FOOD",
      preparationStationId: stations[0]?.preparationStationId ?? "",
      isAvailable: true,
    },
  });

  const categoryEditForm = useForm<CategoryEditFormValues>({
    defaultValues: { name: category.name, status: category.status },
  });

  return (
    <section className="rounded-[1.6rem] border border-border/70 bg-background/55 p-5">
      {isEditingCategory ? (
        <form
          onSubmit={categoryEditForm.handleSubmit((values) => {
            onUpdateCategory(category.menuCategoryId, {
              name: values.name.trim(),
              status: values.status,
            });
            setEditingCategory(false);
          })}
          className="grid gap-3 rounded-[1.25rem] border border-primary/20 bg-primary/5 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
        >
          <FieldGroup>
            <FieldLabel htmlFor={`category-edit-name-${category.menuCategoryId}`}>
              {t("categoryEditNameLabel")}
            </FieldLabel>
            <TextInput
              id={`category-edit-name-${category.menuCategoryId}`}
              disabled={isUpdatingCategory}
              {...categoryEditForm.register("name", { required: true })}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor={`category-edit-status-${category.menuCategoryId}`}>
              {t("categoryEditStatusLabel")}
            </FieldLabel>
            <SelectInput
              id={`category-edit-status-${category.menuCategoryId}`}
              disabled={isUpdatingCategory}
              {...categoryEditForm.register("status")}
            >
              {CATEGORY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`categoryStatus_${status}`)}
                </option>
              ))}
            </SelectInput>
          </FieldGroup>

          <Button type="submit" size="sm" className="rounded-full" disabled={isUpdatingCategory}>
            {isUpdatingCategory ? <Spinner /> : null}
            {t("categoryEditSave")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => {
              categoryEditForm.reset({ name: category.name, status: category.status });
              setEditingCategory(false);
            }}
          >
            {t("categoryEditCancel")}
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">{category.name}</h3>
            {category.status !== "ACTIVE" ? (
              <Badge variant="secondary" className="gap-1">
                <EyeOff className="size-3" />
                {t(`categoryStatus_${category.status}`)}
              </Badge>
            ) : null}
            {canEdit ? (
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                className="rounded-full"
                aria-label={t("categoryEditAction")}
                onClick={() => setEditingCategory(true)}
              >
                <Pencil />
              </Button>
            ) : null}
          </div>
          <Badge variant="outline">
            {t("categoryItemsCount", { count: category.items.length })}
          </Badge>
        </div>
      )}

      {category.items.length ? (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {category.items.map((item) => (
            <li
              key={item.menuItemId}
              className={cn(
                "rounded-[1.25rem] border border-border/70 bg-card/72 p-4",
                !item.isAvailable && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium">{item.name}</p>
                    {canEdit ? (
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        className="rounded-full"
                        aria-label={t("itemEditAction")}
                        onClick={() => setEditingItem(item)}
                      >
                        <Pencil />
                      </Button>
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 font-heading text-lg font-semibold text-primary">
                  {formatMoney(item.price, "CLP")}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">{t(`itemType_${item.itemType}`)}</Badge>
                <Badge variant="outline">
                  {item.preparationStation.name}
                </Badge>
                {!item.isAvailable ? (
                  <Badge className="border-0 bg-muted text-muted-foreground">
                    {t("itemUnavailable")}
                  </Badge>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-[1.25rem] border border-dashed border-border bg-background/45 p-4 text-sm text-muted-foreground">
          {t("categoryNoItems")}
        </div>
      )}

      {canEdit ? (
        <div className="mt-4">
          {isFormOpen ? (
            <form
              onSubmit={itemForm.handleSubmit((values) => {
                onAddItem(category.menuCategoryId, {
                  name: values.name.trim(),
                  description: values.description.trim() || undefined,
                  price: values.price.trim(),
                  itemType: values.itemType,
                  preparationStationId: values.preparationStationId,
                  isAvailable: values.isAvailable,
                });
                itemForm.reset({
                  name: "",
                  description: "",
                  price: "",
                  itemType: values.itemType,
                  preparationStationId: values.preparationStationId,
                  isAvailable: true,
                });
                setFormOpen(false);
              })}
              className="grid gap-4 rounded-[1.4rem] border border-primary/15 bg-primary/5 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {t("itemFormEyebrow", { category: category.name })}
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldGroup>
                  <FieldLabel htmlFor={`item-name-${category.menuCategoryId}`}>
                    {t("itemNameLabel")}
                  </FieldLabel>
                  <TextInput
                    id={`item-name-${category.menuCategoryId}`}
                    placeholder={t("itemNamePlaceholder")}
                    disabled={isAddingItem}
                    {...itemForm.register("name", { required: true })}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={`item-price-${category.menuCategoryId}`}>
                    {t("itemPriceLabel")}
                  </FieldLabel>
                  <TextInput
                    id={`item-price-${category.menuCategoryId}`}
                    type="number"
                    min={0}
                    step="1"
                    placeholder="5900"
                    disabled={isAddingItem}
                    {...itemForm.register("price", { required: true })}
                  />
                  <FieldHint>{t("itemPriceHint")}</FieldHint>
                </FieldGroup>

                <FieldGroup className="md:col-span-2">
                  <FieldLabel htmlFor={`item-description-${category.menuCategoryId}`}>
                    {t("itemDescriptionLabel")}
                  </FieldLabel>
                  <TextInput
                    id={`item-description-${category.menuCategoryId}`}
                    placeholder={t("itemDescriptionPlaceholder")}
                    disabled={isAddingItem}
                    {...itemForm.register("description")}
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={`item-type-${category.menuCategoryId}`}>
                    {t("itemTypeLabel")}
                  </FieldLabel>
                  <SelectInput
                    id={`item-type-${category.menuCategoryId}`}
                    disabled={isAddingItem}
                    {...itemForm.register("itemType")}
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(`itemType_${type}`)}
                      </option>
                    ))}
                  </SelectInput>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel htmlFor={`item-station-${category.menuCategoryId}`}>
                    {t("itemStationLabel")}
                  </FieldLabel>
                  <SelectInput
                    id={`item-station-${category.menuCategoryId}`}
                    disabled={isAddingItem || !stations.length}
                    {...itemForm.register("preparationStationId", { required: true })}
                  >
                    {stations.map((station) => (
                      <option
                        key={station.preparationStationId}
                        value={station.preparationStationId}
                      >
                        {station.name}
                      </option>
                    ))}
                  </SelectInput>
                  {!stations.length ? (
                    <FieldHint>{t("itemStationMissing")}</FieldHint>
                  ) : null}
                </FieldGroup>
              </div>

              <CheckboxRow>
                <input
                  type="checkbox"
                  className="size-4 cursor-pointer accent-primary"
                  disabled={isAddingItem}
                  {...itemForm.register("isAvailable")}
                />
                {t("itemAvailableLabel")}
              </CheckboxRow>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="rounded-full"
                  disabled={isAddingItem || !stations.length}
                >
                  {isAddingItem ? (
                    <Spinner />
                  ) : (
                    <UtensilsCrossed className="size-4" />
                  )}
                  {isAddingItem ? t("itemSubmitting") : t("itemSubmit")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setFormOpen(false)}
                >
                  {t("itemCancel")}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setFormOpen(true)}
            >
              <PackagePlus className="size-4" />
              {t("itemOpenForm")}
            </Button>
          )}
        </div>
      ) : null}

      {editingItem ? (
        <EditItemDialog
          item={editingItem}
          categoryName={category.name}
          stations={stations}
          isUpdating={isUpdatingItem}
          onClose={() => setEditingItem(null)}
          onSave={(payload) => {
            onUpdateItem(editingItem.menuItemId, payload);
            setEditingItem(null);
          }}
        />
      ) : null}
    </section>
  );
}

type EditItemFormValues = {
  name: string;
  description: string;
  price: string;
  sku: string;
  itemType: MenuItemType;
  preparationStationId: string;
  isAvailable: boolean;
};

type EditItemDialogProps = {
  item: MenuItemDetail;
  categoryName: string;
  stations: PreparationStation[];
  isUpdating: boolean;
  onClose: () => void;
  onSave: (payload: UpdateMenuItemRequest) => void;
};

function EditItemDialog({
  item,
  categoryName,
  stations,
  isUpdating,
  onClose,
  onSave,
}: EditItemDialogProps) {
  const t = useTranslations("MenuStudio");

  const form = useForm<EditItemFormValues>({
    defaultValues: {
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      sku: item.sku ?? "",
      itemType: item.itemType,
      preparationStationId: item.preparationStation.preparationStationId,
      isAvailable: item.isAvailable,
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg gap-5">
        <DialogHeader>
          <DialogTitle>
            {t("itemEditFormEyebrow", { category: categoryName })}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) => {
            onSave({
              name: values.name.trim(),
              description: values.description.trim() || undefined,
              price: values.price.trim(),
              sku: values.sku.trim() || undefined,
              itemType: values.itemType,
              preparationStationId: values.preparationStationId,
              isAvailable: values.isAvailable,
            });
          })}
          className="grid gap-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup>
              <FieldLabel htmlFor="edit-item-name">{t("itemNameLabel")}</FieldLabel>
              <TextInput
                id="edit-item-name"
                disabled={isUpdating}
                {...form.register("name", { required: true })}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="edit-item-price">{t("itemPriceLabel")}</FieldLabel>
              <TextInput
                id="edit-item-price"
                type="number"
                min={0}
                step="1"
                disabled={isUpdating}
                {...form.register("price", { required: true })}
              />
              <FieldHint>{t("itemPriceHint")}</FieldHint>
            </FieldGroup>

            <FieldGroup className="md:col-span-2">
              <FieldLabel htmlFor="edit-item-description">
                {t("itemDescriptionLabel")}
              </FieldLabel>
              <TextInput
                id="edit-item-description"
                disabled={isUpdating}
                {...form.register("description")}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="edit-item-type">{t("itemTypeLabel")}</FieldLabel>
              <SelectInput
                id="edit-item-type"
                disabled={isUpdating}
                {...form.register("itemType")}
              >
                {ITEM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`itemType_${type}`)}
                  </option>
                ))}
              </SelectInput>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="edit-item-station">
                {t("itemStationLabel")}
              </FieldLabel>
              <SelectInput
                id="edit-item-station"
                disabled={isUpdating || !stations.length}
                {...form.register("preparationStationId", { required: true })}
              >
                {stations.map((station) => (
                  <option
                    key={station.preparationStationId}
                    value={station.preparationStationId}
                  >
                    {station.name}
                  </option>
                ))}
              </SelectInput>
            </FieldGroup>
          </div>

          <CheckboxRow>
            <input
              type="checkbox"
              className="size-4 cursor-pointer accent-primary"
              disabled={isUpdating}
              {...form.register("isAvailable")}
            />
            {t("itemAvailableLabel")}
          </CheckboxRow>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              className="rounded-full"
              disabled={isUpdating || !stations.length}
            >
              {isUpdating ? <Spinner /> : null}
              {isUpdating ? t("itemUpdateSubmitting") : t("itemUpdateSubmit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={onClose}
            >
              {t("itemCancel")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
