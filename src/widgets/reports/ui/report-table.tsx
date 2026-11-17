import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CellProps = {
  align?: "left" | "right";
  className?: string;
  colSpan?: number;
  children: ReactNode;
};

export function HeadCell({ align = "left", children }: CellProps) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-10 border-b border-border bg-muted px-3 py-2 text-xs font-semibold whitespace-nowrap text-muted-foreground",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      {children}
    </th>
  );
}

export function BodyCell({ align = "left", className, children }: CellProps) {
  return (
    <td
      className={cn(
        "border-b border-border/60 px-3 py-2 whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
        className
      )}
    >
      {children}
    </td>
  );
}

export function FootCell({ align = "left", colSpan, children }: CellProps) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "sticky bottom-0 z-10 border-t border-border bg-muted px-3 py-2 font-semibold whitespace-nowrap",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      {children}
    </td>
  );
}

export function SelectableRow({
  onSelect,
  children,
}: {
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <tr
      tabIndex={0}
      className="cursor-pointer outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {children}
    </tr>
  );
}
