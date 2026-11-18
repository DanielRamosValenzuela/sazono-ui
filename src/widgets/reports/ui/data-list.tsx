import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BodyCell, FootCell, HeadCell, SelectableRow } from "./report-table";

export type DataColumn<T> = {
  id: string;
  label: string;
  align?: "left" | "right";
  cell: (row: T) => ReactNode;
  foot?: ReactNode;
};

type DataListProps<T> = {
  label: string;
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onSelect?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  hasFoot?: boolean;
};

export function DataList<T>({
  label,
  columns,
  rows,
  rowKey,
  onSelect,
  rowClassName,
  hasFoot = false,
}: DataListProps<T>) {
  const [title, ...rest] = columns;

  return (
    <>
      <div className="hidden max-h-[65vh] overflow-auto rounded-2xl border border-border/70 bg-card md:block">
        <table
          aria-label={label}
          className="w-full border-separate border-spacing-0 text-sm tabular-nums"
        >
          <thead>
            <tr>
              {columns.map((column) => (
                <HeadCell key={column.id} align={column.align}>
                  {column.label}
                </HeadCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cells = columns.map((column, index) => (
                <BodyCell
                  key={column.id}
                  align={column.align}
                  className={cn(index === 0 && "font-medium")}
                >
                  {column.cell(row)}
                </BodyCell>
              ));

              return onSelect ? (
                <SelectableRow key={rowKey(row)} onSelect={() => onSelect(row)}>
                  {cells}
                </SelectableRow>
              ) : (
                <tr key={rowKey(row)} className="hover:bg-muted/40">
                  {cells}
                </tr>
              );
            })}
          </tbody>
          {hasFoot ? (
            <tfoot>
              <tr>
                {columns.map((column) => (
                  <FootCell key={column.id} align={column.align}>
                    {column.foot ?? null}
                  </FootCell>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <ul aria-label={label} className="space-y-3 md:hidden">
        {rows.map((row) => {
          const body = (
            <>
              <div className="text-base font-semibold break-words">
                {title.cell(row)}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {rest.map((column) => (
                  <div key={column.id} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">
                      {column.label}
                    </dt>
                    <dd className="text-sm font-medium break-words tabular-nums">
                      {column.cell(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          );
          const className = cn(
            "w-full rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm",
            rowClassName?.(row)
          );

          return (
            <li key={rowKey(row)}>
              {onSelect ? (
                <button
                  type="button"
                  className={cn(className, "cursor-pointer")}
                  onClick={() => onSelect(row)}
                >
                  {body}
                </button>
              ) : (
                <div className={className}>{body}</div>
              )}
            </li>
          );
        })}
        {hasFoot ? (
          <li className="rounded-2xl border border-border bg-muted p-4">
            {title.foot ? (
              <p className="mb-2 text-sm font-semibold">{title.foot}</p>
            ) : null}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {rest
                .filter((column) => column.foot !== undefined)
                .map((column) => (
                  <div key={column.id} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">
                      {column.label}
                    </dt>
                    <dd className="text-sm font-semibold break-words tabular-nums">
                      {column.foot}
                    </dd>
                  </div>
                ))}
            </dl>
          </li>
        ) : null}
      </ul>
    </>
  );
}
