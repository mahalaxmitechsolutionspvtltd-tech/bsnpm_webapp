'use client'

import { useState } from 'react'
import type { ColumnDef, ColumnFiltersState, RowData } from '@tanstack/react-table'
import {
    flexRender,
    getCoreRowModel,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Filter from '@/components/ui/filter'
import { getLoanSchemesHandler, deleteLoanSchemes } from '@/services/loanHandler'
import type { LoanTypes } from '@/types/loanTypes'
import { formatDateDDMMYYYY } from '@/lib/formateDate'
import AddLoanSchemes from './AddLoanSchemes'
import ViewLoanSchemes from './ViewLoanSchemes'
import { Button } from '@/components/ui/button'
import { Trash } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'

declare module '@tanstack/react-table' {
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: 'text' | 'range' | 'select'
    }
}

const LoanSchemes = () => {
    const queryClient = useQueryClient()
    const { user } = useAuth()

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [selectedLoan, setSelectedLoan] = useState<LoanTypes | null>(null)
    const [openViewDialog, setOpenViewDialog] = useState(false)

    const { data: loanScheme = [], error, isLoading } = useQuery<LoanTypes[]>({
        queryKey: ['LoanSchmes'],
        queryFn: getLoanSchemesHandler,
    })

    const handleViewLoanSchemes = (loan: LoanTypes) => {
        setSelectedLoan(loan)
        setOpenViewDialog(true)
    }

    const handleUpdateLoanScheme = (updatedLoan: LoanTypes) => {
        queryClient.setQueryData<LoanTypes[]>(['LoanSchmes'], (oldData = []) => {
            return oldData.map((item) =>
                item.id === updatedLoan.id ? { ...item, ...updatedLoan } : item
            )
        })

        setSelectedLoan(updatedLoan)
        toast.success('Loan scheme updated in UI successfully')
    }

    const deleteLoanSchemeMutation = useMutation({
        mutationFn: async ({
            scheme_id,
            deleted_by,
        }: {
            scheme_id: number | string
            deleted_by: string
        }) => {
            return await deleteLoanSchemes(scheme_id, deleted_by)
        },

        onSuccess: (response, variables) => {
            if (response?.success) {
                queryClient.setQueryData<LoanTypes[]>(['LoanSchmes'], (oldData = []) =>
                    oldData.filter((item) => item.id !== variables.scheme_id)
                )

                if (selectedLoan?.id === variables.scheme_id) {
                    setSelectedLoan(null)
                    setOpenViewDialog(false)
                }

                toast.success(response?.message || 'Loan scheme deleted successfully')

                queryClient.invalidateQueries({
                    queryKey: ['LoanSchmes'],
                })

                return
            }

            toast.error(response?.message || 'Failed to delete loan scheme')
        },

        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                'Something went wrong while deleting loan scheme'
            )
        },
    })

    const handleDeleteLoanScheme = (loan: LoanTypes) => {
        const deletedBy =
            typeof (user as any)?.admin_name === 'string' && (user as any).admin_name.trim()
                ? (user as any).admin_name.trim()
                : typeof (user as any)?.full_name === 'string' && (user as any).full_name.trim()
                    ? (user as any).full_name.trim()
                    : ''

        if (!deletedBy) {
            toast.error('Deleted by user name is missing')
            return
        }

        deleteLoanSchemeMutation.mutate({
            scheme_id: loan.id,
            deleted_by: deletedBy,
        })
    }

    const columns: ColumnDef<LoanTypes>[] = [
        {
            header: 'Schemes',
            accessorKey: 'scheme_name',
            cell: ({ row }) => (
                <div
                    onClick={() => handleViewLoanSchemes(row.original)}
                    className="font-medium"
                >
                    {String(row.getValue('scheme_name') ?? '-')}
                </div>
            ),
        },
        {
            header: 'Details',
            accessorKey: 'loan_details',
            cell: ({ row }) => (
                <div onClick={() => handleViewLoanSchemes(row.original)}>
                    {String(row.getValue('loan_details') ?? '-')}
                </div>
            ),
            enableSorting: false,
            meta: {
                filterVariant: 'text',
            },
        },
        {
            header: 'Interest Rate',
            accessorKey: 'interest_rate',
            cell: ({ row }) => {
                return <Badge>{String(row.getValue('interest_rate') ?? '-')} %</Badge>
            },
            enableSorting: false,
            meta: {
                filterVariant: 'select',
            },
        },
        {
            header: 'Loan Max Amount',
            accessorKey: 'loan_max_amount',
            cell: ({ row }) => (
                <div onClick={() => handleViewLoanSchemes(row.original)}>
                    {String(row.getValue('loan_max_amount') ?? '-')}
                </div>
            ),
            meta: {
                filterVariant: 'range',
            },
        },
        {
            header: 'Created at',
            accessorKey: 'created_at',
            cell: ({ row }) => (
                <div onClick={() => handleViewLoanSchemes(row.original)}>
                    {String(formatDateDDMMYYYY(row.getValue('created_at')) ?? '-')}
                </div>
            ),
            meta: {
                filterVariant: 'range',
            },
        },
        {
            header: 'Created by',
            accessorKey: 'created_by',
            cell: ({ row }) => (
                <div onClick={() => handleViewLoanSchemes(row.original)}>
                    {String(row.getValue('created_by') ?? '-')}
                </div>
            ),
            meta: {
                filterVariant: 'text',
            },
        },
        {
            header: 'Actions',
            cell: ({ row }) => {
                const isDeleting =
                    deleteLoanSchemeMutation.isPending &&
                    deleteLoanSchemeMutation.variables?.scheme_id === row.original.id

                return (
                    <div>
                        <Button
                            type="button"
                            variant="destructive"
                            className="rounded-xl"
                            disabled={isDeleting}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteLoanScheme(row.original)
                            }}
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: loanScheme,
        columns,
        state: {
            columnFilters,
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        enableSortingRemoval: false,
    })

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-24" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-28" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-20" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-24" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-28" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-24" />
                                </TableHead>
                                <TableHead className="h-10 border-t">
                                    <Skeleton className="h-4 w-20" />
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {Array.from({ length: 6 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-28" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-full max-w-55" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-28" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-9 w-24 rounded-xl" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-32 items-center justify-center rounded-xl border text-sm text-red-500">
                Failed to load loan schemes
            </div>
        )
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-64">
                        <Filter column={table.getColumn('scheme_name')!} />
                    </div>
                    <div className="w-64">
                        <Filter column={table.getColumn('loan_details')!} />
                    </div>
                    <div className="w-36">
                        <Filter column={table.getColumn('interest_rate')!} />
                    </div>
                </div>

                <div className="my-auto">
                    <AddLoanSchemes />
                </div>
            </div>

            <div className="border rounded-xl">
                <Table>
                    <TableHeader className="border-t">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/50 border-t-0">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="relative h-10 border-t select-none"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <ViewLoanSchemes
                open={openViewDialog}
                onOpenChange={setOpenViewDialog}
                selectedLoan={selectedLoan}
                onUpdate={handleUpdateLoanScheme}
            />
        </div>
    )
}

export default LoanSchemes