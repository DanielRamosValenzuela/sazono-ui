"use client";

import { useState, type FormEvent } from "react";
import { Popover } from "@base-ui/react/popover";
import { Bookmark, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ReportFilters, ReportSort } from "@/shared/types/reports";
import { TextInput } from "@/shared/ui/form-controls";
import {
  BUILT_IN_VIEWS,
  loadSavedViews,
  persistSavedViews,
  type SavedView,
} from "./report-filters";

type SavedViewsMenuProps = {
  branchId: string;
  filters: ReportFilters;
  sort: ReportSort;
  canSave: boolean;
  onApply: (view: SavedView) => void;
};

const MAX_VIEWS = 20;
const MAX_NAME_LENGTH = 40;

function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function SavedViewsMenu({
  branchId,
  filters,
  sort,
  canSave,
  onApply,
}: SavedViewsMenuProps) {
  const t = useTranslations("Reports");
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");

  const update = (next: SavedView[]) => {
    setViews(next);
    persistSavedViews(branchId, next);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);

    if (next) {
      setViews(loadSavedViews(branchId));
    }
  };

  const apply = (view: SavedView) => {
    onApply(view);
    setOpen(false);
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed || !canSave) {
      return;
    }

    const existing = views.find(
      (view) => view.name.toLowerCase() === trimmed.toLowerCase()
    );
    const entry: SavedView = {
      id: existing?.id ?? createId(),
      name: trimmed,
      filters,
      sort,
    };

    update(
      existing
        ? views.map((view) => (view.id === existing.id ? entry : view))
        : [entry, ...views]
    );
    setName("");
  };

  const limitReached = views.length >= MAX_VIEWS;

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        render={
          <Button variant="outline" className="rounded-full">
            <Bookmark />
            {t("views.title")}
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" className="z-50">
          <Popover.Popup className="w-80 max-w-[calc(100vw-2rem)] space-y-3 rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none">
            <div>
              <p className="px-1 pb-1 text-xs font-semibold text-muted-foreground">
                {t("views.quick")}
              </p>
              <ul>
                {BUILT_IN_VIEWS.map((view) => (
                  <li key={view.id}>
                    <button
                      type="button"
                      className="min-h-10 w-full cursor-pointer rounded-lg px-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                      onClick={() => apply(view)}
                    >
                      {t(`views.${view.labelKey}`)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="px-1 pb-1 text-xs font-semibold text-muted-foreground">
                {t("views.mine")}
              </p>
              {views.length === 0 ? (
                <p className="px-2 py-1 text-sm text-muted-foreground">
                  {t("views.empty")}
                </p>
              ) : (
                <ul className="max-h-48 overflow-auto">
                  {views.map((view) => (
                    <li key={view.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        className="min-h-10 min-w-0 flex-1 cursor-pointer truncate rounded-lg px-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                        onClick={() => apply(view)}
                      >
                        {view.name}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-muted-foreground"
                        aria-label={t("views.delete", { name: view.name })}
                        onClick={() =>
                          update(views.filter((entry) => entry.id !== view.id))
                        }
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={save} className="space-y-2 border-t border-border pt-3">
              <label
                htmlFor="reports-view-name"
                className="px-1 text-xs font-semibold text-muted-foreground"
              >
                {t("views.save")}
              </label>
              <div className="flex gap-2">
                <TextInput
                  id="reports-view-name"
                  value={name}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder={t("views.namePlaceholder")}
                  onChange={(event) => setName(event.target.value)}
                />
                <Button
                  type="submit"
                  className="h-11 shrink-0 rounded-xl"
                  disabled={!name.trim() || !canSave || (limitReached && !views.some((view) => view.name.toLowerCase() === name.trim().toLowerCase()))}
                >
                  {t("views.saveButton")}
                </Button>
              </div>
              {!canSave ? (
                <p className="px-1 text-xs text-muted-foreground">
                  {t("views.needFilters")}
                </p>
              ) : limitReached ? (
                <p className="px-1 text-xs text-muted-foreground">
                  {t("views.limit")}
                </p>
              ) : null}
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
