import { AdminLoginType, SanchalakLoginType } from "@/types/auth/loginTypes"
import {
    apiClient,
    AuthUser,
    refreshAccessToken,
} from "@/lib/api-client"

export type UserType = "admin" | "sanchalaka" | null

export type AdminLoginResponse = {
    error?: string
    success: boolean
    message: string
    user_type: "admin"
    access_token: string
    expires_in: number
    data: AuthUser
}

export type SanchalakLoginResponse = {
    error?: string
    success: boolean
    message: string
    user_type: "sanchalaka"
    access_token: string
    expires_in: number
    data: AuthUser
}

export type RefreshLoginResponse = {
    success: boolean
    message: string
    user_type: "admin" | "sanchalaka"
    access_token: string
    expires_in: number
    data: AuthUser
}

export type MeResponse = {
    success: boolean
    user_type: "admin" | "sanchalaka"
    data: AuthUser
}

export type LogoutResponse = {
    success: boolean
    message: string
    data: null
}

const adminLoginApi = async ({ adminId, password }: AdminLoginType) => {
    return apiClient.post<AdminLoginResponse>("/api/v1/admin/login", {
        adminId,
        password,
    })
}

const sanchalakLoginApi = async ({ sanchalakId, password }: SanchalakLoginType) => {
    return apiClient.post<SanchalakLoginResponse>("/api/v1/sanchalaka/login", {
        sanchalakId,
        password,
    })
}

const refreshLoginApi = async () => {
    const token = await refreshAccessToken()

    if (!token) {
        throw new Error("Session expired")
    }

    return token
}

const getAuthUserApi = async () => {
    return apiClient.get<MeResponse>("/api/v1/me")
}

const logoutApi = async () => {
    return apiClient.post<LogoutResponse>("/api/v1/logout")
}

export {
    adminLoginApi,
    sanchalakLoginApi,
    refreshLoginApi,
    getAuthUserApi,
    logoutApi,
}