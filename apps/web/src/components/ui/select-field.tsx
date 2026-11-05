"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";

const EMPTY = "__empty__";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  labelClassName?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: "default" | "ghost";
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

function encodeValue(value: string) {
  return value === "" ? EMPTY : value;
}

function decodeValue(value: string) {
  return value === EMPTY ? "" : value;
}

export function SelectField({
  id,
  name,
  label,
  labelClassName,
  value,
  onValueChange,
  options,
  placeholder,
  required,
  disabled,
  variant = "default",
  className,
  triggerClassName,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SelectFieldProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const labelId = `${triggerId}-label`;
  const hasEmptyOption = options.some((option) => option.value === "");
  const radixValue = value === "" && !hasEmptyOption ? undefined : encodeValue(value);

  return (
    <div className={cn(label ? "grid gap-1" : undefined, className)}>
      {label ? (
        <label id={labelId} htmlFor={triggerId} className={cn("text-sm font-medium text-muted-foreground", labelClassName)}>
          {label}
        </label>
      ) : null}
      <Select.Root
        value={radixValue}
        onValueChange={(next) => onValueChange(decodeValue(next))}
        required={required}
        disabled={disabled}
        name={name}
      >
        <Select.Trigger
          id={triggerId}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy ?? (label ? labelId : undefined)}
          aria-required={required || undefined}
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-2 text-left leading-normal tracking-normal outline-none",
            "data-[placeholder]:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            variant === "ghost" &&
              "h-10 bg-transparent text-sm font-medium text-[#12141c] data-[placeholder]:text-[#6b7288]",
            variant === "default" && "h-11 rounded-xl border border-input bg-card px-3 text-sm text-foreground",
            triggerClassName,
          )}
        >
          <Select.Value className="min-w-0 flex-1 truncate" placeholder={placeholder} />
          <Select.Icon className="shrink-0">
            <ChevronDown className={cn("size-4 opacity-60", variant === "ghost" && "text-[#6b7288]")} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={6}
            collisionPadding={{ top: 80, bottom: 16, left: 12, right: 12 }}
            className="z-[80] max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[#ececf2] bg-white text-[#12141c] shadow-[0_16px_48px_rgba(0,0,0,0.22)]"
          >
            <Select.ScrollUpButton className="grid h-8 place-items-center text-[#6b7288]">
              <ChevronUp className="size-4" />
            </Select.ScrollUpButton>
            <Select.Viewport className="max-h-[min(20rem,var(--radix-select-content-available-height))] w-full min-w-[var(--radix-select-trigger-width)] p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value === "" ? EMPTY : option.value}
                  value={encodeValue(option.value)}
                  disabled={option.disabled}
                  className="relative flex cursor-pointer items-center rounded-lg py-2.5 pr-10 pl-3 text-sm leading-snug tracking-normal outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-[#f4f5f8] data-[state=checked]:bg-[#fff1eb] data-[state=checked]:font-medium data-[state=checked]:text-primary"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="absolute right-3 text-primary">
                    <Check className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="grid h-8 place-items-center text-[#6b7288]">
              <ChevronDown className="size-4" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
