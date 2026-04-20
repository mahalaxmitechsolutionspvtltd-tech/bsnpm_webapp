"use client"

import { Input } from "@/components/ui/input"
import { useId, useMemo } from "react"
import { Column } from "@tanstack/react-table"
import { SearchIcon } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type FilterVariant = "text" | "range" | "select"

type ColumnMetaShape = {
    filterVariant?: FilterVariant
}

type FilterProps<TData> = {
    column: Column<TData, unknown>
}

export default function Filter<TData>({ column }: FilterProps<TData>) {
    const id = useId()
    const labelId = `${id}-label`
    const columnFilterValue = column.getFilterValue()
    const meta = (column.columnDef.meta as ColumnMetaShape | undefined) ?? {}
    const { filterVariant } = meta
    const columnHeader = typeof column.columnDef.header === "string" ? column.columnDef.header : ""

    const filterLabel = filterVariant === "text" ? "Search" : "Sort"

    const sortedUniqueValues = useMemo(() => {
        if (filterVariant === "range") return []

        const uniqueValues = Array.from(column.getFacetedUniqueValues().keys()).filter(
            (value): value is string | number => typeof value === "string" || typeof value === "number"
        )

        return uniqueValues.sort((a, b) => String(a).localeCompare(String(b)))
    }, [column, filterVariant])

    if (filterVariant === "range") {
        const minMaxValues = column.getFacetedMinMaxValues()
        const min = typeof minMaxValues?.[0] === "number" ? minMaxValues[0] : undefined
        const max = typeof minMaxValues?.[1] === "number" ? minMaxValues[1] : undefined
        const currentValue = Array.isArray(columnFilterValue)
            ? (columnFilterValue as [number | undefined, number | undefined])
            : [undefined, undefined]

        return (
            <div className="space-y-2">
                <label id={labelId} htmlFor={`${id}-min`} className="text-sm font-medium text-foreground">
                    {filterLabel}
                </label>
                <div className="flex gap-2">
                    <Input
                        id={`${id}-min`}
                        type="number"
                        value={currentValue[0] ?? ""}
                        min={min}
                        max={max}
                        onChange={(e) =>
                            column.setFilterValue((old: [number | undefined, number | undefined] | undefined) => [
                                e.target.value ? Number(e.target.value) : undefined,
                                old?.[1],
                            ])
                        }
                        placeholder="Min"
                        className="h-9 rounded-lg"
                        aria-labelledby={labelId}
                    />
                    <Input
                        id={`${id}-max`}
                        type="number"
                        value={currentValue[1] ?? ""}
                        min={min}
                        max={max}
                        onChange={(e) =>
                            column.setFilterValue((old: [number | undefined, number | undefined] | undefined) => [
                                old?.[0],
                                e.target.value ? Number(e.target.value) : undefined,
                            ])
                        }
                        placeholder="Max"
                        className="h-9 rounded-lg"
                        aria-labelledby={labelId}
                    />
                </div>
            </div>
        )
    }

    if (filterVariant === "select") {
        return (
            <div className="space-y-2">
                <label id={labelId} htmlFor={id} className="text-sm font-medium text-foreground">
                    {filterLabel}
                </label>
                <Select
                    value={(columnFilterValue ?? "") as string}
                    onValueChange={(value) => column.setFilterValue(value === "__all__" ? "" : value)}
                >
                    <SelectTrigger id={id} aria-labelledby={labelId} className="h-9 w-full rounded-lg capitalize">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                        <SelectItem value="__all__">All</SelectItem>
                        {sortedUniqueValues.map((value) => (
                            <SelectItem key={String(value)} value={String(value)}>
                                {String(value)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <label id={labelId} htmlFor={id} className="text-sm font-medium text-foreground">
                {filterLabel}
            </label>
            <div className="relative">
                <Input
                    id={id}
                    type="text"
                    value={(columnFilterValue ?? "") as string}
                    onChange={(e) => column.setFilterValue(e.target.value)}
                    placeholder={`Search ${columnHeader.toLowerCase() || "value"}`}
                    className="h-9 rounded-lg pl-9 capitalize"
                    aria-labelledby={labelId}
                />
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
        </div>
    )
}