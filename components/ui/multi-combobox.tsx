"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ProfileTag, PROFILE_TAG_MAP } from "@/lib/profile-options";

type Option = ProfileTag | { value: string; label: string; category?: string };

interface MultiComboboxProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  maxSelected?: number;
  helperText?: string;
  emptyText?: string;
}

export function MultiCombobox({
  label,
  placeholder = "Search...",
  options,
  value,
  onChange,
  maxSelected = 5,
  helperText,
  emptyText = "No results found",
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false);

  const normalizedOptions = useMemo(() => {
    return options.map((option) => {
      const profileTag = PROFILE_TAG_MAP[option.value];
      if (profileTag) {
        return profileTag;
      }
      return {
        value: option.value,
        label: option.label,
        category: option.category || "Other",
      };
    });
  }, [options]);

  const groupedOptions = useMemo(() => {
    return normalizedOptions.reduce<Record<string, Option[]>>((acc, option) => {
      const category = option.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(option);
      return acc;
    }, {});
  }, [normalizedOptions]);

  const selectionFull = value.length >= maxSelected;

  const toggleValue = (selectedValue: string) => {
    if (value.includes(selectedValue)) {
      onChange(value.filter((item) => item !== selectedValue));
      return;
    }
    if (selectionFull) {
      return;
    }
    onChange([...value, selectedValue]);
  };

  const clearSelection = () => {
    onChange([]);
  };

  const getLabel = (val: string) => {
    return normalizedOptions.find((option) => option.value === val)?.label || PROFILE_TAG_MAP[val]?.label || val;
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((selected) => (
            <Badge key={selected} variant="secondary" className="flex items-center gap-1">
              {getLabel(selected)}
              <button
                type="button"
                onClick={() => toggleValue(selected)}
                className="focus:outline-none hover:text-destructive"
                aria-label={`Remove ${getLabel(selected)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-sm shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#85BCB1]",
              selectionFull && "border-dashed"
            )}
          >
            <span className={cn("truncate", !value.length && "text-muted-foreground")}>
              {value.length ? `${value.length} selected` : placeholder}
            </span>
            <div className="flex items-center gap-2">
              {value.length > 0 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    clearSelection();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      clearSelection();
                    }
                  }}
                  className="rounded-full p-1 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#85BCB1]"
                  aria-label="Clear selection"
                >
                  <X className="h-4 w-4" />
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder={placeholder} autoFocus />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              {Object.entries(groupedOptions).map(([category, items]) => (
                <CommandGroup key={category} heading={category}>
                  {items.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(currentValue) => {
                        toggleValue(currentValue);
                      }}
                      disabled={!value.includes(option.value) && selectionFull}
                      className="flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      <Check className={cn("h-4 w-4", value.includes(option.value) ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        {helperText || `Selected ${value.length}/${maxSelected}. Type to filter options.`}
      </p>
    </div>
  );
}


