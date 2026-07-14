"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  GripVertical,
  Image as ImageIcon,
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
  UpsertCategoryTranslationRequest,
  UpsertItemTranslationRequest,
} from "@/shared/types/menu";
import {
  CheckboxRow,
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { MenuView } from "@/widgets/qr-experience/ui/menu-view";
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

type MutationCallbacks = { onSuccess?: () => void };

type MenuEditorPanelProps = {
  menu: MenuDetail | null;
  stations: PreparationStation[];
  isLoading: boolean;
  isAddingCategory: boolean;
  isAddingItem: boolean;
  isUpdatingCategory: boolean;
  isUpdatingItem: boolean;
  isReorderingCategories: boolean;
  isReorderingItems: boolean;
  isUploadingItemImage: boolean;
  isRemovingItemImage: boolean;
  isUpsertingCategoryTranslation: boolean;
  isUpsertingItemTranslation: boolean;
  isPublishing: boolean;
  onAddCategory: (menuId: string, payload: CreateMenuCategoryRequest) => void;
  onAddItem: (
    menuCategoryId: string,
    payload: CreateMenuItemRequest,
    options?: MutationCallbacks
  ) => void;
  onUpdateCategory: (
    menuCategoryId: string,
    payload: UpdateMenuCategoryRequest,
    options?: MutationCallbacks
  ) => void;
  onUpdateItem: (
    menuItemId: string,
    payload: UpdateMenuItemRequest,
    options?: MutationCallbacks
  ) => void;
  onReorderCategories: (menuId: string, orderedCategoryIds: string[]) => void;
  onReorderItems: (menuCategoryId: string, orderedItemIds: string[]) => void;
  onUploadItemImage: (menuItemId: string, file: File) => void;
  onRemoveItemImage: (menuItemId: string) => void;
  onUpsertCategoryTranslation: (
    menuCategoryId: string,
    locale: string,
    payload: UpsertCategoryTranslationRequest,
    options?: MutationCallbacks
  ) => void;
  onUpsertItemTranslation: (
    menuItemId: string,
    locale: string,
    payload: UpsertItemTranslationRequest
  ) => void;
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
  isReorderingCategories,
  isReorderingItems,
  isUploadingItemImage,
  isRemovingItemImage,
  isUpsertingCategoryTranslation,
  isUpsertingItemTranslation,
  isPublishing,
  onAddCategory,
  onAddItem,
  onUpdateCategory,
  onUpdateItem,
  onReorderCategories,
  onReorderItems,
  onUploadItemImage,
  onRemoveItemImage,
  onUpsertCategoryTranslation,
  onUpsertItemTranslation,
  onPublish,
}: MenuEditorPanelProps) {
  const t = useTranslations("MenuStudio");
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );
  const targetLocale = menu?.defaultLanguage === "en" ? "es" : "en";

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

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!menu || !over || active.id === over.id) {
      return;
    }

    const oldIndex = menu.categories.findIndex(
      (category) => category.menuCategoryId === active.id
    );
    const newIndex = menu.categories.findIndex(
      (category) => category.menuCategoryId === over.id
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = arrayMove(menu.categories, oldIndex, newIndex);
    onReorderCategories(
      menu.menuId,
      reordered.map((category) => category.menuCategoryId)
    );
  };

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

          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="size-4" />
                {t("previewOpen")}
              </Button>
              {isDraft ? (
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
              ) : null}
            </div>
            {isDraft && !hasPublishableContent ? (
              <p className="max-w-52 text-right text-xs leading-5 text-muted-foreground">
                {t("publishBlockedHint")}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {menu.categories.length ? (
          <DndContext
            sensors={categorySensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCategoryDragEnd}
          >
            <SortableContext
              items={menu.categories.map((category) => category.menuCategoryId)}
              strategy={verticalListSortingStrategy}
            >
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
                    isReorderingItems={isReorderingItems}
                    isDraggingDisabled={isReorderingCategories}
                    isUploadingItemImage={isUploadingItemImage}
                    isRemovingItemImage={isRemovingItemImage}
                    isUpsertingCategoryTranslation={isUpsertingCategoryTranslation}
                    isUpsertingItemTranslation={isUpsertingItemTranslation}
                    targetLocale={targetLocale}
                    onAddItem={onAddItem}
                    onUpdateCategory={onUpdateCategory}
                    onUpdateItem={onUpdateItem}
                    onReorderItems={onReorderItems}
                    onUploadItemImage={onUploadItemImage}
                    onRemoveItemImage={onRemoveItemImage}
                    onUpsertCategoryTranslation={onUpsertCategoryTranslation}
                    onUpsertItemTranslation={onUpsertItemTranslation}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

      <Dialog open={isPreviewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md gap-0 overflow-y-auto p-0 sm:max-h-[85vh]">
          <DialogHeader className="border-b border-border/60 p-5 pb-4">
            <DialogTitle>{t("previewTitle")}</DialogTitle>
          </DialogHeader>
          <MenuView menu={menu} readOnly />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

type CategoryEditFormValues = {
  name: string;
  status: MenuCategoryStatus;
  translatedName: string;
};

type CategorySectionProps = {
  category: MenuCategoryDetail;
  canEdit: boolean;
  stations: PreparationStation[];
  isAddingItem: boolean;
  isUpdatingCategory: boolean;
  isUpdatingItem: boolean;
  isReorderingItems: boolean;
  isDraggingDisabled: boolean;
  isUploadingItemImage: boolean;
  isRemovingItemImage: boolean;
  isUpsertingCategoryTranslation: boolean;
  isUpsertingItemTranslation: boolean;
  targetLocale: string;
  onAddItem: (
    menuCategoryId: string,
    payload: CreateMenuItemRequest,
    options?: MutationCallbacks
  ) => void;
  onUpdateCategory: (
    menuCategoryId: string,
    payload: UpdateMenuCategoryRequest,
    options?: MutationCallbacks
  ) => void;
  onUpdateItem: (
    menuItemId: string,
    payload: UpdateMenuItemRequest,
    options?: MutationCallbacks
  ) => void;
  onReorderItems: (menuCategoryId: string, orderedItemIds: string[]) => void;
  onUploadItemImage: (menuItemId: string, file: File) => void;
  onRemoveItemImage: (menuItemId: string) => void;
  onUpsertCategoryTranslation: (
    menuCategoryId: string,
    locale: string,
    payload: UpsertCategoryTranslationRequest,
    options?: MutationCallbacks
  ) => void;
  onUpsertItemTranslation: (
    menuItemId: string,
    locale: string,
    payload: UpsertItemTranslationRequest
  ) => void;
};

function CategorySection({
  category,
  canEdit,
  stations,
  isAddingItem,
  isUpdatingCategory,
  isUpdatingItem,
  isReorderingItems,
  isDraggingDisabled,
  isUploadingItemImage,
  isRemovingItemImage,
  isUpsertingCategoryTranslation,
  isUpsertingItemTranslation,
  targetLocale,
  onAddItem,
  onUpdateCategory,
  onUpdateItem,
  onReorderItems,
  onUploadItemImage,
  onRemoveItemImage,
  onUpsertCategoryTranslation,
  onUpsertItemTranslation,
}: CategorySectionProps) {
  const t = useTranslations("MenuStudio");
  const [isFormOpen, setFormOpen] = useState(false);
  const [isEditingCategory, setEditingCategory] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemDetail | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.menuCategoryId,
    disabled: !canEdit || isDraggingDisabled,
  });

  const itemSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = category.items.findIndex(
      (item) => item.menuItemId === active.id
    );
    const newIndex = category.items.findIndex(
      (item) => item.menuItemId === over.id
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reordered = arrayMove(category.items, oldIndex, newIndex);
    onReorderItems(
      category.menuCategoryId,
      reordered.map((item) => item.menuItemId)
    );
  };

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

  const existingCategoryTranslation = category.translations.find(
    (translation) => translation.locale === targetLocale
  );

  const categoryEditForm = useForm<CategoryEditFormValues>({
    defaultValues: {
      name: category.name,
      status: category.status,
      translatedName: existingCategoryTranslation?.name ?? "",
    },
  });

  return (
    <section
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="rounded-[1.6rem] border border-border/70 bg-background/55 p-5"
    >
      {isEditingCategory ? (
        <form
          onSubmit={categoryEditForm.handleSubmit((values) => {
            const translatedName = values.translatedName.trim();
            let categoryDone = false;
            let translationDone = !translatedName;
            const closeIfDone = () => {
              if (categoryDone && translationDone) {
                setEditingCategory(false);
              }
            };

            onUpdateCategory(
              category.menuCategoryId,
              {
                name: values.name.trim(),
                status: values.status,
              },
              {
                onSuccess: () => {
                  categoryDone = true;
                  closeIfDone();
                },
              }
            );

            if (translatedName) {
              onUpsertCategoryTranslation(
                category.menuCategoryId,
                targetLocale,
                { name: translatedName },
                {
                  onSuccess: () => {
                    translationDone = true;
                    closeIfDone();
                  },
                }
              );
            }
          })}
          className="grid gap-3 rounded-[1.25rem] border border-primary/20 bg-primary/5 p-4"
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

          <div className="grid gap-3 sm:grid-cols-2">
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

            <FieldGroup>
              <FieldLabel
                htmlFor={`category-edit-translated-name-${category.menuCategoryId}`}
              >
                {t("translationSectionTitle", { locale: targetLocale })}
              </FieldLabel>
              <TextInput
                id={`category-edit-translated-name-${category.menuCategoryId}`}
                placeholder={t("translationNameLabel")}
                disabled={isUpdatingCategory || isUpsertingCategoryTranslation}
                {...categoryEditForm.register("translatedName")}
              />
            </FieldGroup>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              size="sm"
              className="rounded-full"
              disabled={isUpdatingCategory || isUpsertingCategoryTranslation}
            >
              {isUpdatingCategory || isUpsertingCategoryTranslation ? (
                <Spinner />
              ) : null}
              {t("categoryEditSave")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                categoryEditForm.reset({
                  name: category.name,
                  status: category.status,
                  translatedName: existingCategoryTranslation?.name ?? "",
                });
                setEditingCategory(false);
              }}
            >
              {t("categoryEditCancel")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {canEdit ? (
              <button
                type="button"
                className="cursor-grab touch-none rounded-full p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                aria-label={t("categoryDragHandle")}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="size-4" />
              </button>
            ) : null}
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
        <DndContext
          sensors={itemSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleItemDragEnd}
        >
          <SortableContext
            items={category.items.map((item) => item.menuItemId)}
            strategy={rectSortingStrategy}
          >
            <ul className="mt-4 grid gap-3 lg:grid-cols-2">
              {category.items.map((item) => (
                <SortableItemCard
                  key={item.menuItemId}
                  item={item}
                  canEdit={canEdit}
                  isDraggingDisabled={isReorderingItems}
                  onEdit={() => setEditingItem(item)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
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
                const { itemType, preparationStationId } = values;
                onAddItem(
                  category.menuCategoryId,
                  {
                    name: values.name.trim(),
                    description: values.description.trim() || undefined,
                    price: values.price.trim(),
                    itemType,
                    preparationStationId,
                    isAvailable: values.isAvailable,
                  },
                  {
                    onSuccess: () => {
                      itemForm.reset({
                        name: "",
                        description: "",
                        price: "",
                        itemType,
                        preparationStationId,
                        isAvailable: true,
                      });
                      setFormOpen(false);
                    },
                  }
                );
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
          item={
            category.items.find(
              (item) => item.menuItemId === editingItem.menuItemId
            ) ?? editingItem
          }
          categoryName={category.name}
          stations={stations}
          isUpdating={isUpdatingItem}
          isUploadingImage={isUploadingItemImage}
          isRemovingImage={isRemovingItemImage}
          isUpsertingTranslation={isUpsertingItemTranslation}
          targetLocale={targetLocale}
          onClose={() => setEditingItem(null)}
          onSave={(payload) => {
            onUpdateItem(editingItem.menuItemId, payload, {
              onSuccess: () => setEditingItem(null),
            });
          }}
          onUploadImage={(file) => onUploadItemImage(editingItem.menuItemId, file)}
          onRemoveImage={() => onRemoveItemImage(editingItem.menuItemId)}
          onUpsertTranslation={(locale, payload) =>
            onUpsertItemTranslation(editingItem.menuItemId, locale, payload)
          }
        />
      ) : null}
    </section>
  );
}

type SortableItemCardProps = {
  item: MenuItemDetail;
  canEdit: boolean;
  isDraggingDisabled: boolean;
  onEdit: () => void;
};

function SortableItemCard({
  item,
  canEdit,
  isDraggingDisabled,
  onEdit,
}: SortableItemCardProps) {
  const t = useTranslations("MenuStudio");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.menuItemId,
    disabled: !canEdit || isDraggingDisabled,
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className={cn(
        "rounded-[1.25rem] border border-border/70 bg-card/72 p-4",
        !item.isAvailable && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-xl object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              {canEdit ? (
                <button
                  type="button"
                  className="cursor-grab touch-none rounded-full p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                  aria-label={t("itemDragHandle")}
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="size-3.5" />
                </button>
              ) : null}
              <p className="font-medium">{item.name}</p>
              {canEdit ? (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="rounded-full"
                  aria-label={t("itemEditAction")}
                  onClick={onEdit}
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
        </div>
        <p className="shrink-0 font-heading text-lg font-semibold text-primary">
          {formatMoney(item.price, "CLP")}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary">{t(`itemType_${item.itemType}`)}</Badge>
        <Badge variant="outline">{item.preparationStation.name}</Badge>
        {!item.isAvailable ? (
          <Badge className="border-0 bg-muted text-muted-foreground">
            {t("itemUnavailable")}
          </Badge>
        ) : null}
      </div>
    </li>
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
  translatedName: string;
  translatedDescription: string;
};

type EditItemDialogProps = {
  item: MenuItemDetail;
  categoryName: string;
  stations: PreparationStation[];
  isUpdating: boolean;
  isUploadingImage: boolean;
  isRemovingImage: boolean;
  isUpsertingTranslation: boolean;
  targetLocale: string;
  onClose: () => void;
  onSave: (payload: UpdateMenuItemRequest) => void;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
  onUpsertTranslation: (
    locale: string,
    payload: UpsertItemTranslationRequest
  ) => void;
};

function EditItemDialog({
  item,
  categoryName,
  stations,
  isUpdating,
  isUploadingImage,
  isRemovingImage,
  isUpsertingTranslation,
  targetLocale,
  onClose,
  onSave,
  onUploadImage,
  onRemoveImage,
  onUpsertTranslation,
}: EditItemDialogProps) {
  const t = useTranslations("MenuStudio");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const existingTranslation = item.translations.find(
    (translation) => translation.locale === targetLocale
  );

  const form = useForm<EditItemFormValues>({
    defaultValues: {
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      sku: item.sku ?? "",
      itemType: item.itemType,
      translatedName: existingTranslation?.name ?? "",
      translatedDescription: existingTranslation?.description ?? "",
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

        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-muted">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt=""
                width={80}
                height={80}
                className="size-full object-cover"
              />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-medium">{t("itemImageLabel")}</p>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onUploadImage(file);
                }
                event.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={isUploadingImage}
                onClick={() => imageInputRef.current?.click()}
              >
                {isUploadingImage ? <Spinner /> : null}
                {item.imageUrl ? t("itemImageReplace") : t("itemImageUpload")}
              </Button>
              {item.imageUrl ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  disabled={isRemovingImage}
                  onClick={onRemoveImage}
                >
                  {isRemovingImage ? <Spinner /> : null}
                  {t("itemImageRemove")}
                </Button>
              ) : null}
            </div>
            <FieldHint>{t("itemImageHint")}</FieldHint>
          </div>
        </div>

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

            const translatedName = values.translatedName.trim();
            if (translatedName) {
              onUpsertTranslation(targetLocale, {
                name: translatedName,
                description: values.translatedDescription.trim() || undefined,
              });
            }
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

          <div className="grid gap-4 rounded-[1.25rem] border border-border/70 bg-background/50 p-4 md:grid-cols-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground md:col-span-2">
              {t("translationSectionTitle", { locale: targetLocale })}
            </p>

            <FieldGroup>
              <FieldLabel htmlFor="edit-item-translated-name">
                {t("translationNameLabel")}
              </FieldLabel>
              <TextInput
                id="edit-item-translated-name"
                disabled={isUpdating || isUpsertingTranslation}
                {...form.register("translatedName")}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="edit-item-translated-description">
                {t("translationDescriptionLabel")}
              </FieldLabel>
              <TextInput
                id="edit-item-translated-description"
                disabled={isUpdating || isUpsertingTranslation}
                {...form.register("translatedDescription")}
              />
            </FieldGroup>

            <FieldHint className="md:col-span-2">{t("translationHint")}</FieldHint>
          </div>

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
