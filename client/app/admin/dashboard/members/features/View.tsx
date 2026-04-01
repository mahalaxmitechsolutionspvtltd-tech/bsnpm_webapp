"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Member } from "@/types/memberTypes"

type ViewProps = {
    memberId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

type Nominee = {
    id?: string | number
    member_name?: string
    nominee_name?: string
    relation?: string
    nominee_contact?: string
    created_by?: string
    created_at?: string
    updated_by?: string
    updated_at?: string
}

function Row({
    label,
    value,
}: {
    label: string
    value: React.ReactNode
}) {
    return (
        <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-3 py-1.5 text-sm">
            <div className="text-muted-foreground">{label}</div>
            <div className="font-medium text-foreground wrap-break-word">{value || "-"}</div>
        </div>
    )
}

export default function View({ memberId, open, onOpenChange }: ViewProps) {
    const queryClient = useQueryClient()

    const members = queryClient.getQueryData<Member[]>(["members"]) ?? []

    const member = React.useMemo(() => {
        return members.find((item) => item.member_id === memberId) ?? null
    }, [members, memberId])

    const nominees = React.useMemo(() => {
        if (!member) return []
        const rawNominees =
            (member as Member & { nominees?: Nominee[]; nomineeDetails?: Nominee[] }).nominees ||
            (member as Member & { nominees?: Nominee[]; nomineeDetails?: Nominee[] }).nomineeDetails ||
            []

        return Array.isArray(rawNominees) ? rawNominees : []
    }, [member])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl rounded-xl">
                <DialogHeader className="space-y-1 pb-2">
                    <DialogTitle className="text-xl font-semibold">
                        Member Details
                    </DialogTitle>
                    <DialogDescription>
                        Complete member and nominee information.
                    </DialogDescription>
                </DialogHeader>

                {member ? (
                    <div className="space-y-5">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0">
                                <h3 className="truncate text-xl font-semibold">
                                    {member.full_name || "-"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Member ID: {member.member_id || "-"}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {member.gender ? (
                                    <Badge variant="secondary" className="capitalize">
                                        {String(member.gender).toLowerCase()}
                                    </Badge>
                                ) : null}
                                {member.status ? (
                                    <Badge className="capitalize">
                                        {String(member.status).toLowerCase()}
                                    </Badge>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
                            <Row label="Full Name" value={member.full_name || "-"} />
                            <Row label="Member ID" value={member.member_id || "-"} />
                            <Row label="Email Address" value={member.email || "-"} />
                            <Row label="Mobile Number" value={member.mobile_number || "-"} />
                            <Row label="Gender" value={member.gender ? String(member.gender).toUpperCase() : "-"} />
                            <Row label="Status" value={member.status ? String(member.status).toUpperCase() : "-"} />
                            <Row label="Created By" value={member.created_by || "-"} />
                            <Row label="Created At" value={member.created_at ? new Date(member.created_at).toLocaleString() : "-"} />
                        </div>
                        <hr />
                        <div className="space-y-3 pt-1">
                            <div>
                                <h4 className="text-base font-semibold">Nominee Details</h4>
                            </div>

                            {nominees.length > 0 ? (
                                <div className="space-y-4">
                                    {nominees.map((nominee, index) => (
                                        <div key={nominee.id ?? `${nominee.nominee_name}-${index}`} className="space-y-1">
                                            
                                            <div className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2">
                                                <Row label="Nominee Name" value={nominee.nominee_name || "-"} />
                                                <Row label="Relation" value={nominee.relation || "-"} />
                                                <Row label="Contact Number" value={nominee.nominee_contact || "-"} />
                                                <Row label="Member Name" value={nominee.member_name || member.full_name || "-"} />
                                                <Row label="Created By" value={nominee.created_by || "-"} />
                                                <Row
                                                    label="Created At"
                                                    value={nominee.created_at ? new Date(nominee.created_at).toLocaleString() : "-"}
                                                />
                                            </div>

                                            {index !== nominees.length - 1 ? (
                                                <div className="pt-2">
                                                    <div className="h-px w-full bg-border" />
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No nominee details available.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-destructive">
                        Member not found in cache for ID: {memberId}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}