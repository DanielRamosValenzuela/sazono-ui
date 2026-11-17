"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextInput } from "@/shared/ui/form-controls";

export type SearchSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

type SearchSelectProps = {
  id: string;
  value: string;
  options: SearchSelectOption[];
  placeholder: string;
  emptyText: string;
  clearLabel: string;
  onChange: (value: string) => void;
};

const MAX_VISIBLE_OPTIONS = 40;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function SearchSelect({
  id,
  value,
  options,
  placeholder,
  emptyText,
  clearLabel,
  onChange,
}: SearchSelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = options.find((option) => option.value === value);
  const selectedLabel = selected?.label ?? value;
  const needle = normalize(query.trim());
  const matches = options
    .filter((option) => !needle || normalize(option.label).includes(needle))
    .slice(0, MAX_VISIBLE_OPTIONS);
  const activeIndex = Math.min(active, Math.max(matches.length - 1, 0));

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (next: string) => {
    onChange(next);
    close();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive(Math.min(activeIndex + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (event.key === "Enter" && open && matches[activeIndex]) {
      event.preventDefault();
      choose(matches[activeIndex].value);
    } else if (event.key === "Escape" && open) {
      event.stopPropagation();
      close();
    }
  };

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          close();
        }
      }}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <TextInput
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined
        }
        autoComplete="off"
        className="pr-9 pl-9"
        placeholder={placeholder}
        value={open ? query : value ? selectedLabel : ""}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setOpen(true);
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={handleKeyDown}
      />
      {value ? (
        <button
          type="button"
          aria-label={clearLabel}
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => onChange("")}
        >
          <X className="size-4" />
        </button>
      ) : null}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-popover p-1 text-sm shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">{emptyText}</li>
          ) : (
            matches.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2",
                  index === activeIndex && "bg-muted",
                  option.value === value && "font-semibold"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(option.value)}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {option.hint ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
