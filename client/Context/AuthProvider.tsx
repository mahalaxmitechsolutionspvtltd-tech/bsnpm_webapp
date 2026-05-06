"use client"

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import {
    AuthUser,
    configureAccessTokenHandlers,
} from "@/lib/api-client"
import {
    adminLoginApi,
    getAuthUserApi,
    logoutApi,
    refreshLoginApi,
    sanchalakLoginApi,
    UserType,
} from "@/services/authApi"
import { AdminLoginType, SanchalakLoginType } from "@/types/auth/loginTypes"

type AuthContextType = {
    user: AuthUser | null
    userType: UserType
    accessToken: string | null
    isAuthenticated: boolean
    isLoading: boolean
    adminLogin: (payload: AdminLoginType) => Promise<void>
    sanchalakLogin: (payload: SanchalakLoginType) => Promise<void>
    login: (userData: AuthUser, userType: UserType, token: string) => void
    logout: () => Promise<void>
    refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [userType, setUserType] = useState<UserType>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const accessTokenRef = useRef<string | null>(null)

    const setAccessTokenState = useCallback((token: string | null) => {
        accessTokenRef.current = token
        setAccessToken(token)
    }, [])

    const clearAuth = useCallback(() => {
        accessTokenRef.current = null
        setAccessToken(null)
        setUser(null)
        setUserType(null)
    }, [])

    useEffect(() => {
        configureAccessTokenHandlers({
            getAccessToken: () => accessTokenRef.current,
            setAccessToken: setAccessTokenState,
            clearAuth,
        })
    }, [setAccessTokenState, clearAuth])

    const refreshSession = useCallback(async () => {
        setIsLoading(true)

        try {
            await refreshLoginApi()
            const response = await getAuthUserApi()
            setUser(response.data.data)
            setUserType(response.data.user_type)
        } catch {
            clearAuth()
        } finally {
            setIsLoading(false)
        }
    }, [clearAuth])

    const login = useCallback(
        (userData: AuthUser, nextUserType: UserType, token: string) => {
            setAccessTokenState(token)
            setUser(userData)
            setUserType(nextUserType)
        },
        [setAccessTokenState]
    )

    const adminLogin = useCallback(
        async (payload: AdminLoginType) => {
            setIsLoading(true)

            try {
                const response = await adminLoginApi(payload)
                login(response.data.data, response.data.user_type, response.data.access_token)
            } finally {
                setIsLoading(false)
            }
        },
        [login]
    )

    const sanchalakLogin = useCallback(
        async (payload: SanchalakLoginType) => {
            setIsLoading(true)

            try {
                const response = await sanchalakLoginApi(payload)
                login(response.data.data, response.data.user_type, response.data.access_token)
            } finally {
                setIsLoading(false)
            }
        },
        [login]
    )

    const logout = useCallback(async () => {
        setIsLoading(true)

        try {
            await logoutApi()
        } finally {
            clearAuth()
            setIsLoading(false)
        }
    }, [clearAuth])

    useEffect(() => {
        refreshSession()
    }, [refreshSession])

    const value = useMemo(
        () => ({
            user,
            userType,
            accessToken,
            isAuthenticated: Boolean(user && accessToken),
            isLoading,
            adminLogin,
            sanchalakLogin,
            login,
            logout,
            refreshSession,
        }),
        [
            user,
            userType,
            accessToken,
            isLoading,
            adminLogin,
            sanchalakLogin,
            login,
            logout,
            refreshSession,
        ]
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