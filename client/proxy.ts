import { NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value
    const { pathname } = request.nextUrl

    const isLoginPage =
        pathname === "/login" ||
        pathname === "/admin/login" ||
        pathname === "/sanchalak/login"

    const isAdminRoute =
        pathname.startsWith("/admin") &&
        pathname !== "/admin/login"

    const isSanchalakRoute =
        pathname.startsWith("/sanchalak") &&
        pathname !== "/sanchalak/login"

    const isProtected = isAdminRoute || isSanchalakRoute

    if (token && isLoginPage) {
        return NextResponse.redirect(new URL("/admin", request.url))
    }

    if (!token && isProtected) {
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
        "/login",
        "/admin/login",
        "/sanchalak/login",
        "/admin/:path*",
        "/sanchalak/:path*",
    ],
}