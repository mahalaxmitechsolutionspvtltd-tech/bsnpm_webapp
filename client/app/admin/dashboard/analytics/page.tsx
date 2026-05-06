"use client"

import * as React from "react"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Label,
    Pie,
    PieChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts"
import {
    CalendarDays,
    ChevronRight,
    Download,
    RefreshCcw,
    TrendingDown,
    TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PeriodKey = "180d" | "90d" | "30d" | "7d"


const kpiCards = [
    {
        title: "Recovery Rate",
        value: "56.5%",
        description: "Recovered / (Recovered + Outstanding)",
    },
    {
        title: "Recovered",
        value: "₹18,82,550",
        description: "Sum of period series",
    },
    {
        title: "Outstanding",
        value: "₹14,47,200",
        description: "Last point outstanding",
    },
    {
        title: "Total Income",
        value: "₹22,12,220",
        description: "Sum of income series",
    },
    {
        title: "Total Expense",
        value: "₹14,69,280",
        description: "Sum of expense series",
    },
    {
        title: "Profit",
        value: "₹7,42,940",
        description: "Net profit",
    },
]

const recoveryAreaData = [
    { date: "2026-04-01", recovered: 2.8, outstanding: 18.2 },
    { date: "2026-04-02", recovered: 2.2, outstanding: 15.1 },
    { date: "2026-04-03", recovered: 2.4, outstanding: 13.9 },
    { date: "2026-04-04", recovered: 2.3, outstanding: 14.4 },
    { date: "2026-04-05", recovered: 2.8, outstanding: 12.1 },
    { date: "2026-04-06", recovered: 2.5, outstanding: 12.6 },
    { date: "2026-04-07", recovered: 3.6, outstanding: 12.8 },
    { date: "2026-04-08", recovered: 3.3, outstanding: 11.9 },
    { date: "2026-04-09", recovered: 2.4, outstanding: 8.1 },
    { date: "2026-04-10", recovered: 1.9, outstanding: 14.7 },
]

const profitBarData = [
    { month: "D1", income: 2.9, expense: 1.9 },
    { month: "D2", income: 2.4, expense: 1.4 },
    { month: "D3", income: 2.0, expense: 1.3 },
    { month: "D4", income: 2.5, expense: 2.0 },
    { month: "D5", income: 1.3, expense: 2.1 },
    { month: "D6", income: 2.5, expense: 1.7 },
    { month: "D7", income: 2.7, expense: 0.6 },
    { month: "D8", income: 3.1, expense: 1.9 },
    { month: "D9", income: 1.2, expense: 0.8 },
    { month: "D10", income: 2.0, expense: 1.3 },
]

const participationPieData = [
    { bucket: "Active", members: 375, fill: "var(--color-active)" },
    { bucket: "Low Engagement", members: 21, fill: "var(--color-low)" },
    { bucket: "Inactive", members: 46, fill: "var(--color-inactive)" },
]

const participationTable = [
    {
        bucket: "Active",
        members: 375,
        participation: "84.8%",
        note: "Regular engagement",
    },
    {
        bucket: "Low Engagement",
        members: 21,
        participation: "4.8%",
        note: "Needs follow-up",
    },
    {
        bucket: "Inactive",
        members: 46,
        participation: "10.4%",
        note: "Dormant / no activity",
    },
]

const recoveryChartConfig = {
    recovered: {
        label: "Recovered",
        color: "var(--chart-1)",
    },
    outstanding: {
        label: "Outstanding",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

const profitChartConfig = {
    income: {
        label: "Income",
        color: "var(--chart-1)",
    },
    expense: {
        label: "Expense",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

const participationChartConfig = {
    members: {
        label: "Members",
    },
    active: {
        label: "Active",
        color: "var(--chart-1)",
    },
    low: {
        label: "Low Engagement",
        color: "var(--chart-2)",
    },
    inactive: {
        label: "Inactive",
        color: "var(--chart-3)",
    },
} satisfies ChartConfig

function RecoveryAreaChart() {
    const [timeRange, setTimeRange] = React.useState<PeriodKey>("180d")

    const filteredData = React.useMemo(() => {
        if (timeRange === "7d") return recoveryAreaData.slice(-7)
        if (timeRange === "30d") return recoveryAreaData
        if (timeRange === "90d") return recoveryAreaData
        return recoveryAreaData
    }, [timeRange])

    return (
        <Card className="rounded-lg  shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-3 border-b px-4 ">
                <div className="">
                    <CardTitle className="text-base font-semibold">Loan Recovery Trends</CardTitle>
                    <CardDescription>Recovered vs Outstanding</CardDescription>
                </div>
                <Select value={timeRange} onValueChange={(value) => setTimeRange(value as PeriodKey)}>
                    <SelectTrigger className=" rounded-lg">
                        <SelectValue placeholder="Last 180 Days" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                        <SelectItem value="180d" className="rounded-lg">Last 180 Days</SelectItem>
                        <SelectItem value="90d" className="rounded-lg">Last 90 Days</SelectItem>
                        <SelectItem value="30d" className="rounded-lg">Last 30 Days</SelectItem>
                        <SelectItem value="7d" className="rounded-lg">Last 7 Days</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-3 py-4">
                <ChartContainer config={recoveryChartConfig} className="h-57.5 w-full">
                    <AreaChart data={filteredData}>
                        <defs>
                            <linearGradient id="fillRecovered" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-recovered)" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="var(--color-recovered)" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="fillOutstanding" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-outstanding)" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="var(--color-outstanding)" stopOpacity={0.04} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    indicator="dot"
                                    labelFormatter={(value) =>
                                        new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }
                                />
                            }
                        />
                        <Area
                            dataKey="outstanding"
                            type="natural"
                            fill="url(#fillOutstanding)"
                            stroke="var(--color-outstanding)"
                            strokeWidth={2}
                        />
                        <Area
                            dataKey="recovered"
                            type="natural"
                            fill="url(#fillRecovered)"
                            stroke="var(--color-recovered)"
                            strokeWidth={2}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

function ProfitBarChart() {
    return (
        <Card className="rounded-lg  shadow-none">
            <CardHeader className="px-4 ">
                <CardTitle className="text-base font-semibold">Profit &amp; Loss Analysis</CardTitle>
                <CardDescription className="-mt-2">Income vs Expense</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-4">
                <ChartContainer config={profitChartConfig} className="h-57.5 w-full">
                    <BarChart accessibilityLayer data={profitBarData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

function ParticipationDonutChart() {
    const totalMembers = React.useMemo(() => {
        return participationPieData.reduce((acc, curr) => acc + curr.members, 0)
    }, [])

    return (
        <Card className="rounded-lg  shadow-none">
            <CardHeader className="px-4 ">
                <CardTitle className="text-base font-semibold">Member Participation</CardTitle>
                <CardDescription className="-mt-2">Active / Inactive / Low engagement</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
                <ChartContainer
                    config={participationChartConfig}
                    className="mx-auto h-70 w-full max-w-105"
                >
                    <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie
                            data={participationPieData}
                            dataKey="members"
                            nameKey="bucket"
                            innerRadius={72}
                            strokeWidth={6}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {totalMembers}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground text-sm"
                                                >
                                                    Members
                                                </tspan>
                                            </text>
                                        )
                                    }
                                    return null
                                }}
                            />
                        </Pie>
                        <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

function ParticipationOverviewCard() {
    return (
        <Card className="rounded-lg  shadow-none">
            <CardHeader className="">
                <CardTitle className="text-base font-semibold">Participation Statistics</CardTitle>
                <CardDescription className="-mt-2">Quick stats + top buckets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 ">
                <div className="grid gap-3 md:grid-cols-3">
                    <section className="rounded-lg border shadow-none p-3">
                        <div className="">
                            <p className="text-xs font-semibold  text-muted-foreground">
                                Active Members
                            </p>
                            <p className=" text-xl font-bold">375</p>
                        </div>
                    </section>
                    <section className="rounded-lg border shadow-none p-3">
                        <div className="">
                            <p className="text-xs font-semibold text-muted-foreground">
                                Avg Participation
                            </p>
                            <p className=" text-xl font-bold">84.8%</p>
                        </div>
                    </section>
                    <section className="rounded-lg border shadow-none p-3">
                        <div className="">
                            <p className="text-xs font-semibold  text-muted-foreground">
                                Low Engagement
                            </p>
                            <p className=" text-xl font-bold">21</p>
                        </div>
                    </section>
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <div className="grid grid-cols-4 border-b bg-muted/40 px-4 py-2 text-xs font-semibold  text-muted-foreground">
                        <div>Bucket</div>
                        <div className="text-center">Members</div>
                        <div className="text-center">Participation</div>
                        <div>Note</div>
                    </div>
                    <div className="divide-y">
                        {participationTable.map((item) => (
                            <div key={item.bucket} className="grid grid-cols-4 items-center px-4 py-3 text-sm">
                                <div className="font-medium">{item.bucket}</div>
                                <div className="text-center">{item.members}</div>
                                <div className="text-center">{item.participation}</div>
                                <div className="text-muted-foreground">{item.note}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function SnapshotMiniChart() {
    const data = [
        { day: "Mon", value: 24 },
        { day: "Tue", value: 18 },
        { day: "Wed", value: 32 },
        { day: "Thu", value: 26 },
        { day: "Fri", value: 37 },
        { day: "Sat", value: 29 },
        { day: "Sun", value: 33 },
    ]

    const config = {
        value: {
            label: "Volume",
            color: "var(--chart-4)",
        },
    } satisfies ChartConfig

    return (
        <Card className="rounded-lg border shadow-none">
            <CardHeader className="px-4 py-4">
                <CardTitle className="text-base font-semibold">Weekly Snapshot</CardTitle>
                <CardDescription>Sample momentum for loan movement</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-4">
                <ChartContainer config={config} className="h-57.5 w-full">
                    <BarChart accessibilityLayer data={data}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export default function Analytics() {
    const [period, setPeriod] = React.useState("180d")
    const [fromDate, setFromDate] = React.useState("")
    const [toDate, setToDate] = React.useState("")

    const handleRefresh = () => {
        setPeriod("180d")
    }

    const handleClear = () => {
        setPeriod("180d")
        setFromDate("")
        setToDate("")
    }

    return (
        <div className="space-y-2 p-4 md:p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                {kpiCards.map((item) => (
                    <div key={item.title} className="rounded-lg px-2 py-2  border shadow-none">
                        <section className="">
                            <p className="text-xs font-semibold  text-muted-foreground">
                                {item.title}
                            </p>
                            <p className=" text-xl font-bold tracking-tight">{item.value}</p>
                            <p className=" text-[10px] text-muted-foreground">{item.description}</p>
                        </section>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-7">
                <div className="xl:col-span-4">
                    <RecoveryAreaChart />
                </div>
                <div className="xl:col-span-3">
                    <ProfitBarChart />
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-7">
                <div className="xl:col-span-3">
                    <ParticipationDonutChart />
                </div>
                <div className="xl:col-span-4">
                    <ParticipationOverviewCard />
                </div>
            </div>


        </div>
    )
}