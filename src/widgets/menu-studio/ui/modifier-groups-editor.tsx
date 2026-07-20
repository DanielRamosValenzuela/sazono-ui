"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { menusApi } from "@/shared/api/menus-api";
import { formatMoney } from "@/shared/lib/format";
import type { MenuItemDetail, ModifierSelectionType } from "@/shared/types/menu";
import {
  CheckboxRow,
  FieldGroup,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";

type ModifierGroupsEditorProps = {
  branchId: string;
  accessToken: string;
  item: MenuItemDetail;
};

const SELECTION_TYPES: ModifierSelectionType[] = ["ONE", "MANY"];

export function ModifierGroupsEditor({
  branchId,
  accessToken,
  item,
}: ModifierGroupsEditorProps) {
  const t = useTranslations("MenuStudio");
  const queryClient = useQueryClient();
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupSelectionType, setNewGroupSelectionType] =
    useState<ModifierSelectionType>("ONE");
  const [newGroupRequired, setNewGroupRequired] = useState(false);
  const [addingOptionToGroupId, setAddingOptionToGroupId] = useState<string | null>(
    null
  );
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPriceDelta, setNewOptionPriceDelta] = useState("0");

  const groupsQuery = useQuery({
    queryKey: ["menus", "modifier-groups", accessToken, branchId],
    queryFn: () => menusApi.listModifierGroups(accessToken, branchId),
  });

  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["menus", "modifier-groups"] }),
      queryClient.invalidateQueries({ queryKey: ["menus", "detail"] }),
    ]);

  const attachedGroupIds = useMemo(
    () => new Set(item.modifierGroups.map((group) => group.modifierGroupId)),
    [item.modifierGroups]
  );

  const setGroupsMutation = useMutation({
    mutationFn: (modifierGroupIds: string[]) =>
      menusApi.setMenuItemModifierGroups(accessToken, item.menuItemId, {
        modifierGroupIds,
      }),
    onSuccess: () => {
      void invalidateAll();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("modifierAttachError"));
    },
  });

  const toggleGroup = (modifierGroupId: string, nextChecked: boolean) => {
    const nextIds = nextChecked
      ? [...attachedGroupIds, modifierGroupId]
      : [...attachedGroupIds].filter((id) => id !== modifierGroupId);
    setGroupsMutation.mutate(nextIds);
  };

  const createGroupMutation = useMutation({
    mutationFn: () =>
      menusApi.createModifierGroup(accessToken, {
        branchId,
        name: newGroupName.trim(),
        selectionType: newGroupSelectionType,
        isRequired: newGroupRequired,
        ...(newGroupSelectionType === "ONE" ? { maxSelect: 1 } : {}),
      }),
    onSuccess: async (group) => {
      setNewGroupName("");
      setNewGroupRequired(false);
      setIsCreatingGroup(false);
      await invalidateAll();
      toggleGroup(group.modifierGroupId, true);
      toast.success(t("modifierGroupCreateSuccess", { name: group.name }));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("modifierGroupCreateError")
      );
    },
  });

  const createOptionMutation = useMutation({
    mutationFn: (modifierGroupId: string) =>
      menusApi.createModifierOption(accessToken, modifierGroupId, {
        name: newOptionName.trim(),
        priceDelta: newOptionPriceDelta.trim() || "0",
      }),
    onSuccess: async () => {
      setNewOptionName("");
      setNewOptionPriceDelta("0");
      setAddingOptionToGroupId(null);
      await invalidateAll();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("modifierOptionCreateError")
      );
    },
  });

  const groups = groupsQuery.data ?? [];

  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t("modifierSectionTitle")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => setIsCreatingGroup((open) => !open)}
        >
          <Plus className="size-3.5" />
          {t("modifierCreateGroup")}
        </Button>
      </div>

      {isCreatingGroup ? (
        <div className="mt-3 grid gap-3 rounded-xl border border-border/70 bg-card p-3 sm:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="new-modifier-group-name">
              {t("modifierGroupNameLabel")}
            </FieldLabel>
            <TextInput
              id="new-modifier-group-name"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder={t("modifierGroupNamePlaceholder")}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="new-modifier-group-type">
              {t("modifierGroupTypeLabel")}
            </FieldLabel>
            <SelectInput
              id="new-modifier-group-type"
              value={newGroupSelectionType}
              onChange={(event) =>
                setNewGroupSelectionType(event.target.value as ModifierSelectionType)
              }
            >
              {SELECTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`modifierSelectionType_${type}`)}
                </option>
              ))}
            </SelectInput>
          </FieldGroup>
          <CheckboxRow className="sm:col-span-2">
            <input
              type="checkbox"
              className="cursor-pointer"
              checked={newGroupRequired}
              onChange={(event) => setNewGroupRequired(event.target.checked)}
            />
            <span>{t("modifierGroupRequiredLabel")}</span>
          </CheckboxRow>
          <div className="flex gap-2 sm:col-span-2">
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              disabled={!newGroupName.trim() || createGroupMutation.isPending}
              onClick={() => createGroupMutation.mutate()}
            >
              {createGroupMutation.isPending ? <Spinner /> : null}
              {t("modifierGroupCreateSubmit")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 space-y-3">
        {groupsQuery.isPending ? <Skeleton className="h-10 w-full rounded-xl" /> : null}

        {!groupsQuery.isPending && groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("modifierGroupsEmpty")}</p>
        ) : null}

        {groups.map((group) => {
          const isAttached = attachedGroupIds.has(group.modifierGroupId);

          return (
            <div
              key={group.modifierGroupId}
              className="rounded-xl border border-border/70 bg-card p-3"
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 cursor-pointer"
                  checked={isAttached}
                  disabled={setGroupsMutation.isPending}
                  onChange={(event) =>
                    toggleGroup(group.modifierGroupId, event.target.checked)
                  }
                />
                <span>
                  <span className="text-sm font-medium">{group.name}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    ({t(`modifierSelectionType_${group.selectionType}`)}
                    {group.isRequired ? `, ${t("modifierGroupRequiredLabel")}` : ""})
                  </span>
                </span>
              </label>

              {group.options.length > 0 ? (
                <ul className="mt-2 ml-6 space-y-1">
                  {group.options.map((option) => (
                    <li
                      key={option.modifierOptionId}
                      className="flex items-center justify-between text-xs text-muted-foreground"
                    >
                      <span>{option.name}</span>
                      <span>{formatMoney(option.priceDelta, "CLP")}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {addingOptionToGroupId === group.modifierGroupId ? (
                <div className="mt-2 ml-6 flex flex-wrap items-end gap-2">
                  <FieldGroup className="min-w-32">
                    <FieldLabel htmlFor={`new-option-name-${group.modifierGroupId}`}>
                      {t("modifierOptionNameLabel")}
                    </FieldLabel>
                    <TextInput
                      id={`new-option-name-${group.modifierGroupId}`}
                      value={newOptionName}
                      onChange={(event) => setNewOptionName(event.target.value)}
                    />
                  </FieldGroup>
                  <FieldGroup className="w-24">
                    <FieldLabel htmlFor={`new-option-price-${group.modifierGroupId}`}>
                      {t("modifierOptionPriceLabel")}
                    </FieldLabel>
                    <TextInput
                      id={`new-option-price-${group.modifierGroupId}`}
                      value={newOptionPriceDelta}
                      onChange={(event) => setNewOptionPriceDelta(event.target.value)}
                    />
                  </FieldGroup>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full"
                    disabled={!newOptionName.trim() || createOptionMutation.isPending}
                    onClick={() => createOptionMutation.mutate(group.modifierGroupId)}
                  >
                    {createOptionMutation.isPending ? <Spinner /> : null}
                    {t("modifierOptionCreateSubmit")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => setAddingOptionToGroupId(null)}
                  >
                    {t("itemCancel")}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-1 ml-6 rounded-full"
                  onClick={() => {
                    setAddingOptionToGroupId(group.modifierGroupId);
                    setNewOptionName("");
                    setNewOptionPriceDelta("0");
                  }}
                >
                  <Plus className="size-3.5" />
                  {t("modifierAddOption")}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
