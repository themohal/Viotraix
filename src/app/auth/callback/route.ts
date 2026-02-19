import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const redirectTo = url.searchParams.get("redirect_to") || "/dashboard";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let session = null;

  if (code) {
    // PKCE flow — exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      session = data.session;
    }
  } else if (tokenHash && type) {
    // Implicit flow — verify OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "email",
    });
    if (!error && data.session) {
      session = data.session;
    }
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login?error=confirmation_failed", request.url));
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  // Set auth cookies so server-side getSession() works
  response.cookies.set("sb-access-token", session.access_token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: session.expires_in,
  });
  response.cookies.set("sb-refresh-token", session.refresh_token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
