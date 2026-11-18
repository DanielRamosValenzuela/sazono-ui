"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { ImageIcon, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { menusApi } from "@/shared/api/menus-api";
import { formatMoney } from "@/shared/lib/format";
import type {
  MenuItemDetail,
  ModifierGroup,
  ModifierOption,
  ModifierSelectionType,
} from "@/shared/types/menu";
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
const OPTION_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const OPTION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const MODIFIER_MAX_DEPTH = 3;

type NewGroupValues = {
  name: string;
  selectionType: ModifierSelectionType;
  isRequired: boolean;
};

function NewGroupForm({
  idPrefix,
  pending,
  onSubmit,
}: {
  idPrefix: string;
  pending: boolean;
  onSubmit: (values: NewGroupValues) => void;
}) {
  const t = useTranslations("MenuStudio");
  const [name, setName] = useState("");
  const [selectionType, setSelectionType] =
    useState<ModifierSelectionType>("ONE");
  const [isRequired, setIsRequired] = useState(false);

  return (
    <div className="grid gap-3 rounded-xl border border-border/70 bg-card p-3 sm:grid-cols-2">
      <FieldGroup>
        <FieldLabel htmlFor={`${idPrefix}-name`}>
          {t("modifierGroupNameLabel")}
        </FieldLabel>
        <TextInput
          id={`${idPrefix}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("modifierGroupNamePlaceholder")}
        />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel htmlFor={`${idPrefix}-type`}>
          {t("modifierGroupTypeLabel")}
        </FieldLabel>
        <SelectInput
          id={`${idPrefix}-type`}
          value={selectionType}
          onChange={(event) =>
            setSelectionType(event.target.value as ModifierSelectionType)
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
          checked={isRequired}
          onChange={(event) => setIsRequired(event.target.checked)}
        />
        <span>{t("modifierGroupRequiredLabel")}</span>
      </CheckboxRow>
      <div className="flex gap-2 sm:col-span-2">
        <Button
          type="button"
          size="sm"
          className="min-h-10 rounded-full"
          disabled={!name.trim() || pending}
          onClick={() => {
            onSubmit({ name: name.trim(), selectionType, isRequired });
            setName("");
            setIsRequired(false);
          }}
        >
          {pending ? <Spinner /> : null}
          {t("modifierGroupCreateSubmit")}
        </Button>
      </div>
    </div>
  );
}

function ModifierGroupBlock({
  group,
  depth,
  branchId,
  accessToken,
  onChanged,
}: {
  group: ModifierGroup;
  depth: number;
  branchId: string;
  accessToken: string;
  onChanged: () => void;
}) {
  const t = useTranslations("MenuStudio");
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [optionName, setOptionName] = useState("");
  const [optionPrice, setOptionPrice] = useState("0");

  const createOptionMutation = useMutation({
    mutationFn: () =>
      menusApi.createModifierOption(accessToken, group.modifierGroupId, {
        name: optionName.trim(),
        priceDelta: optionPrice.trim() || "0",
      }),
    onSuccess: () => {
      setOptionName("");
      setOptionPrice("0");
      setIsAddingOption(false);
      onChanged();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("modifierOptionCreateError"),
      );
    },
  });

  return (
    <div>
      {depth > 1 ? (
        <p className="text-xs font-medium text-foreground">
          {group.name}{" "}
          <span className="font-normal text-muted-foreground">
            ({t(`modifierSelectionType_${group.selectionType}`)},{" "}
            {group.isRequired
              ? t("modifierGroupRequiredLabel")
              : t("modifierOptionalLabel")}
            )
          </span>
        </p>
      ) : null}

      {group.options.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {group.options.map((option) => (
            <ModifierOptionRow
              key={option.modifierOptionId}
              option={option}
              depth={depth}
              branchId={branchId}
              accessToken={accessToken}
              onChanged={onChanged}
            />
          ))}
        </ul>
      ) : null}

      {isAddingOption ? (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <FieldGroup className="min-w-32">
            <FieldLabel htmlFor={`new-option-name-${group.modifierGroupId}`}>
              {t("modifierOptionNameLabel")}
            </FieldLabel>
            <TextInput
              id={`new-option-name-${group.modifierGroupId}`}
              value={optionName}
              onChange={(event) => setOptionName(event.target.value)}
            />
          </FieldGroup>
          <FieldGroup className="w-24">
            <FieldLabel htmlFor={`new-option-price-${group.modifierGroupId}`}>
              {t("modifierOptionPriceLabel")}
            </FieldLabel>
            <TextInput
              id={`new-option-price-${group.modifierGroupId}`}
              value={optionPrice}
              onChange={(event) => setOptionPrice(event.target.value)}
            />
          </FieldGroup>
          <Button
            type="button"
            size="sm"
            className="min-h-10 rounded-full"
            disabled={!optionName.trim() || createOptionMutation.isPending}
            onClick={() => createOptionMutation.mutate()}
          >
            {createOptionMutation.isPending ? <Spinner /> : null}
            {t("modifierOptionCreateSubmit")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-10 rounded-full"
            onClick={() => setIsAddingOption(false)}
          >
            {t("itemCancel")}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="mt-1 min-h-10 rounded-full"
          onClick={() => {
            setIsAddingOption(true);
            setOptionName("");
            setOptionPrice("0");
          }}
        >
          <Plus className="size-3.5" />
          {t("modifierAddOption")}
        </Button>
      )}
    </div>
  );
}

function ModifierOptionRow({
  option,
  depth,
  branchId,
  accessToken,
  onChanged,
}: {
  option: ModifierOption;
  depth: number;
  branchId: string;
  accessToken: string;
  onChanged: () => void;
}) {
  const t = useTranslations("MenuStudio");
  const [failed, setFailed] = useState(false);
  const [showChildren, setShowChildren] = useState(false);
  const [showNewChild, setShowNewChild] = useState(false);
  const panelId = useId();
  const isSaved = Boolean(option.modifierOptionId);
  const childGroups = option.childGroups ?? [];
  const canNest = depth < MODIFIER_MAX_DEPTH;

  const createChildMutation = useMutation({
    mutationFn: (values: NewGroupValues) =>
      menusApi.createModifierGroup(accessToken, {
        branchId,
        name: values.name,
        selectionType: values.selectionType,
        isRequired: values.isRequired,
        parentOptionId: option.modifierOptionId,
        ...(values.selectionType === "ONE" ? { maxSelect: 1 } : {}),
      }),
    onSuccess: (group) => {
      setShowNewChild(false);
      onChanged();
      toast.success(t("modifierGroupCreateSuccess", { name: group.name }));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("modifierGroupCreateError"),
      );
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      menusApi.uploadModifierOptionImage(
        accessToken,
        option.modifierOptionId,
        file,
      ),
    onSuccess: () => {
      setFailed(false);
      onChanged();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("optionImageUploadError"),
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: () =>
      menusApi.removeModifierOptionImage(accessToken, option.modifierOptionId),
    onSuccess: onChanged,
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("optionImageRemoveError"),
      );
    },
  });

  const handleFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (!OPTION_IMAGE_TYPES.includes(file.type)) {
      toast.error(t("optionImageTypeError"));
      return;
    }
    if (file.size > OPTION_IMAGE_MAX_BYTES) {
      toast.error(t("optionImageSizeError"));
      return;
    }
    uploadMutation.mutate(file);
  };

  const busy = uploadMutation.isPending || removeMutation.isPending;
  const hasImage = Boolean(option.imageUrl) && !failed;

  return (
    <li className="text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-background/50">
          {hasImage ? (
            <Image
              src={option.imageUrl as string}
              alt={option.name}
              width={40}
              height={40}
              loading="lazy"
              onError={() => setFailed(true)}
              className="size-10 object-cover"
            />
          ) : (
            <ImageIcon aria-hidden className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate">{option.name}</span>
        <span>{formatMoney(option.priceDelta, "CLP")}</span>
        <label
          className={cn(
            "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border/70 px-3 py-1 font-medium text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
            busy && "pointer-events-none opacity-50",
          )}
        >
          {uploadMutation.isPending ? (
            <Spinner />
          ) : option.imageUrl ? (
            t("optionImageReplace")
          ) : (
            t("optionImageUpload")
          )}
          <input
            type="file"
            accept={OPTION_IMAGE_TYPES.join(",")}
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        {option.imageUrl ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-11 rounded-full"
            disabled={busy}
            onClick={() => removeMutation.mutate()}
          >
            {removeMutation.isPending ? <Spinner /> : t("optionImageRemove")}
          </Button>
        ) : null}
        {isSaved || childGroups.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 rounded-full"
            disabled={!isSaved || (!canNest && childGroups.length === 0)}
            aria-expanded={showChildren}
            aria-controls={showChildren ? panelId : undefined}
            onClick={() => setShowChildren((open) => !open)}
          >
            {t("modifierSubChoice")}
            {childGroups.length > 0
              ? ` · ${t("modifierSubChoiceCount", { count: childGroups.length })}`
              : ""}
          </Button>
        ) : null}
      </div>
      {!canNest ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {t("modifierMaxDepth")}
        </p>
      ) : null}
      {showChildren ? (
        <div
          id={panelId}
          className="mt-2 ml-3 space-y-3 border-l-2 border-primary/30 pl-2"
        >
          <p className="text-xs text-muted-foreground">
            {t("modifierSubGroupHint", { name: option.name })}{" "}
            {t("modifierChangesAllMenus")}
          </p>
          {childGroups.map((child) => (
            <ModifierGroupBlock
              key={child.modifierGroupId}
              group={child}
              depth={depth + 1}
              branchId={branchId}
              accessToken={accessToken}
              onChanged={onChanged}
            />
          ))}
          {canNest ? (
            showNewChild ? (
              <NewGroupForm
                idPrefix={`new-child-${option.modifierOptionId}`}
                pending={createChildMutation.isPending}
                onSubmit={(values) => createChildMutation.mutate(values)}
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 rounded-full"
                onClick={() => setShowNewChild(true)}
              >
                <Plus className="size-3.5" />
                {t("modifierCreateGroup")}
              </Button>
            )
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function ModifierGroupsEditor({
  branchId,
  accessToken,
  item,
}: ModifierGroupsEditorProps) {
  const t = useTranslations("MenuStudio");
  const queryClient = useQueryClient();
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

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
    [item.modifierGroups],
  );

  const [optimisticIds, setOptimisticIds] = useState<string[] | null>(null);
  const inflightRef = useRef(0);
  const shownGroupIds = useMemo(
    () => (optimisticIds ? new Set(optimisticIds) : attachedGroupIds),
    [optimisticIds, attachedGroupIds],
  );

  const setGroupsMutation = useMutation({
    mutationFn: (modifierGroupIds: string[]) =>
      menusApi.setMenuItemModifierGroups(accessToken, item.menuItemId, {
        modifierGroupIds,
      }),
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("modifierAttachError"),
      );
    },
    onSettled: async () => {
      inflightRef.current -= 1;
      if (inflightRef.current > 0) {
        return;
      }
      await invalidateAll();
      setOptimisticIds(null);
    },
  });

  const toggleGroup = (modifierGroupId: string, nextChecked: boolean) => {
    const current = optimisticIds ?? [...attachedGroupIds];
    const nextIds = nextChecked
      ? [...current.filter((id) => id !== modifierGroupId), modifierGroupId]
      : current.filter((id) => id !== modifierGroupId);
    setOptimisticIds(nextIds);
    inflightRef.current += 1;
    setGroupsMutation.mutate(nextIds);
  };

  const createGroupMutation = useMutation({
    mutationFn: (values: NewGroupValues) =>
      menusApi.createModifierGroup(accessToken, {
        branchId,
        name: values.name,
        selectionType: values.selectionType,
        isRequired: values.isRequired,
        ...(values.selectionType === "ONE" ? { maxSelect: 1 } : {}),
      }),
    onSuccess: async (group) => {
      setIsCreatingGroup(false);
      await invalidateAll();
      toggleGroup(group.modifierGroupId, true);
      toast.success(t("modifierGroupCreateSuccess", { name: group.name }));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : t("modifierGroupCreateError"),
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
        <div className="mt-3">
          <NewGroupForm
            idPrefix="new-modifier-group"
            pending={createGroupMutation.isPending}
            onSubmit={(values) => createGroupMutation.mutate(values)}
          />
        </div>
      ) : null}

      <div className="mt-3 space-y-3">
        {groupsQuery.isPending ? (
          <Skeleton className="h-10 w-full rounded-xl" />
        ) : null}

        {!groupsQuery.isPending && groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("modifierGroupsEmpty")}
          </p>
        ) : null}

        {groups.map((group) => {
          const isAttached = shownGroupIds.has(group.modifierGroupId);

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
                  onChange={(event) =>
                    toggleGroup(group.modifierGroupId, event.target.checked)
                  }
                />
                <span>
                  <span className="text-sm font-medium">{group.name}</span>{" "}
                  <span className="text-xs text-muted-foreground">
                    ({t(`modifierSelectionType_${group.selectionType}`)}
                    {group.isRequired
                      ? `, ${t("modifierGroupRequiredLabel")}`
                      : ""}
                    )
                  </span>
                </span>
              </label>

              <div className="mt-2 ml-6">
                <ModifierGroupBlock
                  group={group}
                  depth={1}
                  branchId={branchId}
                  accessToken={accessToken}
                  onChanged={() => void invalidateAll()}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
