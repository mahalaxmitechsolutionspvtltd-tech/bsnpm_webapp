import { NextRequest, NextResponse } from "next/server"

const REFRESH_TOKEN_COOKIE = "refresh_token"

export function proxy(request: NextRequest) {
    const token = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
    const { pathname } = request.nextUrl

    const isAuthenticated = Boolean(token)

    const isDefaultPage = pathname === "/"

    const isLoginPage =
        pathname === "/login" ||
        pathname === "/admin/login" ||
        pathname === "/sanchalak/login"

    const isAdminLoginPage = pathname === "/admin/login"
    const isSanchalakLoginPage = pathname === "/sanchalak/login"

    const isAdminRoute =
        pathname.startsWith("/admin/dashboard") &&
        pathname !== "/admin/login"

    const isSanchalakRoute =
        pathname.startsWith("/sanchalak/dashboard") &&
        pathname !== "/sanchalak/login"

    const isProtected = isAdminRoute || isSanchalakRoute

    if (isAuthenticated && isDefaultPage) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    if (isAuthenticated && isAdminLoginPage) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    if (isAuthenticated && isSanchalakLoginPage) {
        return NextResponse.redirect(new URL("/sanchalak/dashboard", request.url))
    }

    if (isAuthenticated && isLoginPage) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    if (!isAuthenticated && isProtected) {
        if (pathname.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/admin/login", request.url))
        }

        if (pathname.startsWith("/sanchalak")) {
            return NextResponse.redirect(new URL("/sanchalak/login", request.url))
        }

        return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/",
        "/login",
        "/admin/login",
        "/sanchalak/login",
        "/admin/:path*",
        "/sanchalak/:path*",
    ],
}