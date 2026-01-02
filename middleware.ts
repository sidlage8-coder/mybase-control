import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/pin-login", "/api/auth", "/api/agent", "/api/pin-login", "/api/pin-logout"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for session cookie (Better-Auth ou PIN)
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const pinSession = request.cookies.get("pin-session");

  if (!sessionCookie && !pinSession) {
    const loginUrl = new URL("/pin-login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
