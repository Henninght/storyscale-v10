import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=no_code", req.url)
    );
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: process.env.LINKEDIN_AUTH_REDIRECT_URI!,
          client_id: process.env.LINKEDIN_AUTH_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_AUTH_CLIENT_SECRET!,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("LinkedIn token exchange failed:", errorData);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("token_exchange_failed")}`, req.url)
      );
    }

    const { access_token } = await tokenResponse.json();

    // Fetch user profile from LinkedIn
    const profileResponse = await fetch(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!profileResponse.ok) {
      const errorData = await profileResponse.text();
      console.error("LinkedIn profile fetch failed:", errorData);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("profile_fetch_failed")}`, req.url)
      );
    }

    const profile = await profileResponse.json();

    // Create custom Firebase token
    const customToken = await getAdminAuth().createCustomToken(profile.sub, {
      provider: "linkedin",
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    });

    // Redirect to callback page with custom token
    return NextResponse.redirect(
      new URL(`/auth/callback?token=${encodeURIComponent(customToken)}`, req.url)
    );
  } catch (error: any) {
    console.error("LinkedIn OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || "auth_failed")}`, req.url)
    );
  }
}
