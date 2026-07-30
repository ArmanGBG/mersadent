'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SearchableOption {
  value: string;
  label: string;
  /** optional extra hint shown muted next to the label */
  hint?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  /** RTL aware: align content. Defaults to true. */
  rtl?: boolean;
}

/**
 * A searchable combobox built on shadcn Popover + Command (cmdk).
 * Mirrors the look of the native shadcn Select trigger (h-9, bordered, rounded-md).
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'انتخاب کنید',
  searchPlaceholder = 'جستجو...',
  emptyText = 'موردی یافت نشد',
  disabled = false,
  className,
  rtl = true,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between h-9 font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
          dir={rtl ? 'rtl' : 'ltr'}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[220px] p-0"
        align="start"
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <Command shouldFilter={true}>
          <div className="flex items-center border-b px-2" dir={rtl ? 'rtl' : 'ltr'}>
            <Search className="size-4 shrink-0 opacity-50" />
            <CommandInput placeholder={searchPlaceholder} className="h-9 flex-1" />
          </div>
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map(opt => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onChange(opt.value === value ? '' : opt.value);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      'size-4 shrink-0',
                      value === opt.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.hint && (
                    <span className="text-xs text-muted-foreground truncate">{opt.hint}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
