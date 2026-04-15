'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type TreeContextType = {
    expanded: Record<string, boolean>
    toggle: (id: string) => void
}

const TreeContext = React.createContext<TreeContextType | null>(null)

export function Tree({ children }: { children: React.ReactNode }) {
    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})

    const toggle = (id: string) => {
        setExpanded((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))
    }

    return (
        <TreeContext.Provider value={{ expanded, toggle }}>
            <div className="space-y-1">{children}</div>
        </TreeContext.Provider>
    )
}

type TreeItemProps = {
    id: string
    label: React.ReactNode
    children?: React.ReactNode
    onClick?: () => void
}

export function TreeItem({ id, label, children, onClick }: TreeItemProps) {
    const context = React.useContext(TreeContext)
    if (!context) return null

    const isOpen = context.expanded[id]

    return (
        <div>
            <div
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100"
                onClick={() => {
                    context.toggle(id)
                    onClick?.()
                }}
            >
                {children ? (
                    <ChevronRight
                        className={cn(
                            'h-4 w-4 transition-transform',
                            isOpen && 'rotate-90'
                        )}
                    />
                ) : (
                    <div className="w-4" />
                )}

                <div className="flex items-center gap-2">{label}</div>
            </div>

            {isOpen && children && (
                <div className="ml-5 mt-1 space-y-1 border-l pl-3">
                    {children}
                </div>
            )}
        </div>
    )
}