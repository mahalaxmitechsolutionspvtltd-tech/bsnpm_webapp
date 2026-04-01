// AuthProvider.tsx
"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

type AuthUser = {
    id: number
    admin_id: string
    admin_name: string
    admin_email: string
    admin_mobile: string
    profile_photo: string | null
    status: string
}

type AuthContextType = {
    user: AuthUser | null
    login: (userData: AuthUser) => void
}

const AUTH_STORAGE_KEY = "bsnpm_auth_user"
const AUTH_EXPIRY_KEY = "bsnpm_auth_expiry"
const TWELVE_HOURS_IN_MS = 12 * 60 * 60 * 1000

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)

    const clearExpiredAuth = () => {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem(AUTH_EXPIRY_KEY)
        setUser(null)
    }

    const login = (userData: AuthUser) => {
        const expiryTime = Date.now() + TWELVE_HOURS_IN_MS
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData))
        localStorage.setItem(AUTH_EXPIRY_KEY, String(expiryTime))
        setUser(userData)
    }

    useEffect(() => {
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY)
        const storedExpiry = localStorage.getItem(AUTH_EXPIRY_KEY)

        if (!storedUser || !storedExpiry) {
            clearExpiredAuth()
            return
        }

        const expiryTime = Number(storedExpiry)

        if (!expiryTime || Date.now() > expiryTime) {
            clearExpiredAuth()
            return
        }

        try {
            setUser(JSON.parse(storedUser) as AuthUser)
        } catch {
            clearExpiredAuth()
        }
    }, [])

    useEffect(() => {
        if (!user) return

        const storedExpiry = localStorage.getItem(AUTH_EXPIRY_KEY)
        if (!storedExpiry) {
            clearExpiredAuth()
            return
        }

        const remainingTime = Number(storedExpiry) - Date.now()

        if (remainingTime <= 0) {
            clearExpiredAuth()
            return
        }

        const timer = window.setTimeout(() => {
            clearExpiredAuth()
        }, remainingTime)

        return () => window.clearTimeout(timer)
    }, [user])

    const value = useMemo(
        () => ({
            user,
            login,
        }),
        [user]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }

    return context
}