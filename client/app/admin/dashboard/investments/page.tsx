'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { GetMemberInvestmentPortfolioParams, MemberInvestmentPortfolioMember } from '@/types/InvestmentPortfolio'
import { getMemberInvestmentPortfolioHandler } from '@/services/InvestmentPortfolioHandler'



type InvestmentPortfolioTableProps = {
    search?: string
    emptyMessage?: string
    className?: string
}

const formatCurrency = (value: number | string) => {
    const numberValue = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(numberValue)
        ? `₹ ${new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numberValue)}`
        : '₹ 0'
}

const getTitlesSummary = (member: MemberInvestmentPortfolioMember) => {
    const uniqueTitles = Array.from(
        new Set(
            member.investments
                .map((item) => item.title?.trim())
                .filter((title): title is string => Boolean(title))
        )
    )

    if (uniqueTitles.length === 0) {
        return 'No titles'
    }

    if (uniqueTitles.length === 1) {
        return uniqueTitles[0]
    }

    if (uniqueTitles.length === 2) {
        return `${uniqueTitles[0]}, ${uniqueTitles[1]}`
    }

    return `${uniqueTitles[0]}, ${uniqueTitles[1]} +${uniqueTitles.length - 2} more`
}

const SkeletonRow = () => {
    return (
        <tr className='border-b last:border-b-0'>
            <td className='px-5 py-4'>
                <div className='space-y-2'>
                    <div className='h-4 w-40 animate-pulse rounded bg-muted' />
                    <div className='h-3 w-24 animate-pulse rounded bg-muted' />
                </div>
            </td>
            {Array.from({ length: 6 }).map((_, index) => (
                <td key={index} className='px-5 py-4 text-center'>
                    <div className='mx-auto h-4 w-16 animate-pulse rounded bg-muted' />
                </td>
            ))}
            <td className='px-5 py-4'>
                <div className='h-4 w-40 animate-pulse rounded bg-muted' />
            </td>
        </tr>
    )
}

const InvestmentPortfolioTable = ({
    search = '',
    emptyMessage = 'No portfolio data found.',
    className = ''
}: InvestmentPortfolioTableProps) => {
    const queryParams: GetMemberInvestmentPortfolioParams = React.useMemo(
        () => ({
            ...(search.trim() ? { search: search.trim() } : {})
        }),
        [search]
    )

    const { data, isLoading, isFetching, isError, error } = useQuery({
        queryKey: ['member-investment-portfolio', queryParams],
        queryFn: () => getMemberInvestmentPortfolioHandler(queryParams)
    })

    const members = data?.data?.members ?? []
    const totalMembers = data?.data?.total_members ?? 0

    return (
        <div className={`w-full space-y-4 ${className}`}>
            <div className='flex w-full items-center justify-between gap-3'>
                <div className='text-sm text-muted-foreground'>
                    {isFetching && !isLoading ? 'Refreshing...' : `Total Members: ${totalMembers}`}
                </div>
            </div>

            <div className='w-full overflow-hidden rounded-xl border bg-background'>
                <div className='w-full overflow-x-auto'>
                    <table className='w-full min-w-362.5 border-collapse'>
                        <thead>
                            <tr className='border-b bg-muted/40'>
                                <th className='px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                                    Member
                                </th>
                                <th className='px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                                    Scheme
                                </th>
                                <th className='px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                                    Loan
                                </th>
                                <th className='px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                                    Other
                                </th>
                                <th className='px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                                    Total Value
                                </th>
                                <th className='px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                                    Titles
                                </th>
                                <th className='px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                                    Entries
                                </th>
                                <th className='px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>
                                    Applications
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)
                            ) : isError ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className='px-5 py-10 text-center text-sm text-red-600'
                                    >
                                        {error instanceof Error ? error.message : 'Failed to load portfolio data.'}
                                    </td>
                                </tr>
                            ) : members.length > 0 ? (
                                members.map((member) => (
                                    <tr
                                        key={member.member_id}
                                        className='border-b transition-colors last:border-b-0 hover:bg-muted/20'
                                    >
                                        <td className='px-5 py-4 align-middle'>
                                            <div className='flex flex-col'>
                                                <span className='text-[18px] font-semibold leading-6 text-foreground'>
                                                    {member.member_name}
                                                </span>
                                                <span className='text-sm text-muted-foreground'>
                                                    {member.member_id}
                                                </span>
                                            </div>
                                        </td>

                                        <td className='px-5 py-4 text-center text-[17px] font-medium whitespace-nowrap'>
                                            {formatCurrency(member.scheme_total_value)}
                                        </td>

                                        <td className='px-5 py-4 text-center text-[17px] font-medium whitespace-nowrap'>
                                            {formatCurrency(member.loan_total_value)}
                                        </td>

                                        <td className='px-5 py-4 text-center text-[17px] font-medium whitespace-nowrap'>
                                            {formatCurrency(member.other_total_value)}
                                        </td>

                                        <td className='px-5 py-4 text-center text-[17px] font-semibold whitespace-nowrap'>
                                            {formatCurrency(member.total_value)}
                                        </td>

                                        <td className='px-5 py-4 text-center text-[15px] font-medium'>
                                            {getTitlesSummary(member)}
                                        </td>

                                        <td className='px-5 py-4 text-center text-[17px] font-medium whitespace-nowrap'>
                                            {member.investments.length}
                                        </td>

                                        <td className='px-5 py-4 align-middle'>
                                            <div className='flex flex-wrap gap-2'>
                                                {member.investments.length > 0 ? (
                                                    member.investments.map((investment, index) => (
                                                        <span
                                                            key={`${member.member_id}-${investment.application_no}-${index}`}
                                                            className='inline-flex rounded-md border px-2.5 py-1 text-xs font-medium text-foreground'
                                                        >
                                                            {investment.application_no || 'N/A'}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className='text-sm text-muted-foreground'>
                                                        No applications
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className='px-5 py-10 text-center text-sm text-muted-foreground'
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default InvestmentPortfolioTable