"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { floorApi } from "@/shared/api/floor-api";
import type { FloorTable, TableZone } from "@/shared/types/floor";
import { CheckboxRow, FieldGroup, FieldLabel, TextInput } from "@/shared/ui/form-controls";

type ManageTableZonesDialogProps = {
  accessToken: string;
  branchId: string;
  tables: FloorTable[];
  onClose: () => void;
};

export function ManageTableZonesDialog({
  accessToken,
  branchId,
  tables,
  onClose,
}: ManageTableZonesDialogProps) {
  const t = useTranslations("FloorConsole");
  const queryClient = useQueryClient();

  const [newZoneName, setNewZoneName] = useState("");
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);
  const [renamingZoneId, setRenamingZoneId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmingDeleteZoneId, setConfirmingDeleteZoneId] = useState<string | null>(null);
  const [staffDraftByZoneId, setStaffDraftByZoneId] = useState<Record<string, string[]>>({});

  const invalidateZonesAndTables = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["floor", "zones", accessToken, branchId] }),
      queryClient.invalidateQueries({ queryKey: ["floor", "tables"] }),
    ]);

  const zonesQuery = useQuery({
    queryKey: ["floor", "zones", accessToken, branchId],
    queryFn: () => floorApi.listZones(accessToken, branchId),
  });

  const staffQuery = useQuery({
    queryKey: ["floor", "branch-staff", accessToken, branchId],
    queryFn: () => floorApi.listBranchStaff(accessToken, branchId),
  });

  const zones = zonesQuery.data ?? [];
  const branchStaff = staffQuery.data ?? [];

  const createZoneMutation = useMutation({
    mutationFn: (name: string) => floorApi.createZone(accessToken, { branchId, name }),
    onSuccess: async () => {
      setNewZoneName("");
      await invalidateZonesAndTables();
      toast.success(t("zoneCreateSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("zoneCreateError"));
    },
  });

  const renameZoneMutation = useMutation({
    mutationFn: ({ zoneId, name }: { zoneId: string; name: string }) =>
      floorApi.renameZone(accessToken, zoneId, { name }),
    onSuccess: async () => {
      setRenamingZoneId(null);
      setRenameValue("");
      await invalidateZonesAndTables();
      toast.success(t("zoneRenameSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("zoneRenameError"));
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (zoneId: string) => floorApi.deleteZone(accessToken, zoneId),
    onSuccess: async (_result, zoneId) => {
      setConfirmingDeleteZoneId(null);
      setExpandedZoneId((current) => (current === zoneId ? null : current));
      await invalidateZonesAndTables();
      toast.success(t("zoneDeleteSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("zoneDeleteError"));
    },
  });

  const setTableZoneMutation = useMutation({
    mutationFn: ({ tableId, zoneId }: { tableId: string; zoneId: string | null }) =>
      floorApi.setTableZone(accessToken, tableId, { zoneId }),
    onSuccess: () => invalidateZonesAndTables(),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("zoneTableUpdateError"));
    },
  });

  const setZoneStaffMutation = useMutation({
    mutationFn: ({ zoneId, staffUserIds }: { zoneId: string; staffUserIds: string[] }) =>
      floorApi.setZoneStaff(accessToken, zoneId, { staffUserIds }),
    onSuccess: async (_result, { zoneId }) => {
      setStaffDraftByZoneId((prev) => {
        const next = { ...prev };
        delete next[zoneId];
        return next;
      });
      await invalidateZonesAndTables();
      toast.success(t("zoneStaffUpdateSuccess"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("zoneStaffUpdateError"));
    },
  });

  const toggleTableInZone = (zone: TableZone, table: FloorTable, checked: boolean) => {
    setTableZoneMutation.mutate({
      tableId: table.tableId,
      zoneId: checked ? zone.zoneId : null,
    });
  };

  const toggleStaffInZone = (zone: TableZone, staffUserId: string, checked: boolean) => {
    const current = staffDraftByZoneId[zone.zoneId] ?? zone.staffUserIds;
    const next = checked
      ? [...current, staffUserId]
      : current.filter((id) => id !== staffUserId);
    setStaffDraftByZoneId((prev) => ({ ...prev, [zone.zoneId]: next }));
  };

  const isLoading = zonesQuery.isPending || staffQuery.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl gap-5 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("zoneManageAction")}</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <FieldLabel htmlFor="zone-create-name">{t("zoneCreateLabel")}</FieldLabel>
          <div className="flex gap-2">
            <TextInput
              id="zone-create-name"
              value={newZoneName}
              onChange={(event) => setNewZoneName(event.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              className="rounded-full"
              disabled={!newZoneName.trim() || createZoneMutation.isPending}
              onClick={() => createZoneMutation.mutate(newZoneName.trim())}
            >
              {createZoneMutation.isPending ? <Spinner /> : <Plus className="size-4" />}
              {t("zoneCreateAction")}
            </Button>
          </div>
        </FieldGroup>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : (
          <ul className="space-y-3">
            {zones.map((zone) => {
              const isExpanded = expandedZoneId === zone.zoneId;
              const isRenaming = renamingZoneId === zone.zoneId;
              const isConfirmingDelete = confirmingDeleteZoneId === zone.zoneId;
              const staffDraft = staffDraftByZoneId[zone.zoneId] ?? zone.staffUserIds;
              const hasStaffChanges =
                staffDraft.length !== zone.staffUserIds.length ||
                !staffDraft.every((id) => zone.staffUserIds.includes(id));

              return (
                <li
                  key={zone.zoneId}
                  className="rounded-2xl border border-border/70 bg-background/55 p-3.5"
                >
                  <div className="flex items-center gap-2">
                    {isRenaming ? (
                      <>
                        <TextInput
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="rounded-full"
                          disabled={!renameValue.trim() || renameZoneMutation.isPending}
                          onClick={() =>
                            renameZoneMutation.mutate({
                              zoneId: zone.zoneId,
                              name: renameValue.trim(),
                            })
                          }
                        >
                          {renameZoneMutation.isPending ? <Spinner /> : <Check className="size-4" />}
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="rounded-full"
                          onClick={() => setRenamingZoneId(null)}
                        >
                          <X className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 truncate text-sm font-semibold text-foreground">
                          {zone.name}
                        </span>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="rounded-full"
                          aria-label={zone.name}
                          onClick={() => {
                            setRenamingZoneId(zone.zoneId);
                            setRenameValue(zone.name);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {isConfirmingDelete ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="rounded-full"
                            disabled={deleteZoneMutation.isPending}
                            onClick={() => deleteZoneMutation.mutate(zone.zoneId)}
                          >
                            {deleteZoneMutation.isPending ? <Spinner /> : null}
                            {t("zoneDeleteConfirm")}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label={t("zoneDeleteAction")}
                            onClick={() => setConfirmingDeleteZoneId(zone.zoneId)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="rounded-full"
                          aria-label={zone.name}
                          onClick={() =>
                            setExpandedZoneId((current) =>
                              current === zone.zoneId ? null : zone.zoneId
                            )
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>

                  {isExpanded ? (
                    <div className="mt-3.5 space-y-4 border-t border-border/60 pt-3.5">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {t("zoneTablesLabel")}
                        </p>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {tables.map((table) => (
                            <CheckboxRow key={table.tableId}>
                              <input
                                type="checkbox"
                                className="cursor-pointer"
                                checked={table.zoneId === zone.zoneId}
                                disabled={setTableZoneMutation.isPending}
                                onChange={(event) =>
                                  toggleTableInZone(zone, table, event.target.checked)
                                }
                              />
                              <span>{table.name}</span>
                            </CheckboxRow>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          {t("zoneStaffLabel")}
                        </p>
                        <div className="grid gap-1.5 sm:grid-cols-2">
                          {branchStaff.map((staffMember) => (
                            <CheckboxRow key={staffMember.staffUserId}>
                              <input
                                type="checkbox"
                                className="cursor-pointer"
                                checked={staffDraft.includes(staffMember.staffUserId)}
                                onChange={(event) =>
                                  toggleStaffInZone(
                                    zone,
                                    staffMember.staffUserId,
                                    event.target.checked
                                  )
                                }
                              />
                              <span>
                                {staffMember.firstName} {staffMember.lastName}
                              </span>
                            </CheckboxRow>
                          ))}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-2.5 rounded-full"
                          disabled={!hasStaffChanges || setZoneStaffMutation.isPending}
                          onClick={() =>
                            setZoneStaffMutation.mutate({
                              zoneId: zone.zoneId,
                              staffUserIds: staffDraft,
                            })
                          }
                        >
                          {setZoneStaffMutation.isPending ? <Spinner /> : <Check className="size-3.5" />}
                          {t("zoneSaveStaff")}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
