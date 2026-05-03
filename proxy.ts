import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) { 
    const token = request.cookies.get("token")?.value;

    const pathname = request.nextUrl.pathname;

    const authRoutes = [
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
    ];

    const protectedRoutes = [
        "/dashboard",
        "/categories",
        "/notes",
        "/tags",
        "/profile",
    ];

    const isAuthPage = authRoutes.some((route) =>
        pathname.startsWith(route)
    );

    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    if (!token && isProtectedRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (token && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password/:path*",
    "/dashboard/:path*",
    "/categories/:path*",
    "/notes/:path*",
    "/tags/:path*",
    "/profile",
  ],
};