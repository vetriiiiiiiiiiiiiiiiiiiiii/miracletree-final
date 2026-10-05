import { NextResponse } from "next/server";
// Imported from `session` rather than `auth` so the Edge bundle stays free of
// Prisma and bcrypt.
import { isStaff, readSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
/**
 * Edge gate for private areas. This is a fast rejection only — every admin
 * route handler and Server Action re-checks the role against the database via
 * `requireAdmin`, because a JWT can outlive a revoked role.
 */
export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await readSessionToken(token) : null;
  const hasNextAuth =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token") ||
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token");

  if (pathname.startsWith("/admin")) {
    if (hasNextAuth) {
      return NextResponse.next();
    }
    if (!session || !isStaff(session.role)) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account") && !session && !hasNextAuth) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}
export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/login", "/register"],
};
