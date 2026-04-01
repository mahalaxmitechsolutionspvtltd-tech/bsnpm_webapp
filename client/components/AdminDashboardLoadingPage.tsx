"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex min-h-screen w-full bg-[#f8fafc]">
            <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:w-59 lg:flex-col">
                <div className="flex h-22 items-center gap-3 border-b border-slate-100 px-6">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20 rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                </div>

                <div className="flex-1 space-y-6 px-4 py-6">
                    <div className="space-y-3">
                        <Skeleton className="h-3 w-12 rounded-md" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-8 w-full rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Skeleton className="h-3 w-28 rounded-md" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-8 w-full rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Skeleton className="h-3 w-20 rounded-md" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-8 w-full rounded-xl" />
                            <Skeleton className="h-8 w-full rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Skeleton className="h-3 w-16 rounded-md" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 p-4">
                    <div className="flex items-center gap-3 rounded-xl">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16 rounded-md" />
                            <Skeleton className="h-3 w-24 rounded-md" />
                        </div>
                    </div>
                </div>
            </aside>

            <div className="min-w-0 flex-1">
                <div className="mx-auto w-full max-w-420 px-6 py-6">
                    <div className="mb-10 flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded-md" />
                        <Separator orientation="vertical" className="h-5 bg-slate-200" />
                        <Skeleton className="h-4 w-20 rounded-md" />
                        <Skeleton className="h-4 w-3 rounded-sm" />
                        <Skeleton className="h-4 w-16 rounded-md" />
                    </div>

                    <div className="mb-8">
                        <Skeleton className="h-9 w-28 rounded-md" />
                    </div>

                    <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <Card
                                key={index}
                                className="rounded-2xl border border-slate-200 bg-white shadow-none"
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <Skeleton className="h-5 w-40 rounded-md" />
                                            <Skeleton className="mt-4 h-8 w-20 rounded-md" />
                                            <Skeleton className="mt-3 h-3 w-28 rounded-md" />
                                        </div>
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}