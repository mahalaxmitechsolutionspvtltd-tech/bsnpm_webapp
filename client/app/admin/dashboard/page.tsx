"use client"

import {
    Banknote,
    BadgeIndianRupee,
    BriefcaseBusiness,
    CalendarDays,
    CreditCard,
    HandCoins,
    Landmark,
    PiggyBank,
    ShieldCheck,
    Users,
    WalletCards,
    CircleDollarSign,
    Star,
    LockKeyhole,
    TrendingUp,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { getDashboardOverviewHandler } from "@/services/dashboardOverviewHandler"

type DashboardStat = {
    key: string
    title: string
    value: number
    subtitle: string
    icon: React.ElementType
}

const iconWrapMap: Record<string, string> = {
    total_members: "bg-blue-50 text-blue-600 border-blue-100",
    joining_fee: "bg-emerald-50 text-emerald-600 border-emerald-100",
    loan_amount: "bg-amber-50 text-amber-600 border-amber-100",
    loan_outstanding: "bg-rose-50 text-rose-600 border-rose-100",
    share_capital: "bg-violet-50 text-violet-600 border-violet-100",
    emergency_fund: "bg-sky-50 text-sky-600 border-sky-100",
    kayam_thev: "bg-cyan-50 text-cyan-600 border-cyan-100",
    active_loans: "bg-red-50 text-red-600 border-red-100",
    recurring_deposit: "bg-blue-50 text-blue-600 border-blue-100",
    lakhpati_3y: "bg-violet-50 text-violet-600 border-violet-100",
    lakhpati_5y: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
    term_deposit_1_3: "bg-cyan-50 text-cyan-600 border-cyan-100",
    term_deposit_5_10: "bg-teal-50 text-teal-600 border-teal-100",
    damduppat: "bg-orange-50 text-orange-600 border-orange-100",
    fixed_deposit: "bg-emerald-50 text-emerald-600 border-emerald-100",
    total_deposit_schemes: "bg-pink-50 text-pink-600 border-pink-100",
}

const currencyKeys = new Set([
    "joining_fee",
    "loan_amount",
    "loan_outstanding",
    "share_capital",
    "emergency_fund",
    "kayam_thev",
    "recurring_deposit",
    "lakhpati_3y",
    "lakhpati_5y",
    "term_deposit_1_3",
    "term_deposit_5_10",
    "damduppat",
    "fixed_deposit",
    "total_deposit_schemes",
])

function formatValue(stat: DashboardStat) {
    if (currencyKeys.has(stat.key)) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(stat.value)
    }

    return new Intl.NumberFormat("en-IN").format(stat.value)
}

function KpiCard({ item }: { item: DashboardStat }) {
    const Icon = item.icon
    const iconWrapClass =
        iconWrapMap[item.key] || "bg-slate-50 text-slate-600 border-slate-200"

    return (
        <Card className="group overflow-hidden rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-px hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <CardContent className="">
                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-semibold capitalize text-slate-400">
                            {item.title}
                        </p>
                        <h3 className="mt-1.5 truncate text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                            {formatValue(item)}
                        </h3>
                        <p className="mt-1 truncate text-[11px] text-slate-500">
                            {item.subtitle}
                        </p>
                    </div>

                    <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconWrapClass}`}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AdminDashboard() {
    const { data } = useQuery({
        queryKey: ["dashboard-overview"],
        queryFn: () => getDashboardOverviewHandler(),
    })

    const overview: DashboardStat[] = [
        {
            key: "total_members",
            title: "Total Members",
            value: Number(data?.kpis?.total_members?.count ?? 0),
            subtitle: "Active members count",
            icon: Users,
        },
        {
            key: "joining_fee",
            title: "Total Member Joining Fee",
            value: Number(data?.kpis?.total_member_joining_fee?.amount ?? 0),
            subtitle: "Total collected fees",
            icon: CreditCard,
        },
        {
            key: "loan_amount",
            title: "Total Loan Amount",
            value: Number(data?.kpis?.total_loan_amount?.amount ?? 0),
            subtitle: "Sanctioned total",
            icon: Landmark,
        },
        {
            key: "loan_outstanding",
            title: "Total Loan Outstanding",
            value: Number(data?.kpis?.total_loan_outstanding?.amount ?? 0),
            subtitle: "As per EMI schedule",
            icon: WalletCards,
        },
        {
            key: "share_capital",
            title: "Total Share Capital",
            value: Number(data?.kpis?.total_share_capital?.amount ?? 0),
            subtitle: "Latest ledger totals",
            icon: CircleDollarSign,
        },
        {
            key: "emergency_fund",
            title: "Total Emergency Fund",
            value: Number(data?.kpis?.total_emergency_fund?.amount ?? 0),
            subtitle: "Latest ledger totals",
            icon: ShieldCheck,
        },
        {
            key: "kayam_thev",
            title: "Total Kayam Thev",
            value: Number(data?.kpis?.total_kayam_thev?.amount ?? 0),
            subtitle: "Paid deductions sum",
            icon: Banknote,
        },
        {
            key: "active_loans",
            title: "Total Active Loans",
            value: Number(data?.kpis?.total_active_loans?.count ?? 0),
            subtitle: "Active loan accounts count",
            icon: BriefcaseBusiness,
        },
    ]

    const depositSchemes: DashboardStat[] = [
        {
            key: "recurring_deposit",
            title: "Recurring Deposit",
            value: Number(data?.deposit_schemes?.recurring_deposit?.amount ?? 0),
            subtitle: "Scheme active total",
            icon: BadgeIndianRupee,
        },
        {
            key: "lakhpati_3y",
            title: "Lakhpati Yojna (3Y)",
            value: Number(data?.deposit_schemes?.lakhpati_yojna_3y?.amount ?? 0),
            subtitle: "Scheme active total",
            icon: Star,
        },
        {
            key: "lakhpati_5y",
            title: "Lakhpati Yojna (5Y)",
            value: Number(data?.deposit_schemes?.lakhpati_yojna_5y?.amount ?? 0),
            subtitle: "Scheme active total",
            icon: PiggyBank,
        },
        {
            key: "term_deposit_1_3",
            title: "Term Deposit (1–3Y)",
            value: Number(data?.deposit_schemes?.term_deposit_1_3y?.amount ?? 0),
            subtitle: "Scheme active total",
            icon: CalendarDays,
        },
        {
            key: "term_deposit_5_10",
            title: "Term Deposit (5–10Y)",
            value: Number(data?.deposit_schemes?.term_deposit_5_10y?.amount ?? 0),
            subtitle: "Scheme active total",
            icon: CalendarDays,
        },
        {
            key: "damduppat",
            title: "Damduppat",
            value: Number(data?.deposit_schemes?.damduppat?.amount ?? 0),
            subtitle: "Scheme active total",
            icon: HandCoins,
        },
        {
            key: "fixed_deposit",
            title: "Fixed Deposit",
            value: Number(data?.deposit_schemes?.fixed_deposit?.amount ?? 0),
            subtitle: "Scheme active total",
            icon: LockKeyhole,
        },
        {
            key: "total_deposit_schemes",
            title: "Total Deposits (Schemes)",
            value: Number(data?.deposit_schemes?.total_deposits_schemes?.amount ?? 0),
            subtitle: "Sum of scheme KPIs",
            icon: TrendingUp,
        },
    ]

    return (
        <div className="min-h-screen">
            <div className="mx-auto w-full max-w-400 space-y-8 p-4 md:p-5 xl:p-6">
                <h1 className="text-xl font-bold">Overview </h1>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {overview.map((item) => (
                        <KpiCard key={item.key} item={item} />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {depositSchemes.map((item) => (
                        <KpiCard key={item.key} item={item} />
                    ))}
                </div>
            </div>
        </div>
    )
}