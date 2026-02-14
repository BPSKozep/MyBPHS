import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const AUTH_WHITELIST = [
  "/auth",
  "/forbidden",
  "/onboarding",
  "/public",
  "/robots.txt",
  "/sitemap.xml",
  "/relay-cgHT",
  "/manifest",
  "/api",
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    if (AUTH_WHITELIST.some((path) => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    if (!req.nextauth.token) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (AUTH_WHITELIST.some((path) => pathname.startsWith(path))) {
          return true;
        }

        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
