"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Archive,
  BookOpenText,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileClock,
  Pencil,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { CreateMenuRequest, MenuStatus, MenuSummary } from "@/shared/types/menu";
import {
  FieldGroup,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextInput,
} from "@/shared/ui/form-controls";
import { EmptyHint, formatDateTime } from "./studio-primitives";

const MENU_LANGUAGES = ["es", "en"];

function getMenuStatusTone(status: MenuStatus) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300";
    case "DRAFT":
      return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
    case "ARCHIVED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

function getMenuStatusIcon(status: MenuStatus) {
  switch (status) {
    case "PUBLISHED":
      return CheckCircle2;
    case "ARCHIVED":
      return Archive;
    default:
      return FileClock;
  }
}

const ARCHIVED_COLLAPSE_THRESHOLD = 3;
const MENU_NAME_MAX_LENGTH = 120;
const COPY_BASE_MAX_LENGTH = 100;

const STATUS_RANK: Record<MenuStatus, number> = {
  PUBLISHED: 0,
  DRAFT: 1,
  ARCHIVED: 2,
};

function sortMenus(menus: MenuSummary[]) {
  return [...menus].sort(
    (left, right) =>
      STATUS_RANK[left.status] - STATUS_RANK[right.status] ||
      Number(right.isDefaultMenu) - Number(left.isDefaultMenu) ||
      right.version - left.version
  );
}

type MutationOptions = { onSuccess?: () => void };

type VersionDialog = {
  kind: "duplicate" | "rename" | "delete";
  menu: MenuSummary;
};

type MenuFormValues = {
  name: string;
  defaultLanguage: string;
};

type MenuVersionsPanelProps = {
  branchId: string;
  menus: MenuSummary[];
  selectedMenuId: string;
  isLoading: boolean;
  isCreating: boolean;
  duplicatingMenuId: string | null;
  renamingMenuId: string | null;
  deletingMenuId: string | null;
  onSelect: (menuId: string) => void;
  onCreate: (payload: CreateMenuRequest) => void;
  onDuplicate: (menuId: string, name: string, options?: MutationOptions) => void;
  onRename: (menuId: string, name: string, options?: MutationOptions) => void;
  onDelete: (menuId: string, options?: MutationOptions) => void;
};

type NameDialogProps = {
  kind: "duplicate" | "rename";
  menu: MenuSummary;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

function NameDialog({ kind, menu, isPending, onClose, onSubmit }: NameDialogProps) {
  const t = useTranslations("MenuStudio");
  const [name, setName] = useState(
    kind === "duplicate"
      ? t("versionCopyName", { name: menu.name.slice(0, COPY_BASE_MAX_LENGTH) })
      : menu.name
  );
  const trimmed = name.trim();
  const canSubmit =
    Boolean(trimmed) && !isPending && (kind === "duplicate" || trimmed !== menu.name);

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) {
              onSubmit(trimmed);
            }
          }}
        >
          <DialogHeader className="pr-8">
            <DialogTitle>
              {kind === "duplicate" ? t("versionDuplicateTitle") : t("versionRenameTitle")}
            </DialogTitle>
            <DialogDescription>
              {kind === "duplicate"
                ? t("versionDuplicateDescription", { name: menu.name })
                : t("versionRenameDescription")}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <FieldLabel htmlFor="menu-version-dialog-name">
              {t("versionNameDialogLabel")}
            </FieldLabel>
            <TextInput
              id="menu-version-dialog-name"
              value={name}
              maxLength={MENU_NAME_MAX_LENGTH}
              disabled={isPending}
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={isPending}
              onClick={onClose}
            >
              {t("versionDialogCancel")}
            </Button>
            <Button type="submit" className="rounded-full" disabled={!canSubmit}>
              {isPending ? <Spinner /> : null}
              {kind === "duplicate"
                ? isPending
                  ? t("versionDuplicateSubmitting")
                  : t("versionDuplicateSubmit")
                : isPending
                  ? t("versionRenameSubmitting")
                  : t("versionRenameSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DeleteDialogProps = {
  menu: MenuSummary;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteDialog({ menu, isPending, onClose, onConfirm }: DeleteDialogProps) {
  const t = useTranslations("MenuStudio");

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent>
        <DialogHeader className="pr-8">
          <DialogTitle>{t("versionDeleteTitle")}</DialogTitle>
          <DialogDescription>
            {t("versionDeleteDescription", { name: menu.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={isPending}
            onClick={onClose}
          >
            {t("versionDialogCancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? <Spinner /> : <Trash2 className="size-4" />}
            {isPending ? t("versionDeleteSubmitting") : t("versionDeleteSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MenuVersionsPanel({
  branchId,
  menus,
  selectedMenuId,
  isLoading,
  isCreating,
  duplicatingMenuId,
  renamingMenuId,
  deletingMenuId,
  onSelect,
  onCreate,
  onDuplicate,
  onRename,
  onDelete,
}: MenuVersionsPanelProps) {
  const t = useTranslations("MenuStudio");
  const locale = useLocale();
  const form = useForm<MenuFormValues>({
    defaultValues: {
      name: "",
      defaultLanguage: locale,
    },
  });
  const [dialog, setDialog] = useState<VersionDialog | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const sortedMenus = useMemo(() => sortMenus(menus), [menus]);
  const activeMenus = sortedMenus.filter((menu) => menu.status !== "ARCHIVED");
  const archivedMenus = sortedMenus.filter((menu) => menu.status === "ARCHIVED");
  const collapseArchived = archivedMenus.length > ARCHIVED_COLLAPSE_THRESHOLD;
  const archivedVisible =
    !collapseArchived ||
    showArchived ||
    archivedMenus.some((menu) => menu.menuId === selectedMenuId);

  const renderRow = (menu: MenuSummary) => {
    const StatusIcon = getMenuStatusIcon(menu.status);
    const isSelected = menu.menuId === selectedMenuId;
    const isDuplicating = duplicatingMenuId === menu.menuId;
    const isRenaming = renamingMenuId === menu.menuId;
    const isDeleting = deletingMenuId === menu.menuId;
    const isBusy = isDuplicating || isRenaming || isDeleting;

    return (
      <li
        key={menu.menuId}
        className={cn(
          "rounded-[1.4rem] border transition",
          isSelected
            ? "border-primary/35 bg-primary/7 shadow-lg shadow-primary/10"
            : "border-border/70 bg-background/55 hover:border-primary/25 hover:bg-background/70"
        )}
      >
        <div className="flex items-start gap-1 pr-3">
          <button
            type="button"
            onClick={() => onSelect(menu.menuId)}
            aria-current={isSelected ? "true" : undefined}
            className="min-w-0 flex-1 cursor-pointer rounded-[1.4rem] p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <StatusIcon className="size-4 shrink-0 text-primary" />
                <p className="truncate font-medium">{menu.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {menu.isDefaultMenu ? (
                  <Badge variant="outline" className="border-primary/25 text-primary">
                    {t("versionDefault")}
                  </Badge>
                ) : null}
                <Badge className={cn("border-0", getMenuStatusTone(menu.status))}>
                  {t(`menuStatus_${menu.status}`)}
                </Badge>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {t("versionMeta", {
                version: menu.version,
                categories: menu.categoryCount,
                items: menu.itemCount,
              })}
              {menu.publishedAt
                ? ` · ${t("versionPublishedAt", {
                    publishedAt: formatDateTime(locale, menu.publishedAt),
                  })}`
                : ""}
            </p>
          </button>

          <div className="flex shrink-0 items-center gap-0.5 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-10 sm:size-8"
              title={t("versionActionDuplicate")}
              aria-label={t("versionActionDuplicate")}
              disabled={isBusy}
              onClick={() => setDialog({ kind: "duplicate", menu })}
            >
              {isDuplicating ? <Spinner /> : <Copy />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-10 sm:size-8"
              title={t("versionActionRename")}
              aria-label={t("versionActionRename")}
              disabled={isBusy}
              onClick={() => setDialog({ kind: "rename", menu })}
            >
              {isRenaming ? <Spinner /> : <Pencil />}
            </Button>
            {menu.status === "DRAFT" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-10 text-destructive hover:text-destructive sm:size-8"
                title={t("versionActionDelete")}
                aria-label={t("versionActionDelete")}
                disabled={isBusy}
                onClick={() => setDialog({ kind: "delete", menu })}
              >
                {isDeleting ? <Spinner /> : <Trash2 />}
              </Button>
            ) : null}
          </div>
        </div>
      </li>
    );
  };

  const closeDialog = () => setDialog(null);

  return (
    <Card className="rounded-[1.9rem] border border-border/70 bg-card/82 shadow-lg shadow-primary/8 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <BookOpenText className="size-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em]">
            {t("versionsEyebrow")}
          </p>
        </div>
        <CardTitle className="text-2xl">{t("versionsTitle")}</CardTitle>
        <CardDescription className="leading-7">
          {t("versionsDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="grid gap-3">
            <span className="sr-only">{t("versionsLoading")}</span>
            <Skeleton className="h-20 w-full rounded-[1.4rem]" />
            <Skeleton className="h-20 w-full rounded-[1.4rem]" />
            <Skeleton className="h-20 w-full rounded-[1.4rem]" />
          </div>
        ) : menus.length ? (
          <div className="grid gap-3">
            <ul className="grid gap-3">{activeMenus.map(renderRow)}</ul>
            {archivedMenus.length ? (
              <>
                {collapseArchived ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-self-start rounded-full text-muted-foreground"
                    aria-expanded={archivedVisible}
                    onClick={() => setShowArchived((value) => !value)}
                  >
                    <ChevronDown
                      className={cn("size-4 transition", archivedVisible && "rotate-180")}
                    />
                    {t("versionsArchivedToggle", { count: archivedMenus.length })}
                  </Button>
                ) : null}
                {archivedVisible ? (
                  <ul className="grid gap-3">{archivedMenus.map(renderRow)}</ul>
                ) : null}
              </>
            ) : null}
          </div>
        ) : (
          <EmptyHint>{t("versionsEmpty")}</EmptyHint>
        )}

        <form
          onSubmit={form.handleSubmit((values) => {
            onCreate({
              branchId,
              name: values.name.trim(),
              defaultLanguage: values.defaultLanguage,
            });
            form.reset({ name: "", defaultLanguage: values.defaultLanguage });
          })}
          className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/50 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t("versionCreateEyebrow")}
          </p>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <FieldGroup>
              <FieldLabel htmlFor="menu-name">{t("versionNameLabel")}</FieldLabel>
              <TextInput
                id="menu-name"
                placeholder={t("versionNamePlaceholder")}
                disabled={isCreating}
                {...form.register("name", { required: true })}
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="menu-language">{t("versionLanguageLabel")}</FieldLabel>
              <SelectInput
                id="menu-language"
                disabled={isCreating}
                {...form.register("defaultLanguage")}
              >
                {MENU_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language.toUpperCase()}
                  </option>
                ))}
              </SelectInput>
            </FieldGroup>
          </div>

          <FieldHint>{t("versionCreateHint")}</FieldHint>
          <FieldHint className="-mt-2">{t("versionCreateDuplicateHint")}</FieldHint>

          <Button
            type="submit"
            className="justify-self-start rounded-full"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Spinner />
                {t("versionCreateSubmitting")}
              </>
            ) : (
              t("versionCreateSubmit")
            )}
          </Button>
        </form>
      </CardContent>

      {dialog && dialog.kind !== "delete" ? (
        <NameDialog
          key={`${dialog.kind}-${dialog.menu.menuId}`}
          kind={dialog.kind}
          menu={dialog.menu}
          isPending={
            dialog.kind === "duplicate"
              ? duplicatingMenuId === dialog.menu.menuId
              : renamingMenuId === dialog.menu.menuId
          }
          onClose={closeDialog}
          onSubmit={(name) =>
            dialog.kind === "duplicate"
              ? onDuplicate(dialog.menu.menuId, name, { onSuccess: closeDialog })
              : onRename(dialog.menu.menuId, name, { onSuccess: closeDialog })
          }
        />
      ) : null}

      {dialog?.kind === "delete" ? (
        <DeleteDialog
          menu={dialog.menu}
          isPending={deletingMenuId === dialog.menu.menuId}
          onClose={closeDialog}
          onConfirm={() => onDelete(dialog.menu.menuId, { onSuccess: closeDialog })}
        />
      ) : null}
    </Card>
  );
}
