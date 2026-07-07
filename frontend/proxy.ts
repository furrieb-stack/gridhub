import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const username = request.nextUrl.pathname.slice(2);
  request.nextUrl.pathname = `/profile/${username}`;
  return NextResponse.rewrite(request.nextUrl);
}

export const config = {
  matcher: "/@:username",
};
