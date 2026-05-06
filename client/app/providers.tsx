"use client"


import { AuthProvider } from "@/Context/AuthProvider"
import React from "react"


export default function Providers({ children }: { children: React.ReactNode }) {
    return (
            <AuthProvider>{children}</AuthProvider>
    )
}