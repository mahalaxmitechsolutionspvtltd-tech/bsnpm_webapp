'use client'

import { useId, useMemo, useState } from 'react'
import { CircleCheckIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

type SearchableSelectOption = {
    value: string
    label: string
}

type SearchableSelectProps = {
    label?: string
    value?: string
    onChange: (value: string) => void
    options: SearchableSelectOption[]
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    triggerClassName?: string
    contentClassName?: string
    disabled?: boolean
}

export default function SearchableSelect({
    label,
    value = '',
    onChange,
    options,
    placeholder = 'Select option',
    searchPlaceholder = 'Search...',
    emptyText = 'No data found.',
    triggerClassName = '',
    contentClassName = '',
    disabled = false,
}: SearchableSelectProps) {
    const id = useId()
    const [open, setOpen] = useState(false)

    const selectedOption = useMemo(() => {
        return options.find((item) => item.value === value)
    }, [options, value])

    return (
        <div className="space-y-1.5">
            {label ? (
                <Label
                    htmlFor={id}
                    className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                    {label}
                </Label>
            ) : null}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={` w-full justify-between rounded-xl border-slate-200 bg-slate-50/30 px-4 text-[13px] font-normal text-slate-700 shadow-none transition-all hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0b2d5c]/10 ${triggerClassName}`}
                    >
                        <span className="truncate">
                            {selectedOption ? (
                                selectedOption.label
                            ) : (
                                <span className="text-slate-400">{placeholder}</span>
                            )}
                        </span>
                        <ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    className={`w-[var(--radix-popover-trigger-width)] rounded-xl border border-slate-200 p-0 shadow-xl ${contentClassName}`}
                >
                    <Command>
                        <CommandInput
                            placeholder={searchPlaceholder}
                            className="h-10 text-[13px]"
                        />

                        <CommandList>
                            <div
                                className="max-h-48 overflow-y-auto overflow-x-hidden overscroll-contain"
                                onWheel={(e) => {
                                    e.stopPropagation()
                                }}
                            >
                                <CommandEmpty className="py-3 text-[13px] text-slate-500">
                                    {emptyText}
                                </CommandEmpty>

                                <CommandGroup>
                                    {options.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={`${option.label} ${option.value}`}
                                            className="cursor-pointer text-[13px]"
                                            onSelect={() => {
                                                onChange(option.value === value ? '' : option.value)
                                                setOpen(false)
                                            }}
                                        >
                                            <span className="truncate">{option.label}</span>
                                            <CircleCheckIcon
                                                className={`ml-auto h-4 w-4 shrink-0 fill-blue-500 stroke-white ${value === option.value ? 'opacity-100' : 'opacity-0'
                                                    }`}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </div>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}